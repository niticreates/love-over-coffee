import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { currentAdmin } from "@/lib/auth";
import { dataMode, demoMode } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return <AdminShell name={admin.name} role={admin.role} preview={dataMode() === "memory"} demo={demoMode()}>{children}</AdminShell>;
}
