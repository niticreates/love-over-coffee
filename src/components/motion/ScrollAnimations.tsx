"use client";
import { useEffect } from "react";

/**
 * Animate-on-scroll for any element with a `data-aos` attribute
 * (fade-up, fade-left, fade-right, zoom-in, zoom-out, flip-up, blur-in), with optional
 * `data-aos-delay` in ms. The hidden starting state only applies once this has run
 * (`html.aos-ready`), so content is never invisible without JavaScript. Elements animate once.
 * Under prefers-reduced-motion nothing is hidden or moved.
 */
export function ScrollAnimations() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("aos-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-aos]:not(.aos-in):not([data-aos-watched])").forEach((el) => {
        el.dataset.aosWatched = "";
        const d = el.dataset.aosDelay;
        if (d) el.style.setProperty("--aos-delay", `${d}ms`);
        io.observe(el);
      });
    };
    scan();
    root.classList.add("aos-ready");
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);
  return null;
}
