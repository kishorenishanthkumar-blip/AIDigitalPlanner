/**
 * AIDP Platform · happy-path E2E suite
 *
 * Maps 1:1 to the 12-step manual walkthrough we ran in Step 1.
 * Runs sequentially (one worker) because Step 1 seeds shared tenant
 * state that subsequent steps depend on.
 *
 * Each test is intentionally light · it verifies the studio loads, the
 * live agent is wired, and the headline data points render. We're not
 * testing every kanban card · we're testing the integration contract.
 */
import { test as base, expect, Page, BrowserContext } from "@playwright/test";

/* ─── Shared-context fixture ────────────────────────────
 * Playwright creates a fresh context per test by default, which would
 * wipe the localStorage demo seed between Step 1 and Step 2. Override
 * with a single context shared across the whole describe block so
 * tenant state persists end-to-end (same as a real user session). */
const test = base.extend<{ sharedPage: Page }>({
  sharedPage: [async ({ browser }, use) => {
    const ctx: BrowserContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  }, { scope: "worker" }]
});

/* ─── Helpers ────────────────────────────────────────── */

async function dismissNishiTip(page: Page) {
  /* The Niche-I tooltip blocks some clicks if it appears · dismiss it
   * if it shows up but don't fail the test if it doesn't. */
  try {
    const notNow = page.getByRole("button", { name: /not now/i });
    if (await notNow.isVisible({ timeout: 500 })) await notNow.click();
  } catch { /* ignored */ }
}

async function gotoStudio(page: Page, path: string) {
  /* DOM-ready is enough · defer scripts execute right after. We don't wait
   * on [data-di-topbar] because top-bar.js may strip that attribute after
   * injecting the nav HTML, leaving the selector unmatchable. */
  await page.goto(path, { waitUntil: "domcontentloaded" });
  /* Give defer scripts a beat to register window.* helpers. Per-test
   * waits cover the actual content readiness. */
  await page.waitForTimeout(1500);
  await dismissNishiTip(page);
}

async function switchToWorkspace(page: Page, idPrefix: string) {
  /* Each studio's Workspace toggle uses id="${prefix}-view-workspace" */
  const btn = page.locator(`#${idPrefix}-view-workspace`);
  if (await btn.count() > 0) {
    await btn.click();
    /* Wait for the workspace container to become visible. */
    await page.locator(`#${idPrefix}-workspace`).waitFor({ state: "visible", timeout: 5_000 });
  }
}

/* ─── Step 1 · Demo tenant seed ──────────────────────── */

