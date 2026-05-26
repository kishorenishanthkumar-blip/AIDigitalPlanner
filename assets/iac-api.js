/* ─────────────────────────────────────────────────────────────────
   AIDP IaC API client · v1 · Phase 3B
   Thin window.IacAPI facade over the IAC worker.

     window.IacAPI.exportBundle({target, variant?, inventory?, persist?})
                                            → {ok, files, summary, ...}
     window.IacAPI.preview({target, variant?, inventory?})
                                            → {files (paths+bytes), summary}
     window.IacAPI.validate({target, variant?, inventory?})
                                            → {ok, issues}
     window.IacAPI.estimateCost({inventory?, usage?})
                                            → {ok, breakdown, monthly_usd}
═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (!window.AIDP || !window.AIDP.callAgent) {
    console.warn('[IaC] AIDP API client not loaded · IacAPI cannot reach the worker.');
    return;
  }

  function getUserEmail() {
    if (window.AIDPStudio && window.AIDPStudio.getUserEmail) return window.AIDPStudio.getUserEmail();
    try {
      const ls = window.localStorage;
      return (ls && (ls.getItem('aidp_user_email') || ls.getItem('user_email'))) || 'guest@aidp.demo';
    } catch { return 'guest@aidp.demo'; }
  }

  function commonArgs(opts) {
    const a = { user_email: getUserEmail() };
    if (opts?.target)    a.target    = opts.target;
    if (opts?.variant)   a.variant   = opts.variant;
    if (opts?.inventory) a.inventory = opts.inventory;
    return a;
  }

  async function exportBundle(opts) {
    if (!opts?.target) throw new Error('IacAPI.exportBundle: target is required');
    const a = commonArgs(opts);
    if (opts.persist != null) a.persist = opts.persist;
    const r = await window.AIDP.callAgent('IAC', 'iac_export', a);
    if (r && r.error) throw new Error('iac_export: ' + (r.message || r.error));
    return r;
  }

  async function preview(opts) {
    if (!opts?.target) throw new Error('IacAPI.preview: target is required');
    const r = await window.AIDP.callAgent('IAC', 'iac_preview', commonArgs(opts));
    if (r && r.error) throw new Error('iac_preview: ' + (r.message || r.error));
    return r;
  }

  async function validate(opts) {
    if (!opts?.target) throw new Error('IacAPI.validate: target is required');
    const r = await window.AIDP.callAgent('IAC', 'iac_validate', commonArgs(opts));
    if (r && r.error) throw new Error('iac_validate: ' + (r.message || r.error));
    return r;
  }

  async function estimateCost(opts) {
    const a = { user_email: getUserEmail() };
    if (opts?.inventory) a.inventory = opts.inventory;
    if (opts?.usage)     a.usage     = opts.usage;
    return window.AIDP.callAgent('IAC', 'iac_estimate_cost', a);
  }

  window.IacAPI = { exportBundle, preview, validate, estimateCost };

  try { console.log('[AIDP] IacAPI v1 loaded'); } catch {}
})();
