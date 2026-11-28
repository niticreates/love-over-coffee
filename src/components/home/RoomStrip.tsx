"use client";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import type { Media } from "@/lib/media";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Three matching arched frames, aligned on all sides. Each frame unveils upward in turn
 * as the row scrolls into view, then the photographs drift gently inside their frames
 * (the frames themselves never move, so the row stays aligned). Off under reduced motion.
 * The outline arch sits an even distance outside the photo on every side and inside the
 * card's own box, so all three cards have the same size and nothing spills into the gaps.
 */
export function RoomStrip({ frames }: { frames: { media: Media; caption: string }[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  return (
    <ul ref={ref} className="grid gap-x-6 gap-y-12 sm:grid-cols-3 lg:gap-x-10">
      {frames.map((f, i) => (
        <Frame key={f.media.src} f={f} i={i} drift={drift} reduce={!!reduce} />
      ))}
    </ul>
  );
}

function Frame({ f, i, drift, reduce }: { f: { media: Media; caption: string }; i: number; drift: MotionValue<string>; reduce: boolean }) {
  const delay = i * 0.15;
  const view = { once: true, margin: "0px 0px -12% 0px" } as const;
  return (
    <li className="group">
      <motion.figure
        initial={reduce ? undefined : "hidden"}
        whileInView={reduce ? undefined : "show"}
        viewport={view}
        variants={{ hidden: { opacity: 0, y: 60 }, show: { opacity: 1, y: 0, transition: { duration: 1.1, delay, ease: EASE } } }}
      >
        <div className="relative p-2.5 sm:p-3">
          {/* outline arch: an even margin around the photo (its radius = photo radius + padding); fades in, then opens out a touch on hover */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-b-[38px] rounded-t-[999px] border-[1.5px] border-turquoise-deep/35 transition-[scale,border-color] duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.02] group-hover:border-turquoise-deep/60 sm:rounded-b-[40px]"
            variants={{ hidden: { opacity: 0, scale: 0.96 }, show: { opacity: 1, scale: 1, transition: { duration: 1, delay: delay + 0.6, ease: EASE } } }}
          />
          <motion.div
            className="relative aspect-[3/4] overflow-hidden rounded-b-[28px] rounded-t-[999px] bg-navy shadow-[0_30px_60px_-30px_rgb(14_31_61/.45)]"
            variants={{ hidden: { clipPath: "inset(100% 0% 0% 0%)" }, show: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 1.3, delay: delay + 0.1, ease: EASE } } }}
          >
            <motion.div
              className="absolute inset-[-8%_0]"
              style={reduce ? undefined : { y: drift }}
              variants={{ hidden: { scale: 1.25 }, show: { scale: 1, transition: { duration: 1.8, delay: delay + 0.1, ease: EASE } } }}
            >
              <Image
                src={f.media.src}
                alt={f.media.alt}
                fill
                sizes="(min-width:640px) 30vw, 90vw"
                className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"
                style={{ objectPosition: f.media.position }}
              />
            </motion.div>
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/45 to-transparent" />
            <span className="absolute bottom-5 left-5 grid h-11 w-11 place-items-center rounded-full bg-ivory font-display text-base italic text-turquoise-deep shadow-[0_8px_20px_-8px_rgb(14_31_61/.5)] transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110">
              {String(i + 1).padStart(2, "0")}
            </span>
          </motion.div>
        </div>
        <figcaption className="mt-7 text-center">
          <span className="font-display text-xl text-ink md:text-2xl">{f.caption}</span>
        </figcaption>
      </motion.figure>
    </li>
  );
}
