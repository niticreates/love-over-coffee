import type { Metadata } from "next";
import { DAY_NAMES } from "./hours";
import type { ExternalPlatform, WebsiteSettings } from "./types";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const OG_IMAGE = { url: "/images/og/love-over-coffee-vijay-nagar.jpg", width: 1200, height: 630, alt: "Love Over Coffee café storefront in Vijay Nagar, Indore" };

export function pageMeta(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: "Love Over Coffee — Vijay Nagar", locale: "en_IN", type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * schema.org CafeOrCoffeeShop. Unverified facts (hours, geo, prices, social) are omitted, never guessed.
 * `sameAs` lists only platform listings verified to belong to this outlet.
 */
export function localBusinessJsonLd(s: WebsiteSettings, platforms: ExternalPlatform[] = []) {
  const b = s.business;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    "@id": `${SITE_URL}/#cafe`,
    name: b.name,
    url: SITE_URL,
    telephone: b.phone_e164,
    image: [`${SITE_URL}/images/exterior/storefront-signage.webp`, `${SITE_URL}/images/interior/dining-room.webp`, `${SITE_URL}/images/coffee/latte-art.webp`],
    logo: `${SITE_URL}/icon.svg`,
    description: "Neighbourhood café in Vijay Nagar, Indore serving coffee, frappes and shakes, nachos, garlic bread, pasta and desserts. Dine in, order online for pickup, or reserve a table.",
    servesCuisine: ["Coffee", "Italian", "Mexican", "Desserts"],
    hasMenu: `${SITE_URL}/menu`,
    acceptsReservations: s.reservations.enabled ? "True" : "False",
    address: {
      "@type": "PostalAddress",
      streetAddress: b.address_lines.join(", "),
      addressLocality: b.city,
      addressRegion: b.region,
      postalCode: b.postal_code,
      addressCountry: b.country,
    },
    areaServed: "Vijay Nagar, Indore",
  };
  if (b.geo) data.geo = { "@type": "GeoCoordinates", latitude: b.geo.lat, longitude: b.geo.lng };
  if (b.hours && b.hours_verification === "verified")
    data.openingHoursSpecification = b.hours
      .filter((h) => h.open && h.close)
      .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${DAY_NAMES[h.day]}`, opens: h.open, closes: h.close }));
  const sameAs = [b.instagram_url, ...platforms.filter((p) => p.is_active && p.is_verified && p.platform_url && p.platform_type !== "location").map((p) => p.platform_url)].filter(Boolean);
  if (sameAs.length) data.sameAs = sameAs;
  data.hasMap = b.maps_place_url;
  return data;
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Love Over Coffee — Vijay Nagar, Indore",
    inLanguage: "en-IN",
    publisher: { "@id": `${SITE_URL}/#cafe` },
  };
}

/** BreadcrumbList from [name, path] pairs, starting after Home. */
export function breadcrumbJsonLd(trail: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [["Home", "/"] as [string, string], ...trail].map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE_URL}${path === "/" ? "" : path}` })),
  };
}
