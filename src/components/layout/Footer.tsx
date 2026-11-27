import Link from "next/link";
import { Hours } from "./Hours";
import { InstagramIcon } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/Wordmark";
import type { Category, WebsiteSettings } from "@/lib/types";

export function Footer({ settings, categories }: { settings: WebsiteSettings; categories: Category[] }) {
  const b = settings.business;
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-ink text-ivory">
      <div className="container-site grid gap-14 py-20 md:grid-cols-12">
        <div className="md:col-span-4">
          <Wordmark className="text-lg" tone="light" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-ivory/70">
            Coffee, comfort food and unhurried conversations in Vijay Nagar, Indore.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/menu" className="btn btn-ghost-light min-h-[42px]">Order Online</Link>
            <Link href="/reserve" className="btn btn-primary min-h-[42px]">Reserve</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 md:col-span-4">
          <div data-aos="fade-up" data-aos-delay="0">
            <p className="eyebrow text-turquoise">Explore</p>
            <ul className="mt-5 space-y-2.5 text-sm text-ivory/80">
              {[["/", "Home"], ["/story", "Our Story"], ["/menu", "Menu"], ["/book-order", "Book & Order"], ["/gallery", "Gallery"], ["/reserve", "Reservations"], ["/contact", "Contact"]].map(([h, l]) => (
                <li key={h}><Link className="link-underline" href={h}>{l}</Link></li>
              ))}
            </ul>
          </div>
          <div data-aos="fade-up" data-aos-delay="90">
            <p className="eyebrow text-turquoise">Menu</p>
            <ul className="mt-5 space-y-2.5 text-sm text-ivory/80">
              {categories.slice(0, 7).map((c) => (
                <li key={c.id}><Link className="link-underline" href={`/menu#${c.slug}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-8 text-sm text-ivory/80 md:col-span-4">
          <div data-aos="fade-up" data-aos-delay="180">
            <p className="eyebrow text-turquoise">Visit</p>
            <address className="mt-5 not-italic leading-relaxed">
              {b.address_lines.map((l) => <span key={l} className="block">{l}</span>)}
              {b.city}, {b.region} {b.postal_code}
            </address>
            <a href={b.maps_place_url} target="_blank" rel="noopener noreferrer" className="link-underline mt-3 inline-block text-ivory">Google Maps ↗</a>
          </div>
          <div data-aos="fade-up" data-aos-delay="270">
            <p className="eyebrow text-turquoise">Contact</p>
            <a href={`tel:${b.phone_e164}`} className="link-underline mt-5 inline-block text-ivory">{b.phone_display}</a>
            {b.instagram_url && (
              <a href={b.instagram_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 text-ivory"><InstagramIcon className="h-4 w-4" /> Instagram</a>
            )}
          </div>
          <div data-aos="fade-up" data-aos-delay="360">
            <p className="eyebrow text-turquoise">Hours</p>
            <Hours business={b} className="mt-5 max-w-xs" />
          </div>
        </div>
      </div>
      <div aria-hidden className="container-site select-none overflow-hidden pb-6 pt-4 md:pb-10">
        <p data-aos="blur-in" className="font-brand whitespace-nowrap text-[clamp(2.6rem,11.6vw,10.5rem)] font-bold leading-[1.15] tracking-[-.04em] text-ivory/[.07]">
          loveOverCoffee.
        </p>
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-site flex flex-col gap-2 py-6 text-xs text-ivory/50 sm:flex-row sm:justify-between">
          <p>© {year} {b.short_name}, Vijay Nagar. All rights reserved.</p>
          {b.fssai && <p>FSSAI Lic. No. {b.fssai}</p>}
        </div>
      </div>
    </footer>
  );
}
