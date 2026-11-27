import type { Metadata } from "next";
import { DAY_NAMES } from "./hours";
import type { WebsiteSettings } from "./types";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const OG_IMAGE = { url: "/images/exterior/storefront-signage.webp", width: 765, height: 1020, alt: "The Love Over Coffee storefront in Vijay Nagar, Indore" };

export function pageMeta(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: "Love Over Coffee — Vijay Nagar", locale: "en_IN", type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** schema.org CafeOrCoffeeShop. Unverified facts (hours, geo, social) are omitted, never guessed. */
export function localBusinessJsonLd(s: WebsiteSettings) {
  const b = s.business;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    "@id": `${SITE_URL}/#cafe`,
    name: b.name,
    url: SITE_URL,
    telephone: b.phone_e164,
    priceRange: "₹200–₹400",
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
  if (b.instagram_url) data.sameAs = [b.instagram_url];
  data.hasMap = b.maps_place_url;
  return data;
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
