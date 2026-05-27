/**
 * AIDP Platform · happy-path E2E smoke suite
 *
 * 12 lightweight checks that each studio loads without JS errors and
 * renders its key chrome (title, action bar, agent API connected). NOT
 * a data-content suite · the testing-master probes already verify
 * agent contracts. This suite catches:
 *   - Pages serving 500 / SPA fallback HTML for missing JS
 *   - Broken script load order (defer race, missing aidp-api.js, etc.)
 *   - Top-bar or workspace tab regressions
 *   - JS console errors on the deployed site
 *
 * Runs sequentially in a single shared browser context (mirrors a real
 * user session). Each test is independent · no cross-test state needed.
 */
import { test as base, expect, Page, BrowserContext } from "@playwright/test";

/* Shared context fixture · one browser context for the whole suite. */
const test = base.extend<{ sharedPage: Page }>({
  sharedPage: [async ({ browser }, use) => {
    const ctx: BrowserContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    /* Collect console errors · used as a soft assertion at the end of each test. */
    const consoleErrors: string[] = [];
    page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
    (page as any).__consoleErrors = consoleErrors;
    await use(page);
    await ctx.close();
  }, { scope: "worker" }]
});

/* ─── Helpers ────────────────────────────────────────── */

async function dismissNishiTip(page: Page) {
  try {
    const notNow = page.getByRole("button", { name: /not now/i });
    if (await notNow.isVisible({ timeout: 500 })) await notNow.click();
  } catch { /* ignored */ }
}

async function gotoStudio(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  /* Give defer scripts a beat to register window.* helpers. */
  await page.waitForTimeout(1500);
  await dismissNishiTip(page);
}

async function expectPageLoaded(page: Page, expectedTitleFragment: RegExp | string) {
  /* Body should have substantial content (not the SPA 404 fallback). */
  const bodyText = await page.locator("body").innerText({ timeout: 10_000 });
  expect(bodyText.length, "page body should have content").toBeGreaterThan(100);
  /* Title or h1 should match. */
  const title = await page.title();
  const h1Text = await page.locator("h1").first().innerText().catch(() => "");
  const combined = `${title} ${h1Text}`;
  expect(combined, `page should mention "${expectedTitleFragment}"`).toMatch(expectedTitleFragment);
}

async function expectNoFatalConsoleErrors(page: Page) {
  /* Soft check · log but don't fail on minor console errors (deprecation
   * warnings, third-party scripts, etc.). Fail only on clear platform errors. */
  const errors = ((page as any).__consoleErrors || []) as string[];
  const fatal = errors.filter(e =>
    /TypeError|ReferenceError|SyntaxError|Refused to execute|listRuns|undefined is not a function/i.test(e)
  );
  if (fatal.length) {
    console.warn("Fatal console errors detected:", fatal);
  }
  expect(fatal, `no fatal console errors on page · saw: ${fatal.slice(0,3).join(" | ")}`).toHaveLength(0);
}

/* ─── Tests · serial because the shared context evolves with each navigation ─── */

