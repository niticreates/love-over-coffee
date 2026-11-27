import { fail, json, limit, parseBody } from "@/lib/http";
import { startCheckout } from "@/lib/services/orders";
import { checkoutSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const limited = limit(req, "checkout", 10, 60_000);
  if (limited) return limited;
  const body = await parseBody(req, checkoutSchema);
  if (!body.ok) return body.res;
  try {
    const r = await startCheckout(body.data);
    if (!r.ok) return fail(r.status, r.code, r.message);
    return json({
      order: { id: r.order.id, reference: r.order.reference, token: r.order.public_token, total: r.order.total },
      payment: r.payment,
      customer: { name: r.order.customer_name, phone: r.order.customer_phone, email: r.order.customer_email },
    });
  } catch (e) {
    console.error("checkout failed", e);
    return fail(503, "unavailable", "We couldn't start your payment. Please try again in a moment — you have not been charged.");
  }
}
