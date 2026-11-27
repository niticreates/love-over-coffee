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

  // Sit the sticky filter bar just under the fixed header, whatever its current height.
  const [navH, setNavH] = useState(84);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("body header");
    if (!header) return;
    const ro = new ResizeObserver(() => setNavH(Math.round(header.getBoundingClientRect().height)));
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

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
      <div ref={barRef} className="sticky z-30 py-3 transition-[top] duration-500" style={{ top: navH }}>
        <div className="flex flex-col gap-2 rounded-[26px] border border-turquoise/25 bg-paper/95 p-2 shadow-[0_18px_40px_-28px_rgb(14_31_61/.45)] backdrop-blur-md md:flex-row md:items-center md:rounded-full">
          <label className="group relative block shrink-0 md:w-56 lg:w-64">
            <span className="sr-only">Search the menu</span>
            <Search size={15} strokeWidth={2.4} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-turquoise-deep" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              className="h-10 w-full rounded-full border border-transparent bg-turquoise-soft pl-10 pr-9 text-sm text-ink placeholder:text-turquoise-deep/70 transition-[border-color,box-shadow,background-color] focus:border-turquoise-deep focus:bg-paper focus:shadow-[0_0_0_3px_rgb(34_184_222/.22)] focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-ink text-ivory" aria-label="Clear search">
                <X size={12} strokeWidth={2.6} />
              </button>
            )}
          </label>
          <span aria-hidden className="hidden h-6 w-px shrink-0 bg-turquoise/30 md:block" />
          <div className="relative min-w-0 flex-1">
            <div
              className="no-scrollbar isolate flex gap-1 overflow-x-auto scroll-smooth pr-8 [mask-image:linear-gradient(to_right,#000_calc(100%-3rem),transparent)]"
              role="toolbar"
              aria-label="Filter by category"
            >
              {[{ id: "all", name: "All", slug: "" }, ...categories.filter((c) => counts[c.id])].map((c) => {
                const on = active === c.id;
                const n = c.id === "all" ? products.length : counts[c.id];
                return (
                  <button
                    key={c.id}
                    aria-pressed={on}
                    onClick={(e) => {
                      setActive(c.id);
                      history.replaceState(null, "", c.slug ? `#${c.slug}` : location.pathname);
                      e.currentTarget.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "center" });
                    }}
                    className={clsx(
                      "relative flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition-colors",
                      on ? "text-ink" : "text-ink/65 hover:bg-turquoise-soft hover:text-ink",
                    )}
                  >
                    {on && <motion.span layoutId="menu-chip" className="absolute inset-0 -z-10 rounded-full bg-turquoise shadow-[0_6px_16px_-8px_rgb(10_111_140/.8)]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                    <span className="relative">{c.name}</span>
                    <span className={clsx("relative font-display text-[11px] italic", on ? "text-ink/70" : "text-pink")}>{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {anyVegKnown && (
            <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3 text-sm text-ink">
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
