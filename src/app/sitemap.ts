import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getSiteData } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products } = await getSiteData();
  const now = new Date();
  const pages = ["", "/menu", "/our-story", "/gallery", "/contact", "/reserve", "/book-order"].map((p, i) => ({
    url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: i === 0 ? 1 : 0.8,
  }));
  return [...pages, ...products.map((p) => ({ url: `${SITE_URL}/menu/${p.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 }))];
}
