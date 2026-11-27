"use client";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import type { Media } from "@/lib/media";

/** Three portrait frames drifting at different speeds — a gentle depth effect, off under reduced motion. */
export function RoomStrip({ frames }: { frames: { media: Media; caption: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const speeds = [useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]), useTransform(scrollYProgress, [0, 1], ["-4%", "10%"]), useTransform(scrollYProgress, [0, 1], ["14%", "-12%"])];
  return (
    <div ref={ref} className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
      {frames.map((f, i) => (
        <motion.figure key={f.media.src} style={reduce ? undefined : { y: speeds[i % 3] }} className={i === 1 ? "md:mt-24" : i === 2 ? "col-span-2 md:col-span-1 md:mt-8" : ""}>
          <div className={`relative overflow-hidden rounded-[20px] ${i === 2 ? "aspect-[4/3] md:aspect-[3/4]" : "aspect-[3/4]"} ${i === 0 ? "rounded-t-[999px]" : ""}`}>
            <Image src={f.media.src} alt={f.media.alt} fill sizes="(min-width:768px) 30vw, 50vw" className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] hover:scale-[1.04]" style={{ objectPosition: f.media.position }} />
          </div>
          <figcaption className="mt-3 text-sm text-ivory/70"><span className="mr-2 font-display italic text-turquoise">{String(i + 1).padStart(2, "0")}</span>{f.caption}</figcaption>
        </motion.figure>
      ))}
    </div>
  );
}
