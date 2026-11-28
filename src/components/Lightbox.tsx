"use client";
import { AnimatePresence, motion } from "motion/react";
import { SafeImage } from "@/components/ui/SafeImage";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Photo } from "@/components/ui/Photo";
import type { GalleryImage } from "@/lib/types";

/** Accessible lightbox: Esc closes, arrows navigate, focus moves into the dialog and back. */
export function Lightbox({ images, index, onChange }: { images: GalleryImage[]; index: number | null; onChange: (i: number | null) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const go = useCallback((d: number) => onChange(index == null ? index : (index + d + images.length) % images.length), [index, images.length, onChange]);

  useEffect(() => {
    if (index == null) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      opener?.focus?.();
    };
  }, [index, go, onChange]);

  const current = index != null ? images[index] : null;
  return (
    <AnimatePresence>
      {current && (
        <motion.div role="dialog" aria-modal="true" aria-label={current.caption ?? current.alt} className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => onChange(null)}>
          <button ref={closeRef} className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full text-ivory hover:bg-ivory/10" aria-label="Close"><X /></button>
          <button className="absolute left-2 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full text-ivory hover:bg-ivory/10 md:left-6" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); go(-1); }}><ChevronLeft /></button>
          <button className="absolute right-2 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full text-ivory hover:bg-ivory/10 md:right-6" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); go(1); }}><ChevronRight /></button>
          <motion.figure key={current.id} initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative mx-auto max-h-[78vh] overflow-hidden rounded-[16px]" style={{ aspectRatio: `${current.width}/${current.height}`, maxWidth: `calc(78vh * ${current.width / current.height})` }}>
              {current.url ? <SafeImage src={current.url} alt={current.alt} fill sizes="90vw" className="object-contain" fallback={<Photo alt={current.alt} tone={current.category} className="h-full w-full" />} /> : <Photo alt={current.alt} tone={current.category} className="h-full w-full" />}
            </div>
            <figcaption className="mt-4 flex items-center justify-center gap-3 text-sm text-ivory/80">
              <span className="font-display text-lg italic text-ivory">{current.caption ?? current.alt}</span>
              <span className="tabular-nums text-ivory/50">{(index ?? 0) + 1} / {images.length}</span>
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
