import Link from "next/link";
import { Photo, type Tone } from "@/components/ui/Photo";
import { ImageReveal, Reveal } from "@/components/ui/Reveal";
import { pageMeta } from "@/lib/seo";
import { getSiteData } from "@/lib/site";

export const revalidate = 300;
export const metadata = pageMeta("Our Story", "The Love Over Coffee experience in Vijay Nagar, Indore: coffee, comforting food, cozy interiors and board games.", "/story");

const TONES: Tone[] = ["interiors", "beverages", "food", "interiors", "experiences"];

export default async function StoryPage() {
  const { settings, gallery } = await getSiteData();
  const sections = settings.content.story_sections;
  return (
    <>
      <header className="container-site pt-36 pb-20 md:pt-48">
        <p className="eyebrow text-terracotta-ink">Our story</p>
        <h1 className="mt-6 max-w-5xl text-display-lg">A place where every cup creates a moment <em>worth remembering.</em></h1>
      </header>
      {sections.map((s, i) => (
        <section key={s.id} className="container-site border-t border-oat py-section">
          <div className={`grid items-center gap-12 md:grid-cols-12 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
            <ImageReveal className={i % 2 ? "md:col-span-5 md:col-start-8" : "md:col-span-6"}>
              <Photo alt={s.title} label={s.title} tone={TONES[i % TONES.length]} shape={i === 0 ? "arch" : "rect"} className={i % 2 ? "aspect-square" : "aspect-[4/5]"} sizes="(min-width:768px) 45vw, 100vw" />
            </ImageReveal>
            <Reveal className={i % 2 ? "md:col-span-6 md:row-start-1" : "md:col-span-5 md:col-start-8"}>
              <p className="font-display text-lg italic text-terracotta-ink">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="mt-3 text-display-sm">{s.title}</h2>
              <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted">{s.body}</p>
            </Reveal>
          </div>
        </section>
      ))}
      <section className="bg-paper py-section">
        <div className="container-site">
          <h2 className="text-display-sm">From the café</h2>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {gallery.slice(0, 6).map((g) => <Photo key={g.id} src={g.url} alt={g.alt} label={g.alt} tone={g.category} className="aspect-[4/5]" sizes="(min-width:768px) 33vw, 50vw" />)}
          </div>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/menu" className="btn btn-dark">See the menu</Link>
            <Link href="/reserve" className="btn btn-primary">Reserve a table</Link>
          </div>
        </div>
      </section>
    </>
  );
}
