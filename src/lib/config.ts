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

/** Payments are "live" only with real keys; "simulated" lets the flow run in preview. */
export function paymentMode(): "razorpay" | "simulated" {
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

/** Simulated payments: never with real Razorpay keys, and never in production unless explicitly allowed. */
export function simulatedPaymentsAllowed(): boolean {
  if (paymentMode() !== "simulated") return false;
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_SIMULATED_PAYMENTS === "true";
}

export function isProduction() {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";
}
