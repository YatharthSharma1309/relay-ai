import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const serverEnv = {
  AUTH_BYPASS: process.env.AUTH_BYPASS ?? "true",
  NEXT_PUBLIC_AUTH_BYPASS: process.env.NEXT_PUBLIC_AUTH_BYPASS ?? "true",
  E2E_AUTH_BYPASS: isCI ? "true" : process.env.E2E_AUTH_BYPASS ?? "",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  APP_URL: process.env.APP_URL ?? baseURL,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
  DEMO_WIDGET_KEY: process.env.DEMO_WIDGET_KEY ?? "",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: isCI ? "npm run start" : "npm run dev",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: serverEnv,
  },
});
