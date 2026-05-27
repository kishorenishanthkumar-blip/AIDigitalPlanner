/**
 * Playwright config · E2E happy-path tests for aidp-platform.pages.dev
 *
 * Runs in CI after every Pages deploy. Chromium only (Firefox/WebKit
 * coverage isn't worth the runtime budget for this stage). Captures
 * screenshots + traces on failure for triage.
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  /* Each test gets up to 60s · agents can be slow under load. */
  timeout: 60_000,
  /* Total wall-clock cap for the whole suite. */
  globalTimeout: 10 * 60_000,
  /* Single worker · tests touch shared tenant state (demo seed) so
   * parallelism would create races. */
  workers: 1,
  /* Retry once on flake before declaring failure · most flakes are
   * cold-start related and clear on retry. */
  retries: process.env.CI ? 1 : 0,
  /* Fail the build if a test is unexpectedly marked `.only`. */
  forbidOnly: !!process.env.CI,
  /* Reporters · JSON for the tm_post_external bridge, HTML for humans. */
  reporter: [
    ["list"],
    ["json",  { outputFile: "playwright-report/results.json" }],
    ["html",  { outputFolder: "playwright-report/html", open: "never" }]
  ],
  use: {
    baseURL: process.env.AIDP_BASE_URL || "https://aidp-platform.pages.dev",
    /* Trace + screenshot on first failure, retain on retry. */
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    /* Reasonable defaults · the platform is responsive but agents
     * can stall briefly on cold start. */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }
    }
  ]
});
