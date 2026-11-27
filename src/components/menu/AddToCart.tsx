"use client";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { Check, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { QtyStepper } from "@/components/cart/QtyStepper";
import { useToast } from "@/components/ui/Toast";
import { formatINR } from "@/lib/money";
import type { Product } from "@/lib/types";

export type PublicProduct = Pick<Product, "id" | "slug" | "name" | "description" | "price" | "is_available" | "customizations" | "image_url" | "is_veg" | "category_id">;

export function canOrder(p: PublicProduct, orderingEnabled: boolean) {
  return orderingEnabled && p.is_available && p.price != null;
}

export function AddToCart({ product, orderingEnabled, variant = "compact", className }: { product: PublicProduct; orderingEnabled: boolean; variant?: "compact" | "full"; className?: string }) {
  const { add, setOpen } = useCart();
  const toast = useToast();
  const [dialog, setDialog] = useState(false);
  const [done, setDone] = useState(false);

  const ok = canOrder(product, orderingEnabled);
  const reason = !product.is_available ? "Unavailable today" : product.price == null ? "Ordering soon" : !orderingEnabled ? "Ordering opens soon" : "";

  const addSimple = () => {
    add({ product_id: product.id, slug: product.slug, name: product.name, unit_price: product.price!, selections: [], selection_labels: [], image_url: product.image_url });
    setDone(true);
    toast(`${product.name} added to your order`);
    setTimeout(() => setDone(false), 1400);
  };

  if (!ok)
    return (
      <span className={clsx("eyebrow inline-flex min-h-[40px] items-center text-muted", className)} aria-label={`${product.name}: ${reason}`}>
        {reason}
      </span>
    );

  return (
    <>
      <button
        type="button"
        onClick={() => (product.customizations.length ? setDialog(true) : addSimple())}
        className={clsx(variant === "full" ? "btn btn-primary" : "btn btn-outline min-h-[40px] px-4", className)}
        aria-label={`Add ${product.name} to order`}
      >
        {done ? <Check size={14} /> : <Plus size={14} />} {done ? "Added" : "Add"}
      </button>
      <CustomizeDialog
        open={dialog}
        product={product}
        onClose={() => setDialog(false)}
        onAdd={(sel, labels, unit, qty) => {
          add({ product_id: product.id, slug: product.slug, name: product.name, unit_price: unit, selections: sel, selection_labels: labels, image_url: product.image_url }, qty);
          setDialog(false);
          toast(`${product.name} added`);
          setOpen(false);
        }}
      />
    </>
  );
}

function CustomizeDialog({ open, product, onClose, onAdd }: {
  open: boolean; product: PublicProduct; onClose: () => void;
  onAdd: (sel: { customization_id: string; option_ids: string[] }[], labels: string[], unit: number, qty: number) => void;
}) {
  const [choice, setChoice] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  useEffect(() => {
    if (open) {
      setQty(1);
      setChoice(Object.fromEntries(product.customizations.map((c) => [c.id, c.required && c.max_select === 1 ? [c.options[0].id] : []])));
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [open, product, onClose]);

  const unit = (product.price ?? 0) + product.customizations.flatMap((c) => c.options.filter((o) => choice[c.id]?.includes(o.id)).map((o) => o.price_delta)).reduce((a, b) => a + b, 0);
  const missing = product.customizations.some((c) => c.required && !(choice[c.id]?.length));

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center">
          <motion.div className="absolute inset-0 bg-espresso/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog" aria-modal="true" aria-labelledby={`cz-${product.id}`}
            className="relative w-full max-w-md bg-ivory p-6 shadow-drawer sm:p-8"
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <button onClick={onClose} className="absolute right-3 top-3 grid h-11 w-11 place-items-center" aria-label="Close"><X size={18} /></button>
            <h3 id={`cz-${product.id}`} className="pr-10 text-3xl">{product.name}</h3>
            {product.customizations.map((c) => (
              <fieldset key={c.id} className="mt-6">
                <legend className="eyebrow text-walnut">{c.name}{c.required ? "" : " · optional"}</legend>
                <div className="mt-3 grid gap-2">
                  {c.options.map((o) => {
                    const selected = choice[c.id]?.includes(o.id) ?? false;
                    return (
                      <label key={o.id} className={clsx("flex min-h-[48px] cursor-pointer items-center justify-between border px-4 text-sm transition-colors", selected ? "border-espresso bg-paper" : "border-oat")}>
                        <span className="flex items-center gap-3">
                          <input
                            type={c.max_select === 1 ? "radio" : "checkbox"} name={c.id} checked={selected} className="accent-terracotta"
                            onChange={() => setChoice((prev) => {
                              const cur = prev[c.id] ?? [];
                              if (c.max_select === 1) return { ...prev, [c.id]: [o.id] };
                              return { ...prev, [c.id]: cur.includes(o.id) ? cur.filter((x) => x !== o.id) : cur.length < c.max_select ? [...cur, o.id] : cur };
                            })}
                          />
                          {o.label}
                        </span>
                        {o.price_delta !== 0 && <span className="text-muted">+{formatINR(o.price_delta)}</span>}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
            <div className="mt-8 flex items-center justify-between gap-4">
              <QtyStepper value={qty} onChange={setQty} min={1} label={product.name} />
              <button
                className="btn btn-primary flex-1" disabled={missing}
                onClick={() => onAdd(
                  product.customizations.map((c) => ({ customization_id: c.id, option_ids: choice[c.id] ?? [] })).filter((s) => s.option_ids.length),
                  product.customizations.flatMap((c) => c.options.filter((o) => choice[c.id]?.includes(o.id)).map((o) => o.label)),
                  unit, qty,
                )}
              >
                Add · {formatINR(unit * qty)}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
