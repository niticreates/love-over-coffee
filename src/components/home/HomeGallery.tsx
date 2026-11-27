"use client";
import Image from "next/image";
import { useState } from "react";
import { Lightbox } from "@/components/Lightbox";
import type { GalleryImage } from "@/lib/types";

/** Asymmetric six-frame mosaic that opens the shared lightbox. */
const SPANS = [
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-2",
  "col-span-1 row-span-1",
  "col-span-2 row-span-1",
  "col-span-2 row-span-1",
];

export function HomeGallery({ images }: { images: GalleryImage[] }) {
  const list = images.filter((g) => g.url).slice(0, 6);
  const [open, setOpen] = useState<number | null>(null);
  if (!list.length) return null;
  return (
    <>
      <div className="grid grid-flow-dense auto-rows-[38vw] grid-cols-2 gap-3 sm:auto-rows-[26vw] md:auto-rows-[18vw] md:grid-cols-4 md:gap-4 2xl:auto-rows-[260px]">
        {list.map((g, i) => (
          <button key={g.id} type="button" onClick={() => setOpen(i)} aria-label={`Open photo: ${g.caption ?? g.alt}`} className={`group relative overflow-hidden rounded-[20px] bg-oat ${SPANS[i]}`}>
            <Image src={g.url!} alt={g.alt} fill sizes="(min-width:768px) 40vw, 50vw" className="object-cover transition-transform duration-[1000ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]" />
            <span className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/25" />
            <span className="absolute bottom-3 left-3 translate-y-2 rounded-full bg-ivory px-3 py-1.5 text-xs font-semibold text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
              {g.caption ?? g.alt}
            </span>
          </button>
        ))}
      </div>
      <Lightbox images={list} index={open} onChange={setOpen} />
    </>
  );
}
