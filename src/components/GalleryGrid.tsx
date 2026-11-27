"use client";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Lightbox } from "@/components/Lightbox";
import { Photo } from "@/components/ui/Photo";
import type { GalleryImage } from "@/lib/types";

const CATS = [
  ["all", "All"], ["interiors", "Interiors"], ["beverages", "Coffee & drinks"], ["food", "Food"], ["desserts", "Desserts"], ["experiences", "Moments"],
] as const;

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [cat, setCat] = useState<(typeof CATS)[number][0]>("all");
  const [open, setOpen] = useState<number | null>(null);
  const cats = CATS.filter(([id]) => id === "all" || images.some((g) => g.category === id));
  const list = images.filter((g) => cat === "all" || g.category === cat);
  return (
    <>
      <div className="-mx-[var(--spacing-gutter)] flex gap-2 overflow-x-auto px-[var(--spacing-gutter)] pb-1" role="toolbar" aria-label="Gallery categories">
        {cats.map(([id, label]) => (
          <button key={id} aria-pressed={cat === id} onClick={() => setCat(id)} className={clsx("shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition-colors", cat === id ? "border-ink bg-ink text-ivory" : "border-oat hover:border-ink")}>{label}</button>
        ))}
      </div>
      <motion.div layout className="mt-10 columns-2 gap-3 md:columns-3 md:gap-5 [&>*]:mb-3 md:[&>*]:mb-5">
        <AnimatePresence mode="popLayout">
          {list.map((g, i) => (
            <motion.button
              key={g.id} layout onClick={() => setOpen(i)} className="group relative block w-full break-inside-avoid overflow-hidden rounded-[20px] text-left"
              aria-label={`Open photo: ${g.caption ?? g.alt}`}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]">
                <Photo src={g.url} alt={g.alt} label={g.caption ?? g.alt} tone={g.category} className="w-full" style={{ aspectRatio: `${g.width} / ${g.height}` }} sizes="(min-width:768px) 33vw, 50vw" />
              </div>
              {g.url && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink/70 to-transparent p-4 pt-10 font-display text-lg italic text-ivory opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  {g.caption ?? g.alt}
                </span>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>
      <Lightbox images={list} index={open} onChange={setOpen} />
    </>
  );
}
