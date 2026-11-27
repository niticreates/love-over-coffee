import { GalleryGrid } from "@/components/GalleryGrid";
import { ClosingCTA } from "@/components/ui/ClosingCTA";
import { PageHero } from "@/components/ui/PageHero";
import { Ticker } from "@/components/ui/Ticker";
import { MEDIA } from "@/lib/media";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/seo";
import { getSiteData } from "@/lib/site";

export const revalidate = 300;
export const metadata = pageMeta("Gallery", "Photos of Love Over Coffee in Vijay Nagar, Indore: the navy-and-blush dining room, the coffee counter, latte art, cold coffees, nachos, pizza and garlic bread.", "/gallery");

export default async function GalleryPage() {
  const { gallery, settings } = await getSiteData();
  const hasPhotos = gallery.some((g) => g.url);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([["Gallery", "/gallery"]])} />
      <PageHero
        eyebrow="Gallery"
        title={<>Moments, <em className="text-turquoise-deep">poured</em><span className="text-pink">.</span></>}
        media={MEDIA.counterParty}
        accent={MEDIA.layered}
        intro={<p>The room, the cups and the plates — photographed at the café in Vijay Nagar. Tap any photo to see it larger.</p>}
      >
        {settings.business.instagram_url && <a href={settings.business.instagram_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Follow on Instagram</a>}
      </PageHero>
      <Ticker words={["Interiors", "Coffee", "Comfort food", "Moments", "The navy ceiling", "Blush velvet"]} tone="blush" />
      <div className="container-site pt-16 pb-section">
        {!hasPhotos && <p className="mb-6 max-w-xl text-sm text-muted">Our photographs are on their way.</p>}
        <GalleryGrid images={gallery} />
      </div>
      <ClosingCTA eyebrow="Seen enough?" title={<>Come see it <em>in person</em><span className="text-pink">.</span></>} />
    </>
  );
}
