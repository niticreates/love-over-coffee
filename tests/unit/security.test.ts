import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { verifyPaymentSignature, verifyWebhookSignature } from "@/lib/razorpay";
import { signSession, verifySession, hasRole } from "@/lib/session";
import { checkoutSchema, contactSchema, indianMobile } from "@/lib/validation";

describe("razorpay signatures", () => {
  const secret = "test_secret";
  it("accepts valid and rejects tampered checkout signatures", () => {
    const sig = createHmac("sha256", secret).update("order_1|pay_1").digest("hex");
    expect(verifyPaymentSignature("order_1", "pay_1", sig, secret)).toBe(true);
    expect(verifyPaymentSignature("order_1", "pay_2", sig, secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", "", secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", sig, "")).toBe(false);
  });
  it("verifies webhook bodies", () => {
    const body = '{"event":"payment.captured"}';
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
    expect(verifyWebhookSignature(body + " ", sig, secret)).toBe(false);
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
  });
});

describe("admin session", () => {
  it("round-trips and rejects tampering / expiry", async () => {
    const s = "x".repeat(40);
    const t = await signSession({ uid: "u", name: "n", role: "staff", exp: Date.now() / 1000 + 60 }, s);
    expect((await verifySession(t, s))?.role).toBe("staff");
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ uid: "u", name: "n", role: "owner", exp: Date.now() / 1000 + 60 })).toString("base64url");
    expect(await verifySession(`${forged}.${sig}`, s)).toBeNull();
    expect(await verifySession(`${body}.${sig}`, "y".repeat(40))).toBeNull();
    const old = await signSession({ uid: "u", name: "n", role: "staff", exp: 1 }, s);
    expect(await verifySession(old, s)).toBeNull();
  });
  it("ranks roles", () => {
    expect(hasRole("owner", "manager")).toBe(true);
    expect(hasRole("staff", "manager")).toBe(false);
  });
});

describe("validation", () => {
  it("normalises Indian mobiles", () => {
    expect(indianMobile.parse("093296 97769")).toBe("+919329697769");
    expect(indianMobile.parse("+91 93296-97769")).toBe("+919329697769");
    expect(indianMobile.safeParse("12345").success).toBe(false);
    expect(indianMobile.safeParse("5329697769").success).toBe(false);
  });
  it("requires an address for delivery and strips markup", () => {
    const base = { idempotency_key: "k".repeat(20), items: [{ product_id: "p", quantity: 1 }], customer_name: "<b>Asha</b>", customer_phone: "9876543210", fulfilment: "delivery" as const };
    const r = checkoutSchema.safeParse(base);
    expect(r.success).toBe(false);
    const ok = checkoutSchema.parse({ ...base, fulfilment: "pickup" });
    expect(ok.customer_name).toBe("bAsha/b");
  });
  it("needs a way to reply on contact", () => {
    expect(contactSchema.safeParse({ name: "Asha", message: "Hello there" }).success).toBe(false);
    expect(contactSchema.safeParse({ name: "Asha", email: "a@b.co", message: "Hello there" }).success).toBe(true);
  });
});