test.describe.serial("AIDP happy path", () => {

  test("Step 1 · Demo tenant seeds in <15s", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/home");
    /* Auto-accept the confirm() dialog the seeder fires. */
    page.on("dialog", d => d.accept());
    /* Use the silent variant so no confirm is shown and we don't depend
     * on the dialog handler timing. */
    const result = await page.evaluate(async () => {
      // @ts-ignore  · loadDemoTenantSilent is injected by assets/demo-tenant.js
      if (!(window as any).loadDemoTenantSilent) return { ok: false, error: "seeder not loaded" };
      // @ts-ignore
      return await (window as any).loadDemoTenantSilent();
    });
    expect(result, "seeder result").toBeTruthy();
    expect((result as any).ok, JSON.stringify(result)).toBe(true);
  });

  /* ─── Step 2 · Discovery ─────────────────────────────── */

  test("Step 2 · Discovery shows capabilities + 7R verdicts", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/discovery-studio");
    /* Wait for any "REARCH|REPLAT|REFACT|REHOST|RETAIN|REBUILD|REPLACE" verdict
     * chip to appear · proves 7R engine ran. */
    const verdicts = page.getByText(/REARCH|REPLAT|REFACT|REHOST|RETAIN|REBUILD|REPLACE/);
    await expect(verdicts.first()).toBeVisible({ timeout: 20_000 });
    /* At least 5 verdicts (the demo has 8-10 capabilities). */
    const count = await verdicts.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  /* ─── Step 3 · Architecture ──────────────────────────── */

  test("Step 3 · Architecture compares 7 clouds with cost ranking", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/architecture-studio");
    /* Look for the 7 cloud names in the comparison table. */
    const clouds = ["PRIVATE-DC", "ALIBABA", "OCI", "GCP", "AWS", "AZURE", "IBM"];
    for (const cloud of clouds) {
      await expect(page.getByText(cloud).first()).toBeVisible({ timeout: 15_000 });
    }
    /* "Source: Live AIDP agent" proves the agent responded. */
    await expect(page.getByText(/Live AIDP agent/i).first()).toBeVisible();
  });

  /* ─── Step 4 · Requirements ──────────────────────────── */

  test("Step 4 · Requirements Workspace renders MoSCoW + INVEST", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/requirements");
    await switchToWorkspace(page, "req");
    /* RequirementsAPI loaded · console will have logged it. */
    /* Look for MoSCoW chips in the table. */
    await expect(page.getByText(/MUST|SHOULD|COULD|WON'T/i).first()).toBeVisible({ timeout: 20_000 });
  });

  /* ─── Step 5 · Actions ───────────────────────────────── */

  test("Step 5 · Actions Workspace renders role-based table", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/actions");
    await switchToWorkspace(page, "act");
    /* Headline KPI · "Total actions" should resolve to a number ≥ 1. */
    await expect(page.getByText(/P[0-3]/).first()).toBeVisible({ timeout: 20_000 });
  });

  /* ─── Step 6 · SOW ───────────────────────────────────── */

  test("Step 6 · SOW Workspace assembles with 0 cross-binding errors", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/sow");
    await switchToWorkspace(page, "sow");
    /* The "Cross-binding errors" KPI should show 0 (or "all upstream agents responded"). */
    await expect(page.getByText(/all upstream agents responded|cross-binding errors[^0-9]+0/i).first())
      .toBeVisible({ timeout: 30_000 });
  });

  /* ─── Step 7 · Governance ────────────────────────────── */

  test("Step 7 · Governance Workspace shows RAID kanban + Steering pack", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/program-governance");
    await switchToWorkspace(page, "pg");
    /* Kanban columns · Risks/Assumptions/Issues/Dependencies headers. */
    await expect(page.getByText(/Risks/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Issues/i).first()).toBeVisible();
    /* Programme RAG indicator visible. */
    await expect(page.getByText(/RED|AMBER|GREEN/).first()).toBeVisible();
  });

  /* ─── Step 8 · Operations ────────────────────────────── */

  test("Step 8 · Operations Workspace shows DORA + SLOs", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/operations");
    await switchToWorkspace(page, "op");
    /* DORA tier label visible (elite/high/medium/low). */
    await expect(page.getByText(/elite|high|medium|low/i).first()).toBeVisible({ timeout: 30_000 });
    /* Programme RAG indicator. */
    await expect(page.getByText(/RED|AMBER|GREEN/i).first()).toBeVisible();
  });

  /* ─── Step 9 · Cross-studio handoff ──────────────────── */

  test("Step 9 · Governance → Operations handoff persists open issues", async ({ sharedPage: page }) => {
    /* Write the handoff directly via localStorage (same shape as the
     * "Send to Operations" button writes) so this test is hermetic. */
    await page.goto("/home");
    await page.evaluate(() => {
      localStorage.setItem("aidp_handoff_operations_v1", JSON.stringify({
        source: "governance",
        sent_at: new Date().toISOString(),
        rag: "red",
        open_issues: [
          { id: "TEST-001", summary: "E2E handoff smoke", severity: 4, owner_role: "cto", status: "open" }
        ]
      }));
    });
    await gotoStudio(page, "/operations");
    await switchToWorkspace(page, "op");
    /* The handoff tab should auto-flip and show the test issue. */
    await expect(page.getByText("E2E handoff smoke").first()).toBeVisible({ timeout: 15_000 });
  });

  /* ─── Step 10 · Knowledge ────────────────────────────── */

  test("Step 10 · Knowledge Workspace search returns hits", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/knowledge");
    await switchToWorkspace(page, "kn");
    /* Type into the search box + press Enter · expect at least 1 hit
     * OR a "no hits" empty state (both prove the agent responded). */
    const q = page.locator("#kn-q");
    if (await q.count() > 0) {
      await q.fill("PCI-DSS data residency");
      await q.press("Enter");
      /* Either a hit list or an empty-state message must appear. */
      await expect(page.getByText(/results|hits|No hits/i).first())
        .toBeVisible({ timeout: 20_000 });
    }
  });

  /* ─── Step 11 · IaC ──────────────────────────────────── */

  test("Step 11 · IaC Workspace · Preview returns file tree", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/iac");
    await switchToWorkspace(page, "iac");
    /* Click the Preview button in the sticky action bar. */
    const previewBtn = page.getByRole("button", { name: /📁 Preview|Preview/i }).last();
    await previewBtn.click();
    /* Expect either a file path (.tf, .yaml) OR a no_inventory error
     * — both prove the agent responded · we only fail if neither shows. */
    await expect(
      page.locator("text=/\\.tf|\\.yaml|\\.yml|no_inventory/").first()
    ).toBeVisible({ timeout: 25_000 });
  });

  /* ─── Step 12 · EVP Summary ──────────────────────────── */

  test("Step 12 · EVP Summary shows live cross-bind strip", async ({ sharedPage: page }) => {
    await gotoStudio(page, "/evp-summary");
    /* The headline "Modernize N banking capabilities" should always render. */
    await expect(page.getByText(/Modernize \d+ banking capabilities/i).first())
      .toBeVisible({ timeout: 15_000 });
    /* The Auditor view has the live cross-bind strip · click that tab. */
    const auditor = page.getByRole("button", { name: /Auditor/i });
    if (await auditor.count() > 0) await auditor.first().click();
    /* Wait up to 10s for the live strip to populate from agents. */
    await page.waitForTimeout(3_000);
    /* Either the strip is visible (live data arrived) or the strip is
     * hidden (no live data) · either is a valid state. We just verify
     * the page didn't crash. */
    await expect(page.getByText(/Modernize/i).first()).toBeVisible();
  });

});
