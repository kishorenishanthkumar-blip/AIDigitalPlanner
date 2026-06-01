/* ─────────────────────────────────────────────────────────────────
   AIDP Select Enhancer · app-wide.
   Converts every native <select> into a checkbox dropdown:
     - single-select  → single-choice checkbox dropdown (value preserved)
     - <select multiple> → checkboxes + "Select all" bulk option
   The native <select> stays in the DOM (hidden) as the source of truth:
   we set its selection and dispatch a 'change' event, so all existing
   page logic (reads of .value, change listeners) keeps working.

   Opt out per element with  data-no-enhance.
   Loaded automatically from top-bar.js, so it runs on every page.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__aidpSelectEnhance) return;
  window.__aidpSelectEnhance = true;

  if (!document.getElementById('aidp-se-css')) {
    var st = document.createElement('style');
    st.id = 'aidp-se-css';
    st.textContent =
      '.aidp-se{position:relative;display:inline-block;vertical-align:middle}' +
      '.aidp-se-btn{font:inherit;font-size:13px;padding:7px 10px;border:1px solid #CBD5E1;border-radius:6px;background:#fff;color:#1E293B;cursor:pointer;text-align:left;min-width:140px;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.aidp-se-btn:hover{border-color:#1E40AF}' +
      /* width:max-content sizes the panel to the longest option on one line,
         which defeats the absolute-positioned shrink-to-fit collapse that
         otherwise wraps option text one character per line inside a narrow
         flex-column parent (e.g. label.fld). */
      '.aidp-se-panel{position:absolute;z-index:9999;top:100%;left:0;margin-top:4px;background:#fff;border:1px solid #E2E8F0;border-radius:8px;box-shadow:0 6px 16px rgba(15,23,42,.16);max-height:300px;overflow-y:auto;overflow-x:hidden;width:max-content !important;min-width:200px;max-width:360px;padding:6px}' +
      /* !important + flex-start guard against page-level `label{justify-content:space-between}`
         rules leaking in (the option row IS a <label>), which would right-align the text. */
      '.aidp-se-opt{display:flex !important;flex-direction:row !important;align-items:center !important;justify-content:flex-start !important;text-align:left !important;text-transform:none !important;letter-spacing:normal !important;gap:8px;margin:0;padding:6px 8px;font-size:13px;font-weight:400;color:#334155;cursor:pointer;border-radius:4px;line-height:1.35}' +
      '.aidp-se-opt:hover{background:#F1F5F9}' +
      '.aidp-se-opt input[type=checkbox]{margin:0;flex:0 0 auto;width:15px;height:15px;cursor:pointer}' +
      '.aidp-se-lbl{flex:1 1 auto;min-width:0;text-align:left !important;white-space:nowrap !important;overflow:hidden;text-overflow:ellipsis;word-break:normal !important}' +
      '.aidp-se-all{font-weight:600;border-bottom:1px solid #E2E8F0;margin-bottom:4px;padding-bottom:8px;color:#0F172A}';
    document.head.appendChild(st);
  }

  function opts(sel) {
    return Array.prototype.map.call(sel.options, function (o) {
      return { value: o.value, label: (o.textContent || o.value || '').trim(), selected: o.selected, disabled: o.disabled };
    });
  }

  function enhance(sel) {
    try {
      if (!sel || sel.tagName !== 'SELECT') return;
      if (sel.dataset.aidpEnhanced === '1' || sel.hasAttribute('data-no-enhance')) return;
      sel.dataset.aidpEnhanced = '1';

      var multiple = !!sel.multiple;
      var wrap = document.createElement('span'); wrap.className = 'aidp-se';
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'aidp-se-btn';
      var panel = document.createElement('div'); panel.className = 'aidp-se-panel'; panel.style.display = 'none';
      wrap.appendChild(btn); wrap.appendChild(panel);
      sel.style.display = 'none';
      if (sel.parentNode) sel.parentNode.insertBefore(wrap, sel.nextSibling);

      function selectedValues() { return opts(sel).filter(function (o) { return o.selected; }).map(function (o) { return o.value; }); }
      function setSingle(v) { Array.prototype.forEach.call(sel.options, function (o) { o.selected = (o.value === v); }); }
      function setMulti(vals) { var s = {}; vals.forEach(function (v) { s[v] = 1; }); Array.prototype.forEach.call(sel.options, function (o) { o.selected = !!s[o.value]; }); }
      function fire() { sel.dispatchEvent(new Event('change', { bubbles: true })); sel.dispatchEvent(new Event('input', { bubbles: true })); }
      function updateBtn() {
        var list = opts(sel), sv = selectedValues();
        if (!multiple) {
          var cur = list.filter(function (o) { return o.value === sv[0]; })[0] || list.filter(function (o) { return o.selected; })[0] || list[0];
          btn.textContent = (cur ? cur.label : '—') + '  ▾';
        } else {
          var n = sv.length, tot = list.length;
          btn.textContent = (n === 0 ? (sel.getAttribute('data-placeholder') || 'None') : (n === tot && tot > 0 ? 'All (' + tot + ')' : n + ' selected')) + '  ▾';
        }
      }
      function render() {
        panel.innerHTML = '';
        var list = opts(sel);
        if (multiple) {
          var all = document.createElement('label'); all.className = 'aidp-se-opt aidp-se-all';
          var acb = document.createElement('input'); acb.type = 'checkbox';
          acb.checked = list.length > 0 && list.every(function (o) { return o.selected; });
          acb.addEventListener('change', function () { setMulti(acb.checked ? list.map(function (o) { return o.value; }) : []); render(); updateBtn(); fire(); });
          var albl = document.createElement('span'); albl.className = 'aidp-se-lbl'; albl.textContent = 'Select all';
          all.appendChild(acb); all.appendChild(albl); panel.appendChild(all);
        }
        list.forEach(function (o) {
          var l = document.createElement('label'); l.className = 'aidp-se-opt';
          var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = o.selected; if (o.disabled) cb.disabled = true;
          cb.addEventListener('change', function () {
            if (multiple) {
              var cur = selectedValues();
              if (cb.checked) { if (cur.indexOf(o.value) < 0) cur.push(o.value); }
              else { cur = cur.filter(function (v) { return v !== o.value; }); }
              setMulti(cur); updateBtn();
              var a = panel.querySelector('.aidp-se-all input'); if (a) a.checked = (selectedValues().length === opts(sel).length && opts(sel).length > 0);
              fire();
            } else {
              setSingle(o.value); panel.style.display = 'none'; render(); updateBtn(); fire();
            }
          });
          var lbl = document.createElement('span'); lbl.className = 'aidp-se-lbl'; lbl.textContent = o.label;
          l.appendChild(cb); l.appendChild(lbl); panel.appendChild(l);
        });
      }

      btn.addEventListener('click', function (e) { e.stopPropagation(); panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; });
      document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) panel.style.display = 'none'; });

      /* re-sync when page JS repopulates the <select> options */
      try { new MutationObserver(function () { render(); updateBtn(); }).observe(sel, { childList: true }); } catch (e) {}

      render(); updateBtn();
    } catch (e) { /* never let one select break the page */ }
  }

  function run(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var sels = scope.querySelectorAll('select');
    Array.prototype.forEach.call(sels, enhance);
  }

  function start() {
    run(document);
    try {
      new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          Array.prototype.forEach.call(m.addedNodes || [], function (n) {
            if (n.nodeType !== 1) return;
            if (n.tagName === 'SELECT') enhance(n);
            else if (n.querySelectorAll) run(n);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);

  window.AIDPSelectEnhance = { run: run, enhance: enhance };
})();
