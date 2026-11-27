import { json } from "@/lib/http";
import { notifyOrderPlaced } from "@/lib/notify";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { getStore } from "@/lib/store";

interface RzpEvent {
  event: string;
  payload?: { payment?: { entity?: { id: string; order_id: string; amount: number; status: string; method?: string } } };
}

/**
 * Razorpay webhook — the source of truth if the browser closes before /verify runs.
 * Configure in Razorpay Dashboard → Webhooks with events payment.captured, payment.failed, order.paid.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) return json({ error: "invalid signature" }, 400);
  const eventId = req.headers.get("x-razorpay-event-id");
  let evt: RzpEvent;
  try {
    evt = JSON.parse(raw);
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const store = getStore();
  if (eventId && !(await store.claimWebhookEvent("razorpay", eventId, evt))) return json({ ok: true, duplicate: true });

  const pay = evt.payload?.payment?.entity;
  if (!pay?.order_id) return json({ ok: true, ignored: evt.event });
  const order = await store.getOrderByRazorpayOrderId(pay.order_id);
  if (!order) return json({ ok: true, ignored: "unknown order" });

  if (evt.event === "payment.captured" || evt.event === "order.paid") {
    if (pay.amount !== order.total) {
      console.error("webhook amount mismatch", order.reference, pay.amount, order.total);
      return json({ ok: true, flagged: "amount_mismatch" });
    }
    const { recorded, order: paid } = await store.recordPayment({
      order_id: order.id, provider: "razorpay", provider_order_id: pay.order_id, provider_payment_id: pay.id,
      amount: pay.amount, status: "captured", method: pay.method ?? null, raw: evt,
    });
    if (recorded) await notifyOrderPlaced(paid);
  } else if (evt.event === "payment.failed") {
    await store.markPaymentFailed(order.id, evt);
  }
  return json({ ok: true });
}
