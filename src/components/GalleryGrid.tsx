"use client";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Photo } from "@/components/ui/Photo";
import type { GalleryImage } from "@/lib/types";

const CATS = [
  ["all", "All"], ["interiors", "Café Interiors"], ["beverages", "Coffee & Beverages"], ["food", "Food"], ["desserts", "Desserts"], ["experiences", "Experiences"],
] as const;

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [cat, setCat] = useState<(typeof CATS)[number][0]>("all");
  const [open, setOpen] = useState<number | null>(null);
  const list = images.filter((g) => cat === "all" || g.category === cat);
  const go = useCallback((d: number) => setOpen((i) => (i == null ? i : (i + d + list.length) % list.length)), [list.length]);

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, go]);

  const current = open != null ? list[open] : null;
  return (
    <>
      <div className="-mx-[var(--spacing-gutter)] flex gap-2 overflow-x-auto px-[var(--spacing-gutter)]" role="toolbar" aria-label="Gallery categories">
        {CATS.map(([id, label]) => (
          <button key={id} aria-pressed={cat === id} onClick={() => setCat(id)} className={clsx("shrink-0 whitespace-nowrap border px-4 py-2 text-[13px]", cat === id ? "border-espresso bg-espresso text-ivory" : "border-oat")}>{label}</button>
        ))}
      </div>
      <div className="mt-10 columns-2 gap-3 md:columns-3 md:gap-5 [&>*]:mb-3 md:[&>*]:mb-5">
        {list.map((g, i) => (
          <motion.button
            key={g.id} layout onClick={() => setOpen(i)} className="block w-full break-inside-avoid text-left"
            aria-label={`Open ${g.alt}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
          >
            <Photo src={g.url} alt={g.alt} label={g.caption ?? g.alt} tone={g.category} className="w-full" style={{ aspectRatio: `${g.width} / ${g.height}` }} sizes="(min-width:768px) 33vw, 50vw" />
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {current && (
          <motion.div role="dialog" aria-modal="true" aria-label={current.alt} className="fixed inset-0 z-[80] flex items-center justify-center bg-espresso/95 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <button className="absolute right-4 top-4 grid h-12 w-12 place-items-center text-ivory" aria-label="Close"><X /></button>
            <button className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center text-ivory" aria-label="Previous" onClick={(e) => { e.stopPropagation(); go(-1); }}><ChevronLeft /></button>
            <button className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center text-ivory" aria-label="Next" onClick={(e) => { e.stopPropagation(); go(1); }}><ChevronRight /></button>
            <motion.figure key={current.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <div className="relative mx-auto max-h-[80vh]" style={{ aspectRatio: `${current.width}/${current.height}`, maxWidth: `calc(80vh * ${current.width / current.height})` }}>
                {current.url ? <Image src={current.url} alt={current.alt} fill sizes="90vw" className="object-contain" unoptimized={current.url.startsWith("data:")} /> : <Photo alt={current.alt} tone={current.category} className="h-full w-full" />}
              </div>
              <figcaption className="mt-4 text-center text-sm text-ivory/80">{current.caption ?? current.alt}</figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
