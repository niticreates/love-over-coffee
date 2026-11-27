import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatus } from "@/components/checkout/OrderStatus";
import { formatINR } from "@/lib/money";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string }> }) {
  const { token } = await params;
  const { new: isNew } = await searchParams;
  const o = await getStore().getOrderByToken(token);
  if (!o) notFound();
  const paid = o.payment_status === "paid";
  return (
    <div className="container-site max-w-3xl pt-32 pb-section md:pt-44">
      <p className="eyebrow text-terracotta-ink">Order {o.reference}</p>
      <h1 className="mt-5 text-display-md">{paid ? (isNew ? "Thank you — payment received." : "Your order") : "Payment not completed"}</h1>
      {paid && o.status === "pending" && <p className="mt-4 max-w-prose text-muted">Your order has been sent to the café. You&apos;ll see it change to “Accepted” once the café confirms it{o.customer_email ? ", and we'll email you" : ""}.</p>}
      <OrderStatus token={token} initial={{ status: o.status, payment_status: o.payment_status, fulfilment: o.fulfilment }} />
      <div className="mt-12 border border-oat bg-paper p-6 md:p-8">
        <ul className="divide-y divide-oat">
          {o.items.map((i, k) => (
            <li key={k} className="flex justify-between gap-4 py-3 text-sm">
              <span>{i.quantity} × {i.name}{i.selections.length ? <span className="block text-xs text-muted">{i.selections.map((s) => s.option).join(", ")}</span> : null}</span>
              <span className="tabular-nums">{formatINR(i.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-oat pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(o.subtotal)}</dd></div>
          {o.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd>−{formatINR(o.discount)}</dd></div>}
          {o.tax > 0 && <div className="flex justify-between"><dt className="text-muted">Taxes</dt><dd>{formatINR(o.tax)}</dd></div>}
          {o.delivery_fee > 0 && <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{formatINR(o.delivery_fee)}</dd></div>}
          <div className="flex justify-between pt-2 font-semibold"><dt>Total</dt><dd>{formatINR(o.total)}</dd></div>
        </dl>
        <p className="mt-4 text-xs text-muted">{o.fulfilment === "pickup" ? "Pickup from the café" : "Delivery"} · placed {new Date(o.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</p>
      </div>
      <div className="mt-10 flex gap-3">
        {!paid && <Link href="/checkout" className="btn btn-primary">Try again</Link>}
        <Link href="/menu" className="btn btn-outline">Back to menu</Link>
      </div>
    </div>
  );
}
