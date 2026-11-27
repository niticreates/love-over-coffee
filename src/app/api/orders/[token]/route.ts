import { fail, json, limit } from "@/lib/http";
import { getStore } from "@/lib/store";

/** Customer-facing status. Lookup is by an unguessable token; returns no address/phone. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const limited = limit(req, "order-status", 60, 60_000);
  if (limited) return limited;
  const { token } = await params;
  const o = await getStore().getOrderByToken(token);
  if (!o) return fail(404, "not_found", "Order not found.");
  return json({ reference: o.reference, status: o.status, payment_status: o.payment_status, fulfilment: o.fulfilment, total: o.total, updated_at: o.updated_at });
}
