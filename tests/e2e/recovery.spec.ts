import { expect, test, type Page } from "@playwright/test";

// Supabase Auth is mocked in the browser: the reset page talks to it directly, so these tests
// check what the page sends and how it reacts without touching a real project.
const AUTH = "https://e2e-mock.supabase.co/auth/v1";
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const ACCESS = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "user-1", exp: Math.floor(Date.now() / 1000) + 3600, amr: [{ method: "otp" }] })}.c2ln`;
const REFRESH = "refresh-token-123";
const RECOVERY_HASH = `#access_token=${ACCESS}&expires_in=3600&refresh_token=${REFRESH}&token_type=bearer&type=recovery`;
const USER = { id: "user-1", aud: "authenticated", role: "authenticated", email: "owner@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-11-28T00:00:00Z" };
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,PUT,OPTIONS" };

interface Calls { getUser: number; update: { password?: string; auth?: string }[]; logout: string[] }

async function mockAuth(page: Page, opts: { updateError?: { code: string; msg: string } } = {}): Promise<Calls> {
  const calls: Calls = { getUser: 0, update: [], logout: [] };
  await page.route(`${AUTH}/**`, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    const url = new URL(req.url());
    if (url.pathname.endsWith("/user") && req.method() === "GET") {
      calls.getUser++;
      return route.fulfill({ status: 200, headers: CORS, json: USER });
    }
    if (url.pathname.endsWith("/user") && req.method() === "PUT") {
      calls.update.push({ password: req.postDataJSON()?.password, auth: req.headers()["authorization"] });
      if (opts.updateError) return route.fulfill({ status: 422, headers: CORS, json: { code: 422, error_code: opts.updateError.code, msg: opts.updateError.msg } });
      return route.fulfill({ status: 200, headers: CORS, json: USER });
    }
    if (url.pathname.endsWith("/logout")) {
      calls.logout.push(url.searchParams.get("scope") ?? "global");
      return route.fulfill({ status: 204, headers: CORS });
    }
    return route.fulfill({ status: 404, headers: CORS, json: { msg: "not mocked" } });
  });
  return calls;
}

test.describe("password recovery", () => {
  test("a recovery link that lands on the homepage opens the reset form and sets the password", async ({ page }) => {
    const logs: string[] = [];
    page.on("console", (m) => logs.push(m.text()));
    const calls = await mockAuth(page);

    await page.goto("/" + RECOVERY_HASH);
    await expect(page).toHaveURL(/\/auth\/reset-password$/);
    await expect(page.getByRole("heading", { name: /New password/ })).toBeVisible();
    await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
    expect(page.url()).not.toContain("access_token");
    expect(calls.getUser).toBe(1);

    // validation
    await page.getByLabel("New password", { exact: true }).fill("short");
    await page.getByLabel("Confirm new password").fill("short");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(/at least 8/);
    await page.getByLabel("New password", { exact: true }).fill("a-strong-pass-1");
    await page.getByLabel("Confirm new password").fill("a-strong-pass-2");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(/don't match/);
    expect(calls.update).toHaveLength(0);

    // success
    await page.getByLabel("Confirm new password").fill("a-strong-pass-1");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByText("Password updated. Taking you to sign in")).toBeVisible();
    expect(calls.update).toEqual([{ password: "a-strong-pass-1", auth: `Bearer ${ACCESS}` }]);
    expect(calls.logout).toEqual(["local"]);
    await expect(page).toHaveURL(/\/admin\/login\?reset=done$/);
    await expect(page.getByText("Password updated. Sign in with your new password.")).toBeVisible();

    const joined = logs.join("\n");
    expect(joined).not.toContain(ACCESS);
    expect(joined).not.toContain(REFRESH);
    expect(joined).not.toContain("a-strong-pass-1");
  });

  test("the configured redirect opens the form directly and shows Supabase's refusal", async ({ page }) => {
    const calls = await mockAuth(page, { updateError: { code: "same_password", msg: "New password should be different from the old password." } });
    await page.goto("/auth/reset-password" + RECOVERY_HASH);
    await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
    expect(page.url()).not.toContain("access_token");
    await page.getByLabel("New password", { exact: true }).fill("same-old-pass");
    await page.getByLabel("Confirm new password").fill("same-old-pass");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(/different from your current one/);
    await expect(page.getByRole("button", { name: "Set new password" })).toBeEnabled();
    expect(calls.update).toHaveLength(1);
    expect(calls.logout).toHaveLength(0);
  });

  test("an expired link explains itself and offers a new one", async ({ page }) => {
    await mockAuth(page);
    await page.goto("/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
    await expect(page).toHaveURL(/\/auth\/reset-password$/);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(/expired or was already used/);
    await expect(page.getByRole("link", { name: "Request a new link" })).toHaveAttribute("href", "/admin/login?forgot=1");
  });

  test("visiting the page without a link doesn't show the form", async ({ page }) => {
    await mockAuth(page);
    await page.goto("/auth/reset-password");
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(/reset link in your email/);
    await expect(page.getByLabel("New password", { exact: true })).toHaveCount(0);
  });

  test("ordinary hash links on the homepage are left alone", async ({ page }) => {
    await page.goto("/#menu");
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("the reset-email endpoint blocks cross-site posts, checks the email, and needs the database", async ({ request }) => {
    const cross = await request.post("/api/auth/password-reset", { data: { email: "owner@example.com" }, headers: { origin: "https://evil.example" } });
    expect(cross.status()).toBe(403);
    const bad = await request.post("/api/auth/password-reset", { data: { email: "not-an-email" } });
    expect(bad.status()).toBe(422);
    // This test server runs without the service key, so the database isn't connected.
    const memory = await request.post("/api/auth/password-reset", { data: { email: "owner@example.com" } });
    expect(memory.status()).toBe(503);
  });

  test("staff login only offers a reset when the database is connected", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Forgot password?" })).toHaveCount(0);
  });
});
