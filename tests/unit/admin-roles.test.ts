// Role-based authorization of the admin API, exercised through the real route handlers,
// adminRoute(), requireAdmin() and signed session cookies. Each test signs a session for one
// role; the in-memory store stands in for the database. The memory store's preview login
// (always "owner") is never used here.
import { readdirSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
const jar = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (jar.token ? { value: jar.token } : undefined), set: () => {}, delete: () => { jar.token = undefined; } }),
}));
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("redirect"); } }));

import { POST as logoutPOST } from "@/app/api/admin/logout/route";
import { POST as categoriesPOST } from "@/app/api/admin/categories/route";
import { DELETE as productDELETE, PATCH as productPATCH } from "@/app/api/admin/products/[id]/route";
import { GET as settingsGET, PATCH as settingsPATCH } from "@/app/api/admin/settings/route";
import { POST as uploadPOST } from "@/app/api/admin/upload/route";
import { PATCH as whatsappPATCH } from "@/app/api/admin/whatsapp/route";
import { signSession, type Role } from "@/lib/session";
import { getStore } from "@/lib/store";
import { resetMemoryStore } from "@/lib/store/memory";

const ORIGIN = "http://localhost:3000";
async function as(role: Role | null) {
  jar.token = role ? await signSession({ uid: `u-${role}`, name: role, role, exp: Math.floor(Date.now() / 1000) + 600 }) : undefined;
}
function req(method: string, url: string, body?: unknown, origin = ORIGIN) {
  return new Request(`${ORIGIN}${url}`, {
    method,
    headers: { host: "localhost:3000", origin, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const PRODUCT = "prd_cappuccino";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("DEMO_MODE", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  resetMemoryStore(false);
});
afterEach(() => {
  vi.unstubAllEnvs();
  jar.token = undefined;
});

async function business() {
  return (await getStore().getSettings()).business;
}
const waBody = { whatsapp_e164: "+919999999999", whatsapp_messages: { general: "hi", reservation: "hi", ordering: "hi", group: "hi" } };

describe("unauthenticated and cross-site requests", () => {
  it("every admin route answers 401 without a session", async () => {
    await as(null);
    expect((await settingsGET(req("GET", "/api/admin/settings"), {})).status).toBe(401);
    expect((await settingsPATCH(req("PATCH", "/api/admin/settings", { content: {} }), {})).status).toBe(401);
    expect((await whatsappPATCH(req("PATCH", "/api/admin/whatsapp", waBody), {})).status).toBe(401);
    expect((await productPATCH(req("PATCH", `/api/admin/products/${PRODUCT}`, { is_available: false }), ctx(PRODUCT))).status).toBe(401);
    expect((await categoriesPOST(req("POST", "/api/admin/categories", {}), {})).status).toBe(401);
  });

  it("a forged or tampered session is rejected", async () => {
    await as("staff");
    const [body, sig] = jar.token!.split(".");
    const forged = Buffer.from(JSON.stringify({ uid: "x", name: "x", role: "owner", exp: 9999999999 })).toString("base64url");
    jar.token = `${forged}.${sig}`;
    expect((await settingsGET(req("GET", "/api/admin/settings"), {})).status).toBe(401);
    jar.token = `${body}.`;
    expect((await settingsGET(req("GET", "/api/admin/settings"), {})).status).toBe(401);
  });

  it("an owner's write from another site is blocked with 403", async () => {
    await as("owner");
    const evil = "https://evil.example";
    expect((await settingsPATCH(req("PATCH", "/api/admin/settings", { content: {} }, evil), {})).status).toBe(403);
    expect((await whatsappPATCH(req("PATCH", "/api/admin/whatsapp", waBody, evil), {})).status).toBe(403);
  });
});

describe("staff", () => {
  beforeEach(() => as("staff"));
  it("may mark a product sold out (200) but not feature it, edit or delete it (403)", async () => {
    const ok = await productPATCH(req("PATCH", `/api/admin/products/${PRODUCT}`, { is_available: false }), ctx(PRODUCT));
    expect(ok.status).toBe(200);
    expect((await ok.json()).is_available).toBe(false);
    expect((await productPATCH(req("PATCH", `/api/admin/products/${PRODUCT}`, { is_featured: true }), ctx(PRODUCT))).status).toBe(403);
    expect((await productDELETE(req("DELETE", `/api/admin/products/${PRODUCT}`), ctx(PRODUCT))).status).toBe(403);
  });
  it("cannot read or change settings, WhatsApp, categories or uploads (403)", async () => {
    expect((await settingsGET(req("GET", "/api/admin/settings"), {})).status).toBe(403);
    expect((await settingsPATCH(req("PATCH", "/api/admin/settings", { content: {} }), {})).status).toBe(403);
    expect((await whatsappPATCH(req("PATCH", "/api/admin/whatsapp", waBody), {})).status).toBe(403);
    expect((await categoriesPOST(req("POST", "/api/admin/categories", { slug: "x", name: "X", sort_order: 0, is_active: true }), {})).status).toBe(403);
    expect((await uploadPOST(new Request(`${ORIGIN}/api/admin/upload`, { method: "POST", headers: { host: "localhost:3000", origin: ORIGIN }, body: new FormData() }), {})).status).toBe(403);
  });
});

describe("manager", () => {
  beforeEach(() => as("manager"));
  it("may read settings, feature products and change the WhatsApp number outside the demo (200)", async () => {
    expect((await settingsGET(req("GET", "/api/admin/settings"), {})).status).toBe(200);
    expect((await productPATCH(req("PATCH", `/api/admin/products/${PRODUCT}`, { is_featured: true }), ctx(PRODUCT))).status).toBe(200);
    expect((await whatsappPATCH(req("PATCH", "/api/admin/whatsapp", waBody), {})).status).toBe(200);
    expect((await business()).whatsapp_e164).toBe("+919999999999");
  });
  it("cannot change business, payment/tax or notification settings (403), and nothing is saved", async () => {
    const before = await getStore().getSettings();
    for (const patch of [
      { business: { ...before.business, phone_e164: "+911234567890" } },
      { commerce: { ...before.commerce, ordering_enabled: true, tax_bps: 1 } },
      { notifications: { ...before.notifications, admin_emails: ["attacker@example.com"] } },
    ]) {
      const res = await settingsPATCH(req("PATCH", "/api/admin/settings", patch), {});
      expect(res.status).toBe(403);
    }
    const after = await getStore().getSettings();
    expect(after.business.phone_e164).toBe(before.business.phone_e164);
    expect(after.commerce).toEqual(before.commerce);
    expect(after.notifications).toEqual(before.notifications);
  });
});

describe("owner", () => {
  beforeEach(() => as("owner"));
  it("may change business, payment/tax and notification settings (200)", async () => {
    const s = await getStore().getSettings();
    const res = await settingsPATCH(req("PATCH", "/api/admin/settings", { commerce: { ...s.commerce, tax_bps: 500 }, business: { ...s.business, phone_display: "+91 90000 00000" } }), {});
    expect(res.status).toBe(200);
    const after = await getStore().getSettings();
    expect(after.commerce.tax_bps).toBe(500);
    expect(after.business.phone_display).toBe("+91 90000 00000");
  });
});

describe("public demo (DEMO_MODE=true)", () => {
  beforeEach(() => {
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("ADMIN_SESSION_SECRET", "s".repeat(40));
    vi.stubEnv("CRON_SECRET", "c".repeat(40));
  });
  it("nobody, not even an owner, can change the WhatsApp destination or business details (403)", async () => {
    const before = await business();
    for (const role of ["manager", "owner"] as const) {
      await as(role);
      const wa = await whatsappPATCH(req("PATCH", "/api/admin/whatsapp", waBody), {});
      expect(wa.status).toBe(403);
      expect((await wa.json()).error.message).toContain("Contact options are disabled in this demo.");
    }
    const s = await getStore().getSettings();
    expect((await settingsPATCH(req("PATCH", "/api/admin/settings", { business: { ...s.business, whatsapp_e164: "+919999999999" } }), {})).status).toBe(403);
    expect(await business()).toEqual(before);
  });
  it("manager content edits still work (200)", async () => {
    await as("manager");
    const s = await getStore().getSettings();
    expect((await settingsPATCH(req("PATCH", "/api/admin/settings", { content: { ...s.content, hero_headline: "Hello" } }), {})).status).toBe(200);
  });
});

describe("admin profiles", () => {
  it("no API route reads or writes staff profiles (they are managed only in Supabase by the owner)", () => {
    const dir = path.resolve(__dirname, "../../src/app/api/admin");
    const routes = readdirSync(dir, { recursive: true }).map(String);
    expect(routes.filter((r) => /profile|users?|staff|roles?|invite|signup|register/i.test(r))).toEqual([]);
  });
});

describe("logout", () => {
  it("same-origin logout works (200); cross-site logout is blocked (403)", async () => {
    await as("staff");
    expect((await logoutPOST(req("POST", "/api/admin/logout", {}, "https://evil.example"))).status).toBe(403);
    expect(jar.token).toBeDefined();
    expect((await logoutPOST(req("POST", "/api/admin/logout", {}))).status).toBe(200);
    expect(jar.token).toBeUndefined();
  });
});
