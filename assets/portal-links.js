/* AIDP Portal · single source of truth for the catalog + deep links into the live console.
   Console routes are same-origin .html pages (portal + console share the Pages site).
   status: live | beta | plan(roadmap). route '' = roadmap (no link). */
(function () {
  'use strict';
  var DOMAINS = [
    { id: 'delivery',   name: 'Delivery',                 icon: 'ti-git-branch',    blurb: 'Agentic SDLC powering every banking product — plan, build, test, govern.' },
    { id: 'onboarding', name: 'Onboarding & Cards',       icon: 'ti-user-plus',     blurb: 'Customer acquisition and card issuance for consumer and corporate.' },
    { id: 'payments',   name: 'Payments',                 icon: 'ti-arrows-exchange', blurb: 'Money movement across every rail — online, network, ATM, cheque.' },
    { id: 'servicing',  name: 'Servicing',                icon: 'ti-headset',       blurb: 'Post-transaction servicing: fraud, disputes, overdraft and limits.' },
    { id: 'platform',   name: 'Platform & Compliance',    icon: 'ti-shield-lock',   blurb: 'Shared services: comms, regulatory reporting, open banking, risk, governance.' },
    { id: 'core',       name: 'Core Banking & Lending',   icon: 'ti-building-bank', blurb: 'System-of-record banking — deposits, ledger, lending and credit.' },
    { id: 'defi',       name: 'Digital Assets & DeFi',    icon: 'ti-hexagon',       blurb: 'On-chain banking — tokenized assets, stablecoin / x402 settlement.' }
  ];
  var PRODUCTS = [
    { id: 'pgm',     domain: 'delivery',   name: 'Program Management', status: 'live', route: 'program-governance.html', features: [
      { name: 'Program Planning', status: 'live', route: 'program.html' },
      { name: 'RAID & Risk', status: 'live', route: 'program-governance.html' },
      { name: 'Governance & Stage Gates', status: 'live', route: 'program-governance.html' },
      { name: 'Status Reporting', status: 'live', route: 'insights.html' },
      { name: 'Dependency Management', status: 'beta', route: 'program.html' } ] },
    { id: 'sdlc',    domain: 'delivery',   name: 'SDLC', status: 'live', route: 'requirements.html', features: [
      { name: 'Requirements', status: 'live', route: 'requirements.html' },
      { name: 'Design', status: 'live', route: 'architecture-studio.html' },
      { name: 'Build', status: 'live', route: 'actions.html' },
      { name: 'Deploy & Release', status: 'live', route: 'iac.html' } ] },
    { id: 'stlc',    domain: 'delivery',   name: 'STLC', status: 'live', route: 'testing-services.html', features: [
      { name: 'Functional Testing', status: 'live', route: 'test-design.html' },
      { name: 'Test Automation', status: 'live', route: 'testing-dashboard.html' },
      { name: 'Performance Testing', status: 'live', route: 'testing-services.html' },
      { name: 'Security Testing', status: 'beta', route: 'testing-services.html' },
      { name: 'UAT', status: 'live', route: 'testing-services.html' } ] },
    { id: 'acq',     domain: 'onboarding', name: 'Acquisitions', status: 'live', route: 'onboarding.html', features: [
      { name: 'Consumer Acquisition', status: 'live', route: 'onboarding.html' },
      { name: 'Corporate Acquisition', status: 'live', route: 'onboarding.html' },
      { name: 'Agentic AI Acquisition', status: 'beta', route: 'onboarding.html' } ] },
    { id: 'card',    domain: 'onboarding', name: 'Card Fulfillment', status: 'live', route: 'cards.html', features: [
      { name: 'Card Issuance', status: 'live', route: 'cards.html' },
      { name: 'Personalization', status: 'live', route: 'cards.html' },
      { name: 'Delivery Tracking', status: 'live', route: 'cards.html' },
      { name: 'Activation & Reissue', status: 'live', route: 'cards.html' } ] },
    { id: 'txn',     domain: 'payments',   name: 'Transaction Management', status: 'live', route: 'payments.html', features: [
      { name: 'Online Payments', status: 'live', route: 'payments.html' },
      { name: 'Bank Payments', status: 'live', route: 'payments.html' },
      { name: 'Subscription Payments', status: 'live', route: 'payments.html' },
      { name: 'Network / POS Payments', status: 'live', route: 'payments.html' },
      { name: 'ATM Payments', status: 'live', route: 'payments.html' },
      { name: 'Cheque Payments', status: 'live', route: 'payments.html' } ] },
    { id: 'svc',     domain: 'servicing',  name: 'Service & Support', status: 'live', route: 'fraud.html', features: [
      { name: 'Fraud Management', status: 'live', route: 'fraud.html' },
      { name: 'Dispute Management', status: 'live', route: 'dispute.html' },
      { name: 'Overdraft Management', status: 'live', route: 'overdraft.html' },
      { name: 'Credit Card Limit Management', status: 'live', route: 'cards.html' } ] },
    { id: 'comm',    domain: 'platform',   name: 'Communication', status: 'live', route: 'comms.html', features: [
      { name: 'Email Service', status: 'live', route: 'comms.html' },
      { name: 'SMS Service', status: 'live', route: 'comms.html' } ] },
    { id: 'reg',     domain: 'platform',   name: 'Regulatory Reporting', status: 'live', route: 'kyc.html', features: [
      { name: 'AML', status: 'live', route: 'kyc.html' },
      { name: 'KYC', status: 'live', route: 'kyc.html' },
      { name: 'Basel / IFRS-9 Reporting', status: 'live', route: 'risk.html' },
      { name: 'Audit Trail', status: 'live', route: 'audit.html' } ] },
    { id: 'openbank',domain: 'platform',   name: 'Open Banking & APIs', status: 'live', route: 'openbanking.html', features: [
      { name: 'API Management', status: 'live', route: 'openbanking.html' },
      { name: 'Consent Management', status: 'live', route: 'openbanking.html' },
      { name: 'Third-Party Onboarding', status: 'live', route: 'openbanking.html' },
      { name: 'Developer Portal', status: 'live', route: 'openbanking.html' } ] },
    { id: 'risk',    domain: 'platform',   name: 'Risk & Capital', status: 'live', route: 'risk.html', features: [
      { name: 'Credit Risk', status: 'live', route: 'risk.html' },
      { name: 'Market Risk', status: 'live', route: 'risk.html' },
      { name: 'Basel / IFRS-9 Reporting', status: 'live', route: 'risk.html' },
      { name: 'Stress Testing', status: 'beta', route: 'risk.html' } ] },
    { id: 'gov',     domain: 'platform',   name: 'Governance & Trust', status: 'live', route: 'audit.html', features: [
      { name: 'Approvals Queue (HITL)', status: 'live', route: 'approvals.html' },
      { name: 'Audit & Explainability', status: 'live', route: 'audit.html' },
      { name: 'Tenant Admin & Keys', status: 'live', route: 'admin.html' } ] },
    { id: 'cb',      domain: 'core',       name: 'Core Banking & Deposits', status: 'live', route: 'ledger.html', features: [
      { name: 'Account Management', status: 'live', route: 'ledger.html' },
      { name: 'Deposits & Savings', status: 'live', route: 'ledger.html' },
      { name: 'General Ledger', status: 'live', route: 'ledger.html' },
      { name: 'Interest & Fees', status: 'live', route: 'ledger.html' },
      { name: 'Statements & Notices', status: 'live', route: 'ledger.html' } ] },
    { id: 'lending', domain: 'core',       name: 'Lending & Credit', status: 'live', route: 'lending.html', features: [
      { name: 'Loan Origination', status: 'live', route: 'lending.html' },
      { name: 'Agentic Underwriting', status: 'beta', route: 'lending.html' },
      { name: 'Loan Servicing', status: 'live', route: 'lending.html' },
      { name: 'Collections & Recovery', status: 'live', route: 'lending.html' } ] },
    { id: 'chain',   domain: 'defi',       name: 'Blockchain & DeFi', status: 'plan', route: '', features: [
      { name: 'Tokenized Assets', status: 'plan', route: '' },
      { name: 'Smart Contracts', status: 'plan', route: '' } ] },
    { id: 'xrppay',  domain: 'defi',       name: 'Blockchain Payments (XRP / x402)', status: 'plan', route: '', features: [
      { name: 'x402 Agentic Payments', status: 'plan', route: '' },
      { name: 'XRP Ledger Settlement', status: 'plan', route: '' },
      { name: 'Stablecoin Rails', status: 'plan', route: '' },
      { name: 'Machine-to-Machine Commerce', status: 'plan', route: '' } ] }
  ];
  function byDomain(id) { return PRODUCTS.filter(function (p) { return p.domain === id; }); }
  function domain(id) { return DOMAINS.filter(function (d) { return d.id === id; })[0]; }
  window.AIDP_PORTAL = {
    domains: DOMAINS, products: PRODUCTS, byDomain: byDomain, domain: domain,
    counts: { domains: DOMAINS.length, products: PRODUCTS.length,
      features: PRODUCTS.reduce(function (n, p) { return n + (p.features ? p.features.length : 0); }, 0),
      live: 12 },
    console: { home: 'home.html', signin: 'signin.html' }
  };
})();
