"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJSON } from "@/components/forms/api";

export function LoginForm() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = Object.fromEntries(new FormData(e.currentTarget));
        const r = await postJSON("/api/admin/login", f);
        setBusy(false);
        if (!r.ok) return setErr(r.error.message);
        router.replace("/admin");
        router.refresh();
      }}
    >
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" className="input" required /></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" className="input" required /></div>
      {err && <p className="field-error" role="alert">{err}</p>}
      <button className="btn btn-primary mt-2 w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
