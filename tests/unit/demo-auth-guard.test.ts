// Regression: with DEMO_MODE pointed at the production project, staff login, the session check
// and the password-reset endpoint must refuse before any Supabase Auth request is made.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn(() => ({
  auth: {
    signInWithPassword: vi.fn(async () => ({ data: { user: null }, error: { message: "nope" } })),
    resetPasswordForEmail: vi.fn(async () => ({ error: null })),
  },
  from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) })),
})) }));
vi.mock("@supabase/supabase-js", () => ({ createClient }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("redirect"); } }));

import { POST as loginPOST } from "@/app/api/admin/login/route";
import { POST as resetPOST } from "@/app/api/auth/password-reset/route";
import { authenticate, currentAdmin } from "@/lib/auth";

const SECRETS = { ADMIN_SESSION_SECRET: "s".repeat(40), CRON_SECRET: "c".repeat(40) };
const PROD = { NEXT_PUBLIC_SUPABASE_URL: "https://fzbhkwzcaezfvmeejtuk.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "service" };
const DEMO = { ...PROD, NEXT_PUBLIC_SUPABASE_URL: "https://demoabcdefghijklmno.supabase.co" };

let ip = 0;
const post = (path: string, body: unknown) =>
  new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost:3000", origin: "http://localhost:3000", "x-forwarded-for": `10.0.0.${++ip}` },
    body: JSON.stringify(body),
  });

function setEnv(vars: Record<string, string>) {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("DEMO_MODE", "true");
  for (const [k, v] of Object.entries({ ...SECRETS, ...vars })) vi.stubEnv(k, v);
}
beforeEach(() => createClient.mockClear());
afterEach(() => vi.unstubAllEnvs());

describe("demo guard on Supabase Auth", () => {
  it("login is refused with 503 and never creates a Supabase client", async () => {
    setEnv(PROD);
    await expect(authenticate("a@example.com", "pw")).rejects.toThrow(/production Supabase project/);
    const res = await loginPOST(post("/api/admin/login", { email: "a@example.com", password: "pw" }));
    expect(res.status).toBe(503);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("the session check refuses before querying staff profiles", async () => {
    setEnv(PROD);
    await expect(currentAdmin()).rejects.toThrow(/production Supabase project/);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("password reset is refused with 503 and sends nothing", async () => {
    setEnv(PROD);
    const res = await resetPOST(post("/api/auth/password-reset", { email: "a@example.com" }));
    expect(res.status).toBe(503);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("missing demo secrets also block login and reset", async () => {
    setEnv({ ...DEMO, CRON_SECRET: "" });
    expect((await loginPOST(post("/api/admin/login", { email: "a@example.com", password: "pw" }))).status).toBe(503);
    expect((await resetPOST(post("/api/auth/password-reset", { email: "a@example.com" }))).status).toBe(503);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("control: a correctly configured demo does reach its own project's Auth", async () => {
    setEnv(DEMO);
    const res = await loginPOST(post("/api/admin/login", { email: "a@example.com", password: "pw" }));
    expect(res.status).toBe(401); // mocked Auth said no
    expect(createClient).toHaveBeenCalledWith("https://demoabcdefghijklmno.supabase.co", "anon", expect.anything());
    createClient.mockClear();
    expect((await resetPOST(post("/api/auth/password-reset", { email: "a@example.com" }))).status).toBe(200);
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it("outside DEMO_MODE nothing changes: login goes to the configured project", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_MODE", "");
    for (const [k, v] of Object.entries({ ...SECRETS, ...PROD })) vi.stubEnv(k, v);
    expect((await loginPOST(post("/api/admin/login", { email: "a@example.com", password: "pw" }))).status).toBe(401);
    expect(createClient).toHaveBeenCalledWith("https://fzbhkwzcaezfvmeejtuk.supabase.co", "anon", expect.anything());
  });
});