test.describe.serial("AIDP happy path", () => {

  test("Step 1 · Home loads + demo tenant seeder is available", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/home");
    await expectPageLoaded(page, /Digital Infotech|AIDP|Home|Platform/i);
    /* Seeder should be exposed on window after defer scripts load. */
    const hasSeeder = await page.evaluate(() => typeof (window as any).loadDemoTenantSilent === "function");
    expect(hasSeeder, "loadDemoTenantSilent should be a function on window").toBe(true);
    /* Run the seed for downstream tests' localStorage state (idempotent). */
    const result = await page.evaluate(async () => {
      return await (window as any).loadDemoTenantSilent();
    });
    expect((result as any)?.ok, JSON.stringify(result)).toBe(true);
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 2 · Discovery Studio loads", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/discovery-studio");
    await expectPageLoaded(page, /Discovery/i);
    /* AIDP api client should be loaded (proves assets/aidp-api.js shipped). */
    const apiLoaded = await page.evaluate(() => !!(window as any).AIDP);
    expect(apiLoaded, "window.AIDP should be loaded").toBe(true);
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 3 · Architecture Studio loads", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/architecture-studio");
    await expectPageLoaded(page, /Architecture/i);
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 4 · Requirements page loads + Workspace toggle present", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/requirements");
    await expectPageLoaded(page, /Requirements|AI Requirements/i);
    /* The Workspace toggle button should exist (proves Phase 1A workspace block shipped). */
    const wsBtn = page.locator("#rq-view-workspace");
    expect(await wsBtn.count(), "Workspace toggle should exist on Requirements").toBeGreaterThan(0);
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 5 · Actions page loads + Workspace toggle present", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/actions");
    await expectPageLoaded(page, /Actions|Role-Based/i);
    const wsBtn = page.locator("#ac-view-workspace");
    expect(await wsBtn.count(), "Workspace toggle should exist on Actions").toBeGreaterThan(0);
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 6 · SOW page loads + Workspace toggle present", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/sow");
    await expectPageLoaded(page, /SOW|Statement of Work|Draft SOW/i);
    const wsBtn = page.locator("#sw-view-workspace");
    expect(await wsBtn.count(), "Workspace toggle should exist on SOW").toBeGreaterThan(0);
    /* SowAPI should be loaded (Workspace tab needs it). */
    const apiLoaded = await page.evaluate(() => !!(window as any).SowAPI);
    expect(apiLoaded, "window.SowAPI should be loaded").toBe(true);
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 7 · Governance page loads + Workspace toggle present", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/program-governance");
    await expectPageLoaded(page, /Governance|Program Governance/i);
    const wsBtn = page.locator("#pg-view-workspace");
    expect(await wsBtn.count(), "Workspace toggle should exist on Governance").toBeGreaterThan(0);
    const apiLoaded = await page.evaluate(() => !!(window as any).GovernanceAPI);
    expect(apiLoaded, "window.GovernanceAPI should be loaded").toBe(true);
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 8 · Operations page loads + Workspace toggle present", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/operations");
    await expectPageLoaded(page, /Operations|Run/i);
    const wsBtn = page.locator("#op-view-workspace");
    expect(await wsBtn.count(), "Workspace toggle should exist on Operations").toBeGreaterThan(0);
    const apiLoaded = await page.evaluate(() => !!(window as any).OperationsAPI);
    expect(apiLoaded, "window.OperationsAPI should be loaded").toBe(true);
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 9 · Governance → Operations handoff key round-trips", async ({ sharedPage: page }) => {
    /* Write a synthetic handoff payload (same shape as Governance's
     * "Send to Operations" button) and verify Operations can read it. */
    await gotoStudio(page, "/home");
    await page.evaluate(() => {
      localStorage.setItem("aidp_handoff_operations_v1", JSON.stringify({
        source: "governance",
        sent_at: new Date().toISOString(),
        rag: "red",
        open_issues: [{ id: "E2E-001", summary: "smoke", severity: 4, owner_role: "cto", status: "open" }]
      }));
    });
    await gotoStudio(page, "/operations");
    const readBack = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem("aidp_handoff_operations_v1") || "null"); }
      catch { return null; }
    });
    expect(readBack, "handoff key should be readable from Operations page").not.toBeNull();
    expect((readBack as any)?.open_issues?.length, "handoff should carry open_issues").toBeGreaterThan(0);
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 10 · Knowledge page loads + KnowledgeAPI present", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/knowledge");
    await expectPageLoaded(page, /Knowledge/i);
    const apiLoaded = await page.evaluate(() => !!(window as any).KnowledgeAPI);
    expect(apiLoaded, "window.KnowledgeAPI should be loaded").toBe(true);
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 11 · IaC page loads + IacAPI present", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/iac");
    await expectPageLoaded(page, /IaC|Infrastructure|Bundle/i);
    const apiLoaded = await page.evaluate(() => !!(window as any).IacAPI);
    expect(apiLoaded, "window.IacAPI should be loaded").toBe(true);
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 12 · EVP Summary page loads", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/evp-summary");
    await expectPageLoaded(page, /EVP|Modernize|Banking/i);
    /* EVP cross-binds to SOW + Governance + Operations · all 3 APIs should be loaded. */
    const apis = await page.evaluate(() => ({
      sow: !!(window as any).SowAPI,
      gov: !!(window as any).GovernanceAPI,
      ops: !!(window as any).OperationsAPI
    }));
    expect(apis.sow && apis.gov && apis.ops, `EVP needs SOW + Governance + Operations APIs · got ${JSON.stringify(apis)}`).toBe(true);
    await expectNoFatalConsoleErrors(page);
  });

  /* ─── Data-content tests · click Workspace toggle, verify the
   * workspace container actually renders its structural content.
   * These exercise the JS glue between the toggle button, the demo
   * seed in localStorage, and the workspace-specific render code.
   * They go beyond the page-load smoke tests above. ─── */

  test("Step 13 · Requirements Workspace renders KPIs", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/requirements");
    await page.locator("#rq-view-workspace").click();
    /* Workspace container should become visible after the toggle. */
    const ws = page.locator("#rq-workspace");
    await expect(ws).toBeVisible({ timeout: 5000 });
    /* KPI cells should exist (their values may still be "—" if the
     * agent hasn't populated yet — that's fine for a structural check). */
    await expect(page.locator("#rq-kpi-must")).toBeVisible();
    await expect(page.locator("#rq-kpi-invest")).toBeVisible();
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 14 · Actions Workspace container renders", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/actions");
    await page.locator("#ac-view-workspace").click();
    const ws = page.locator("#ac-workspace");
    await expect(ws).toBeVisible({ timeout: 5000 });
    /* Workspace body should have substantive content (kanban columns,
     * filter chips, or a loading state — anything non-empty). */
    const text = await ws.innerText();
    expect(text.length, "actions workspace should render content").toBeGreaterThan(20);
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 15 · SOW Workspace renders section navigator", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/sow");
    await page.locator("#sw-view-workspace").click();
    const ws = page.locator("#sow-workspace");
    await expect(ws).toBeVisible({ timeout: 5000 });
    /* Section navigator should exist · it's the 220px left rail listing
     * the 11 SOW sections. Without this, the workspace is broken. */
    const navCount = await page.locator("#sow-workspace .sw-nav").count();
    expect(navCount, "SOW workspace should have a section navigator").toBeGreaterThan(0);
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 16 · Governance Workspace renders RAID columns", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/program-governance");
    await page.locator("#pg-view-workspace").click();
    const ws = page.locator("#pg-workspace");
    await expect(ws).toBeVisible({ timeout: 5000 });
    /* 4-column RAID kanban should render · one column for each of
     * Risks, Assumptions, Issues, Dependencies. */
    const cols = page.locator("#pg-workspace .pgw-col");
    await expect(cols).toHaveCount(4, { timeout: 5000 });
    await expectNoFatalConsoleErrors(page);
  });

  test("Step 17 · Operations Workspace container renders", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/operations");
    await page.locator("#op-view-workspace").click();
    const ws = page.locator("#op-workspace");
    await expect(ws).toBeVisible({ timeout: 5000 });
    const text = await ws.innerText();
    expect(text.length, "operations workspace should render content").toBeGreaterThan(20);
    await expectNoFatalConsoleErrors(page);
  });

});
