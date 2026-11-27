import { fail, json, limit, parseBody } from "@/lib/http";
import { confirmPayment } from "@/lib/services/orders";
import { verifyPaymentSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const limited = limit(req, "verify", 20, 60_000);
  if (limited) return limited;
  const body = await parseBody(req, verifyPaymentSchema);
  if (!body.ok) return body.res;
  try {
    const r = await confirmPayment(body.data);
    if (!r.ok) return fail(r.status, r.code, r.message);
    return json({ ok: true, token: r.order.public_token, reference: r.order.reference });
  } catch (e) {
    console.error("verify failed", e);
    return fail(503, "unavailable", "We couldn't confirm your payment yet. If money was deducted, your order will be confirmed automatically.");
  }
}
