import { z } from "zod";
import { simulatedPaymentsAllowed } from "@/lib/config";
import { fail, json, limit, parseBody } from "@/lib/http";
import { uuid } from "@/lib/ids";
import { confirmPayment, simulatedSignature } from "@/lib/services/orders";
import { getStore } from "@/lib/store";

const schema = z.object({ order_id: z.string().uuid(), outcome: z.enum(["success", "failure"]) });

/** Preview-only stand-in for Razorpay Checkout. Disabled whenever real Razorpay keys exist. */
export async function POST(req: Request) {
  if (!simulatedPaymentsAllowed())
    return fail(404, "not_found", "Not found.");
  const limited = limit(req, "simulate", 20, 60_000);
  if (limited) return limited;
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  if (body.data.outcome === "failure") {
    await getStore().markPaymentFailed(body.data.order_id, { simulated: true });
    return fail(402, "payment_failed", "Payment failed (simulated). You have not been charged.");
  }
  const paymentId = `simpay_${uuid().slice(0, 12)}`;
  const r = await confirmPayment({
    order_id: body.data.order_id,
    razorpay_order_id: "",
    razorpay_payment_id: paymentId,
    razorpay_signature: simulatedSignature(body.data.order_id, paymentId),
  });
  if (!r.ok) return fail(r.status, r.code, r.message);
  return json({ ok: true, token: r.order.public_token, reference: r.order.reference });
}
