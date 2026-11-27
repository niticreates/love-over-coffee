"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { postJSON } from "@/components/forms/api";

/** Call an admin API, toast the result, refresh server data. */
export function useAdminAction() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function run<T>(url: string, body: unknown, method = "POST", success?: string): Promise<T | null> {
    setBusy(true);
    const r = await postJSON<T>(url, body, method);
    setBusy(false);
    if (!r.ok) {
      if (r.error.code === "unauthenticated") router.push("/admin/login");
      toast(r.error.fields ? `${r.error.message} (${Object.entries(r.error.fields).map(([k, v]) => `${k}: ${v}`).join("; ")})` : r.error.message, "error");
      return null;
    }
    if (success) toast(success);
    router.refresh();
    return r.data;
  }
  return { run, busy };
}
