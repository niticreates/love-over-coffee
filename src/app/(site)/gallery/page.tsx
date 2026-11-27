import { GalleryGrid } from "@/components/GalleryGrid";
import { pageMeta } from "@/lib/seo";
import { getSiteData } from "@/lib/site";

export const revalidate = 300;
export const metadata = pageMeta("Gallery", "Inside Love Over Coffee, Vijay Nagar: interiors, coffee, food, desserts and good times.", "/gallery");

export default async function GalleryPage() {
  const { gallery, settings } = await getSiteData();
  const hasPhotos = gallery.some((g) => g.url);
  return (
    <div className="container-site pt-32 pb-section md:pt-44">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-terracotta-ink">Gallery</p>
          <h1 className="mt-5 text-display-lg">Moments, <em>poured.</em></h1>
        </div>
        {settings.business.instagram_url && <a href={settings.business.instagram_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline self-start">Follow on Instagram</a>}
      </div>
      {!hasPhotos && <p className="mt-6 max-w-xl text-sm text-muted">Our photographs are on their way. These frames will be filled with real moments from the café very soon.</p>}
      <div className="mt-12"><GalleryGrid images={gallery} /></div>
    </div>
  );
}
