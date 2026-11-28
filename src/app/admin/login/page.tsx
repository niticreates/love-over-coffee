import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Mascot } from "@/components/ui/Mascot";
import { Wordmark } from "@/components/ui/Wordmark";
import { currentAdmin } from "@/lib/auth";
import { dataMode } from "@/lib/config";
import { MEDIA } from "@/lib/media";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Staff sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string; forgot?: string }> }) {
  const { reset, forgot } = await searchParams;
  if (await currentAdmin()) redirect("/admin");
  return (
    <div className="admin grid min-h-svh bg-navy lg:grid-cols-2">
      {/* The café itself, on the left on large screens */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image src={MEDIA.storefront.src} alt={MEDIA.storefront.alt} fill priority sizes="50vw" className="object-cover" style={{ objectPosition: MEDIA.storefront.position }} />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 p-12 text-ivory">
          <p className="eyebrow text-turquoise">Vijay Nagar · Indore</p>
          <p className="mt-3 max-w-md font-display text-5xl leading-[1.05]">Every cup starts <em className="text-turquoise">here</em><span className="text-pink">.</span></p>
        </div>
      </div>

      <div className="relative grid place-items-center overflow-hidden p-4 py-12">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-turquoise/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-pink/15 blur-3xl" aria-hidden />
        <div className="relative w-full max-w-md rounded-[32px] bg-ivory p-8 shadow-[0_40px_80px_-40px_rgb(0_0_0_/_.6)] md:p-10">
          <Mascot className="absolute -top-10 right-8 h-20 w-auto drop-shadow-[0_12px_18px_rgb(14_31_61_/_.25)]" title={null} />
          <Wordmark className="text-sm" mascot={false} />
          <p className="eyebrow mt-8 text-turquoise-deep">Staff dashboard</p>
          <h1 className="mt-2 text-4xl text-ink md:text-5xl">Welcome back<span className="text-pink">.</span></h1>
          <p className="mt-3 text-muted">Sign in to manage orders, table requests and the menu.</p>
          {dataMode() === "memory" && <p className="mt-4 rounded-2xl bg-turquoise-soft px-4 py-3 text-xs text-ink">Preview mode: use any email and the DEMO_ADMIN_PASSWORD.</p>}
          {reset === "done" && <p className="mt-4 rounded-2xl bg-turquoise-soft px-4 py-3 text-sm text-ink" role="status">Password updated. Sign in with your new password.</p>}
          <LoginForm canReset={dataMode() === "supabase"} startInReset={forgot === "1"} />
        </div>
      </div>
    </div>
  );
}
