"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartLine {
  key: string; // product + selections signature
  product_id: string;
  slug: string;
  name: string;
  unit_price: number; // display only — server reprices
  quantity: number;
  selections: { customization_id: string; option_ids: string[] }[];
  selection_labels: string[];
  image_url: string | null;
}

interface CartCtx {
  lines: CartLine[];
  count: number;
  subtotal: number;
  notes: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (l: Omit<CartLine, "key" | "quantity">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setNotes: (n: string) => void;
  hydrated: boolean;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "loc_cart_v1";

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (Array.isArray(v.lines)) setLines(v.lines.slice(0, 50));
        if (typeof v.notes === "string") setNotes(v.notes.slice(0, 500));
      }
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ lines, notes, at: Date.now() }));
    } catch {}
  }, [lines, notes, hydrated]);

  const add = useCallback<CartCtx["add"]>((l, qty = 1) => {
    const key = `${l.product_id}|${l.selections.map((s) => `${s.customization_id}:${[...s.option_ids].sort().join(",")}`).sort().join(";")}`;
    setLines((prev) => {
      const i = prev.findIndex((x) => x.key === key);
      if (i >= 0) return prev.map((x, j) => (j === i ? { ...x, quantity: Math.min(20, x.quantity + qty) } : x));
      return [...prev, { ...l, key, quantity: Math.min(20, qty) }];
    });
  }, []);
  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) => (qty <= 0 ? prev.filter((x) => x.key !== key) : prev.map((x) => (x.key === key ? { ...x, quantity: Math.min(20, qty) } : x))));
  }, []);
  const remove = useCallback((key: string) => setLines((p) => p.filter((x) => x.key !== key)), []);
  const clear = useCallback(() => {
    setLines([]);
    setNotes("");
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      lines, notes, open, setOpen, add, setQty, remove, clear, setNotes, hydrated,
      count: lines.reduce((a, l) => a + l.quantity, 0),
      subtotal: lines.reduce((a, l) => a + l.quantity * l.unit_price, 0),
    }),
    [lines, notes, open, add, setQty, remove, clear, hydrated],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
