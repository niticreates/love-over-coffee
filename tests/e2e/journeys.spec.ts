import { expect, test, type Page } from "@playwright/test";

const noOverflow = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

test.describe("public site", () => {
  test("homepage renders key sections and structured data", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Good Coffee.");
    await expect(page.getByRole("link", { name: "Reserve a Table" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "More Than Just Coffee." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Find Your Way to Us." })).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(ld!)["@type"]).toBe("CafeOrCoffeeShop");
    expect(JSON.parse(ld!).telephone).toBe("+919329697769");
    expect(JSON.parse(ld!).openingHoursSpecification).toBeUndefined(); // unverified hours never published
  });

  for (const width of [360, 390, 430, 768, 1024, 1440, 1920]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/", "/menu", "/story", "/gallery", "/contact", "/reserve", "/checkout"]) {
        await page.goto(path);
        await noOverflow(page);
      }
    });
  }

  test("mobile navigation and action bar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    // Retry until hydrated: a click before React attaches handlers is a no-op.
    await expect(async () => {
      await page.getByRole("button", { name: /menu/i }).first().click();
      await expect(page.locator("#mobile-menu")).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });
    await page.locator("#mobile-menu").getByRole("link", { name: "Our Story" }).click();
    await expect(page).toHaveURL(/\/story$/);
    const bar = page.getByRole("navigation", { name: "Quick actions" });
    await expect(bar.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:+919329697769");
  });

  test("menu search, filters and product detail", async ({ page }) => {
    await page.goto("/menu");
    await page.getByPlaceholder(/Search coffee/).fill("frappe");
    await expect(page.getByRole("heading", { name: "Cafe Frappe" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tex-Mex Nachos" })).toHaveCount(0);
    await page.getByPlaceholder(/Search coffee/).fill("zzzz");
    await expect(page.getByText(/Nothing matches/)).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.getByRole("toolbar", { name: "Filter by category" }).getByRole("button", { name: "Pasta" }).click();
    await expect(page.getByRole("heading", { name: "Penne Arrabiata Red" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cappuccino", exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: "Penne Arrabiata Red" }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Penne Arrabiata Red");
    await expect(page.getByText("You might also like")).toBeVisible();
  });

  test("contact form validates and submits", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Your name").fill("Asha");
    await page.getByRole("textbox", { name: "Message" }).fill("Do you host birthday groups?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Add a phone number or email")).toBeVisible();
    await page.getByLabel("Email").fill("asha@example.com");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Thank you.")).toBeVisible();
  });

  test("SEO files", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/menu/cafe-frappe");
  });
});

test.describe("ordering", () => {
  test("cart → checkout validation → failed payment → successful payment → admin fulfils", async ({ page, context }) => {
    await page.goto("/menu/tex-mex-nachos");
    await page.getByRole("button", { name: "Add Tex-Mex Nachos to order" }).click();
    await page.goto("/menu/cafe-frappe");
    await page.getByRole("button", { name: "Add Cafe Frappe to order" }).click();
    // customization dialog
    await page.getByRole("dialog").getByText("Less sweet").click();
    await page.getByRole("dialog").getByRole("button", { name: /^Add ·/ }).click();
    await page.getByRole("button", { name: /Open cart, 2 items/ }).click();
    await page.getByRole("button", { name: "Increase Tex-Mex Nachos" }).click();
    await page.getByRole("link", { name: "Checkout" }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByTestId("total")).toBeVisible();

    // validation
    await page.getByRole("button", { name: /^Pay/ }).click();
    await expect(page.getByText("Please enter your name")).toBeVisible();
    await page.getByLabel("Name").fill("Asha Verma");
    await page.getByLabel("Mobile number").fill("12345");
    await page.getByRole("button", { name: /^Pay/ }).click();
    await expect(page.getByText("valid 10-digit")).toBeVisible();
    await page.getByLabel("Mobile number").fill("98765 43210");

    // delivery requires address
    await page.getByRole("radio", { name: /Delivery/ }).click();
    await page.getByRole("button", { name: /^Pay/ }).click();
    await expect(page.getByText("full delivery address")).toBeVisible();
    await page.getByRole("radio", { name: /Pickup/ }).click();

    // failed payment
    await page.getByRole("button", { name: /^Pay/ }).click();
    await page.getByRole("button", { name: "Simulate failure" }).click();
    await expect(page.getByText(/Payment failed/)).toBeVisible();

    // retry → success (same idempotency key → same order)
    await page.getByRole("button", { name: /^Pay/ }).click();
    await page.getByRole("button", { name: "Simulate success" }).click();
    await expect(page).toHaveURL(/\/order\/.+\?new=1/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("payment received");
    const ref = (await page.locator("p.eyebrow").first().textContent())!.replace("Order ", "").trim();
    await expect(page.getByText("Sent to café")).toBeVisible();
    const orderUrl = page.url();

    // admin
    const admin = await context.newPage();
    await admin.goto("/admin");
    await expect(admin).toHaveURL(/\/admin\/login/);
    await admin.getByLabel("Email").fill("owner@example.com");
    await admin.getByLabel("Password").fill("wrong");
    await admin.getByRole("button", { name: "Sign in" }).click();
    await expect(admin.getByText("Incorrect email or password")).toBeVisible();
    await admin.getByLabel("Password").fill("preview-admin");
    await admin.getByRole("button", { name: "Sign in" }).click();
    await expect(admin.getByRole("heading", { name: "Today" })).toBeVisible();
    await admin.goto("/admin/orders");
    await admin.getByRole("cell", { name: ref }).click();
    await admin.getByRole("button", { name: "confirmed", exact: true }).click();
    await expect(admin.getByText(`Order ${ref}: confirmed`)).toBeVisible();
    await admin.getByRole("button", { name: "preparing", exact: true }).click();
    await expect(admin.getByText(`Order ${ref}: preparing`)).toBeVisible();

    await page.goto(orderUrl.replace("?new=1", ""));
    await expect(page.locator('[aria-current="step"]')).toHaveText("Preparing");
  });

  test("unpriced/unavailable items can't be ordered via API", async ({ request }) => {
    const r = await request.post("/api/quote", { data: { items: [{ product_id: "prd_does_not_exist", quantity: 1 }], fulfilment: "pickup" } });
    expect(r.status()).toBe(409);
  });
});

test.describe("reservations", () => {
  test("request → duplicate guard → admin approves → guest sees confirmed", async ({ page, context }) => {
    await page.goto("/reserve");
    const tomorrow = await page.evaluate(() => {
      const d = new Date(Date.now() + 330 * 60_000 + 86_400_000);
      return d.toISOString().slice(0, 10);
    });
    await page.getByLabel("Date").fill(tomorrow);
    await page.getByLabel("Guests").selectOption("4");
    await page.getByRole("radio", { name: "7:00 pm" }).click();
    await page.getByLabel("Name").fill("Rohan");
    await page.getByLabel("Mobile number").fill("9812345678");
    await page.getByRole("button", { name: "Request reservation" }).click();
    await expect(page.getByText("not yet confirmed")).toBeVisible();
    const ref = await page.locator("p.font-display.text-4xl").textContent();

    // duplicate submission returns the same booking
    const dup = await page.request.post("/api/reservations", { data: { name: "Rohan", phone: "9812345678", date: tomorrow, time: "19:00", guests: 4 } });
    expect((await dup.json()).reference).toBe(ref);
    expect((await dup.json()).duplicate).toBe(true);

    // invalid inputs
    const past = await page.request.post("/api/reservations", { data: { name: "X Y", phone: "9812345670", date: "2020-01-01", time: "19:00", guests: 2 } });
    expect(past.status()).toBe(409);

    await page.getByRole("link", { name: "View your booking" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Awaiting confirmation");
    const guestUrl = page.url();

    const admin = await context.newPage();
    await admin.goto("/admin/login");
    await admin.getByLabel("Email").fill("owner@example.com");
    await admin.getByLabel("Password").fill("preview-admin");
    await admin.getByRole("button", { name: "Sign in" }).click();
    await admin.waitForURL(/\/admin$/);
    await admin.goto("/admin/reservations");
    await admin.locator("li", { hasText: ref! }).getByRole("button", { name: "Approve" }).click();
    await expect(admin.getByText("Rohan: confirmed")).toBeVisible();

    await page.goto(guestUrl);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Confirmed");
  });

  test("overbooking is blocked when capacity is reached", async ({ request }) => {
    const d = new Date(Date.now() + 330 * 60_000 + 3 * 86_400_000).toISOString().slice(0, 10);
    // sample capacity = 24 covers per overlapping window
    for (const [i, phone] of ["9800000001", "9800000002"].entries()) {
      const r = await request.post("/api/reservations", { data: { name: `Guest ${i}`, phone, date: d, time: "13:00", guests: 10 } });
      expect(r.ok()).toBeTruthy();
    }
    const full = await request.post("/api/reservations", { data: { name: "Late", phone: "9800000003", date: d, time: "13:30", guests: 6 } });
    expect(full.status()).toBe(409);
    expect((await full.json()).error.code).toBe("full");
  });
});

test.describe("security", () => {
  test("admin APIs require a session", async ({ request }) => {
    expect((await request.get("/api/admin/products")).status()).toBe(401);
    const r = await request.patch("/api/admin/orders/00000000-0000-0000-0000-000000000000", { data: { status: "completed" }, headers: { origin: "http://localhost:3000" } });
    expect(r.status()).toBe(401);
  });
  test("cross-site admin writes are rejected", async ({ request }) => {
    const r = await request.post("/api/admin/login", { data: { email: "a", password: "b" }, headers: { origin: "https://evil.example" } });
    expect(r.status()).toBe(403);
  });
  test("webhooks need a valid signature", async ({ request }) => {
    const r = await request.post("/api/webhooks/razorpay", { data: '{"event":"payment.captured"}', headers: { "x-razorpay-signature": "bad", "content-type": "application/json" } });
    expect(r.status()).toBe(400);
  });
  test("order lookups need the secret token", async ({ request }) => {
    expect((await request.get("/api/orders/guess")).status()).toBe(404);
  });
  test("forged payment verification is rejected", async ({ request }) => {
    const r = await request.post("/api/payments/verify", { data: { order_id: "00000000-0000-0000-0000-000000000000", razorpay_order_id: "x", razorpay_payment_id: "y", razorpay_signature: "z" } });
    expect(r.status()).toBe(404);
  });
  test("security headers are set", async ({ request }) => {
    const r = await request.get("/");
    expect(r.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(r.headers()["x-content-type-options"]).toBe("nosniff");
  });
});
