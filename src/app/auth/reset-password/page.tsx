import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Mascot } from "@/components/ui/Mascot";
import { Wordmark } from "@/components/ui/Wordmark";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return (
    <div className="admin relative grid min-h-svh place-items-center overflow-hidden bg-navy p-4 py-12">
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-turquoise/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-pink/15 blur-3xl" aria-hidden />
      <main className="relative w-full max-w-md rounded-[32px] bg-ivory p-8 shadow-[0_40px_80px_-40px_rgb(0_0_0_/_.6)] md:p-10">
        <Mascot className="absolute -top-10 right-8 h-20 w-auto drop-shadow-[0_12px_18px_rgb(14_31_61_/_.25)]" title={null} />
        <Wordmark className="text-sm" mascot={false} />
        <p className="eyebrow mt-8 text-turquoise-deep">Staff dashboard</p>
        <h1 className="mt-2 text-4xl text-ink md:text-5xl">New password<span className="text-pink">.</span></h1>
        <p className="mt-3 text-muted">Choose a new password for your staff account.</p>
        <ResetPasswordForm />
      </main>
    </div>
  );
}
