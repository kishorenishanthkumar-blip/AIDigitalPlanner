/**
 * AIDP exporters · download chatbot content in Office and data formats.
 *
 * Mounts as window.AIDP_EXPORT with:
 *   - asMarkdown(text, filename?)         · .md
 *   - asTxt(text, filename?)              · .txt
 *   - asJson(obj, filename?)              · .json (pretty-printed)
 *   - asCsv(rows, filename?)              · .csv (rows = [[r1c1,r1c2,...], ...])
 *   - asDocx(markdown, filename?)         · .docx (mammoth → docx via docx.js)
 *   - asXlsx(sheets, filename?)           · .xlsx (sheets = {sheetName: rows[][]})
 *   - asPptx(slides, filename?)           · .pptx (slides = [{title, bullets[], notes?}])
 *   - guessAndExport(text)                · sniff content (json/csv/md) and export best-fit
 *
 * Libraries auto-load from CDN on first use:
 *   - SheetJS (xlsx)            for XLSX
 *   - PptxGenJS                 for PPTX
 *   - docx-js                   for DOCX (UMD build)
 */
(function () {
  'use strict';

  const SHEETJS_CDN  = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  const PPTXGEN_CDN  = 'https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgen.bundle.min.js';
  const DOCX_CDN     = 'https://unpkg.com/docx@8.5.0/build/index.umd.js';

  function _loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src; s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  function _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  function _ts() { return Date.now().toString(36); }

  /* ─── plain text + markdown + json + csv ───────────────────────── */

  function asMarkdown(text, filename) {
    _downloadBlob(new Blob([text], { type: 'text/markdown' }), filename || `niche-i-${_ts()}.md`);
  }

  function asTxt(text, filename) {
    _downloadBlob(new Blob([text], { type: 'text/plain' }), filename || `niche-i-${_ts()}.txt`);
  }

  function asJson(obj, filename) {
    const body = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
    _downloadBlob(new Blob([body], { type: 'application/json' }), filename || `niche-i-${_ts()}.json`);
  }

  function asCsv(rows, filename) {
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const body = rows.map(r => Array.isArray(r) ? r.map(esc).join(',') : esc(r)).join('\n');
    _downloadBlob(new Blob([body], { type: 'text/csv' }), filename || `niche-i-${_ts()}.csv`);
  }

  /* ─── XLSX ─────────────────────────────────────────────────────── */

  async function _ensureXlsx() {
    if (typeof window.XLSX !== 'undefined') return;
    await _loadScript(SHEETJS_CDN);
    if (typeof window.XLSX === 'undefined') throw new Error('SheetJS failed to load');
  }

  async function asXlsx(sheets, filename) {
    await _ensureXlsx();
    const wb = window.XLSX.utils.book_new();
    /* sheets may be: array of rows (→ Sheet1), or {sheetName: rows[][]}. */
    if (Array.isArray(sheets)) {
      const ws = window.XLSX.utils.aoa_to_sheet(sheets);
      window.XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    } else {
      for (const [name, rows] of Object.entries(sheets)) {
        const ws = window.XLSX.utils.aoa_to_sheet(rows);
        window.XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31)); /* Excel cap */
      }
    }
    window.XLSX.writeFile(wb, filename || `niche-i-${_ts()}.xlsx`);
  }

  /* ─── PPTX ─────────────────────────────────────────────────────── */

  async function _ensurePptx() {
    if (typeof window.PptxGenJS !== 'undefined') return;
    await _loadScript(PPTXGEN_CDN);
    if (typeof window.PptxGenJS === 'undefined') throw new Error('PptxGenJS failed to load');
  }

  /**
   * slides = [{ title:string, bullets:string[], notes?:string }]
   * OR full structured video brief (will be auto-converted).
   */
  async function asPptx(slides, filename) {
    await _ensurePptx();
    /* Allow passing a video brief {title, scenes:[...]} */
    if (slides && slides.scenes && Array.isArray(slides.scenes)) {
      slides = slides.scenes.map(s => ({
        title: s.title || '',
        bullets: [s.narration || s.visual || ''].filter(Boolean),
        notes: s.narration || ''
      }));
    }
    if (!Array.isArray(slides)) throw new Error('asPptx expects array of {title,bullets,notes?} or a video brief');

    const pres = new window.PptxGenJS();
    pres.layout = 'LAYOUT_WIDE';

    slides.forEach((s, i) => {
      const slide = pres.addSlide();
      slide.background = { fill: i === 0 ? '1A2238' : 'FFFFFF' };
      slide.addText(s.title || `Slide ${i + 1}`, {
        x: 0.5, y: 0.4, w: 12, h: 1,
        fontSize: 28, bold: true,
        color: i === 0 ? 'FFD070' : '1A2238',
        fontFace: 'Calibri'
      });
      const bullets = (s.bullets || []).filter(Boolean);
      if (bullets.length) {
        slide.addText(bullets.map(b => ({ text: b, options: { bullet: true } })), {
          x: 0.6, y: 1.6, w: 12, h: 5,
          fontSize: 18, color: i === 0 ? 'FFFFFF' : '1A2238',
          fontFace: 'Calibri', valign: 'top'
        });
      }
      if (s.notes) slide.addNotes(s.notes);
    });

    await pres.writeFile({ fileName: filename || `niche-i-${_ts()}.pptx` });
  }

  /* ─── DOCX ─────────────────────────────────────────────────────── */

  async function _ensureDocx() {
    if (typeof window.docx !== 'undefined') return;
    await _loadScript(DOCX_CDN);
    if (typeof window.docx === 'undefined') throw new Error('docx.js failed to load');
  }

  /**
   * Convert a markdown string to a Word document. Lightweight conversion ·
   * supports headers (#, ##, ###), bullets (- or *), bold (**…**), and paragraphs.
   * For richer fidelity (tables, code blocks, links), upgrade to a markdown-to-docx
   * tool · today's mapping is intentionally simple to keep the build fast.
   */
  async function asDocx(markdown, filename) {
    await _ensureDocx();
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = window.docx;

    const lines = String(markdown || '').split(/\r?\n/);
    const blocks = [];

    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) { blocks.push(new Paragraph('')); continue; }

      let heading = null;
      if (line.startsWith('### ')) { heading = HeadingLevel.HEADING_3; }
      else if (line.startsWith('## ')) { heading = HeadingLevel.HEADING_2; }
      else if (line.startsWith('# '))  { heading = HeadingLevel.HEADING_1; }

      if (heading) {
        const text = line.replace(/^#+\s+/, '');
        blocks.push(new Paragraph({ heading, children: _runs(text, TextRun) }));
        continue;
      }
      if (/^\s*[-*]\s+/.test(line)) {
        const text = line.replace(/^\s*[-*]\s+/, '');
        blocks.push(new Paragraph({ bullet: { level: 0 }, children: _runs(text, TextRun) }));
        continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        const text = line.replace(/^\s*\d+\.\s+/, '');
        blocks.push(new Paragraph({ numbering: { reference: 'default-numbering', level: 0 }, children: _runs(text, TextRun) }));
        continue;
      }
      blocks.push(new Paragraph({ children: _runs(line, TextRun) }));
    }

    const doc = new Document({
      creator: 'Niche-I (AIDP)',
      title: 'Niche-I export',
      sections: [{ properties: {}, children: blocks }]
    });
    const blob = await Packer.toBlob(doc);
    _downloadBlob(blob, filename || `niche-i-${_ts()}.docx`);
  }

  /* split text on **bold** runs */
  function _runs(text, TextRun) {
    const out = [];
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    for (const p of parts) {
      if (!p) continue;
      if (/^\*\*[^*]+\*\*$/.test(p)) {
        out.push(new TextRun({ text: p.slice(2, -2), bold: true }));
      } else {
        out.push(new TextRun(p));
      }
    }
    return out.length ? out : [new TextRun(text)];
  }

  /* ─── guess + export ───────────────────────────────────────────── */

  function guessAndExport(text, baseName) {
    const trimmed = String(text || '').trim();
    /* JSON? */
    if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && (trimmed.endsWith('}') || trimmed.endsWith(']'))) {
      try { JSON.parse(trimmed); return asJson(trimmed, (baseName || 'export') + '.json'); } catch {}
    }
    /* CSV? · cheap heuristic · lots of commas + uniform line length */
    if (/^[^,\n]+(,[^,\n]+){2,}\n/.test(trimmed)) {
      const rows = trimmed.split(/\r?\n/).map(line => _splitCsvLine(line));
      return asCsv(rows, (baseName || 'export') + '.csv');
    }
    /* Markdown-ish? · headers / bullets / fences */
    if (/^#{1,6}\s|\n[*\-]\s|```/m.test(trimmed)) {
      return asMarkdown(trimmed, (baseName || 'export') + '.md');
    }
    /* Default · plain text */
    return asTxt(trimmed, (baseName || 'export') + '.txt');
  }

  function _splitCsvLine(line) {
    const out = [];
    let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else {
        if (ch === ',') { out.push(cur); cur = ''; }
        else if (ch === '"') q = true;
        else cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  /* ─── expose ───────────────────────────────────────────────────── */

  window.AIDP_EXPORT = {
    asMarkdown:      asMarkdown,
    asTxt:           asTxt,
    asJson:          asJson,
    asCsv:           asCsv,
    asDocx:          asDocx,
    asXlsx:          asXlsx,
    asPptx:          asPptx,
    guessAndExport:  guessAndExport
  };

  if (typeof console !== 'undefined') console.info('[AIDP_EXPORT] ready · md/txt/json/csv/docx/xlsx/pptx');
})();
