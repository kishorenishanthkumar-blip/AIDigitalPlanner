/* DI-Platform · Phase 2 Questionnaire Engine (v1.1 — with validation) */
(function () {
  'use strict';
  if (typeof window !== 'undefined' && window.QEngine) return;
  const SKEY_ANS = 'di_q_answers', SKEY_META = 'di_q_meta';

  const QEngine = {
    _root: null, _packs: null, _state: null,

    mount(opts) {
      this._root = opts.rootEl;
      this._packs = opts.packs;
      const meta = this._loadMeta();
      this._state = {
        role:    opts.role   || meta.role   || 'Business Owner',
        region:  opts.region || meta.region || 'North America',
        domain:  opts.domain || meta.domain || 'Core Banking — Payments',
        answers: this._loadAnswers(),
        currentSection: meta.currentSection || 0,
        onComplete: opts.onComplete || (()=>{}),
        onProgress: opts.onProgress || (()=>{})
      };
      this._render();
    },

    visibleQuestions() {
      const { role, region, domain, answers } = this._state;
      return this._packs.questions.filter(q => {
        if (q.roleScope   && q.roleScope.length   && !q.roleScope.includes(role)   && !q.roleScope.includes('*')) return false;
        if (q.regionScope && q.regionScope.length && !q.regionScope.includes(region)&& !q.regionScope.includes('*')) return false;
        if (q.domainScope && q.domainScope.length && !q.domainScope.includes(domain)&& !q.domainScope.includes('*')) return false;
        if (q.showIf) for (const [k, v] of Object.entries(q.showIf)) {
          const a = answers[k];
          if (Array.isArray(v) ? !v.includes(a) : a !== v) return false;
        }
        return true;
      });
    },

    questionsForSection(id){ return this.visibleQuestions().filter(q=>q.section===id); },
    sections() { const v = this.visibleQuestions(); return this._packs.sections.filter(s => v.some(q => q.section === s.id)); },

    progress() {
      const v = this.visibleQuestions();
      const ans = v.filter(q => this._isAnswered(q)).length;
      return { total: v.length, answered: ans, pct: v.length ? Math.round(ans/v.length*100) : 0 };
    },

    saveAnswer(qid, val) {
      this._state.answers[qid] = val;
      try { sessionStorage.setItem(SKEY_ANS, JSON.stringify(this._state.answers)); } catch (e) {}
      this._state.onProgress(this.progress());
      this._rerenderProgress();
    },

    setSection(idx) { this._state.currentSection = idx; this._saveMeta(); this._render(); },
    setProfile(p) { if (p.role) this._state.role = p.role; if (p.region) this._state.region = p.region; if (p.domain) this._state.domain = p.domain; this._saveMeta(); this._render(); },
    reset() { try{sessionStorage.removeItem(SKEY_ANS);sessionStorage.removeItem(SKEY_META);}catch(e){} this._state.answers = {}; this._state.currentSection = 0; this._render(); },

    _isAnswered(q) {
      const a = this._state.answers[q.id];
      if (a === undefined || a === null) return false;
      if (typeof a === 'string') return a.trim() !== '';
      if (Array.isArray(a)) return a.length > 0;
      return true;
    },

    validateQuestion(q, valOverride) {
      const a = arguments.length >= 2 ? valOverride : this._state.answers[q.id];
      const isAns = (a !== undefined && a !== null && !(typeof a === 'string' && a.trim() === '') && !(Array.isArray(a) && a.length === 0));
      if (q.required && !isAns) return { ok: false, error: 'This question is required.' };
      if (!isAns) return { ok: true, error: null };
      const v = q.validate || {};
      if (v.minLength != null && typeof a === 'string' && a.length < v.minLength) return { ok: false, error: v.errorMessage || ('Minimum length is ' + v.minLength + '.') };
      if (v.maxLength != null && typeof a === 'string' && a.length > v.maxLength) return { ok: false, error: v.errorMessage || ('Maximum length is ' + v.maxLength + '.') };
      if (v.regex) { try { const re = new RegExp(v.regex); if (typeof a !== 'string' || !re.test(a)) return { ok: false, error: v.errorMessage || 'Invalid format.' }; } catch(e){} }
      if (v.min != null && Number(a) < v.min) return { ok: false, error: v.errorMessage || ('Minimum value is ' + v.min + '.') };
      if (v.max != null && Number(a) > v.max) return { ok: false, error: v.errorMessage || ('Maximum value is ' + v.max + '.') };
      if (q.type === 'multi' && q.options && Array.isArray(a)) {
        const set = new Set(q.options);
        const bad = a.find(x => !set.has(x));
        if (bad) return { ok: false, error: 'Unknown option: ' + bad };
      }
      if (q.type === 'single' && q.options && !q.options.includes(a)) return { ok: false, error: 'Unknown option: ' + a };
      if (q.type === 'boolean' && !['Yes','No','N/A'].includes(a)) return { ok: false, error: 'Boolean answers must be Yes / No / N/A.' };
      return { ok: true, error: null };
    },

    validateAll() {
      return this.visibleQuestions().map(q => ({ qid: q.id, label: q.label, ...this.validateQuestion(q) })).filter(r => !r.ok);
    },

    consolidate() {
      const visible = this.visibleQuestions();
      const responses = visible.map(q => ({
        id: q.id, section: q.section, question: q.label,
        answer: this._state.answers[q.id] ?? null,
        sourceRole: this._state.role, mapsTo: q.mapsTo || [], weight: q.weight || 1,
        timestamp: new Date().toISOString()
      }));
      const flagged = tag => responses.filter(r => r.mapsTo.includes(tag));
      return {
        profile: { role: this._state.role, region: this._state.region, domain: this._state.domain, generatedAt: new Date().toISOString() },
        progress: this.progress(),
        responses,
        derivedArtifacts: {
          requirements: flagged('requirement').map(r => ({ id: 'REQ-' + r.id, title: r.question, evidence: r.answer })),
          raidItems: flagged('raid').map(r => ({ id: 'RAID-' + r.id, type: 'Risk', desc: r.question, evidence: r.answer })),
          complianceChecklist: flagged('compliance').map(r => ({ item: r.question, status: r.answer, region: this._state.region })),
          discoveryFields: Object.fromEntries(flagged('discovery').map(r => [r.id, r.answer]))
        }
      };
    },

    exportJSON()    { this._download('questionnaire-output.json', 'application/json', JSON.stringify(this.consolidate(), null, 2)); },
    exportMarkdown(){
      const d = this.consolidate(); const lines = [`# DI-Platform Questionnaire Brief`, '', `**Role:** ${d.profile.role} · **Region:** ${d.profile.region} · **Domain:** ${d.profile.domain}`, `**Generated:** ${d.profile.generatedAt}`, `**Progress:** ${d.progress.answered}/${d.progress.total} (${d.progress.pct}%)`, ''];
      this.sections().forEach(s => {
        lines.push(`## ${s.title}`); if (s.intro) lines.push('*' + s.intro + '*'); lines.push('');
        d.responses.filter(r => r.section === s.id).forEach(r => {
          lines.push(`### ${r.question}`);
          lines.push(r.answer == null || r.answer === '' ? '_(not answered)_' : (Array.isArray(r.answer) ? r.answer.join(', ') : String(r.answer)));
          lines.push('');
        });
      });
      this._download('questionnaire-brief.md', 'text/markdown', lines.join('\n'));
    },

    _loadAnswers(){ try{return JSON.parse(sessionStorage.getItem(SKEY_ANS))||{};}catch(e){return{};} },
    _loadMeta()   { try{return JSON.parse(sessionStorage.getItem(SKEY_META))||{};}catch(e){return{};} },
    _saveMeta()   { try{ sessionStorage.setItem(SKEY_META, JSON.stringify({ role:this._state.role, region:this._state.region, domain:this._state.domain, currentSection:this._state.currentSection })); }catch(e){} },
    _download(name, mime, body) {
      if (typeof Blob === 'undefined') return;
      const blob = new Blob([body], { type: mime }); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    _esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); },

    _render() {
      if (!this._root || typeof this._root.innerHTML !== 'string') return;
      const sections = this.sections();
      const idx = Math.min(this._state.currentSection, Math.max(sections.length - 1, 0));
      const section = sections[idx];
      const questions = section ? this.questionsForSection(section.id) : [];
      const prog = this.progress();
      this._root.innerHTML = `<div class="qe-shell">
        <div class="qe-head">
          <div class="qe-profile">
            <span class="qe-pill">Role: <strong>${this._state.role}</strong></span>
            <span class="qe-pill">Region: <strong>${this._state.region}</strong></span>
            <span class="qe-pill">Domain: <strong>${this._state.domain}</strong></span>
          </div>
          <div class="qe-progress">
            <div class="qe-prog-label">${prog.answered}/${prog.total} answered · ${prog.pct}%</div>
            <div class="qe-prog-bar"><div class="qe-prog-fill" style="width:${prog.pct}%"></div></div>
          </div>
        </div>
        <div class="qe-secnav">${sections.map((s,i)=>`<button class="qe-sectab ${i===idx?'act':''}" onclick="QEngine.setSection(${i})"><span class="num">${i+1}</span>${s.title}<span class="tally">${this.questionsForSection(s.id).filter(q=>this._isAnswered(q)).length}/${this.questionsForSection(s.id).length}</span></button>`).join('')}</div>
        ${section ? `<div class="qe-section">
          <h2 class="qe-section-title">${section.title}</h2>
          ${section.intro?`<p class="qe-section-intro">${section.intro}</p>`:''}
          <div class="qe-questions">${questions.map(q=>this._renderQuestion(q)).join('')}</div>
          <div class="qe-nav">
            <button class="qe-btn ghost" ${idx===0?'disabled':''} onclick="QEngine.setSection(${idx-1})">← Previous</button>
            <button class="qe-btn ghost" onclick="QEngine.reset()">↻ Reset all</button>
            <button class="qe-btn primary" ${idx===sections.length-1?'onclick="QEngine._complete()"':`onclick="QEngine.setSection(${idx+1})"`}>${idx===sections.length-1?'Finish & Generate Brief':'Next →'}</button>
          </div>
        </div>`:`<div class="qe-empty">No questions match the current scope.</div>`}
      </div>`;
      this._wire();
    },

    _wire() {
      if (!this._root.querySelectorAll) return;
      this._root.querySelectorAll('[data-qid]').forEach(el => {
        const qid = el.dataset.qid;
        const handler = (e) => {
          let val;
          if (el.type === 'checkbox') {
            const checks = this._root.querySelectorAll('[data-qid="'+qid+'"][type="checkbox"]');
            val = Array.from(checks).filter(c => c.checked).map(c => c.value);
          } else if (el.type === 'radio') val = e.target.value;
          else val = el.value;
          this.saveAnswer(qid, val);
        };
        el.addEventListener('change', handler);
        if (el.tagName === 'TEXTAREA' || el.type === 'text' || el.type === 'date' || el.type === 'range') {
          el.addEventListener('input', () => { this.saveAnswer(qid, el.value); if (el.type==='range'){ const out=this._root.querySelector('[data-out-for="'+qid+'"]'); if(out) out.textContent = el.value; } });
        }
      });
    },

    _rerenderProgress() {
      if (!this._root || !this._root.querySelector) return;
      const prog = this.progress();
      const lbl = this._root.querySelector('.qe-prog-label'); if (lbl) lbl.textContent = `${prog.answered}/${prog.total} answered · ${prog.pct}%`;
      const fill = this._root.querySelector('.qe-prog-fill'); if (fill) fill.style.width = prog.pct + '%';
    },

    _renderQuestion(q) {
      const a = this._state.answers[q.id];
      const req = q.required ? '<span class="qe-req">*</span>' : '';
      const help = q.help ? `<div class="qe-help">${q.help}</div>` : '';
      let body = '';
      switch (q.type) {
        case 'text': body = `<input class="qe-input" type="text" data-qid="${q.id}" value="${this._esc(a||'')}" placeholder="${this._esc(q.placeholder||'')}"/>`; break;
        case 'longtext': body = `<textarea class="qe-input qe-textarea" data-qid="${q.id}" placeholder="${this._esc(q.placeholder||'')}">${this._esc(a||'')}</textarea>`; break;
        case 'single': body = `<div class="qe-opts">${(q.options||[]).map(o=>`<label class="qe-opt"><input type="radio" name="q_${q.id}" data-qid="${q.id}" value="${this._esc(o)}" ${a===o?'checked':''}/><span>${this._esc(o)}</span></label>`).join('')}</div>`; break;
        case 'multi': { const sel = Array.isArray(a)?a:[]; body = `<div class="qe-opts">${(q.options||[]).map(o=>`<label class="qe-opt"><input type="checkbox" data-qid="${q.id}" value="${this._esc(o)}" ${sel.includes(o)?'checked':''}/><span>${this._esc(o)}</span></label>`).join('')}</div>`; break; }
        case 'scale': { const mn=q.min??1,mx=q.max??5; body = `<div class="qe-scale"><input type="range" class="qe-range" data-qid="${q.id}" min="${mn}" max="${mx}" step="${q.step||1}" value="${a??(q.default??mn)}"/><output data-out-for="${q.id}">${a??(q.default??mn)}</output><div class="qe-scale-lbls"><span>${q.minLabel||mn}</span><span>${q.maxLabel||mx}</span></div></div>`; break; }
        case 'boolean': body = `<div class="qe-opts qe-opts-h"><label class="qe-opt"><input type="radio" name="q_${q.id}" data-qid="${q.id}" value="Yes" ${a==='Yes'?'checked':''}/><span>Yes</span></label><label class="qe-opt"><input type="radio" name="q_${q.id}" data-qid="${q.id}" value="No" ${a==='No'?'checked':''}/><span>No</span></label><label class="qe-opt"><input type="radio" name="q_${q.id}" data-qid="${q.id}" value="N/A" ${a==='N/A'?'checked':''}/><span>N/A</span></label></div>`; break;
        case 'date': body = `<input class="qe-input" type="date" data-qid="${q.id}" value="${this._esc(a||'')}"/>`; break;
        case 'ranked': { const order = Array.isArray(a)&&a.length?a:(q.options||[]); body = `<div class="qe-ranked">${order.map((o,i)=>`<div class="qe-rank-item"><span class="rn">${i+1}</span>${this._esc(o)}</div>`).join('')}<div class="qe-help">Visual rank only · drag-and-drop coming later.</div></div>`; break; }
        default: body = `<div class="qe-help">Unknown question type: ${q.type}</div>`;
      }
      const tags = [];
      if (q.regulator) tags.push(`<span class="qe-tag reg">${q.regulator}</span>`);
      if (q.weight && q.weight >= 3) tags.push(`<span class="qe-tag high">Critical</span>`);
      if (q.mapsTo && q.mapsTo.length) tags.push(`<span class="qe-tag map">→ ${q.mapsTo.join(' · ')}</span>`);
      return `<div class="qe-q ${this._isAnswered(q)?'done':''}"><div class="qe-q-head"><span class="qe-qid">${q.id}</span><h3 class="qe-q-label">${q.label} ${req}</h3><div class="qe-tags">${tags.join('')}</div></div>${help}${body}</div>`;
    },

    _complete() { this._state.onComplete(this.consolidate()); }
  };

  if (typeof window !== 'undefined') window.QEngine = QEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = QEngine;
})();
