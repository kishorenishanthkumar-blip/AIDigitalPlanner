/**
 * AIDP attachments · local file + URL fetch reader for Niche-I.
 *
 * Mounts as window.AIDP_ATTACH with:
 *   - openPicker()           · open file dialog
 *   - fromUrl(url)           · fetch + extract text (CORS-permitting)
 *   - pending                · array of currently attached items
 *   - clearPending()         · reset attachments
 *   - buildContextString()   · render <attachment> blocks for next message
 *   - renderChips(container) · render small UI chips for attached items
 *
 * Supported types:
 *   - text/plain, text/markdown, application/json, text/csv, text/yaml → read as text
 *   - application/pdf → extract text via PDF.js (CDN-loaded on first use)
 *   - image/*, video/* → attach as metadata only (analysis needs vision model · roadmap)
 *
 * Integration: a chatbot's input form should call AIDP_ATTACH.openPicker(),
 * watch AIDP_ATTACH.pending, and prepend AIDP_ATTACH.buildContextString() to the
 * message text before sending. Call AIDP_ATTACH.clearPending() after send.
 */
(function () {
  'use strict';

  const MAX_TEXT_CHARS = 60000;       // ~15k tokens · keep request under master's 8000-char limit + reasonable history
  const MAX_FILES      = 5;
  const PDFJS_CDN      = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFJS_WORKER   = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const MAMMOTH_CDN    = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
  const XLSX_CDN       = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  const JSZIP_CDN      = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

  const pending = [];   // {id, name, type, sizeBytes, text?, kind: 'text'|'pdf'|'image'|'video'|'url'|'other'}
  let _listeners = [];
  let _pdfJsLoaded = false;

  function _emit() { _listeners.forEach(fn => { try { fn(pending); } catch {} }); }

  function onChange(fn) { _listeners.push(fn); }

  function clearPending() { pending.length = 0; _emit(); }

  function _push(item) {
    if (pending.length >= MAX_FILES) {
      alert(`Max ${MAX_FILES} attachments per message`);
      return false;
    }
    pending.push(item);
    _emit();
    return true;
  }

  /* ─── file picker ──────────────────────────────────────────────── */

  let _input;
  function _ensureInput() {
    if (_input) return _input;
    _input = document.createElement('input');
    _input.type = 'file';
    _input.multiple = true;
    _input.style.display = 'none';
    _input.accept = [
      '.txt','.md','.json','.csv','.yaml','.yml','.log','.xml','.html',
      '.pdf','.docx','.xlsx','.xls','.pptx','.ebc','.dat',
      '.mpp',                /* MPP shows but we reject with a clear message */
      'image/*','video/*','application/json','text/*'
    ].join(',');
    _input.addEventListener('change', () => {
      const files = Array.from(_input.files || []);
      files.forEach(_handleFile);
      _input.value = '';
    });
    document.body.appendChild(_input);
    return _input;
  }

  function openPicker() { _ensureInput().click(); }

  /* ─── file handlers ────────────────────────────────────────────── */

  async function _handleFile(file) {
    const id = 'att-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const name = file.name;
    const type = file.type || 'application/octet-stream';
    const sizeBytes = file.size;

    if (sizeBytes > 5 * 1024 * 1024) {
      alert(`${name} is too large (${(sizeBytes/1024/1024).toFixed(1)} MB). Max 5 MB per file.`);
      return;
    }

    if (_isTextLike(type, name)) {
      const text = await file.text();
      _push({ id, name, type, sizeBytes, text: _truncate(text), kind: 'text' });
      return;
    }
    if (type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
      try {
        const text = await _extractPdfText(file);
        _push({ id, name, type, sizeBytes, text: _truncate(text), kind: 'pdf' });
      } catch (e) {
        alert(`Could not extract text from ${name}: ${e.message}`);
      }
      return;
    }
    /* Word documents · mammoth.js extracts plain text + basic structure. */
    if (name.toLowerCase().endsWith('.docx')) {
      try {
        const text = await _extractDocxText(file);
        _push({ id, name, type, sizeBytes, text: _truncate(text), kind: 'docx' });
      } catch (e) {
        alert(`Could not parse Word document ${name}: ${e.message}`);
      }
      return;
    }
    /* Excel · SheetJS converts every sheet to CSV form for the LLM. */
    if (/\.xlsx?$/i.test(name)) {
      try {
        const text = await _extractXlsxText(file);
        _push({ id, name, type, sizeBytes, text: _truncate(text), kind: 'xlsx' });
      } catch (e) {
        alert(`Could not parse Excel ${name}: ${e.message}`);
      }
      return;
    }
    /* PowerPoint · JSZip + XML walker for slide text (no layout fidelity). */
    if (name.toLowerCase().endsWith('.pptx')) {
      try {
        const text = await _extractPptxText(file);
        _push({ id, name, type, sizeBytes, text: _truncate(text), kind: 'pptx' });
      } catch (e) {
        alert(`Could not parse PowerPoint ${name}: ${e.message}`);
      }
      return;
    }
    /* Microsoft Project · binary MPP not parseable in browser · graceful message. */
    if (name.toLowerCase().endsWith('.mpp')) {
      alert(
        `Microsoft Project (.mpp) is a binary format with no browser-side parser.\n\n` +
        `Workaround: in MS Project, open the file → File → Save As → choose "XML Format" (*.xml) or "CSV (Comma delimited)" (*.csv) → reattach the exported file here.\n\n` +
        `Full .mpp support requires a backend parser (Java MPXJ wrapped as a service · CR-AGENT-PROJECT · 3-5 days).`
      );
      return;
    }
    /* EBCDIC mainframe · convert IBM-1047 codepage to UTF-8 (extension or *.ebc/.dat). */
    if (/\.(ebc|ebcdic)$/i.test(name) ||
        (/\.dat$/i.test(name) && confirm(`Treat ${name} as EBCDIC (IBM-1047)? Cancel for ASCII.`))) {
      try {
        const text = await _convertEbcdicToText(file);
        _push({ id, name, type: 'application/ebcdic', sizeBytes, text: _truncate(text), kind: 'ebcdic' });
      } catch (e) {
        alert(`EBCDIC conversion failed for ${name}: ${e.message}`);
      }
      return;
    }
    if (type.startsWith('image/')) {
      _push({ id, name, type, sizeBytes, kind: 'image', text: `[image · ${name} · ${type} · ${(sizeBytes/1024).toFixed(1)} KB · analysis requires vision model (roadmap · CR-AGENT-VISION)]` });
      return;
    }
    if (type.startsWith('video/')) {
      _push({ id, name, type, sizeBytes, kind: 'video', text: `[video · ${name} · ${type} · ${(sizeBytes/1024/1024).toFixed(1)} MB · transcript + frame analysis requires Whisper + vision agent (roadmap)]` });
      return;
    }
    _push({ id, name, type, sizeBytes, kind: 'other', text: `[file · ${name} · ${type} · binary content not extracted]` });
  }

  function _isTextLike(type, name) {
    if (type.startsWith('text/')) return true;
    if (type === 'application/json') return true;
    const ext = name.split('.').pop().toLowerCase();
    return ['txt','md','markdown','json','csv','yaml','yml','log','xml','html','htm','sql','sh','js','ts','py','java','go','rs','rb'].includes(ext);
  }

  function _truncate(text) {
    if (text.length <= MAX_TEXT_CHARS) return text;
    return text.slice(0, MAX_TEXT_CHARS) + `\n\n[truncated · ${text.length - MAX_TEXT_CHARS} chars omitted]`;
  }

  /* ─── PDF extraction (lazy-load PDF.js) ─────────────────────────── */

  async function _ensurePdfJs() {
    if (_pdfJsLoaded || (typeof window.pdfjsLib !== 'undefined')) {
      _pdfJsLoaded = true;
      return;
    }
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PDFJS_CDN;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(s);
    });
    if (typeof window.pdfjsLib !== 'undefined') {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    }
    _pdfJsLoaded = true;
  }

  async function _extractPdfText(file) {
    await _ensurePdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    const parts = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const txt = await page.getTextContent();
      const pageText = txt.items.map(it => it.str).join(' ');
      parts.push(`--- page ${i} ---\n${pageText}`);
    }
    return parts.join('\n\n');
  }

  /* ─── DOCX extraction (lazy-load mammoth.js) ───────────────────── */

  let _mammothLoaded = false;
  async function _ensureMammoth() {
    if (_mammothLoaded || typeof window.mammoth !== 'undefined') { _mammothLoaded = true; return; }
    await _loadScript(MAMMOTH_CDN);
    _mammothLoaded = typeof window.mammoth !== 'undefined';
    if (!_mammothLoaded) throw new Error('mammoth.js failed to load');
  }

  async function _extractDocxText(file) {
    await _ensureMammoth();
    const buf = await file.arrayBuffer();
    const r = await window.mammoth.extractRawText({ arrayBuffer: buf });
    return r.value || '';
  }

  /* ─── XLSX extraction (lazy-load SheetJS) ──────────────────────── */

  let _xlsxLoaded = false;
  async function _ensureXlsx() {
    if (_xlsxLoaded || typeof window.XLSX !== 'undefined') { _xlsxLoaded = true; return; }
    await _loadScript(XLSX_CDN);
    _xlsxLoaded = typeof window.XLSX !== 'undefined';
    if (!_xlsxLoaded) throw new Error('SheetJS failed to load');
  }

  async function _extractXlsxText(file) {
    await _ensureXlsx();
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf, { type: 'array' });
    const parts = [];
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const csv = window.XLSX.utils.sheet_to_csv(ws, { strip: false });
      parts.push(`=== Sheet: ${sheetName} ===\n${csv}`);
    }
    return parts.join('\n\n');
  }

  /* ─── PPTX extraction (JSZip + XML walker for slide text) ──────── */

  let _jszipLoaded = false;
  async function _ensureJsZip() {
    if (_jszipLoaded || typeof window.JSZip !== 'undefined') { _jszipLoaded = true; return; }
    await _loadScript(JSZIP_CDN);
    _jszipLoaded = typeof window.JSZip !== 'undefined';
    if (!_jszipLoaded) throw new Error('JSZip failed to load');
  }

  async function _extractPptxText(file) {
    await _ensureJsZip();
    const buf = await file.arrayBuffer();
    const zip = await window.JSZip.loadAsync(buf);
    /* Slides live at ppt/slides/slideN.xml · sort numerically. */
    const slideFiles = Object.keys(zip.files)
      .filter(p => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)/i)[1], 10);
        const nb = parseInt(b.match(/slide(\d+)/i)[1], 10);
        return na - nb;
      });
    const slides = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const xml = await zip.files[slideFiles[i]].async('string');
      /* Pull all <a:t>…</a:t> runs · these contain actual text on the slide. */
      const matches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
      const text = matches
        .map(m => m.replace(/<\/?a:t[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"))
        .join(' ')
        .trim();
      slides.push(`--- Slide ${i + 1} ---\n${text || '[no text · likely image-only slide]'}`);
    }
    return slides.join('\n\n');
  }

  /* ─── EBCDIC IBM-1047 → UTF-8 conversion (inline lookup table) ─── */

  /* IBM-1047 codepage (most common z/OS Latin-1) → Unicode codepoints.
     Indices are EBCDIC byte values · values are the matching Unicode char. */
  const EBCDIC_1047 = (() => {
    const t = new Array(256).fill('?');
    /* Printable ASCII letters/digits/punct mapped from IBM-1047 byte positions. */
    const map = {
      0x40:' ', 0x4A:'¢', 0x4B:'.', 0x4C:'<', 0x4D:'(', 0x4E:'+', 0x4F:'|',
      0x50:'&', 0x5A:'!', 0x5B:'$', 0x5C:'*', 0x5D:')', 0x5E:';', 0x5F:'¬',
      0x60:'-', 0x61:'/', 0x6A:'¦', 0x6B:',', 0x6C:'%', 0x6D:'_', 0x6E:'>', 0x6F:'?',
      0x79:'`', 0x7A:':', 0x7B:'#', 0x7C:'@', 0x7D:"'", 0x7E:'=', 0x7F:'"',
      0x81:'a',0x82:'b',0x83:'c',0x84:'d',0x85:'e',0x86:'f',0x87:'g',0x88:'h',0x89:'i',
      0x91:'j',0x92:'k',0x93:'l',0x94:'m',0x95:'n',0x96:'o',0x97:'p',0x98:'q',0x99:'r',
      0xA2:'s',0xA3:'t',0xA4:'u',0xA5:'v',0xA6:'w',0xA7:'x',0xA8:'y',0xA9:'z',
      0xC1:'A',0xC2:'B',0xC3:'C',0xC4:'D',0xC5:'E',0xC6:'F',0xC7:'G',0xC8:'H',0xC9:'I',
      0xD1:'J',0xD2:'K',0xD3:'L',0xD4:'M',0xD5:'N',0xD6:'O',0xD7:'P',0xD8:'Q',0xD9:'R',
      0xE2:'S',0xE3:'T',0xE4:'U',0xE5:'V',0xE6:'W',0xE7:'X',0xE8:'Y',0xE9:'Z',
      0xF0:'0',0xF1:'1',0xF2:'2',0xF3:'3',0xF4:'4',0xF5:'5',0xF6:'6',0xF7:'7',0xF8:'8',0xF9:'9',
      0x15:'\n', 0x25:'\n', 0x05:'\t', 0x00:''
    };
    for (const [k, v] of Object.entries(map)) t[+k] = v;
    return t;
  })();

  async function _convertEbcdicToText(file) {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let out = '';
    for (let i = 0; i < bytes.length; i++) out += EBCDIC_1047[bytes[i]];
    return out;
  }

  /* ─── shared script loader helper ──────────────────────────────── */

  function _loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  /* ─── URL fetch (CORS-permitting) ──────────────────────────────── */

  async function fromUrl(url) {
    if (!/^https?:\/\//i.test(url)) { alert('URL must start with http:// or https://'); return; }
    const id = 'att-' + Date.now().toString(36);
    try {
      const r = await fetch(url, { method: 'GET' });
      const text = await r.text();
      _push({ id, name: url, type: r.headers.get('content-type') || 'text/html', sizeBytes: text.length, text: _truncate(text), kind: 'url' });
    } catch (e) {
      alert(`Fetch failed for ${url}: ${e.message}\n\nMany sites block cross-origin requests. To pull arbitrary URLs reliably we'd need a backend proxy (roadmap · 1-2 hour add to Knowledge agent).`);
    }
  }

  /* ─── build context string for the LLM ─────────────────────────── */

  function buildContextString() {
    if (!pending.length) return '';
    const blocks = pending.map(att => {
      const t = att.text || '';
      return `<attachment name="${att.name.replace(/"/g, '&quot;')}" type="${att.type}" kind="${att.kind}" bytes="${att.sizeBytes}">\n${t}\n</attachment>`;
    });
    return blocks.join('\n\n') + '\n\n';
  }

  /* ─── render chips · small UI for displaying attached items ────── */

  function renderChips(container) {
    if (!container) return;
    container.innerHTML = '';
    if (!pending.length) { container.style.display = 'none'; return; }
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '6px';
    container.style.padding = '6px 0';
    pending.forEach(att => {
      const chip = document.createElement('span');
      chip.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:#FFF7E6;border:1px solid #E8AC38;color:#1A2238;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:500';
      const icon = att.kind === 'pdf'    ? '📄'
                 : att.kind === 'docx'   ? '📝'
                 : att.kind === 'xlsx'   ? '📊'
                 : att.kind === 'pptx'   ? '📽'
                 : att.kind === 'ebcdic' ? '🖥'
                 : att.kind === 'image'  ? '🖼'
                 : att.kind === 'video'  ? '🎥'
                 : att.kind === 'url'    ? '🌐'
                 : '📎';
      chip.innerHTML = `${icon} ${att.name.length > 28 ? att.name.slice(0,25)+'…' : att.name} <button data-att-id="${att.id}" style="background:none;border:0;cursor:pointer;color:#1A2238;font-weight:700;padding:0 2px">×</button>`;
      chip.querySelector('button').addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-att-id');
        const idx = pending.findIndex(x => x.id === id);
        if (idx >= 0) { pending.splice(idx, 1); _emit(); renderChips(container); }
      });
      container.appendChild(chip);
    });
  }

  /* ─── expose ───────────────────────────────────────────────────── */

  window.AIDP_ATTACH = {
    openPicker:          openPicker,
    fromUrl:             fromUrl,
    pending:             pending,
    clearPending:        clearPending,
    buildContextString:  buildContextString,
    renderChips:         renderChips,
    onChange:            onChange
  };

  if (typeof console !== 'undefined') console.info('[AIDP_ATTACH] ready · supports text/md/json/csv/pdf/image-metadata/url');
})();
