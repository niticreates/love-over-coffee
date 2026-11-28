// Runtime configuration. Server-only values are read lazily so they never reach client bundles.
import "server-only";

export const env = {
  get siteUrl() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  },
  get supabaseUrl() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  },
  get supabaseAnonKey() {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  },
  get supabaseServiceKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  },
  get razorpayKeyId() {
    return process.env.RAZORPAY_KEY_ID ?? "";
  },
  get razorpayKeySecret() {
    return process.env.RAZORPAY_KEY_SECRET ?? "";
  },
  get razorpayWebhookSecret() {
    return process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  },
  get resendKey() {
    return process.env.RESEND_API_KEY ?? "";
  },
  get emailFrom() {
    return process.env.EMAIL_FROM ?? "";
  },
  get whatsappToken() {
    return process.env.WHATSAPP_ACCESS_TOKEN ?? "";
  },
  get whatsappPhoneNumberId() {
    return process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
  },
  get sessionSecret() {
    return process.env.ADMIN_SESSION_SECRET ?? "";
  },
  get demoAdminPassword() {
    return process.env.DEMO_ADMIN_PASSWORD ?? "";
  },
  get demoSampleData() {
    return process.env.DEMO_SAMPLE_DATA === "true";
  },
};

/** "supabase" when the database is configured, otherwise an in-memory preview store. */
export function dataMode(): "supabase" | "memory" {
  return env.supabaseUrl && env.supabaseServiceKey ? "supabase" : "memory";
}

/**
 * DEMO_MODE=true marks a public client demo: its own Supabase project, sample data, simulated
 * payments, no outgoing notifications. It never relaxes the production guards for a normal
 * deployment; instead demoConfigProblems() refuses to run when real integrations are present.
 */
export function demoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

/** The real café database. A demo deployment must never point at it. */
export const PRODUCTION_SUPABASE_REF = "fzbhkwzcaezfvmeejtuk";

/** Names (never values) of settings that make a demo unsafe. Empty when not in demo mode. */
export function demoConfigProblems(): string[] {
  if (!demoMode()) return [];
  const problems: string[] = [];
  if (env.supabaseUrl.includes(PRODUCTION_SUPABASE_REF)) problems.push("the production Supabase project (use the separate demo project)");
  if (env.razorpayKeyId || env.razorpayKeySecret || env.razorpayWebhookSecret) problems.push("Razorpay keys");
  if (env.resendKey) problems.push("RESEND_API_KEY");
  if (env.whatsappToken || env.whatsappPhoneNumberId) problems.push("WhatsApp keys");
  if (process.env.NODE_ENV === "production") {
    if (dataMode() !== "supabase") problems.push("no demo Supabase project (the in-memory store does not persist on Vercel)");
    if (env.demoAdminPassword) problems.push("DEMO_ADMIN_PASSWORD (shared-password admin must not be public)");
    if (process.env.ALLOW_MEMORY_STORE === "true") problems.push("ALLOW_MEMORY_STORE");
    if (process.env.ALLOW_SIMULATED_PAYMENTS === "true") problems.push("ALLOW_SIMULATED_PAYMENTS (DEMO_MODE already simulates payments)");
  }
  return problems;
}

export function assertDemoSafe() {
  const problems = demoConfigProblems();
  if (problems.length) throw new Error(`DEMO_MODE refuses to run with: ${problems.join("; ")}. Remove them from this deployment's environment.`);
}

/** Payments are "live" only with real keys; "simulated" lets the flow run in preview and in the demo. */
export function paymentMode(): "razorpay" | "simulated" {
  if (demoMode()) return "simulated";
  return env.razorpayKeyId && env.razorpayKeySecret ? "razorpay" : "simulated";
}

/**
 * The in-memory store is for local preview, development and CI only. A production server
 * (NODE_ENV=production) refuses to fall back to it unless ALLOW_MEMORY_STORE=true is set on
 * purpose, so a missing Supabase variable can never make orders "succeed" into memory.
 */
export function memoryStoreAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_MEMORY_STORE === "true";
}

/** Simulated payments: never with real Razorpay keys, and never in production unless explicitly allowed or a safe demo. */
export function simulatedPaymentsAllowed(): boolean {
  if (paymentMode() !== "simulated") return false;
  if (demoMode()) return demoConfigProblems().length === 0;
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_SIMULATED_PAYMENTS === "true";
}

export function isProduction() {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";
}
