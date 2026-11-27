import Image from "next/image";
import Link from "next/link";
import { ClosingCTA } from "@/components/ui/ClosingCTA";
import { PageHero } from "@/components/ui/PageHero";
import { Ticker } from "@/components/ui/Ticker";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { MEDIA, type Media } from "@/lib/media";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/seo";
import { getSiteData } from "@/lib/site";

export const revalidate = 300;
export const metadata = pageMeta("Our Story", "The Love Over Coffee experience in Vijay Nagar, Indore: coffee, comforting food, a navy-and-blush dining room and a wall of books.", "/our-story");

/** Photograph for each story section id; unknown ids fall back by position. */
const SECTION_MEDIA: Record<string, Media> = {
  experience: MEDIA.storefront,
  coffee: MEDIA.latteArt,
  food: MEDIA.garlicBread,
  ambience: MEDIA.diningRoom,
  conversations: MEDIA.counterBooks,
};
const FALLBACK = [MEDIA.storefrontCup, MEDIA.coldCoffees, MEDIA.spread];
const GROUNDS = ["bg-ivory", "bg-cream", "bg-ivory", "bg-navy text-ivory", "bg-ivory"];

export default async function StoryPage() {
  const { settings } = await getSiteData();
  const sections = settings.content.story_sections;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([["Our Story", "/our-story"]])} />
      <PageHero
        eyebrow="Our story"
        title={<>A place where every cup creates a moment <em className="text-turquoise-deep">worth remembering</em><span className="text-pink">.</span></>}
        media={MEDIA.storefrontCup}
        accent={MEDIA.latteArt}
        intro={<p>Coffee, comfort food and a room worth staying in — on Scheme 113 in Vijay Nagar, Indore.</p>}
      />
      <Ticker words={["Coffee", "Conversations", "Comfort food", "Books on the wall", "Good company"]} />
      {sections.map((s, i) => {
        const media = SECTION_MEDIA[s.id] ?? FALLBACK[i % FALLBACK.length];
        const flip = i % 2 === 1;
        return (
          <section key={s.id} className={`py-section ${GROUNDS[i % GROUNDS.length]}`}>
            <div className="container-site grid items-center gap-12 md:grid-cols-12">
              <ImageReveal className={flip ? "md:order-2 md:col-span-5 md:col-start-8" : "md:col-span-5"}>
                <div className={`relative overflow-hidden ${flip ? "aspect-square rounded-full" : i === 0 ? "aspect-[4/5] max-h-[640px] rounded-t-[999px] rounded-b-[24px]" : "aspect-[4/5] max-h-[640px] rounded-[24px]"}`}>
                  <Image src={media.src} alt={media.alt} fill sizes="(min-width:768px) 45vw, 90vw" className="object-cover" style={{ objectPosition: media.position }} />
                </div>
              </ImageReveal>
              <Reveal className={flip ? "md:col-span-6" : "md:col-span-6 md:col-start-7"}>
                <p className="flex items-center gap-3 font-display text-xl italic text-pink">{String(i + 1).padStart(2, "0")}<span className="h-px w-10 bg-pink/50" /></p>
                <h2 className="mt-4 text-[clamp(2.4rem,1.2rem+3.6vw,4.8rem)] leading-[1.02] text-balance">{s.title}</h2>
                <p className={`mt-8 max-w-xl text-xl leading-relaxed md:text-[1.4rem] ${GROUNDS[i % GROUNDS.length].includes("navy") ? "text-ivory/75" : "text-muted"}`}>{s.body}</p>
              </Reveal>
            </div>
          </section>
        );
      })}
      <ClosingCTA eyebrow="The next chapter" title={<>Come and write it <em>with us</em><span className="text-pink">.</span></>}>
        <Link href="/menu" className="btn btn-dark">See the menu</Link>
        <Link href="/reserve" className="btn btn-outline">Reserve a table</Link>
      </ClosingCTA>
    </>
  );
}
