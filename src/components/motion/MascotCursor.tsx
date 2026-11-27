"use client";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { Mascot } from "@/components/ui/Mascot";

const INTERACTIVE = "a, button, [role='button'], label, summary, select, [data-cursor='hover']";
const TEXT = "input:not([type='checkbox']):not([type='radio']):not([type='submit']):not([type='button']), textarea, [contenteditable='true']";

/**
 * The cup mascot as the pointer, on desktop mice and trackpads only.
 * A small turquoise dot marks the exact pointer position; the mascot trails it on a spring,
 * grows and tilts over links and buttons, squishes on click and steps aside over text fields
 * (where the normal text cursor returns). Off for touch devices and under reduced motion,
 * where the system cursor stays untouched.
 */
export function MascotCursor() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<"idle" | "hover" | "text" | "hidden">("hidden");
  const [down, setDown] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 420, damping: 34, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 420, damping: 34, mass: 0.6 });

  useEffect(() => {
    if (reduce) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [reduce]);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("mascot-cursor");
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as Element | null;
      setState(t?.closest(TEXT) ? "text" : t?.closest(INTERACTIVE) ? "hover" : "idle");
    };
    const leave = () => setState("hidden");
    const press = () => setDown(true);
    const release = () => setDown(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    document.addEventListener("mouseleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      root.classList.remove("mascot-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      document.removeEventListener("mouseleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;
  const hidden = state === "hidden" || state === "text";
  const hover = state === "hover";
  const size = hidden ? 0.4 : hover ? 1.35 : 1;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      {/* exact pointer position */}
      <motion.span
        className="absolute left-0 top-0 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-pink"
        style={{ x, y }}
        animate={{ opacity: hidden ? 0 : 1, scale: down ? 0.6 : 1 }}
        transition={{ duration: 0.15 }}
      />
      {/* halo over interactive elements */}
      <motion.span
        className="absolute left-0 top-0 -ml-6 -mt-6 h-12 w-12 rounded-full border-[1.5px] border-turquoise bg-turquoise/10"
        style={{ x: sx, y: sy }}
        animate={{ opacity: hover && !hidden ? 1 : 0, scale: hover ? (down ? 0.85 : 1) : 0.4 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
      />
      {/* the mascot, trailing just below-right of the pointer */}
      <motion.span className="absolute left-0 top-0" style={{ x: sx, y: sy }}>
        <motion.span
          className="block w-[22px] drop-shadow-[0_6px_10px_rgb(14_31_61/.22)]"
          style={{ translateX: 6, translateY: 6, originX: 0.5, originY: 1 }}
          animate={{
            opacity: hidden ? 0 : 1,
            scaleX: size * (down ? 1.1 : 1),
            scaleY: size * (down ? 0.8 : 1),
            rotate: hover ? -12 : 0,
          }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <Mascot className="h-auto w-full" title={null} />
        </motion.span>
      </motion.span>
    </div>
  );
}
