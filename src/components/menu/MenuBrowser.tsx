"use client";
import clsx from "clsx";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { CATEGORY_MEDIA } from "@/lib/media";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "@/lib/types";
import { ProductRow } from "./ProductRow";
import type { PublicProduct } from "./AddToCart";

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, "");

export function MenuBrowser({ categories, products, orderingEnabled, sample }: { categories: Category[]; products: PublicProduct[]; orderingEnabled: boolean; sample: boolean }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");
  const [vegOnly, setVegOnly] = useState(false);
  const q = useDeferredValue(query);
  const anyVegKnown = products.some((p) => p.is_veg != null);
  const barRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const hash = decodeURIComponent(location.hash.slice(1));
    const c = categories.find((x) => x.slug === hash);
    if (c) setActive(c.id);
  }, [categories]);

  const filtered = useMemo(() => {
    const nq = norm(q.trim());
    return products.filter((p) =>
      (active === "all" || p.category_id === active) &&
      (!vegOnly || p.is_veg === true) &&
      (!nq || norm(`${p.name} ${p.description ?? ""}`).includes(nq)),
    );
  }, [products, active, vegOnly, q]);

  const groups = categories.map((c) => ({ c, items: filtered.filter((p) => p.category_id === c.id) })).filter((g) => g.items.length);
  const counts = Object.fromEntries(categories.map((c) => [c.id, products.filter((p) => p.category_id === c.id).length]));

  return (
    <div>
      <div ref={barRef} className="sticky top-[68px] z-30 -mx-[var(--spacing-gutter)] border-b border-oat bg-ivory/95 px-[var(--spacing-gutter)] py-4 backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <label className="relative block lg:w-80">
            <span className="sr-only">Search the menu</span>
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search coffee, pasta, frappe…" className="input rounded-full pl-11 pr-10" />
            {query && <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center" aria-label="Clear search"><X size={14} /></button>}
          </label>
          <div className="isolate -mx-[var(--spacing-gutter)] flex gap-2 overflow-x-auto px-[var(--spacing-gutter)] lg:mx-0 lg:flex-1 lg:px-0" role="toolbar" aria-label="Filter by category">
            {[{ id: "all", name: "All", slug: "" }, ...categories.filter((c) => counts[c.id])].map((c) => (
              <button
                key={c.id}
                aria-pressed={active === c.id}
                onClick={() => {
                  setActive(c.id);
                  history.replaceState(null, "", c.slug ? `#${c.slug}` : location.pathname);
                }}
                className={clsx("relative shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition-colors", active === c.id ? "border-ink text-ivory" : "border-oat hover:border-ink")}
              >
                {active === c.id && <motion.span layoutId="menu-chip" className="absolute inset-0 -z-10 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                <span className="relative">{c.name}</span>
              </button>
            ))}
          </div>
          {anyVegKnown && (
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} className="accent-[var(--color-veg)]" /> Veg only
            </label>
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{filtered.length} items shown</p>
      {groups.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-3xl italic">Nothing matches “{query}”.</p>
          <button className="btn btn-outline mt-6" onClick={() => { setQuery(""); setActive("all"); setVegOnly(false); }}>Clear filters</button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout" initial={false}>
          {groups.map(({ c, items }, gi) => {
            const media = CATEGORY_MEDIA[c.id];
            return (
              <motion.section
                key={c.id} id={c.slug} layout={!reduce} className="scroll-mt-40 border-b border-oat py-14 first:pt-10 last:border-0" aria-labelledby={`h-${c.slug}`}
                initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
                  <div className="lg:col-span-4">
                    <div className="lg:sticky lg:top-48">
                      <p className="font-display text-sm italic text-pink">{String(gi + 1).padStart(2, "0")}</p>
                      <h2 id={`h-${c.slug}`} className="mt-1 text-[clamp(2.4rem,1.6rem+2.6vw,3.6rem)]">{c.name}</h2>
                      <p className="eyebrow mt-3 text-muted">{items.length} {items.length === 1 ? "item" : "items"}</p>
                      {media && (
                        <div className="relative mt-6 hidden aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[22px] lg:block">
                          <Image src={media.src} alt={media.alt} fill sizes="30vw" className="object-cover" style={{ objectPosition: media.position }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <ul className="grid gap-x-10 sm:grid-cols-2 lg:col-span-8">
                    {items.map((p) => <ProductRow key={p.id} product={p} orderingEnabled={orderingEnabled} sample={sample} />)}
                  </ul>
                </div>
              </motion.section>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
