import "server-only";
import { createHmac } from "node:crypto";
import { env, paymentMode, simulatedPaymentsAllowed } from "../config";
import { shortRef, token } from "../ids";
import { notifyOrderPlaced, notifyOrderStatus } from "../notify";
import { computeTotals, PricingError, priceLines } from "../pricing";
import { createRazorpayOrder, fetchRazorpayPayment, verifyPaymentSignature } from "../razorpay";
import { getStore } from "../store";
import type { Order, OrderStatus } from "../types";
import type { checkoutSchema } from "../validation";
import type { z } from "zod";

type CheckoutData = z.output<typeof checkoutSchema>;

export type CheckoutResult =
  | { ok: true; order: Order; payment: { mode: "razorpay"; key_id: string; razorpay_order_id: string; amount: number } | { mode: "simulated"; amount: number } }
  | { ok: false; status: number; code: string; message: string };

export async function startCheckout(input: CheckoutData): Promise<CheckoutResult> {
  const store = getStore();
  const settings = await store.getSettings();
  const c = settings.commerce;
  if (!c.ordering_enabled) return { ok: false, status: 409, code: "ordering_disabled", message: "Online ordering isn't open yet. Please call us to order." };
  if (input.fulfilment === "delivery" && !c.delivery_enabled)
    return { ok: false, status: 409, code: "no_delivery", message: "Delivery isn't available online yet — please choose pickup." };

  // Refuse before creating an order that could never be paid.
  if (paymentMode() === "simulated" && !simulatedPaymentsAllowed())
    return { ok: false, status: 503, code: "payments_unavailable", message: "Online payment isn't set up yet. Please call us to order." };

  const products = await store.listProducts({ includeUnavailable: true });
  let items;
  try {
    items = priceLines(input.items, new Map(products.map((p) => [p.id, p])));
  } catch (e) {
    if (e instanceof PricingError) return { ok: false, status: 409, code: e.code, message: e.message };
    throw e;
  }
  const coupon = input.coupon_code ? await store.getCoupon(input.coupon_code) : null;
  if (input.coupon_code && !coupon) return { ok: false, status: 422, code: "bad_coupon", message: "That code isn't valid." };
  const totals = computeTotals(items, c, input.fulfilment, coupon);
  if (totals.total < c.min_order_value)
    return { ok: false, status: 422, code: "below_minimum", message: "Your order is below the minimum order value." };
  if (totals.total < 100) return { ok: false, status: 422, code: "too_small", message: "Order total is too small to pay online." };

  const { order, existed } = await store.createOrder({
    reference: shortRef("LOC"),
    public_token: token(),
    idempotency_key: input.idempotency_key,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    customer_email: input.customer_email,
    fulfilment: input.fulfilment,
    address: input.fulfilment === "delivery" ? input.address : null,
    landmark: input.fulfilment === "delivery" ? input.landmark : null,
    notes: input.notes,
    items,
    coupon_code: coupon?.code ?? null,
    ...totals,
    status: "pending",
    payment_status: "unpaid",
    razorpay_order_id: null,
    razorpay_payment_id: null,
  });
  if (existed && order.payment_status === "paid")
    return { ok: false, status: 409, code: "already_paid", message: "This order has already been paid." };

  if (paymentMode() === "simulated") return { ok: true, order, payment: { mode: "simulated", amount: order.total } };

  let rzpOrderId = order.razorpay_order_id;
  if (!rzpOrderId) {
    const rzp = await createRazorpayOrder({ amount: order.total, receipt: order.reference, notes: { order_id: order.id } });
    rzpOrderId = rzp.id;
    await store.updateOrder(order.id, { razorpay_order_id: rzp.id, payment_status: "created" });
  }
  return { ok: true, order, payment: { mode: "razorpay", key_id: env.razorpayKeyId, razorpay_order_id: rzpOrderId, amount: order.total } };
}

/**
 * Confirms a payment. Never trusts the browser alone: verifies the HMAC signature and
 * (with live keys) re-fetches the payment from Razorpay to check status + amount.
 */
export async function confirmPayment(input: { order_id: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  const store = getStore();
  const order = await store.getOrder(input.order_id);
  if (!order) return { ok: false as const, status: 404, code: "not_found", message: "Order not found." };
  if (order.payment_status === "paid") return { ok: true as const, order, duplicate: true };

  if (paymentMode() === "simulated") {
    if (!simulatedPaymentsAllowed())
      return { ok: false as const, status: 400, code: "simulation_disabled", message: "Payment simulation is disabled." };
    // Simulated signature uses the session secret so it can't be forged from the browser blindly.
    const expected = simulatedSignature(order.id, input.razorpay_payment_id);
    if (input.razorpay_signature !== expected)
      return { ok: false as const, status: 400, code: "bad_signature", message: "Payment could not be verified." };
  } else {
    if (order.razorpay_order_id !== input.razorpay_order_id)
      return { ok: false as const, status: 400, code: "order_mismatch", message: "Payment does not match this order." };
    if (!verifyPaymentSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
      await store.markPaymentFailed(order.id, { reason: "bad_signature" });
      return { ok: false as const, status: 400, code: "bad_signature", message: "Payment could not be verified." };
    }
    const p = await fetchRazorpayPayment(input.razorpay_payment_id);
    if (p.order_id !== order.razorpay_order_id || p.amount !== order.total || !["captured", "authorized"].includes(p.status))
      return { ok: false as const, status: 400, code: "payment_incomplete", message: "Payment isn't complete yet. If money was deducted, it will be confirmed automatically or refunded." };
  }

  const { recorded, order: paid } = await store.recordPayment({
    order_id: order.id,
    provider: paymentMode() === "simulated" ? "simulated" : "razorpay",
    provider_order_id: input.razorpay_order_id || null,
    provider_payment_id: input.razorpay_payment_id,
    amount: order.total,
    status: "captured",
    method: null,
    raw: null,
  });
  if (recorded) await notifyOrderPlaced(paid);
  return { ok: true as const, order: paid, duplicate: !recorded };
}

export function simulatedSignature(orderId: string, paymentId: string) {
  return createHmac("sha256", `sim:${process.env.ADMIN_SESSION_SECRET ?? "preview"}`).update(`${orderId}|${paymentId}`).digest("hex");
}

/** Allowed status transitions — prevents e.g. completing a cancelled or unpaid order by mistake. */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "out_for_delivery", "cancelled"],
  ready_for_pickup: ["completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
export const allowedNextStatuses = (o: Pick<Order, "status" | "fulfilment">) =>
  NEXT[o.status].filter((s) => !(o.fulfilment === "pickup" && s === "out_for_delivery") && !(o.fulfilment === "delivery" && s === "ready_for_pickup"));

export async function changeOrderStatus(id: string, status: OrderStatus, actor?: string) {
  const store = getStore();
  const order = await store.getOrder(id);
  if (!order) return { ok: false as const, status: 404, message: "Order not found." };
  if (order.payment_status !== "paid" && status !== "cancelled")
    return { ok: false as const, status: 409, message: "Unpaid orders can only be cancelled." };
  if (!allowedNextStatuses(order).includes(status))
    return { ok: false as const, status: 409, message: `Can't move an order from ${order.status} to ${status}.` };
  const updated = await store.updateOrder(id, { status }, actor);
  await notifyOrderStatus(updated);
  return { ok: true as const, order: updated };
}
