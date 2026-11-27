import { z } from "zod";
import { json, limit, parseBody } from "@/lib/http";
import { getStore } from "@/lib/store";

const schema = z.object({ order_id: z.string().uuid(), razorpay_order_id: z.string().max(80).optional() });

/** Browser reports a failed/abandoned Razorpay attempt. Never downgrades a paid order. */
export async function POST(req: Request) {
  const limited = limit(req, "payfail", 20, 60_000);
  if (limited) return limited;
  const body = await parseBody(req, schema);
  if (!body.ok) return body.res;
  const store = getStore();
  const order = await store.getOrder(body.data.order_id);
  if (order && order.razorpay_order_id === (body.data.razorpay_order_id ?? order.razorpay_order_id)) await store.markPaymentFailed(order.id, { client: true });
  return json({ ok: true });
}
