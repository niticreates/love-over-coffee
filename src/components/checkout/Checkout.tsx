"use client";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { QtyStepper } from "@/components/cart/QtyStepper";
import { postJSON } from "@/components/forms/api";
import { Field, TextArea, TextInput } from "@/components/forms/Field";
import { formatINR } from "@/lib/money";

interface Totals { subtotal: number; discount: number; tax: number; delivery_fee: number; total: number }
interface CheckoutResp {
  order: { id: string; reference: string; token: string; total: number };
  payment: { mode: "razorpay"; key_id: string; razorpay_order_id: string; amount: number } | { mode: "simulated"; amount: number };
  customer: { name: string; phone: string; email: string | null };
}
declare global {
  interface Window { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void } }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Same cart + details → same key, so double-clicks and retries never create duplicate orders. */
function idempotencyKey(signature: string) {
  try {
    const raw = sessionStorage.getItem("loc_idem");
    const v = raw ? JSON.parse(raw) : null;
    if (v?.sig === signature) return v.key as string;
    const key = crypto.randomUUID();
    sessionStorage.setItem("loc_idem", JSON.stringify({ sig: signature, key }));
    return key;
  } catch {
    return crypto.randomUUID();
  }
}

export function Checkout({ deliveryEnabled, taxNote, phone }: { deliveryEnabled: boolean; taxNote: string; phone: string }) {
  const { lines, setQty, notes, setNotes, clear, hydrated } = useCart();
  const router = useRouter();
  const [fulfilment, setFulfilment] = useState<"pickup" | "delivery">("pickup");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sim, setSim] = useState<CheckoutResp | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const items = useMemo(() => lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity, selections: l.selections })), [lines]);

  const quote = useCallback(
    async (code: string | null) => {
      if (!items.length) return setTotals(null);
      const r = await postJSON<{ totals: Totals; coupon: { code: string; valid: boolean } | null }>("/api/quote", { items, fulfilment, coupon_code: code });
      if (!r.ok) {
        setQuoteError(r.error.message);
        setTotals(null);
        return;
      }
      setQuoteError("");
      setTotals(r.data.totals);
      if (code) {
        if (r.data.coupon?.valid) setAppliedCoupon(code);
        else {
          setAppliedCoupon(null);
          setErrors((e) => ({ ...e, coupon: "That code isn't valid for this order." }));
        }
      }
    },
    [items, fulfilment],
  );

  useEffect(() => {
    if (hydrated) quote(appliedCoupon);
  }, [hydrated, quote]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = (token: string) => {
    clear();
    try {
      sessionStorage.removeItem("loc_idem");
    } catch {}
    router.push(`/order/${token}?new=1`);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const payload = {
      items, fulfilment, notes,
      customer_name: f.customer_name ?? "", customer_phone: f.customer_phone ?? "", customer_email: f.customer_email || null,
      address: f.address || null, landmark: f.landmark || null, coupon_code: appliedCoupon,
    };
    setBusy(true);
    setErrors({});
    setFormError("");
    const r = await postJSON<CheckoutResp>("/api/checkout", { ...payload, idempotency_key: idempotencyKey(JSON.stringify(payload)) });
    if (!r.ok) {
      setBusy(false);
      setErrors(r.error.fields ?? {});
      setFormError(r.error.message);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    const d = r.data;
    if (d.payment.mode === "simulated") {
      setBusy(false);
      setSim(d);
      return;
    }
    const ok = await loadRazorpay();
    if (!ok || !window.Razorpay) {
      setBusy(false);
      setFormError("We couldn't load the secure payment window. Check your connection and try again — you have not been charged.");
      return;
    }
    const payment = d.payment;
    const rzp = new window.Razorpay({
      key: payment.key_id,
      amount: payment.amount,
      currency: "INR",
      name: "Love Over Coffee",
      description: `Order ${d.order.reference}`,
      order_id: payment.razorpay_order_id,
      prefill: { name: d.customer.name, contact: d.customer.phone, email: d.customer.email ?? undefined },
      theme: { color: "#A65F40" },
      handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const v = await postJSON<{ token: string }>("/api/payments/verify", { order_id: d.order.id, ...resp });
        if (v.ok) finish(v.data.token);
        else {
          setBusy(false);
          setFormError(v.error.message);
        }
      },
      modal: {
        ondismiss: () => {
          setBusy(false);
          setFormError("Payment was not completed. You have not been charged — you can try again.");
        },
      },
    });
    rzp.on("payment.failed", () => {
      postJSON("/api/payments/failed", { order_id: d.order.id, razorpay_order_id: payment.razorpay_order_id });
    });
    rzp.open();
  }

  async function simulate(outcome: "success" | "failure") {
    if (!sim) return;
    setBusy(true);
    const r = await postJSON<{ token: string }>("/api/payments/simulate", { order_id: sim.order.id, outcome });
    setBusy(false);
    setSim(null);
    if (r.ok) finish(r.data.token);
    else setFormError(r.error.message);
  }

  if (!hydrated) return <div className="h-96 animate-pulse rounded-[24px] bg-paper" />;
  if (!lines.length)
    return (
      <div className="py-20 text-center">
        <p className="font-display text-4xl italic">Your order is empty.</p>
        <Link href="/menu" className="btn btn-dark mt-8">Browse the menu</Link>
      </div>
    );

  return (
    <>
      <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-14 lg:grid-cols-12">
        <div className="grid content-start gap-10 lg:col-span-7">
          <section aria-labelledby="how">
            <h2 id="how" className="text-3xl">How would you like it?</h2>
            <div className="mt-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Fulfilment">
              {(["pickup", "delivery"] as const).map((m) => {
                const disabled = m === "delivery" && !deliveryEnabled;
                return (
                  <button
                    key={m} type="button" role="radio" aria-checked={fulfilment === m} disabled={disabled} onClick={() => setFulfilment(m)}
                    className={clsx("rounded-[18px] border p-5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50", fulfilment === m ? "border-espresso bg-paper" : "border-oat")}
                  >
                    <span className="font-display text-2xl">{m === "pickup" ? "Pickup" : "Delivery"}</span>
                    <span className="mt-1 block text-xs text-muted">{m === "pickup" ? "Collect from the café" : disabled ? "Not available online yet" : "To your address"}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="you" className="grid gap-5">
            <h2 id="you" className="text-3xl">Your details</h2>
            <Field label="Name" name="customer_name" error={errors.customer_name}><TextInput name="customer_name" autoComplete="name" required error={errors.customer_name} /></Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Mobile number" name="customer_phone" error={errors.customer_phone} hint="For order updates."><TextInput name="customer_phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" required error={errors.customer_phone} /></Field>
              <Field label="Email (optional)" name="customer_email" error={errors.customer_email} hint="For your receipt."><TextInput name="customer_email" type="email" autoComplete="email" error={errors.customer_email} /></Field>
            </div>
            <AnimatePresence initial={false}>
              {fulfilment === "delivery" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid gap-5 overflow-hidden">
                  <Field label="Delivery address" name="address" error={errors.address}><TextArea name="address" autoComplete="street-address" rows={3} required error={errors.address} /></Field>
                  <Field label="Landmark (optional)" name="landmark" error={errors.landmark}><TextInput name="landmark" error={errors.landmark} /></Field>
                </motion.div>
              )}
            </AnimatePresence>
            <Field label="Order instructions (optional)" name="notes" error={errors.notes}>
              <TextArea name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} placeholder="Less sugar, no onions…" />
            </Field>
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-[24px] border border-oat bg-paper p-6 md:p-8 lg:sticky lg:top-28">
            <h2 className="text-3xl">Summary</h2>
            <ul className="mt-6 divide-y divide-oat">
              {lines.map((l) => (
                <li key={l.key} className="flex items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl leading-tight">{l.name}</p>
                    {l.selection_labels.length > 0 && <p className="text-xs text-muted">{l.selection_labels.join(" · ")}</p>}
                  </div>
                  <QtyStepper value={l.quantity} onChange={(q) => setQty(l.key, q)} label={l.name} />
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <label htmlFor="coupon" className="sr-only">Promo code</label>
              <input id="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Promo code" className="input min-h-[44px] flex-1 uppercase" aria-invalid={errors.coupon ? true : undefined} />
              <button type="button" className="btn btn-outline min-h-[44px] px-4" onClick={() => { setErrors((e) => ({ ...e, coupon: "" })); quote(coupon.trim() || null); }}>Apply</button>
            </div>
            {errors.coupon && <p className="field-error mt-2">{errors.coupon}</p>}
            {appliedCoupon && <p className="mt-2 text-xs text-success">Code {appliedCoupon} applied.</p>}

            <dl className="mt-6 space-y-2 border-t border-oat pt-5 text-sm" aria-live="polite">
              {quoteError ? (
                <p className="field-error">{quoteError}</p>
              ) : totals ? (
                <>
                  <Row k="Subtotal" v={formatINR(totals.subtotal)} />
                  {totals.discount > 0 && <Row k="Discount" v={`−${formatINR(totals.discount)}`} />}
                  <Row k={taxNote} v={formatINR(totals.tax)} />
                  {fulfilment === "delivery" && <Row k="Delivery" v={totals.delivery_fee ? formatINR(totals.delivery_fee) : "Free"} />}
                  <div className="flex items-baseline justify-between border-t border-oat pt-4"><dt className="font-semibold">Total</dt><dd className="font-display text-3xl tabular-nums" data-testid="total">{formatINR(totals.total)}</dd></div>
                </>
              ) : (
                <div className="h-24 animate-pulse bg-oat/60" />
              )}
            </dl>
            {formError && <p className="field-error mt-4" role="alert">{formError}</p>}
            <button className="btn btn-primary mt-6 w-full" disabled={busy || !totals}>{busy ? "Processing…" : totals ? `Pay ${formatINR(totals.total)}` : "Pay"}</button>
            <p className="mt-3 text-center text-xs text-muted">Secure payment by Razorpay · UPI, cards, net banking, wallets</p>
            <p className="mt-2 text-center text-xs text-muted">Questions? Call <a className="underline" href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></p>
          </div>
        </aside>
      </form>

      <AnimatePresence>
        {sim && (
          <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-espresso/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div role="dialog" aria-modal="true" aria-labelledby="sim-title" className="w-full max-w-sm bg-ivory p-8 text-center shadow-drawer">
              <p className="eyebrow text-terracotta-ink">Preview mode</p>
              <h3 id="sim-title" className="mt-3 text-3xl">Test payment</h3>
              <p className="mt-3 text-sm text-muted">Razorpay keys aren&apos;t configured, so this simulates the payment step. Nothing is charged.</p>
              <p className="mt-5 font-display text-4xl">{formatINR(sim.payment.amount)}</p>
              <div className="mt-6 grid gap-2">
                <button className="btn btn-primary" disabled={busy} onClick={() => simulate("success")}>Simulate success</button>
                <button className="btn btn-outline" disabled={busy} onClick={() => simulate("failure")}>Simulate failure</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}
