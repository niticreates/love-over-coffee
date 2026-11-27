import "server-only";
import { cache } from "react";
import { featuredOrder } from "@/data/seed";
import { dataMode, env, paymentMode } from "./config";
import { getStore } from "./store";

/** Per-request cached read of everything public pages need. */
export const getSiteData = cache(async () => {
  const store = getStore();
  const [settings, categories, products, gallery, platforms] = await Promise.all([
    store.getSettings(),
    store.listCategories(),
    store.listProducts({ includeUnavailable: true }),
    store.listGallery(),
    store.listPlatforms({ publicOnly: true }),
  ]);
  const featured = products
    .filter((p) => p.is_featured)
    .sort((a, b) => {
      const ia = featuredOrder.indexOf(a.slug), ib = featuredOrder.indexOf(b.slug);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.sort_order - b.sort_order;
    });
  return {
    settings,
    categories,
    products,
    featured,
    gallery,
    platforms,
    flags: {
      preview: dataMode() === "memory",
      samplePrices: dataMode() === "memory" && env.demoSampleData,
      paymentMode: paymentMode(),
    },
  };
});
export type SiteData = Awaited<ReturnType<typeof getSiteData>>;
