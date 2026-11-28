"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJSON } from "@/components/forms/api";

export function LoginForm({ canReset = false, startInReset = false }: { canReset?: boolean; startInReset?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "reset">(canReset && startInReset ? "reset" : "signin");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (mode === "reset")
    return (
      <form
        className="mt-8 grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          const r = await postJSON("/api/auth/password-reset", Object.fromEntries(new FormData(e.currentTarget)));
          setBusy(false);
          if (!r.ok) return setErr(r.error.fields?.email ?? r.error.message);
          setSent(true);
        }}
      >
        <p className="text-sm text-muted">Enter your staff email. If it has an account, we will email a link to set a new password.</p>
        <div className="field"><label htmlFor="reset-email">Email</label><input id="reset-email" name="email" type="email" autoComplete="username" className="input" required /></div>
        {err && <p className="field-error" role="alert">{err}</p>}
        {sent && <p className="rounded-2xl bg-turquoise-soft px-4 py-3 text-sm text-ink" role="status">Check your inbox. The link works once and expires after a while.</p>}
        <button className="btn btn-primary mt-2 w-full" disabled={busy}>{busy ? "Sending…" : sent ? "Send again" : "Email me a reset link"}</button>
        <button type="button" className="text-sm font-semibold text-turquoise-deep underline-offset-4 hover:underline" onClick={() => { setMode("signin"); setErr(""); setSent(false); }}>Back to sign in</button>
      </form>
    );

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
      {canReset && <button type="button" className="text-sm font-semibold text-turquoise-deep underline-offset-4 hover:underline" onClick={() => { setMode("reset"); setErr(""); }}>Forgot password?</button>}
    </form>
  );
}
