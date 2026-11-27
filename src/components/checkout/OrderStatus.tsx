"use client";
import clsx from "clsx";
import { useEffect, useState } from "react";

const STEPS_PICKUP = ["pending", "confirmed", "preparing", "ready_for_pickup", "completed"];
const STEPS_DELIVERY = ["pending", "confirmed", "preparing", "out_for_delivery", "completed"];
const LABEL: Record<string, string> = {
  pending: "Sent to café", confirmed: "Accepted", preparing: "Preparing", ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery", completed: "Completed", cancelled: "Cancelled",
};

export function OrderStatus({ token, initial }: { token: string; initial: { status: string; payment_status: string; fulfilment: string } }) {
  const [s, setS] = useState(initial);
  useEffect(() => {
    if (["completed", "cancelled"].includes(s.status)) return;
    const id = setInterval(async () => {
      try {
        const r = await fetch(`/api/orders/${token}`, { cache: "no-store" });
        if (r.ok) setS(await r.json());
      } catch {}
    }, 15_000);
    return () => clearInterval(id);
  }, [token, s.status]);

  if (s.payment_status !== "paid")
    return <p className="mt-6 text-danger">Payment for this order wasn&apos;t completed{s.payment_status === "failed" ? " — it failed" : ""}. You have not been charged; any amount deducted is refunded automatically by your bank.</p>;
  if (s.status === "cancelled") return <p className="mt-6 text-danger">This order was cancelled. If you paid, the café will arrange your refund.</p>;
  const steps = s.fulfilment === "delivery" ? STEPS_DELIVERY : STEPS_PICKUP;
  const at = steps.indexOf(s.status);
  return (
    <ol className="mt-8 grid gap-0 sm:grid-cols-5" aria-label="Order progress">
      {steps.map((st, i) => (
        <li key={st} className={clsx("flex items-center gap-3 border-l-2 py-3 pl-4 sm:border-l-0 sm:border-t-2 sm:pl-0 sm:pt-4", i <= at ? "border-terracotta" : "border-oat")} aria-current={i === at ? "step" : undefined}>
          <span className={clsx("text-sm", i <= at ? "font-semibold text-espresso" : "text-muted")}>{LABEL[st]}</span>
        </li>
      ))}
    </ol>
  );
}
