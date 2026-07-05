/* ─────────────────────────────────────────────────────────────
   Niche-I · DI-Platform personal AI assistant
   Phase 1 — Chatbot widget + CLI + Context store
   Auto-injects on any page that includes this script.
   © 2026 Nishanth Kumar Kishore / Digital Infotech
   ───────────────────────────────────────────────────────────── */
(function() {
  'use strict';
  if (window.__nishiMounted) return;
  window.__nishiMounted = true;

  // ─── Constants ─────────────────────────────────────────────
  const CTX_KEY = 'di_nishi_context';
  const HIST_KEY = 'di_nishi_history';
  const PREFS_KEY = 'di_nishi_prefs';
  const VERSION = '1.0.0';

  // ─── Default context shape ─────────────────────────────────
  const DEFAULT_CTX = {
    name: null,
    role: null,
    region: null,
    persona: null,
    email: null,
    organization: 'Digital Infotech',
    createdAt: null,
    answers: {},
    preferences: { voice: false, speak: false, theme: 'dark' }
  };

  // ─── Context store ─────────────────────────────────────────
  const Ctx = {
    load() {
      try {
        const raw = sessionStorage.getItem(CTX_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return Object.assign({}, DEFAULT_CTX, parsed || {});
      } catch (e) { return Object.assign({}, DEFAULT_CTX); }
    },
    save(c) { sessionStorage.setItem(CTX_KEY, JSON.stringify(c)); },
    update(patch) {
      const c = this.load();
      Object.assign(c, patch);
      this.save(c);
      return c;
    },
    reset() {
      sessionStorage.removeItem(CTX_KEY);
      sessionStorage.removeItem(HIST_KEY);
    }
  };

  // ─── History store ─────────────────────────────────────────
  const Hist = {
    load() {
      try {
        const raw = sessionStorage.getItem(HIST_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    },
    push(role, text) {
      const list = this.load();
      list.push({ role, text, ts: new Date().toISOString() });
      if (list.length > 200) list.shift();
      sessionStorage.setItem(HIST_KEY, JSON.stringify(list));
      return list;
    },
    clear() { sessionStorage.removeItem(HIST_KEY); }
  };

  // ─── Responder (rule-based, role/region aware) ────────────
  // This is a deterministic stub. Phase 9 will replace responder
  // logic with the RAG + LLM pipeline; the interface stays the same.
  const KB = {
    studios: [
      { key: 'discovery',     name: 'Discovery Studio',      path: 'discovery-studio.html',     blurb: 'Current vs Future systems analysis, asset & CMDB discovery, SLA management. Board-ready.' },
      { key: 'requirements',  name: 'AI Requirements',       path: 'requirements.html',                blurb: 'Six-agent pipeline that turns unstructured discovery into Jira/Rally backlogs.' },
      { key: 'architecture',  name: 'Architecture Studio',   path: 'architecture-studio.html',  blurb: 'Six deployment targets — Private DC, AWS, Azure, GCP, OCI, IBM — with full blueprints.' },
      { key: 'governance',    name: 'Program Governance',    path: 'program-governance.html',   blurb: 'End-to-end plan: requirements, RAID, 7R timeline, cost, MS Project export, DR runlog.' }
    ],
    regionRegs: {
      'North America': 'SOX, GLBA, PCI-DSS, FFIEC, OCC (US); OSFI, PIPEDA (Canada)',
      'Europe':        'GDPR, PSD2/PSD3, DORA, MiCA, EBA guidelines',
      'Asia Pacific':  'RBI (India), MAS (Singapore), APRA (Australia), FSA (Japan), HKMA (Hong Kong)',
      'South East Asia': 'BNM (Malaysia), OJK (Indonesia), BSP (Philippines), BoT (Thailand), SBV (Vietnam)',
      'South Western Asia': 'SAMA (Saudi Arabia), CBUAE/DFSA, CBB (Bahrain), CBK (Kuwait), QFCRA (Qatar)'
    }
  };

  function reply(input, ctx) {
    const q = input.trim().toLowerCase();
    const name = ctx.name || 'there';

    // Greetings
    if (/^(hi|hello|hey|hola|namaste|good\s+(morning|afternoon|evening))\b/.test(q)) {
      return `Hi ${name}! I'm Niche-I — your DI-Platform assistant. Try \`help\` to see what I can do, or ask me about any studio.`;
    }
    // Help
    if (/^(help|\?|what can you do)/.test(q)) {
      return [
        `**Things I can do** (${VERSION})`,
        ``,
        `- Greet you by name and remember your role / region`,
        `- Launch the RFP Questionnaire: type \`start questionnaire\``,
        `- Point you to the right studio for what you need`,
        `- Show your current context: type \`context show\``,
        `- Update your context: \`my role is CTO\` · \`my region is Europe\``,
        `- List regulatory rules for your region: \`regulations\``,
        `- Open the CLI panel: press \`Ctrl + \``,
        `- In CLI, commands are: \`ask\`, \`history\`, \`context show\`, \`context set <key>=<value>\`, \`reset\`, \`clear\`, \`help\``,
        ``,
        `In Phase 9 I'll connect to a real LLM via RAG — until then I'm rule-based but personalised to your profile.`
      ].join('\n');
    }
    // Show context
    if (/^(context show|show (my )?context|who am i)/.test(q)) {
      const o = {
        name: ctx.name, role: ctx.role, region: ctx.region,
        persona: ctx.persona, email: ctx.email, organization: ctx.organization,
        answersCount: Object.keys(ctx.answers || {}).length
      };
      return `Your current context:\n\`\`\`json\n${JSON.stringify(o, null, 2)}\n\`\`\``;
    }
    // Update role
    const roleMatch = q.match(/my role is\s+(.+)/i);
    if (roleMatch) {
      Ctx.update({ role: titleCase(roleMatch[1].trim()) });
      return `Got it — I'll remember your role is **${titleCase(roleMatch[1].trim())}**.`;
    }
    // Update region
    const regionMatch = q.match(/my region is\s+(.+)/i);
    if (regionMatch) {
      const r = titleCase(regionMatch[1].trim());
      Ctx.update({ region: r });
      const regs = KB.regionRegs[r];
      return regs
        ? `Updated — your region is **${r}**. Regulators to consider: ${regs}.`
        : `Updated — your region is **${r}**. I don't have a regulator pack for that region yet.`;
    }
    // Regulations
    if (/^(regulations|compliance|regs)\b/.test(q)) {
      const r = ctx.region;
      if (r && KB.regionRegs[r]) return `For **${r}**, the in-scope regulators are: ${KB.regionRegs[r]}.`;
      return `I don't know your region yet. Set it with \`my region is Europe\` (or NA / APAC / SEA / SWA).`;
    }
    // Questionnaire launch
    if (/(start|launch|open|begin|take).{0,12}(questionnaire|rfp|brief|survey)|^questionnaire$|^rfp$/i.test(q)) {
      setTimeout(() => { window.location.href = 'questionnaire.html'; }, 800);
      return `Opening the RFP Questionnaire now${ctx.name ? ', ' + ctx.name.split(' ')[0] : ''}. I'll pre-fill your role (**${ctx.role || 'unset'}**) and region (**${ctx.region || 'unset'}**) and adapt the questions.`;
    }
    // Studios
    if (/(studio|discovery|architecture|governance|requirements|workflow)/.test(q)) {
      const lines = ['Here are the studios — click any to open:', ''];
      KB.studios.forEach(s => lines.push(`- **${s.name}** — ${s.blurb} · [open](${s.path})`));
      lines.push(`- **RFP Questionnaire (NEW)** — Role + region-adapted brainstorm. · [open](questionnaire.html)`);
      return lines.join('\n');
    }
    // Thank you
    if (/^(thanks|thank you|ty|thx)\b/.test(q)) {
      return `You're welcome${ctx.name ? ', ' + ctx.name : ''}. Anything else you'd like to explore?`;
    }
    // Bye
    if (/^(bye|goodbye|see you|exit|quit)\b/.test(q)) {
      return `Take care${ctx.name ? ', ' + ctx.name : ''} — your context is saved for this session.`;
    }
    // Default — acknowledge with context
    const hints = [];
    if (!ctx.role) hints.push('tell me your role (`my role is …`)');
    if (!ctx.region) hints.push('tell me your region (`my region is …`)');
    const hint = hints.length ? ` Tip: ${hints.join(' and ')} so I can tailor my answers.` : '';
    return `I heard: "${input}". I'm a Phase-1 rule-based responder, so I can't answer free-form questions yet — try \`help\` for what I can do.${hint}`;
  }

  function titleCase(s) {
    return s.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
  }

  // ─── Markdown-lite renderer (bold + inline code + lists + links) ──
  function md(s) {
    const esc = x => x.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    let out = esc(s);
    // code fences
    out = out.replace(/```([\s\S]*?)```/g, (_, body) => `<pre class="ni-pre">${body}</pre>`);
    // inline code
    out = out.replace(/`([^`]+)`/g, '<code class="ni-code">$1</code>');
    // bold
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // links [text](url)
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="ni-link" href="$2">$1</a>');
    // bullets
    out = out.replace(/(^|\n)- (.+)/g, '$1<li>$2</li>');
    out = out.replace(/(<li>.+<\/li>)/gs, '<ul class="ni-ul">$1</ul>');
    // newlines
    out = out.replace(/\n/g, '<br>');
    return out;
  }

  // ─── Styles ────────────────────────────────────────────────
  const STYLE = `
  #nishi-root, #nishi-cli { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Outfit", sans-serif; }
  /* FAB toggle */
  #nishi-fab { position:fixed; right:22px; bottom:22px; z-index:9990; width:54px; height:54px; border-radius:50%; cursor:pointer;
    background: linear-gradient(135deg,#C8921A 0%,#FFD070 100%); border:none; box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 0 1px rgba(200,146,26,.4);
    display:flex; align-items:center; justify-content:center; font-weight:900; font-size:18px; color:#060B14;
    transition: transform .25s ease; }
  #nishi-fab:hover { transform: translateY(-3px) scale(1.04); }
  #nishi-fab .ni-dot { position:absolute; top:6px; right:6px; width:10px; height:10px; border-radius:50%; background:#0FD49A; box-shadow:0 0 8px #0FD49A; }
  /* Widget panel */
  #nishi-root { position:fixed; right:22px; bottom:90px; z-index:9991; width:380px; max-width:calc(100vw - 30px); height:560px; max-height:calc(100vh - 120px);
    background:#101828; border:1px solid #1C2E48; border-radius:14px; box-shadow:0 30px 80px rgba(0,0,0,.7),0 0 0 1px rgba(200,146,26,.06);
    display:none; flex-direction:column; overflow:hidden; color:#EEF4FF; font-size:13px; line-height:1.5; }
  #nishi-root.on { display:flex; animation: ni-pop .25s ease; }
  @keyframes ni-pop { from{ opacity:0; transform:translateY(8px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1);} }
  .ni-head { display:flex; align-items:center; gap:10px; padding:12px 14px; border-bottom:1px solid #1C2E48; background:#172845; }
  .ni-avatar { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#C8921A,#FFD070); display:flex; align-items:center; justify-content:center; font-weight:900; color:#060B14; font-size:14px; }
  .ni-title { flex:1; }
  .ni-title .n { font-family:"Fraunces",Georgia,serif; font-size:15px; font-weight:700; color:#EEF4FF; }
  .ni-title .s { font-size:10.5px; color:#8AA4C8; }
  .ni-status { width:8px; height:8px; border-radius:50%; background:#0FD49A; box-shadow:0 0 6px #0FD49A; }
  .ni-btn { background:transparent; border:1px solid #243655; color:#8AA4C8; border-radius:6px; padding:5px 9px; font-size:11px; cursor:pointer; transition:.2s; }
  .ni-btn:hover { border-color:#C8921A; color:#E8AC38; }
  .ni-body { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:10px; background:#0D1628; }
  .ni-msg { padding:9px 12px; border-radius:10px; max-width:88%; word-wrap:break-word; }
  .ni-msg.bot { background:#14213A; border:1px solid #1C2E48; align-self:flex-start; color:#EEF4FF; }
  .ni-msg.user { background:#172845; border:1px solid #243655; align-self:flex-end; color:#EEF4FF; }
  .ni-msg.bot strong { color:#E8AC38; }
  .ni-code { background:#060B14; padding:1px 6px; border-radius:4px; font-family:"JetBrains Mono","Courier New",monospace; font-size:11.5px; color:#FFD070; border:1px solid #1C2E48;}
  .ni-pre { background:#060B14; padding:9px 11px; border-radius:6px; font-family:"JetBrains Mono","Courier New",monospace; font-size:11px; color:#8AA4C8; overflow-x:auto; border:1px solid #1C2E48; white-space:pre-wrap; }
  .ni-link { color:#3D8EFF; text-decoration:none; }
  .ni-link:hover { text-decoration:underline; }
  .ni-ul { margin:6px 0 4px 18px; padding:0; }
  .ni-ul li { margin-bottom:3px; }
  .ni-input-row { display:flex; gap:6px; padding:10px 12px; border-top:1px solid #1C2E48; background:#101828; }
  .ni-input { flex:1; padding:9px 12px; background:#14213A; border:1px solid #1C2E48; border-radius:7px; color:#EEF4FF; font-size:13px; outline:none; }
  .ni-input:focus { border-color:#C8921A; }
  .ni-mic, .ni-send { padding:9px 11px; border:1px solid #243655; background:#14213A; color:#8AA4C8; border-radius:7px; font-size:13px; cursor:pointer; transition:.2s; }
  .ni-mic.on { background:#FF4D6A; color:#fff; border-color:#FF4D6A; }
  .ni-send { background:#C8921A; color:#060B14; border-color:#C8921A; font-weight:700; }
  .ni-send:hover { background:#E8AC38; }
  .ni-foot { display:flex; gap:8px; align-items:center; padding:6px 14px 10px; background:#101828; border-top:1px solid #1C2E48; font-size:10.5px; color:#4A6285; }
  .ni-toggle { display:flex; align-items:center; gap:5px; cursor:pointer; }
  .ni-toggle input { accent-color:#C8921A; }

  /* CLI overlay */
  #nishi-cli { position:fixed; left:0; right:0; bottom:0; height:42vh; z-index:9992; background:#060B14; border-top:2px solid #C8921A; display:none; flex-direction:column;
    box-shadow:0 -10px 40px rgba(0,0,0,.6); font-family:"JetBrains Mono","Courier New",monospace; }
  #nishi-cli.on { display:flex; animation: ni-slide .25s ease; }
  @keyframes ni-slide { from{ transform: translateY(100%); } to { transform: translateY(0); } }
  .cli-head { display:flex; align-items:center; padding:6px 14px; background:#0D1628; border-bottom:1px solid #1C2E48; font-size:11.5px; color:#8AA4C8; }
  .cli-head .dot { width:9px; height:9px; border-radius:50%; background:#FF4D6A; margin-right:6px; }
  .cli-head .dot.y { background:#E8AC38; }
  .cli-head .dot.g { background:#0FD49A; }
  .cli-head .lbl { flex:1; color:#EEF4FF; }
  .cli-head .ni-btn { margin-left:6px; }
  .cli-out { flex:1; overflow-y:auto; padding:10px 14px; font-size:12px; color:#8AA4C8; white-space:pre-wrap; line-height:1.55; }
  .cli-out .cli-prompt { color:#FFD070; }
  .cli-out .cli-bot { color:#EEF4FF; }
  .cli-out .cli-err { color:#FF4D6A; }
  .cli-in-row { display:flex; gap:6px; padding:8px 14px 10px; border-top:1px solid #1C2E48; background:#0D1628; align-items:center; }
  .cli-in-row .ps { color:#FFD070; font-size:12px; }
  .cli-in { flex:1; background:transparent; border:none; outline:none; color:#EEF4FF; font-family:"JetBrains Mono","Courier New",monospace; font-size:12.5px; }
  `;

  // ─── DOM building ──────────────────────────────────────────
  function injectStyle() {
    if (document.getElementById('nishi-style')) return;
    const s = document.createElement('style');
    s.id = 'nishi-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  let widget, body, input, micBtn, fab, cli, cliOut, cliIn, speakToggle;
  let recognition = null, recognising = false;

  function buildWidget() {
    // FAB
    fab = document.createElement('button');
    fab.id = 'nishi-fab';
    fab.title = 'Open Niche-I (Alt+N)';
    fab.innerHTML = 'Ni<span class="ni-dot"></span>';
    fab.onclick = toggleWidget;
    document.body.appendChild(fab);

    // Panel
    widget = document.createElement('div');
    widget.id = 'nishi-root';
    widget.innerHTML = `
      <div class="ni-head">
        <div class="ni-avatar">Ni</div>
        <div class="ni-title">
          <div class="n">Niche-I</div>
          <div class="s">Personal AI assistant · v${VERSION}</div>
        </div>
        <div class="ni-status" title="Online"></div>
        <button class="ni-btn" id="ni-cli-open" title="Open CLI (Ctrl+\`)">CLI</button>
        <button class="ni-btn" id="ni-clear" title="Clear history">Clear</button>
        <button class="ni-btn" id="ni-close" title="Close">✕</button>
      </div>
      <div class="ni-body" id="ni-body"></div>
      <div class="ni-input-row">
        <input class="ni-input" id="ni-input" type="text" placeholder="Ask Niche-I…" autocomplete="off">
        <button class="ni-mic" id="ni-mic" title="Speak">🎤</button>
        <button class="ni-send" id="ni-send" title="Send (Enter)">Send</button>
      </div>
      <div class="ni-foot">
        <label class="ni-toggle"><input type="checkbox" id="ni-speak"> Speak responses</label>
        <span style="flex:1"></span>
        <span>Phase 1 · rule-based</span>
      </div>`;
    document.body.appendChild(widget);

    body = widget.querySelector('#ni-body');
    input = widget.querySelector('#ni-input');
    micBtn = widget.querySelector('#ni-mic');
    speakToggle = widget.querySelector('#ni-speak');

    widget.querySelector('#ni-close').onclick = toggleWidget;
    widget.querySelector('#ni-clear').onclick = () => { Hist.clear(); body.innerHTML=''; greet(true); };
    widget.querySelector('#ni-cli-open').onclick = toggleCLI;
    widget.querySelector('#ni-send').onclick = onSend;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') onSend(); });
    micBtn.onclick = onMic;
    speakToggle.onchange = () => {
      const c = Ctx.load();
      c.preferences = c.preferences || {};
      c.preferences.speak = speakToggle.checked;
      Ctx.save(c);
    };
    // restore prefs
    const ctxNow = Ctx.load();
    if (ctxNow.preferences && ctxNow.preferences.speak) speakToggle.checked = true;
  }

  function buildCLI() {
    cli = document.createElement('div');
    cli.id = 'nishi-cli';
    cli.innerHTML = `
      <div class="cli-head">
        <span class="dot"></span><span class="dot y"></span><span class="dot g"></span>
        <span class="lbl">nishi · cli — type <code>help</code> for commands · <code>Ctrl+\`</code> to toggle</span>
        <button class="ni-btn" id="cli-clear">Clear</button>
        <button class="ni-btn" id="cli-close">✕</button>
      </div>
      <div class="cli-out" id="cli-out"></div>
      <div class="cli-in-row">
        <span class="ps">nishi&nbsp;❯</span>
        <input class="cli-in" id="cli-in" type="text" autocomplete="off" autofocus placeholder="ask, history, context show, reset, help…">
      </div>`;
    document.body.appendChild(cli);
    cliOut = cli.querySelector('#cli-out');
    cliIn = cli.querySelector('#cli-in');
    cli.querySelector('#cli-close').onclick = toggleCLI;
    cli.querySelector('#cli-clear').onclick = () => { cliOut.innerHTML = ''; };
    cliIn.addEventListener('keydown', e => { if (e.key === 'Enter') cliRun(); });
  }

  // ─── Widget actions ────────────────────────────────────────
  function toggleWidget() {
    widget.classList.toggle('on');
    if (widget.classList.contains('on')) {
      input.focus();
      if (body.children.length === 0) greet();
    }
  }

  function toggleCLI() {
    cli.classList.toggle('on');
    if (cli.classList.contains('on')) {
      cliIn.focus();
      if (cliOut.children.length === 0) {
        cliPrint('bot', `nishi CLI v${VERSION} · type \`help\` for commands.`);
      }
    }
  }

  function greet(reset) {
    const ctx = Ctx.load();
    const hour = new Date().getHours();
    const tod = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const name = ctx.name ? ', ' + ctx.name : '';
    const role = ctx.role ? ` (${ctx.role})` : '';
    const region = ctx.region ? ` working from ${ctx.region}` : '';
    bot(`Good ${tod}${name}${role}${region}. I'm Niche-I — your DI-Platform assistant. ${reset ? 'History cleared. ' : ''}How can I help today? Type \`help\` for what I can do.`);
  }

  function bot(text) {
    const el = document.createElement('div');
    el.className = 'ni-msg bot';
    el.innerHTML = md(text);
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    Hist.push('bot', text);
    if (speakToggle && speakToggle.checked) speak(text);
    return el;          // return for streaming use
  }
  function user(text) {
    const el = document.createElement('div');
    el.className = 'ni-msg user';
    el.innerHTML = md(text);
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    Hist.push('user', text);
  }

  function onSend() {
    const t = input.value.trim();
    if (!t) return;
    user(t);
    input.value = '';

    /* Live path · stream from master /chat when AIDP API client is loaded */
    if (window.AIDP && typeof window.AIDP.streamChat === 'function') {
      const botEl = bot('_…thinking…_');
      let textBuf = '';
      let toolNote = '';

      function rerender() {
        const content = toolNote + textBuf;
        botEl.innerHTML = md(content || '_…thinking…_');
        body.scrollTop = body.scrollHeight;
      }

      window.AIDP.streamChat(t, {
        onToolCall: (evt) => {
          const tname = (evt.toolName || evt.tool || evt.name || 'tool');
          toolNote = `_calling \`${tname}\`…_\n\n`;
          rerender();
        },
        onToolResult: () => {
          toolNote = '';
          rerender();
        },
        onChunk: (evt) => {
          textBuf += (evt.content || evt.text || evt.delta || '');
          rerender();
        },
        onToolError: (evt) => {
          toolNote = `_tool error: ${evt.message || 'unknown'}_\n\n`;
          rerender();
        },
        onError: (evt) => {
          textBuf += `\n\n_⚠ ${evt.message || 'stream error'}_`;
          rerender();
        },
        onDone: () => {
          if (!textBuf.trim()) {
            textBuf = '_(no response · master agent returned empty stream · check connection)_';
            rerender();
          }
          Hist.push('bot', textBuf);
          if (speakToggle && speakToggle.checked) speak(textBuf);
        }
      });
      return;
    }

    /* Fallback · demo response when AIDP client not present */
    setTimeout(() => bot(reply(t, Ctx.load())), 220);
  }

  // ─── Speech ────────────────────────────────────────────────
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text.replace(/[*`#>_]/g, ''));
    u.rate = 1.05; u.pitch = 1; u.volume = 0.9;
    speechSynthesis.speak(u);
  }

  function onMic() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      bot('Sorry — your browser does not support speech recognition. Try Chrome or Edge.');
      return;
    }
    if (recognising) { recognition && recognition.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { recognising = true; micBtn.classList.add('on'); };
    recognition.onend   = () => { recognising = false; micBtn.classList.remove('on'); };
    recognition.onerror = (e) => { recognising = false; micBtn.classList.remove('on'); };
    recognition.onresult = (e) => {
      const t = e.results[0][0].transcript;
      input.value = t;
      onSend();
    };
    recognition.start();
  }

  // ─── CLI ───────────────────────────────────────────────────
  function cliPrint(kind, text) {
    const div = document.createElement('div');
    div.className = 'cli-' + kind;
    if (kind === 'prompt') div.textContent = 'nishi ❯ ' + text;
    else div.innerHTML = (kind === 'bot' || kind === 'err') ? text : md(text);
    cliOut.appendChild(div);
    cliOut.scrollTop = cliOut.scrollHeight;
  }

  function cliRun() {
    const line = cliIn.value.trim();
    if (!line) return;
    cliPrint('prompt', line);
    cliIn.value = '';
    const [cmd, ...rest] = line.split(/\s+/);
    const arg = rest.join(' ');
    try {
      switch (cmd.toLowerCase()) {
        case 'help':
          cliPrint('bot', `Commands:
  ask "<question>"            Ask Niche-I (use quotes for multi-word)
  history                     Show last 20 messages
  context show                Show your full context
  context set <key>=<value>   Update a context key (name, role, region, persona, email)
  reset                       Clear context + history
  clear                       Clear CLI screen
  version                     Print Niche-I version
  exit                        Close the CLI`);
          break;
        case 'ask': {
          const q = arg.replace(/^"|"$/g, '');
          if (!q) { cliPrint('err','usage: ask "<question>"'); break; }
          cliPrint('bot', reply(q, Ctx.load()));
          break;
        }
        case 'history': {
          const list = Hist.load().slice(-20);
          if (!list.length) { cliPrint('bot', '(no history yet)'); break; }
          cliPrint('bot', list.map(h => `[${h.role}] ${h.text.slice(0,140).replace(/\n/g,' ')}`).join('\n'));
          break;
        }
        case 'context': {
          const sub = rest[0];
          if (sub === 'show' || !sub) {
            cliPrint('bot', `\`\`\`json\n${JSON.stringify(Ctx.load(), null, 2)}\n\`\`\``);
          } else if (sub === 'set') {
            const kv = rest.slice(1).join(' ');
            const m = kv.match(/^(\w+)=(.+)$/);
            if (!m) { cliPrint('err','usage: context set name=Nishanth'); break; }
            Ctx.update({ [m[1]]: m[2] });
            cliPrint('bot', `set ${m[1]} = ${m[2]}`);
          } else {
            cliPrint('err', 'unknown subcommand: ' + sub);
          }
          break;
        }
        case 'reset':
          Ctx.reset(); cliPrint('bot','context and history cleared.');
          break;
        case 'clear':
          cliOut.innerHTML = '';
          break;
        case 'version':
          cliPrint('bot', 'nishi v' + VERSION);
          break;
        case 'exit': case 'quit':
          toggleCLI();
          break;
        default:
          // any free-text is treated as "ask"
          cliPrint('bot', reply(line, Ctx.load()));
      }
    } catch (e) {
      cliPrint('err', 'error: ' + e.message);
    }
  }

  // ─── Global shortcuts ──────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    // Ctrl + ` toggles CLI
    if (e.ctrlKey && e.key === '`') { e.preventDefault(); toggleCLI(); }
    // Alt + N toggles widget
    if (e.altKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); toggleWidget(); }
  });

  // ─── Public API on window ─────────────────────────────────
  window.Nishi = {
    context: Ctx,
    history: Hist,
    say(text) { if (!widget.classList.contains('on')) toggleWidget(); bot(text); },
    ask(text) { if (!widget.classList.contains('on')) toggleWidget(); user(text); setTimeout(()=>bot(reply(text, Ctx.load())), 200); },
    open() { if (!widget.classList.contains('on')) toggleWidget(); },
    openCLI() { if (!cli.classList.contains('on')) toggleCLI(); },
    setProfile(p) { Ctx.update(p || {}); return Ctx.load(); },
    version: VERSION
  };

  // ─── Boot ──────────────────────────────────────────────────
  function boot() {
    injectStyle();
    buildWidget();
    buildCLI();
    // If account-creation profile is stashed by index.html, pick it up
    try {
      const acct = sessionStorage.getItem('di_account_profile');
      if (acct) {
        const p = JSON.parse(acct);
        const c = Ctx.load();
        if (!c.name) Ctx.update({ ...p, createdAt: c.createdAt || new Date().toISOString() });
      }
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
