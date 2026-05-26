/* ─────────────────────────────────────────────────────────────────
   AIDP Knowledge API client · v1 · Phase 3A
   Thin window.KnowledgeAPI facade over the KNOWLEDGE worker.

     window.KnowledgeAPI.search({query, topK?, min_score?, kind?, framework?, tenant_key?})
                                            → {hits, citations, ...}
     window.KnowledgeAPI.ingest({title, text, kind?, source_url?, frameworks?, ...})
                                            → {ok, source_id, chunks, ...}
     window.KnowledgeAPI.listSources({tenant_key?, kind?, framework?, limit?})
                                            → {sources, count}
     window.KnowledgeAPI.cite({chunk_id, tenant_key?})
                                            → {citation}
═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (!window.AIDP || !window.AIDP.callAgent) {
    console.warn('[Knowledge] AIDP API client not loaded · KnowledgeAPI cannot reach the worker.');
    return;
  }

  function getUserEmail() {
    if (window.AIDPStudio && window.AIDPStudio.getUserEmail) return window.AIDPStudio.getUserEmail();
    try {
      const ls = window.localStorage;
      return (ls && (ls.getItem('aidp_user_email') || ls.getItem('user_email'))) || 'guest@aidp.demo';
    } catch { return 'guest@aidp.demo'; }
  }

  async function search(opts) {
    if (!opts?.query) throw new Error('KnowledgeAPI.search: query is required');
    const args = { query: opts.query };
    if (opts.topK       != null) args.topK       = opts.topK;
    if (opts.min_score  != null) args.min_score  = opts.min_score;
    if (opts.kind)               args.kind       = opts.kind;
    if (opts.framework)          args.framework  = opts.framework;
    args.tenant_key = opts.tenant_key || getUserEmail();
    const r = await window.AIDP.callAgent('KNOWLEDGE', 'knowledge_search', args);
    if (r && r.error) throw new Error('knowledge_search: ' + (r.message || r.error));
    return r;
  }

  async function ingest(opts) {
    if (!opts?.title || !opts?.text) throw new Error('KnowledgeAPI.ingest: title and text are required');
    const args = { title: opts.title, text: opts.text };
    if (opts.id)             args.id             = opts.id;
    if (opts.kind)           args.kind           = opts.kind;
    if (opts.source_url)     args.source_url     = opts.source_url;
    if (opts.jurisdiction)   args.jurisdiction   = opts.jurisdiction;
    if (opts.version)        args.version        = opts.version;
    if (Array.isArray(opts.frameworks)) args.frameworks = opts.frameworks;
    args.tenant_key = opts.tenant_key || getUserEmail();
    if (opts.target_tokens  != null) args.target_tokens  = opts.target_tokens;
    if (opts.overlap_tokens != null) args.overlap_tokens = opts.overlap_tokens;
    const r = await window.AIDP.callAgent('KNOWLEDGE', 'knowledge_ingest', args);
    if (r && r.error) throw new Error('knowledge_ingest: ' + (r.message || r.error));
    return r;
  }

  async function listSources(filters) {
    const args = {};
    args.tenant_key = (filters && filters.tenant_key) || getUserEmail();
    if (filters?.kind)      args.kind      = filters.kind;
    if (filters?.framework) args.framework = filters.framework;
    if (filters?.limit != null) args.limit = filters.limit;
    return window.AIDP.callAgent('KNOWLEDGE', 'knowledge_list_sources', args);
  }

  async function cite(opts) {
    if (!opts?.chunk_id) throw new Error('KnowledgeAPI.cite: chunk_id is required');
    const args = { chunk_id: opts.chunk_id };
    args.tenant_key = opts.tenant_key || getUserEmail();
    return window.AIDP.callAgent('KNOWLEDGE', 'knowledge_cite', args);
  }

  window.KnowledgeAPI = { search, ingest, listSources, cite };

  try { console.log('[AIDP] KnowledgeAPI v1 loaded'); } catch {}
})();
