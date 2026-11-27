"use client";
import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/ui/icons";

/**
 * Global floating WhatsApp button. Sits above the mobile action bar, and is hidden on
 * checkout (payment controls) and the admin area.
 */
export function WhatsAppFab({ href }: { href: string | null }) {
  const path = usePathname();
  const reduce = useReducedMotion();
  if (!href || path.startsWith("/checkout") || path.startsWith("/admin")) return null;
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp (opens WhatsApp)"
      className="group fixed right-4 z-[45] grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgb(41_39_32/.45)] transition-transform duration-300 hover:-translate-y-0.5 hover:scale-105 focus-visible:scale-105 bottom-[calc(68px+env(safe-area-inset-bottom)+14px)] md:bottom-8 md:right-8"
      initial={reduce ? false : { opacity: 0, scale: 0.6, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <WhatsAppIcon className="h-7 w-7" strokeWidth={1.7} />
      <span
        role="tooltip"
        className="pointer-events-none absolute right-[calc(100%+12px)] top-1/2 hidden -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-full bg-ink px-3 py-2 text-xs text-ivory opacity-0 shadow-soft transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 md:block"
      >
        Chat with us on WhatsApp
      </span>
    </motion.a>
  );
}
