import Image from "next/image";
import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { MEDIA, type Media } from "@/lib/media";
import { pageMeta } from "@/lib/seo";
import { getSiteData } from "@/lib/site";

export const revalidate = 300;
export const metadata = pageMeta("Our Story", "The Love Over Coffee experience in Vijay Nagar, Indore: coffee, comforting food, a navy-and-blush dining room and a wall of books.", "/story");

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
      <header className="container-site grid gap-12 pt-36 pb-20 md:pt-44 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="eyebrow text-turquoise-deep">Our story</p>
          <h1 className="mt-6 text-display-lg text-balance">A place where every cup creates a moment <em className="text-turquoise-deep">worth remembering</em><span className="text-pink">.</span></h1>
        </div>
        <div className="relative lg:col-span-5">
          <ImageReveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[24px]">
              <Image src={MEDIA.storefrontCup.src} alt={MEDIA.storefrontCup.alt} fill priority sizes="(min-width:1024px) 38vw, 90vw" className="object-cover" style={{ objectPosition: MEDIA.storefrontCup.position }} />
            </div>
          </ImageReveal>
          <div className="absolute -bottom-6 -left-4 grid h-28 w-28 place-items-center rounded-full bg-turquoise shadow-[var(--shadow-soft)] md:h-36 md:w-36">
            <Mascot className="h-auto w-[45%]" />
          </div>
        </div>
      </header>
      {sections.map((s, i) => {
        const media = SECTION_MEDIA[s.id] ?? FALLBACK[i % FALLBACK.length];
        const flip = i % 2 === 1;
        return (
          <section key={s.id} className={`py-section ${GROUNDS[i % GROUNDS.length]}`}>
            <div className="container-site grid items-center gap-12 md:grid-cols-12">
              <ImageReveal className={flip ? "md:order-2 md:col-span-5 md:col-start-8" : "md:col-span-6"}>
                <div className={`relative overflow-hidden ${flip ? "aspect-square rounded-full" : i === 0 ? "aspect-[4/5] rounded-t-[999px] rounded-b-[24px]" : "aspect-[4/5] rounded-[24px]"}`}>
                  <Image src={media.src} alt={media.alt} fill sizes="(min-width:768px) 45vw, 90vw" className="object-cover" style={{ objectPosition: media.position }} />
                </div>
              </ImageReveal>
              <Reveal className={flip ? "md:col-span-6" : "md:col-span-5 md:col-start-8"}>
                <p className="font-display text-lg italic text-pink">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="mt-3 text-display-md text-balance">{s.title}</h2>
                <p className={`mt-6 max-w-prose text-lg leading-relaxed ${GROUNDS[i % GROUNDS.length].includes("navy") ? "text-ivory/75" : "text-muted"}`}>{s.body}</p>
              </Reveal>
            </div>
          </section>
        );
      })}
      <section className="bg-turquoise py-section text-ink">
        <div className="container-site flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
          <h2 className="max-w-3xl text-display-lg">Come and write the <em>next chapter</em> with us<span className="text-pink">.</span></h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/menu" className="btn btn-dark">See the menu</Link>
            <Link href="/reserve" className="btn btn-outline">Reserve a table</Link>
          </div>
        </div>
      </section>
    </>
  );
}
