import Link from "next/link";
import type { ReactNode } from "react";
import { Mascot } from "@/components/ui/Mascot";
import { Reveal } from "@/components/ui/Reveal";

/** The turquoise sign-off used at the foot of every main page. */
export function ClosingCTA({
  eyebrow = "Your table is waiting",
  title = <>See you <em>over</em> coffee<span className="text-pink">.</span></>,
  body,
  children,
}: { eyebrow?: string; title?: ReactNode; body?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-turquoise py-section text-ink">
      <div className="container-site grid items-center gap-12 md:grid-cols-12">
        <Reveal className="md:col-span-8">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-6 text-[clamp(3rem,1rem+7.5vw,8.5rem)] leading-[.9]">{title}</h2>
          {body && <div className="mt-8 max-w-xl text-lg leading-relaxed">{body}</div>}
          <div className="mt-10 flex flex-wrap gap-3">
            {children ?? (
              <>
                <Link href="/reserve" className="btn btn-dark">Reserve a Table</Link>
                <Link href="/menu" className="btn btn-outline">Order Online</Link>
              </>
            )}
          </div>
        </Reveal>
        <Reveal className="hidden md:col-span-4 md:block" delay={0.15}>
          <Mascot className="mx-auto h-auto w-[72%] max-w-[280px] drop-shadow-[0_30px_30px_rgb(14_31_61/.25)]" />
        </Reveal>
      </div>
    </section>
  );
}
