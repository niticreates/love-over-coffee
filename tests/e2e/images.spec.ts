import { expect, test } from "@playwright/test";
import sharp from "sharp";

test.describe("product photos", () => {
  test("a photo that fails to load shows the labelled tile, not a broken image", async ({ page }) => {
    // Make one seeded photo fail the way an upstream fetch failure would.
    await page.route(/\/_next\/image\?url=%2Fimages%2Fcoffee%2Flatte-art\.webp/, (route) => route.fulfill({ status: 502, body: "upstream failed" }));
    await page.goto("/menu");
    const card = page.locator("li", { has: page.getByRole("link", { name: "Cappuccino", exact: true }) }).first();
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator('[role="img"][aria-label="Cappuccino — photograph coming soon"]')).toBeVisible();
    await expect(card.locator("img")).toHaveCount(0);
    // Other photos still load.
    const nachos = page.locator("li", { has: page.getByRole("link", { name: "Tex-Mex Nachos", exact: true }) }).first();
    await nachos.scrollIntoViewIfNeeded();
    await expect.poll(() => nachos.locator("img").evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  });

  test("admin uploads are resized and re-encoded in the browser before they are sent", async ({ page, context }) => {
    await context.request.post("/api/admin/login", { data: { email: "owner@example.com", password: "preview-admin" } });
    const big = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: { r: 34, g: 184, b: 222 } } })
      .composite([{ input: Buffer.from('<svg width="4000" height="3000"><circle cx="2000" cy="1500" r="1200" fill="#f472b6"/></svg>') }])
      .jpeg({ quality: 95 }).withMetadata({ exif: { IFD0: { Copyright: "test" } } }).toBuffer();

    let sent: { type: string; width?: number; height?: number; bytes: number } | null = null;
    await page.route("**/api/admin/upload", async (route) => {
      const body = route.request().postDataBuffer()!;
      const ct = route.request().headers()["content-type"];
      const boundary = ct.split("boundary=")[1];
      const part = body.toString("latin1").split("--" + boundary).find((p) => p.includes('name="file"'))!;
      const type = /Content-Type: ([^\r\n]+)/.exec(part)![1];
      const data = Buffer.from(part.slice(part.indexOf("\r\n\r\n") + 4, part.lastIndexOf("\r\n")), "latin1");
      const meta = await sharp(data).metadata();
      sent = { type, width: meta.width, height: meta.height, bytes: data.length };
      await route.continue();
    });

    await page.goto("/admin/menu");
    await page.getByRole("button", { name: "Edit" }).first().click();
    await page.locator('input[type="file"]').first().setInputFiles({ name: "phone-photo.jpg", mimeType: "image/jpeg", buffer: big });
    await expect.poll(() => sent).not.toBeNull();
    expect(sent!.type).toBe("image/webp");
    expect(Math.max(sent!.width!, sent!.height!)).toBe(1600);
    expect(sent!.height).toBe(1200);
    expect(sent!.bytes).toBeLessThan(big.length);
    await expect(page.getByRole("button", { name: "Replace" })).toBeVisible();
  });
});
