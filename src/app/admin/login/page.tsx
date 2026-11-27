import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Wordmark } from "@/components/ui/Wordmark";
import { currentAdmin } from "@/lib/auth";
import { dataMode } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Staff sign in", robots: { index: false } };

export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <div className="grid min-h-svh place-items-center bg-charcoal p-4">
      <div className="w-full max-w-sm bg-ivory p-8 shadow-drawer">
        <Wordmark className="text-sm" />
        <h1 className="mt-8 text-4xl">Staff sign in</h1>
        {dataMode() === "memory" && <p className="mt-3 text-xs text-muted">Preview mode: use any email and the DEMO_ADMIN_PASSWORD.</p>}
        <LoginForm />
      </div>
    </div>
  );
}
