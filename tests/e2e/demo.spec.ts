import { expect, test } from "@playwright/test";

// Runs only against a server started with DEMO_MODE=true (see docs/DEMO.md):
//   E2E_DEMO=1 E2E_BASE_URL=http://localhost:3300 E2E_CRON_SECRET=... npx playwright test demo
test.skip(!process.env.E2E_DEMO, "needs a DEMO_MODE server");
const CRON = process.env.E2E_CRON_SECRET ?? "";

test.describe("public demo mode", () => {
  test("every public page carries the demo banner, and forms ask for made-up details", async ({ page }) => {
    for (const path of ["/", "/menu", "/reserve", "/contact", "/gallery"]) {
      await page.goto(path);
      await expect(page.getByTestId("demo-banner")).toContainText("Demo site");
    }
    for (const path of ["/reserve", "/contact"]) {
      await page.goto(path);
      await expect(page.getByRole("note").filter({ hasText: "made-up details" })).toBeVisible();
    }
    await page.goto("/menu");
    await expect(page.getByText("Sample").first()).toBeVisible();
  });

  test("search engines are kept out", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toMatch(/Disallow: \/\s*$/m);
    const home = await request.get("/");
    expect(home.headers()["x-robots-tag"]).toContain("noindex");
  });

  test("simulated order, then the daily purge removes it", async ({ page, request }) => {
    await page.goto("/menu/tex-mex-nachos");
    await page.getByRole("button", { name: "Add Tex-Mex Nachos to order" }).click();
    await page.goto("/checkout");
    await expect(page.getByRole("note").filter({ hasText: "made-up details" })).toBeVisible();
    await page.getByLabel("Name").fill("Demo Visitor");
    await page.getByLabel("Mobile number").fill("98765 43210");
    await page.getByRole("button", { name: /^Pay/ }).click();
    await page.getByRole("button", { name: "Simulate success" }).click();
    await expect(page).toHaveURL(/\/order\/.+\?new=1/);
    const orderUrl = page.url().replace("?new=1", "");

    expect((await request.get("/api/cron/demo-purge")).status()).toBe(401);
    expect((await request.get("/api/cron/demo-purge", { headers: { authorization: "Bearer wrong" } })).status()).toBe(401);
    const purge = await request.get("/api/cron/demo-purge", { headers: { authorization: `Bearer ${CRON}` } });
    expect(purge.status()).toBe(200);
    const body = await purge.json();
    expect(body.removed.orders).toBeGreaterThanOrEqual(1);

    const after = await page.goto(orderUrl);
    expect(after?.status()).toBe(404);
  });
});
