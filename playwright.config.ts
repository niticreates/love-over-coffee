import { defineConfig, devices } from "@playwright/test";

const executablePath = process.env.PW_CHROMIUM_PATH; // e.g. /opt/pw-browsers/chromium in CI images

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "off",
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
        env: { DEMO_SAMPLE_DATA: "true", DEMO_ADMIN_PASSWORD: "preview-admin", ADMIN_SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e" },
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
