import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";
import { Wordmark } from "@/components/ui/Wordmark";

/** Unmatched URLs render outside the site layout, so this carries its own minimal header. */
export default function NotFound() {
  return (
    <main className="min-h-svh bg-ivory">
      <header className="container-site py-5"><Link href="/" aria-label="Love Over Coffee — home" className="text-[15px]"><Wordmark /></Link></header>
      <section className="container-site grid min-h-[75svh] items-center gap-10 pb-20 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="eyebrow text-turquoise-deep">Page not found</p>
          <h1 className="mt-6 text-[clamp(3rem,1.4rem+6vw,7rem)]">This cup is <em className="text-turquoise-deep">empty</em><span className="text-pink">.</span></h1>
          <p className="mt-6 max-w-md text-lg text-muted">The page you&apos;re looking for has moved or never existed. Let&apos;s get you back to the good stuff.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/" className="btn btn-primary">Back home</Link>
            <Link href="/menu" className="btn btn-outline">See the menu</Link>
          </div>
        </div>
        <div className="md:col-span-4 md:col-start-9">
          <div className="mx-auto grid aspect-square w-2/3 max-w-[320px] place-items-center rounded-full bg-turquoise md:w-full">
            <Mascot className="h-auto w-[45%]" />
          </div>
        </div>
      </section>
    </main>
  );
}
