import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // The suite shares one seeded database and server-side rate limits: run it serially.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  // One project only: flows hit server rate limits, so they must not run twice.
  // The responsive spec sets 1920×1080 and 1400×900 itself.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } } }],
  webServer: {
    command: "bun run build && bun run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
