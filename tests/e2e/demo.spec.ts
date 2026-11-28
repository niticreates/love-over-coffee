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
    await expect(page.getByTestId("payment-note")).toHaveText("Demo checkout: payment is simulated. No real charge is made.");
    await expect(page.getByText("Secure payment by Razorpay")).toHaveCount(0);
    await page.getByRole("button", { name: /^Pay/ }).click();
    await expect(page.getByRole("dialog")).toContainText("This demo simulates the payment step. No real charge is made.");
    await page.getByRole("button", { name: "Simulate success" }).click();
    await expect(page).toHaveURL(/\/order\/.+\?new=1/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("simulated payment complete");
    await expect(page.getByText("The payment was simulated and no money was charged.")).toBeVisible();
    await expect(page.getByText("payment received")).toHaveCount(0);
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

  test("public pages don't tell visitors to call, WhatsApp or pay for real", async ({ request }) => {
    const pages = ["/", "/menu", "/our-story", "/gallery", "/reserve", "/contact", "/book-order", "/cafe-in-vijay-nagar-indore", "/checkout", "/llms.txt"];
    const misleading = ["WhatsApp us", "Call us", "please call", "Please call", "Call, WhatsApp", "or by WhatsApp", "Secure payment by Razorpay", "payment received", "on Zomato or Swiggy", "pay securely online", "pay at checkout and collect"];
    for (const path of pages) {
      const html = await (await request.get(path)).text();
      for (const phrase of misleading) expect(html, `${path} contains "${phrase}"`).not.toContain(phrase);
    }
  });

  test("no real café contact channel or partner link reaches any public page", async ({ page, request }) => {
    const pages = ["/", "/menu", "/our-story", "/gallery", "/reserve", "/contact", "/book-order", "/cafe-in-vijay-nagar-indore", "/checkout", "/llms.txt"];
    for (const path of pages) {
      const html = await (await request.get(path)).text();
      for (const leak of ["9329697769", "93296 97769", "tel:", "wa.me", "zomato.com", "swiggy.com", "district.in", "instagram.com"])
        expect(html, `${path} contains ${leak}`).not.toContain(leak);
    }
    await page.goto("/contact");
    await expect(page.getByText("Contact options are disabled in this demo.").first()).toBeVisible();
    await expect(page.getByTestId("demo-contact-notice")).toBeVisible();
    await expect(page.locator('a[href^="tel:"], a[href*="wa.me"]')).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    await expect(page.getByLabel("Chat with us on WhatsApp (opens WhatsApp)")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Quick actions" }).getByText("Call off in demo")).toBeVisible();
  });

  test("a signed-in demo admin cannot change the WhatsApp destination", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("demo@example.com");
    await page.getByLabel("Password").fill(process.env.E2E_DEMO_ADMIN_PASSWORD ?? "preview-admin");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
    const res = await page.request.patch("/api/admin/whatsapp", {
      headers: { origin: new URL(page.url()).origin },
      data: { whatsapp_e164: "+919999999999", whatsapp_messages: { general: "hi", reservation: "hi", ordering: "hi", group: "hi" } },
    });
    expect(res.status()).toBe(403);
    expect((await res.json()).error.message).toContain("Contact options are disabled in this demo.");
  });
});
