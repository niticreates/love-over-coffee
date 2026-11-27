"use client";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Scroll progress in the brand's own shape.
 * - A hairline turquoise-to-pink bar across the top of the viewport.
 * - On larger screens, the cup mascot in the corner fills with turquoise "coffee" as you read;
 *   it smiles when you reach the end, and clicking it takes you back to the top.
 * Hidden on checkout and admin. Under reduced motion the fill still tracks scroll, without the wave.
 */
export function ScrollCup() {
  const path = usePathname();
  const reduce = useReducedMotion();
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(false);
  const [pct, setPct] = useState(0);
  useMotionValueEvent(scrollY, "change", (v) => setShown(v > 480));
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setDone(v > 0.985);
    setPct(Math.round(v * 100));
  });
  // Liquid inside the cup body: y from bottom (108) up to the rim of the face panel (52).
  const level = useTransform(progress, [0, 1], [108, 52]);

  if (path?.startsWith("/checkout") || path?.startsWith("/admin")) return null;

  return (
    <>
      <motion.div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-turquoise via-turquoise to-pink" style={{ scaleX: progress }} />
      <AnimatePresence>
        {shown && (
          <motion.button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
            aria-label={`Back to top (${pct}% of the page read)`}
            className="group fixed bottom-8 right-[7.25rem] z-[44] hidden h-14 w-14 place-items-center rounded-full bg-ivory/90 shadow-[0_10px_30px_-10px_rgb(14_31_61/.35)] ring-1 ring-ink/10 backdrop-blur-md md:grid"
            initial={{ opacity: 0, y: 24, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg viewBox="0 0 100 124" className="h-9 w-auto overflow-visible" aria-hidden>
              <defs>
                <clipPath id="cup-inside"><path d="M26 52 H74 L69.5 104 Q69 108 65 108 H35 Q31 108 30.5 104 Z" /></clipPath>
              </defs>
              <g strokeLinejoin="round" strokeLinecap="round" className="transition-transform duration-500 group-hover:-rotate-6" style={{ transformOrigin: "50% 100%" }}>
                <path d="M58 22 L64 4 L71 6" fill="none" stroke="#0e1f3d" strokeWidth="5" />
                <path d="M22 34 C24 18 38 14 50 14 C62 14 76 18 78 34 Z" fill="#fff" stroke="#0e1f3d" strokeWidth="5" />
                <rect x="11" y="32" width="78" height="12" rx="6" fill="#fff" stroke="#0e1f3d" strokeWidth="5" />
                <path d="M17 44 H83 L76 112 Q75.4 118 69 118 H31 Q24.6 118 24 112 Z" fill="#fff" stroke="#0e1f3d" strokeWidth="5" />
                <g clipPath="url(#cup-inside)">
                  <rect x="20" y="40" width="60" height="80" fill="#d3eff7" />
                  <motion.g style={{ y: level }}>
                    <motion.path
                      d="M-40 0 Q-30 -5 -20 0 T0 0 T20 0 T40 0 T60 0 T80 0 T100 0 T120 0 T140 0 V80 H-40 Z"
                      fill="#22b8de"
                      animate={reduce ? undefined : { x: [0, 40] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.g>
                </g>
                <circle cx="40" cy="70" r="3.8" fill="#0e1f3d" />
                <circle cx="60" cy="70" r="3.8" fill="#0e1f3d" />
                <ellipse cx="34" cy="80" rx="4.2" ry="2.6" fill="#f6cdd6" />
                <ellipse cx="66" cy="80" rx="4.2" ry="2.6" fill="#f6cdd6" />
                {done ? (
                  <>
                    <path d="M41 79 Q50 80 59 79 Q58 92 50 92 Q42 92 41 79 Z" fill="#0e1f3d" />
                    <path d="M44.5 87.5 Q50 84 55.5 87.5 Q53.5 91 50 91 Q46.5 91 44.5 87.5 Z" fill="#d6336c" />
                  </>
                ) : (
                  <path d="M43 81 Q50 87 57 81" fill="none" stroke="#0e1f3d" strokeWidth="3.6" />
                )}
              </g>
            </svg>
            <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-ivory opacity-0 transition-opacity group-hover:opacity-100">{done ? "Back to top" : `${pct}%`}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
