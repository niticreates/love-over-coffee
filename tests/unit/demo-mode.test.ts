import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { demoConfigProblems, demoMode, paymentMode, simulatedPaymentsAllowed, supabaseRefFromKey, supabaseRefFromUrl } from "@/lib/config";
import { simulatedSignature } from "@/lib/services/orders";

const SECRETS = { ADMIN_SESSION_SECRET: "s".repeat(40), CRON_SECRET: "c".repeat(40) };
const DEMO_SUPABASE = { NEXT_PUBLIC_SUPABASE_URL: "https://demoabcdefghijklmno.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "demo-service-key", ...SECRETS };
const KEYS = ["DEMO_MODE", "NODE_ENV", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET", "RESEND_API_KEY", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "DEMO_ADMIN_PASSWORD", "ALLOW_MEMORY_STORE", "ALLOW_SIMULATED_PAYMENTS", "ADMIN_SESSION_SECRET", "CRON_SECRET", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

function withEnv(vars: Record<string, string>) {
  for (const k of KEYS) vi.stubEnv(k, "");
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
}
afterEach(() => vi.unstubAllEnvs());

describe("demo mode", () => {
  it("is off unless DEMO_MODE is exactly true, and then changes nothing", () => {
    withEnv({ NODE_ENV: "production", ...DEMO_SUPABASE, DEMO_MODE: "1" });
    expect(demoMode()).toBe(false);
    expect(demoConfigProblems()).toEqual([]);
    expect(simulatedPaymentsAllowed()).toBe(false); // the production guard still holds
  });

  it("a correctly configured production demo has no problems and simulates payments", () => {
    withEnv({ NODE_ENV: "production", ...DEMO_SUPABASE, DEMO_MODE: "true" });
    expect(demoConfigProblems()).toEqual([]);
    expect(paymentMode()).toBe("simulated");
    expect(simulatedPaymentsAllowed()).toBe(true);
  });

  it("refuses the production Supabase project", () => {
    withEnv({ NODE_ENV: "production", ...SECRETS, DEMO_MODE: "true", NEXT_PUBLIC_SUPABASE_URL: "https://fzbhkwzcaezfvmeejtuk.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "x" });
    expect(demoConfigProblems().join()).toMatch(/production Supabase/);
    expect(simulatedPaymentsAllowed()).toBe(false);
  });

  it("refuses real payment and messaging keys, and never reports their values", () => {
    withEnv({ NODE_ENV: "production", ...DEMO_SUPABASE, DEMO_MODE: "true", RAZORPAY_KEY_ID: "rzp_live_secretvalue", RAZORPAY_KEY_SECRET: "s3cr3t", RESEND_API_KEY: "re_secret", WHATSAPP_ACCESS_TOKEN: "wa_secret" });
    const problems = demoConfigProblems().join(" ");
    expect(problems).toMatch(/Razorpay/);
    expect(problems).toMatch(/RESEND_API_KEY/);
    expect(problems).toMatch(/WhatsApp/);
    expect(problems).not.toMatch(/secret|s3cr3t/);
    expect(paymentMode()).toBe("simulated"); // live keys are never used in a demo
    expect(simulatedPaymentsAllowed()).toBe(false);
  });

  it("refuses the in-memory store, the shared demo password and the escape hatches in production", () => {
    withEnv({ NODE_ENV: "production", DEMO_MODE: "true", DEMO_ADMIN_PASSWORD: "pw", ALLOW_MEMORY_STORE: "true", ALLOW_SIMULATED_PAYMENTS: "true" });
    const problems = demoConfigProblems().join(" ");
    expect(problems).toMatch(/in-memory store/);
    expect(problems).toMatch(/DEMO_ADMIN_PASSWORD/);
    expect(problems).toMatch(/ALLOW_MEMORY_STORE/);
    expect(problems).toMatch(/ALLOW_SIMULATED_PAYMENTS/);
  });

  it("allows the memory store in development so local tests still run", () => {
    withEnv({ NODE_ENV: "development", ...SECRETS, DEMO_MODE: "true", DEMO_ADMIN_PASSWORD: "pw" });
    expect(demoConfigProblems()).toEqual([]);
  });

  it("requires its own session and cron secrets, at least 32 characters and different", () => {
    for (const [vars, expected] of [
      [{ ADMIN_SESSION_SECRET: "" }, /ADMIN_SESSION_SECRET missing/],
      [{ ADMIN_SESSION_SECRET: "short" }, /ADMIN_SESSION_SECRET missing or shorter/],
      [{ CRON_SECRET: "" }, /CRON_SECRET missing/],
      [{ CRON_SECRET: "c".repeat(20) }, /CRON_SECRET missing or shorter/],
      [{ CRON_SECRET: "s".repeat(40) }, /must differ/],
    ] as const) {
      withEnv({ NODE_ENV: "production", ...DEMO_SUPABASE, DEMO_MODE: "true", ...vars });
      expect(demoConfigProblems().join(" ")).toMatch(expected);
      expect(simulatedPaymentsAllowed()).toBe(false);
    }
  });

  it("never signs demo payment confirmations with the default key", () => {
    withEnv({ NODE_ENV: "production", ...DEMO_SUPABASE, DEMO_MODE: "true", ADMIN_SESSION_SECRET: "" });
    expect(() => simulatedSignature("o", "p")).toThrow(/ADMIN_SESSION_SECRET/);
    withEnv({ NODE_ENV: "production", ...DEMO_SUPABASE, DEMO_MODE: "true" });
    const withSecret = simulatedSignature("o", "p");
    vi.stubEnv("ADMIN_SESSION_SECRET", "t".repeat(40));
    expect(simulatedSignature("o", "p")).not.toBe(withSecret); // depends on the deployment's own secret
  });

  it("detects legacy Supabase keys that belong to the production or another project", () => {
    const jwt = (ref: string) => `x.${Buffer.from(JSON.stringify({ iss: "supabase", ref, role: "service_role" })).toString("base64url")}.sig`;
    expect(supabaseRefFromUrl("https://abc123.supabase.co")).toBe("abc123");
    expect(supabaseRefFromUrl("https://example.com")).toBeNull();
    expect(supabaseRefFromKey(jwt("abc123"))).toBe("abc123");
    expect(supabaseRefFromKey("sb_secret_opaque")).toBeNull();

    withEnv({ NODE_ENV: "production", ...DEMO_SUPABASE, DEMO_MODE: "true", SUPABASE_SERVICE_ROLE_KEY: jwt("fzbhkwzcaezfvmeejtuk") });
    expect(demoConfigProblems().join(" ")).toMatch(/SUPABASE_SERVICE_ROLE_KEY from the production Supabase project/);
    withEnv({ NODE_ENV: "production", ...DEMO_SUPABASE, DEMO_MODE: "true", NEXT_PUBLIC_SUPABASE_ANON_KEY: jwt("someotherproject") });
    expect(demoConfigProblems().join(" ")).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY from a different Supabase project/);
    withEnv({ NODE_ENV: "production", ...DEMO_SUPABASE, DEMO_MODE: "true", SUPABASE_SERVICE_ROLE_KEY: jwt("demoabcdefghijklmno") });
    expect(demoConfigProblems()).toEqual([]);
  });
});
