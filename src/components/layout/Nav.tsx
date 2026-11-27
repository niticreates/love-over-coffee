"use client";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Wordmark } from "@/components/ui/Wordmark";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/story", label: "Our Story" },
  { href: "/menu", label: "Menu" },
  { href: "/book-order", label: "Book & Order" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function Nav({ phone, announcement }: { phone: string; announcement?: string | null }) {
  const path = usePathname();
  const overlayRoute = path === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, setOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setMenuOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  const transparent = overlayRoute && !scrolled && !menuOpen;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:bg-espresso focus:px-4 focus:py-2 focus:text-ivory">Skip to content</a>
      <header
        className={clsx(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,color,box-shadow,padding] duration-500",
          transparent ? "bg-transparent pb-5 text-ivory" : "bg-ivory/95 pb-3 text-espresso shadow-[0_1px_0_rgb(41_39_32/.08)] backdrop-blur-md",
        )}
      >
        {announcement && <div className="bg-espresso px-4 py-1.5 text-center text-[11px] tracking-wide text-ivory">{announcement}</div>}
        <div className={transparent ? "pt-5" : "pt-3"}>
        <nav className="container-site flex items-center justify-between gap-6" aria-label="Main">
          <Link href="/" className="text-[13px] sm:text-sm" aria-label="Love Over Coffee — home">
            <Wordmark />
          </Link>
          <ul className="hidden items-center gap-6 xl:gap-8 lg:flex">
            {NAV_LINKS.map((l) => {
              const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link href={l.href} aria-current={active ? "page" : undefined} className={clsx("link-underline py-1 text-[13px] tracking-[.08em]", active && "bg-[length:100%_1px]")}>
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/menu" className={clsx("btn hidden min-h-[42px] px-4 md:inline-flex", transparent ? "btn-ghost-light" : "btn-outline")}>Order Online</Link>
            <Link href="/reserve" className="btn btn-primary hidden min-h-[42px] px-4 md:inline-flex">Reserve a Table</Link>
            <button onClick={() => setOpen(true)} className="relative grid h-11 w-11 place-items-center" aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}>
              <ShoppingBag size={20} strokeWidth={1.6} />
              {count > 0 && <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-terracotta px-1 text-[10px] font-bold text-white">{count}</span>}
            </button>
            <button onClick={() => setMenuOpen((v) => !v)} className="grid h-11 w-11 place-items-center lg:hidden" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? "Close menu" : "Open menu"}>
              {menuOpen ? <X size={22} strokeWidth={1.6} /> : <Menu size={22} strokeWidth={1.6} />}
            </button>
          </div>
        </nav>
        </div>
      </header>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-ivory px-[var(--spacing-gutter)] pb-10 pt-28 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((l, i) => (
                <motion.li key={l.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i + 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                  <Link href={l.href} className="font-display block py-2 text-5xl">{l.label}</Link>
                </motion.li>
              ))}
            </ul>
            <div className="mt-auto grid gap-3">
              <Link href="/menu" className="btn btn-dark">Order Online</Link>
              <Link href="/reserve" className="btn btn-primary">Reserve a Table</Link>
              <a href={`tel:${phone}`} className="btn btn-outline">Call the café</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
