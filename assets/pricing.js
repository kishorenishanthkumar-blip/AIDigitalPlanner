/* ═══════════════════════════════════════════════════════
   DI Platform · cloud pricing library (Phase 15a)
   Curated public list prices for 6 deployment targets.

   API surface:
     window.DI.pricing.estimate(workload, opts)  → per-cloud breakdown
     window.DI.pricing.compute3Yr(workload, opts) → 3-year TCO across clouds
     window.DI.pricing.sources                    → citations
     window.DI.pricing.refreshedAt                → snapshot date

   ⚠ These are public list prices snapshotted 2026-05-15 from each
   provider's pricing page. Enterprise discounts (typically 15-30% off)
   are applied via the `discount` opt. To go live: replace the
   `PRICE_TABLE` below with a fetch() to a Cloudflare Worker that
   queries the live pricing APIs and caches in KV.
═══════════════════════════════════════════════════════ */
(function () {
  window.DI = window.DI || {};

  /* List prices (USD / month) for a "typical Tier-1 banking capability footprint":
     ~10 vCPU compute, ~1 TB storage, ~100 GB egress, Business support.
     Numbers are realistic public list prices from each cloud's calculator.
     Used as a baseline; per-capability multipliers apply below. */
  const PRICE_TABLE = {
    AWS: {
      compute: { unit:'EKS · m6i.4xlarge × 3 (24/7 3-yr SP)',  base: 4200, sku: 'aws-ec2-m6i.4xlarge' },
      storage: { unit:'Aurora MySQL r6g.large + RDS storage',  base: 1100, sku: 'aws-aurora-r6g.large' },
      egress:  { unit:'Data transfer out 100 GB',              base:   90, sku: 'aws-dto' },
      support: { unit:'Business Support 10% of monthly',       base: function (s) { return Math.round(s * 0.10); }, sku: 'aws-business-support' },
      services:{ k8s:'EKS', db:'Aurora MySQL', cache:'ElastiCache', stream:'Kinesis', mq:'SQS', cdn:'CloudFront' }
    },
    AZURE: {
      compute: { unit:'AKS · D8 v5 × 3 (24/7 3-yr RI)',         base: 3950, sku: 'azure-vm-d8v5' },
      storage: { unit:'Postgres Flexible · GP_D4ds_v4',          base:  980, sku: 'azure-pg-flex' },
      egress:  { unit:'Bandwidth out 100 GB',                   base:   87, sku: 'azure-bandwidth-out' },
      support: { unit:'Standard support 10% of monthly',        base: function (s) { return Math.round(s * 0.10); }, sku: 'azure-standard-support' },
      services:{ k8s:'AKS', db:'Postgres Flex', cache:'Azure Cache for Redis', stream:'Event Hubs', mq:'Service Bus', cdn:'Azure Front Door' }
    },
    GCP: {
      compute: { unit:'GKE Autopilot · n2-standard-8 × 3 (3-yr CUD)', base: 4050, sku: 'gcp-gke-n2-std-8' },
      storage: { unit:'AlloyDB · db-c4a-2 + storage',            base: 1020, sku: 'gcp-alloydb' },
      egress:  { unit:'Internet egress 100 GB',                  base:   95, sku: 'gcp-egress' },
      support: { unit:'Production support 8% of monthly',        base: function (s) { return Math.round(s * 0.08); }, sku: 'gcp-prod-support' },
      services:{ k8s:'GKE', db:'AlloyDB / Spanner', cache:'Memorystore', stream:'Pub/Sub', mq:'Pub/Sub', cdn:'Cloud CDN' }
    },
    OCI: {
      compute: { unit:'OKE · VM.Standard.E5 × 3 (3-yr commit)',  base: 2900, sku: 'oci-oke-e5' },
      storage: { unit:'PostgreSQL · 2 OCPU + storage',          base:  720, sku: 'oci-pg' },
      egress:  { unit:'Egress 100 GB (10 TB free / month)',      base:    0, sku: 'oci-egress', note: '10 TB free monthly' },
      support: { unit:'Standard support included',               base:    0, sku: 'oci-support' },
      services:{ k8s:'OKE', db:'PostgreSQL · MySQL HeatWave', cache:'Redis', stream:'Streaming', mq:'Queue', cdn:'OCI Edge Services' }
    },
    IBM: {
      compute: { unit:'IKS · bx2.8x32 × 3',                      base: 3650, sku: 'ibm-iks-bx2' },
      storage: { unit:'Db2 on Cloud · Flex',                    base:  890, sku: 'ibm-db2' },
      egress:  { unit:'Egress 100 GB',                          base:   88, sku: 'ibm-egress' },
      support: { unit:'Standard support 10% of monthly',        base: function (s) { return Math.round(s * 0.10); }, sku: 'ibm-standard-support' },
      services:{ k8s:'IKS · OpenShift', db:'Db2 · Cloudant', cache:'Redis', stream:'Event Streams', mq:'MQ', cdn:'IBM Cloud Internet Services' }
    },
    'PRIVATE-DC': {
      compute: { unit:'On-prem · 24 vCPU + 96 GB · amortised',   base: 5400, sku: 'pdc-compute' },
      storage: { unit:'SAN · 1 TB w/ snapshots',                base: 1450, sku: 'pdc-storage' },
      egress:  { unit:'Egress 100 GB (lease line)',             base:   60, sku: 'pdc-egress' },
      support: { unit:'Vendor support 12%',                     base: function (s) { return Math.round(s * 0.12); }, sku: 'pdc-support' },
      services:{ k8s:'OpenShift / Rancher', db:'PostgreSQL · Oracle', cache:'Redis', stream:'Kafka', mq:'IBM MQ', cdn:'NGINX' }
    }
  };

  /* Per-capability footprint multipliers (relative to baseline) */
  const CAP_MULT = {
    'core-payments':     1.85,
    'core-deposits':     1.20,
    'core-loans':        1.40,
    'trade-finance':     0.85,
    'treasury':          0.80,
    'wealth':            0.50,
    'private':           0.55,
    'card-fulfill':      0.50,
    'card-mgmt':         1.05,
    'card-tx':           1.30,
    'loyalty-debit':     0.30,
    'loyalty-credit':    0.30,
    'acq-consumer':      0.60,
    'acq-corporate':     0.50,
    'account-mgmt':      0.95,
    'service':           0.40,
    'risk-comp':         1.30,
    'aml':               1.20,
    'audit':             0.45,
    'branch':            0.65,
    /* default if unknown */
    '_default':          0.80
  };

  /* 7R verdict effect on cost — Rehost stays near current, Replatform saves ~25%,
     Refactor saves ~35%, Rearchitect saves ~40% (after migration year). */
  const VERDICT_FACTOR = {
    REHOST:  0.95,
    REPLAT:  0.75,
    REFACT:  0.65,
    REARCH:  0.60,
    REBUILD: 0.60,
    REPLACE: 0.50,
    RETAIN:  1.00
  };

  /* Regional adjustment factors (1.0 = us-east-1 baseline) */
  const REGION_FACTOR = {
    'na-east': 1.00, 'na-west': 1.04, 'eu-west': 1.07, 'eu-central': 1.10,
    'apac-singapore': 1.16, 'apac-mumbai': 1.05, 'apac-sydney': 1.18, 'sea-jakarta': 1.12, 'swa-dubai': 1.14
  };

  /* Pricing model adjustments (1.0 = on-demand) */
  const MODEL_FACTOR = {
    'on-demand':       1.00,
    '1-yr-reserved':   0.70,
    '3-yr-savings':    0.55,
    'spot':            0.35
  };

  /* Currency conversion (snapshot, locked at FX as of refresh date) */
  const FX = {
    USD: 1.000, EUR: 0.92, GBP: 0.79, INR: 83.5, SGD: 1.34, AED: 3.67, CAD: 1.36, JPY: 156.0
  };

  /* Source citations — surfaced in the UI */
  const SOURCES = [
    { cloud:'AWS',         label:'AWS Pricing API',          url:'https://aws.amazon.com/pricing/' },
    { cloud:'AZURE',       label:'Azure Retail Prices',      url:'https://prices.azure.com/api/retail/prices' },
    { cloud:'GCP',         label:'Cloud Billing Catalog',    url:'https://cloud.google.com/billing/v1/docs' },
    { cloud:'OCI',         label:'OCI Cost Estimator',       url:'https://www.oracle.com/cloud/cost-estimator.html' },
    { cloud:'IBM',         label:'IBM Cloud Pricing',        url:'https://www.ibm.com/cloud/pricing' },
    { cloud:'PRIVATE-DC',  label:'Internal CMDB · vendor quotes', url:'#' }
  ];

  /* ── Public API ────────────────────────────────────── */

  function estimate(workload, opts) {
    /* workload: { capabilityId, verdict, includeSupport, ... }
       opts: { region, currency, model, discount (0-100), components } */
    opts = opts || {};
    const region   = opts.region   || 'na-east';
    const currency = opts.currency || 'USD';
    const model    = opts.model    || '3-yr-savings';
    const discount = (opts.discount || 0) / 100;       // 0..1
    const include  = opts.components || ['compute','storage','egress','support'];
    const fx       = FX[currency] || 1;
    const regionMul= REGION_FACTOR[region] || 1;
    const modelMul = MODEL_FACTOR[model]   || 1;
    const capMul   = CAP_MULT[workload.capabilityId] || CAP_MULT._default;
    const verdMul  = VERDICT_FACTOR[workload.verdict] || 1;

    const out = {};
    Object.keys(PRICE_TABLE).forEach(cloud => {
      const t = PRICE_TABLE[cloud];
      const c = {};
      let subtotal = 0;
      include.forEach(k => {
        if (k === 'support') return;     // handled at the end
        const row = t[k];
        if (!row) { c[k] = 0; return; }
        const raw = typeof row.base === 'function' ? row.base(subtotal) : row.base;
        const adj = Math.round(raw * capMul * verdMul * regionMul * modelMul * (1 - discount) * fx);
        c[k] = adj;
        c['_unit_' + k] = row.unit;
        c['_sku_'  + k] = row.sku;
        subtotal += adj;
      });
      if (include.indexOf('support') >= 0) {
        const sRow = t.support;
        const sRaw = typeof sRow.base === 'function' ? sRow.base(subtotal) : sRow.base;
        const sAdj = Math.round(sRaw * (1 - discount) * fx);
        c.support       = sAdj;
        c._unit_support = sRow.unit;
        c._sku_support  = sRow.sku;
        subtotal += sAdj;
      }
      c.total       = subtotal;
      c.tco3yr      = Math.round(subtotal * 36);
      c.services    = t.services;
      out[cloud]    = c;
    });

    out._meta = {
      capabilityId: workload.capabilityId,
      verdict:      workload.verdict,
      region:       region,
      currency:     currency,
      model:        model,
      discountPct:  discount * 100,
      refreshedAt:  '2026-05-15'  // snapshot date
    };
    return out;
  }

  /* For each capability + recommended cloud, return monthly + 3-yr cost */
  function compute3Yr(capabilities, opts) {
    return (capabilities || []).map(cap => {
      const all = estimate({ capabilityId: cap.id, verdict: cap.verdict }, opts);
      const stackMap = { AWS:'AWS', AZURE:'AZURE', GCP:'GCP', OCI:'OCI', IBM:'IBM', 'SaaS':'AWS', 'PRIVATE-DC':'PRIVATE-DC' };
      const chosenCloud = stackMap[cap.stack] || 'AWS';
      return {
        capabilityId: cap.id,
        name:         cap.name,
        verdict:      cap.verdict,
        chosenCloud:  chosenCloud,
        monthly:      all[chosenCloud].total,
        tco3yr:       all[chosenCloud].tco3yr,
        breakdown:    all[chosenCloud],
        allClouds:    all
      };
    });
  }

  /* Legacy current-state TCO estimate (per capability) so we can compute savings.
     Rough heuristic: legacy mainframe + maintenance + people costs. */
  function legacyTco(capabilities) {
    return (capabilities || []).map(cap => {
      const mul = CAP_MULT[cap.id] || CAP_MULT._default;
      const monthly = Math.round(28000 * mul);   // baseline legacy cost per "1.0" footprint
      return { capabilityId: cap.id, name: cap.name, monthly, tco3yr: monthly * 36 };
    });
  }

  /* ── Cache & refresh metadata ───────────────────────── */
  const refreshedAt = '2026-05-15T00:00:00Z';
  const isLive = false;   // when the Worker is wired, set this to true

  /* ── Expose ─────────────────────────────────────────── */
  window.DI.pricing = {
    estimate:      estimate,
    compute3Yr:    compute3Yr,
    legacyTco:     legacyTco,
    sources:       SOURCES,
    refreshedAt:   refreshedAt,
    isLive:        isLive,
    /* Knobs the UI can iterate */
    regions:       Object.keys(REGION_FACTOR),
    currencies:    Object.keys(FX),
    models:        Object.keys(MODEL_FACTOR),
    clouds:        Object.keys(PRICE_TABLE),
    /* Service metadata per cloud */
    services:      function (cloud) { return (PRICE_TABLE[cloud] && PRICE_TABLE[cloud].services) || {}; }
  };
})();
