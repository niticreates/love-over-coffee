"use client";
import { CalendarDays, Phone, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Mobile-only bottom bar. Hidden on checkout/admin so it never covers payment controls. */
export function MobileActionBar({ phone }: { phone: string }) {
  const path = usePathname();
  if (path.startsWith("/checkout") || path.startsWith("/admin") || path.startsWith("/reserve")) return null;
  const item = "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold tracking-[.16em] uppercase";
  return (
    <>
      <div className="h-[68px] md:hidden" aria-hidden />
      <nav aria-label="Quick actions" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-oat bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <Link href="/menu" className={item}><ShoppingBag size={18} strokeWidth={1.6} />Order</Link>
        <Link href="/reserve" className={`${item} bg-turquoise text-ink`}><CalendarDays size={18} strokeWidth={1.6} />Reserve</Link>
        <a href={`tel:${phone}`} className={item}><Phone size={18} strokeWidth={1.6} />Call</a>
      </nav>
    </>
  );
}
