/* ─────────────────────────────────────────────────────────────────
   AIDP MultiSelect · reusable checkbox dropdown with "Select all".
   Usage:
     var ms = AIDPMultiSelect.create({
       options: [{value, label}], placeholder: 'Modules', onChange: fn
     });
     mountEl.appendChild(ms.el);
     ms.getSelected();          // -> [values]
     ms.setOptions(opts, keep); // replace options (keep=true preserves valid selections)
     ms.selectAll();
   Self-contained: injects its own CSS once.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (!document.getElementById('aidp-ms-css')) {
    var st = document.createElement('style');
    st.id = 'aidp-ms-css';
    st.textContent =
      '.aidp-ms{position:relative;display:inline-block}' +
      '.aidp-ms-btn{font-size:13px;padding:7px 10px;border:1px solid #CBD5E1;border-radius:6px;background:#fff;color:#1E293B;cursor:pointer;min-width:170px;text-align:left;font-family:inherit}' +
      '.aidp-ms-btn:hover{border-color:#1E40AF}' +
      '.aidp-ms-panel{position:absolute;z-index:60;top:100%;left:0;margin-top:4px;background:#fff;border:1px solid #E2E8F0;border-radius:8px;box-shadow:0 4px 14px rgba(15,23,42,.14);max-height:280px;overflow:auto;min-width:240px;padding:6px}' +
      '.aidp-ms-opt{display:flex;align-items:flex-start;gap:7px;padding:5px 8px;font-size:13px;color:#334155;cursor:pointer;border-radius:4px;line-height:1.35}' +
      '.aidp-ms-opt:hover{background:#F1F5F9}' +
      '.aidp-ms-opt input{margin-top:2px}' +
      '.aidp-ms-all{font-weight:600;border-bottom:1px solid #E2E8F0;margin-bottom:4px;color:#0F172A}';
    document.head.appendChild(st);
  }

  function create(opts) {
    opts = opts || {};
    var options = (opts.options || []).slice();
    var placeholder = opts.placeholder || 'Select…';
    var selected = new Set();

    var root = document.createElement('div'); root.className = 'aidp-ms';
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'aidp-ms-btn';
    var panel = document.createElement('div'); panel.className = 'aidp-ms-panel'; panel.style.display = 'none';
    root.appendChild(btn); root.appendChild(panel);

    function getSelected() { return options.filter(function (o) { return selected.has(o.value); }).map(function (o) { return o.value; }); }
    function updateBtn() {
      var n = selected.size;
      btn.textContent = (n === 0 ? placeholder : (n === options.length && n > 0 ? 'All (' + n + ')' : n + ' selected')) + '  ▾';
    }
    function fire() { if (opts.onChange) opts.onChange(getSelected()); }
    function render() {
      panel.innerHTML = '';
      var all = document.createElement('label'); all.className = 'aidp-ms-opt aidp-ms-all';
      var allcb = document.createElement('input'); allcb.type = 'checkbox';
      allcb.checked = options.length > 0 && selected.size === options.length;
      allcb.addEventListener('change', function () {
        if (allcb.checked) options.forEach(function (o) { selected.add(o.value); });
        else selected.clear();
        render(); updateBtn(); fire();
      });
      all.appendChild(allcb); all.appendChild(document.createTextNode('Select all'));
      panel.appendChild(all);

      options.forEach(function (o) {
        var l = document.createElement('label'); l.className = 'aidp-ms-opt';
        var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = selected.has(o.value);
        cb.addEventListener('change', function () {
          if (cb.checked) selected.add(o.value); else selected.delete(o.value);
          updateBtn();
          var a = panel.querySelector('.aidp-ms-all input'); if (a) a.checked = options.length > 0 && selected.size === options.length;
          fire();
        });
        l.appendChild(cb); l.appendChild(document.createTextNode(o.label));
        panel.appendChild(l);
      });
    }

    btn.addEventListener('click', function (e) { e.stopPropagation(); panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; });
    document.addEventListener('click', function (e) { if (!root.contains(e.target)) panel.style.display = 'none'; });

    render(); updateBtn();

    return {
      el: root,
      getSelected: getSelected,
      setOptions: function (next, keep) {
        options = (next || []).slice();
        if (!keep) selected.clear();
        else { var valid = new Set(options.map(function (o) { return o.value; })); Array.from(selected).forEach(function (s) { if (!valid.has(s)) selected.delete(s); }); }
        render(); updateBtn();
      },
      selectAll: function () { options.forEach(function (o) { selected.add(o.value); }); render(); updateBtn(); fire(); },
      clear: function () { selected.clear(); render(); updateBtn(); fire(); }
    };
  }

  window.AIDPMultiSelect = { create: create };
})();
