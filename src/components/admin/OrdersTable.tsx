"use client";
import { Fragment, useState } from "react";
import { formatINR } from "@/lib/money";
import type { Order, OrderStatus } from "@/lib/types";
import { useAdminAction } from "./useAdmin";
import { Badge } from "./ui";

export function OrdersTable({ orders, openId }: { orders: (Order & { next: OrderStatus[] })[]; openId?: string }) {
  const [open, setOpen] = useState<string | null>(openId ?? null);
  const { run, busy } = useAdminAction();
  if (!orders.length) return <p className="admin-surface p-8 text-center text-muted">No orders match.</p>;
  return (
    <div className="overflow-x-auto admin-surface">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-ink/8 bg-turquoise-soft/60 text-left text-xs uppercase tracking-wider text-turquoise-deep">
          <tr><th className="p-3">Order</th><th className="p-3">Placed</th><th className="p-3">Customer</th><th className="p-3">Type</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <Fragment key={o.id}>
              <tr className="cursor-pointer border-b border-oat hover:bg-turquoise-soft/30" onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}>
                <td className="p-3 font-semibold">{o.reference}</td>
                <td className="p-3 text-muted">{new Date(o.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" })}</td>
                <td className="p-3">{o.customer_name}</td>
                <td className="p-3 capitalize">{o.fulfilment}</td>
                <td className="p-3 tabular-nums">{formatINR(o.total)}</td>
                <td className="p-3"><Badge value={o.payment_status} /></td>
                <td className="p-3"><Badge value={o.status} /></td>
              </tr>
              {open === o.id && (
                <tr className="border-b border-oat bg-ivory">
                  <td colSpan={7} className="p-5">
                    <div className="grid gap-6 md:grid-cols-3">
                      <div>
                        <p className="eyebrow text-turquoise-deep">Customer</p>
                        <p className="mt-2">{o.customer_name}</p>
                        <p><a className="underline" href={`tel:${o.customer_phone}`}>{o.customer_phone}</a></p>
                        {o.customer_email && <p>{o.customer_email}</p>}
                        {o.fulfilment === "delivery" && <p className="mt-2">{o.address}{o.landmark ? ` (near ${o.landmark})` : ""}</p>}
                        {o.notes && <p className="mt-2 italic">“{o.notes}”</p>}
                      </div>
                      <div>
                        <p className="eyebrow text-turquoise-deep">Items</p>
                        <ul className="mt-2 space-y-1">
                          {o.items.map((i, k) => <li key={k}>{i.quantity} × {i.name}{i.selections.length ? <span className="text-muted"> ({i.selections.map((s) => s.option).join(", ")})</span> : null} — {formatINR(i.line_total)}</li>)}
                        </ul>
                        <p className="mt-2 text-xs text-muted">Subtotal {formatINR(o.subtotal)}{o.discount ? ` · −${formatINR(o.discount)} (${o.coupon_code})` : ""} · Tax {formatINR(o.tax)}{o.delivery_fee ? ` · Delivery ${formatINR(o.delivery_fee)}` : ""}</p>
                        {o.razorpay_payment_id && <p className="mt-1 text-xs text-muted">Payment {o.razorpay_payment_id}</p>}
                      </div>
                      <div>
                        <p className="eyebrow text-turquoise-deep">Update status</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {o.next.length === 0 && <span className="text-muted">No further steps.</span>}
                          {o.next.map((s) => (
                            <button key={s} disabled={busy || (o.payment_status !== "paid" && s !== "cancelled")} onClick={() => run(`/api/admin/orders/${o.id}`, { status: s }, "PATCH", `Order ${o.reference}: ${s.replace(/_/g, " ")}`)} className={`btn min-h-[38px] px-3 ${s === "cancelled" ? "border border-danger text-danger" : "btn-dark"}`}>
                              {s.replace(/_/g, " ")}
                            </button>
                          ))}
                        </div>
                        {o.payment_status !== "paid" && <p className="mt-2 text-xs text-danger">Payment not received — don&apos;t prepare this order.</p>}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
