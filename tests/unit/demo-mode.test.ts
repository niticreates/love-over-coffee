import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { demoConfigProblems, demoMode, paymentMode, simulatedPaymentsAllowed } from "@/lib/config";

const DEMO_SUPABASE = { NEXT_PUBLIC_SUPABASE_URL: "https://demoabcdefghijklmno.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "demo-service-key" };
const KEYS = ["DEMO_MODE", "NODE_ENV", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET", "RESEND_API_KEY", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "DEMO_ADMIN_PASSWORD", "ALLOW_MEMORY_STORE", "ALLOW_SIMULATED_PAYMENTS"];

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
    withEnv({ NODE_ENV: "production", DEMO_MODE: "true", NEXT_PUBLIC_SUPABASE_URL: "https://fzbhkwzcaezfvmeejtuk.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "x" });
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
    withEnv({ NODE_ENV: "development", DEMO_MODE: "true", DEMO_ADMIN_PASSWORD: "pw" });
    expect(demoConfigProblems()).toEqual([]);
  });
});
