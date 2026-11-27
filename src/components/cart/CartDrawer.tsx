"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatINR } from "@/lib/money";
import { useCart } from "./CartProvider";
import { QtyStepper } from "./QtyStepper";

export function CartDrawer({ orderingEnabled }: { orderingEnabled: boolean }) {
  const { lines, open, setOpen, setQty, subtotal, notes, setNotes, count } = useCart();
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div className="absolute inset-0 bg-espresso/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.aside
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Your order"
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory shadow-drawer outline-none"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-oat px-6 py-5">
              <h2 className="text-3xl">Your order <span className="font-sans text-sm text-muted">({count})</span></h2>
              <button onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center hover:bg-oat" aria-label="Close cart"><X size={20} /></button>
            </div>
            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
                <p className="font-display text-3xl italic">Nothing here yet.</p>
                <p className="text-muted">Start with a coffee — everything else follows.</p>
                <Link href="/menu" onClick={() => setOpen(false)} className="btn btn-dark">Browse the menu</Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-oat overflow-y-auto px-6">
                  {lines.map((l) => (
                    <li key={l.key} className="flex gap-4 py-5">
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-xl leading-tight">{l.name}</p>
                        {l.selection_labels.length > 0 && <p className="mt-1 text-xs text-muted">{l.selection_labels.join(" · ")}</p>}
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <QtyStepper value={l.quantity} onChange={(q) => setQty(l.key, q)} label={l.name} />
                          <span className="text-sm font-semibold tabular-nums">{formatINR(l.unit_price * l.quantity)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-oat bg-paper px-6 py-5">
                  <label htmlFor="cart-notes" className="eyebrow text-walnut">Order notes</label>
                  <textarea id="cart-notes" value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Less ice, extra napkins…" className="input mt-2 min-h-0 resize-none text-sm" />
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-sm text-muted">Subtotal</span>
                    <span className="font-display text-2xl tabular-nums">{formatINR(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">Taxes and any delivery charge are calculated at checkout.</p>
                  {orderingEnabled ? (
                    <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-primary mt-4 w-full">Checkout</Link>
                  ) : (
                    <p className="mt-4 text-sm text-walnut">Online ordering opens soon. Please call to order.</p>
                  )}
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
