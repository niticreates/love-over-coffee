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
  const side = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Dashboard">
      <Link href="/" className="mb-6 px-3 pt-2 text-xs"><Wordmark /></Link>
      {nav.map((n) => {
        const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={clsx("flex items-center gap-3 px-3 py-2.5 text-sm", active ? "bg-espresso text-ivory" : "hover:bg-oat")}>
            <n.icon size={16} strokeWidth={1.6} /> {n.label}
          </Link>
        );
      })}
      <div className="mt-auto border-t border-oat px-3 pt-4 text-xs text-muted">
        <p className="font-semibold text-espresso">{name}</p>
        <p className="capitalize">{role}</p>
        <button
          className="mt-3 flex items-center gap-2 text-sm text-espresso hover:underline"
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
    <div className="min-h-svh bg-paper lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-oat bg-ivory lg:block">{side}</aside>
      <div className="flex items-center justify-between border-b border-oat bg-ivory px-4 py-3 lg:hidden">
        <Wordmark className="text-xs" />
        <button onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center" aria-label="Open dashboard menu"><MenuIcon size={20} /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-espresso/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-ivory">
            <button onClick={() => setOpen(false)} className="absolute right-2 top-2 grid h-11 w-11 place-items-center" aria-label="Close"><X size={18} /></button>
            {side}
          </aside>
        </div>
      )}
      <div className="min-w-0">
        {preview && <div className="bg-turquoise px-4 py-2 text-center text-xs text-ink">Preview mode — data is held in memory and resets when the server restarts.</div>}
        <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
