"use client";
import clsx from "clsx";
import { CalendarDays, Link2, Image as ImageIcon, LayoutDashboard, LogOut, Menu as MenuIcon, Receipt, Settings, Type, UtensilsCrossed, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Wordmark } from "@/components/ui/Wordmark";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, role: "staff" },
  { href: "/admin/orders", label: "Orders", icon: Receipt, role: "staff" },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarDays, role: "staff" },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed, role: "staff" },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon, role: "manager" },
  { href: "/admin/content", label: "Website content", icon: Type, role: "manager" },
  { href: "/admin/integrations", label: "Booking links", icon: Link2, role: "manager" },
  { href: "/admin/settings", label: "Settings", icon: Settings, role: "manager" },
] as const;
const RANK = { staff: 1, manager: 2, owner: 3 };

export function AdminShell({ name, role, preview, children }: { name: string; role: "owner" | "manager" | "staff"; preview: boolean; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = NAV.filter((n) => RANK[role] >= RANK[n.role]);
  const initial = name.trim().charAt(0).toUpperCase() || "L";
  const side = (
    <nav className="relative flex h-full flex-col gap-1 overflow-hidden p-4 text-ivory" aria-label="Dashboard">
      {/* soft turquoise glow, echoing the neon in the café */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-turquoise/25 blur-3xl" aria-hidden />
      <Link href="/" className="relative mb-2 px-3 pt-3 text-[13px]" aria-label="View the website"><Wordmark tone="light" /></Link>
      <p className="relative mb-6 px-3 text-[11px] uppercase tracking-[.18em] text-ivory/55">Staff dashboard</p>
      {nav.map((n) => {
        const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "relative flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors duration-200",
              active ? "bg-turquoise font-semibold text-ink shadow-[0_10px_24px_-14px_rgb(34_184_222)]" : "text-ivory/80 hover:bg-ivory/10 hover:text-ivory",
            )}
          >
            <n.icon size={17} strokeWidth={active ? 2 : 1.6} /> {n.label}
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-pink" aria-hidden />}
          </Link>
        );
      })}
      <div className="relative mt-auto rounded-[20px] bg-ivory/[.06] p-4 ring-1 ring-ivory/10">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blush font-display text-lg text-berry" aria-hidden>{initial}</span>
          <div className="min-w-0 text-xs">
            <p className="truncate text-sm font-semibold text-ivory">{name}</p>
            <p className="capitalize text-ivory/60">{role}</p>
          </div>
        </div>
        <button
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-ivory/25 py-2 text-xs font-semibold uppercase tracking-[.1em] text-ivory transition-colors hover:border-pink hover:bg-pink"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            router.push("/admin/login");
          }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </nav>
  );
  return (
    <div className="admin min-h-svh bg-ivory lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden bg-navy lg:sticky lg:top-0 lg:block lg:h-svh">{side}</aside>
      <div className="sticky top-0 z-40 flex items-center justify-between bg-navy px-4 py-3 lg:hidden">
        <Link href="/admin" className="text-[11px] text-ivory" aria-label="Dashboard home"><Wordmark tone="light" /></Link>
        <button onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-full text-ivory hover:bg-ivory/10" aria-label="Open dashboard menu"><MenuIcon size={20} /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 rounded-r-[28px] bg-navy">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full text-ivory hover:bg-ivory/10" aria-label="Close"><X size={18} /></button>
            {side}
          </aside>
        </div>
      )}
      <div className="min-w-0">
        {preview && <div className="bg-turquoise px-4 py-2 text-center text-xs font-medium text-ink">Preview mode: data is held in memory and resets when the server restarts.</div>}
        <div className="mx-auto max-w-6xl p-4 md:p-8 lg:p-10">{children}</div>
      </div>
    </div>
  );
}
