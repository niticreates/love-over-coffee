"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { postJSON } from "@/components/forms/api";
import { parseRecoveryLink, PASSWORD_MAX, PASSWORD_MIN, recoveryErrorMessage, RESET_PATH, validateNewPassword } from "@/lib/recovery";
import { recoveryClient } from "@/lib/supabase-browser";

type Phase =
  | { name: "checking" }
  | { name: "ready" }
  | { name: "saving" }
  | { name: "done" }
  | { name: "invalid"; message: string };

export function ResetPasswordForm() {
  const router = useRouter();
  const client = useRef<SupabaseClient | null>(null);
  const started = useRef(false);
  const [phase, setPhase] = useState<Phase>({ name: "checking" });
  const [error, setError] = useState("");

  useEffect(() => {
    // React runs effects twice in development; the link can only be used once.
    if (started.current) return;
    started.current = true;
    const link = parseRecoveryLink(window.location.hash, window.location.search);
    // Wipe the token from the address bar and history before doing anything else.
    window.history.replaceState(null, "", RESET_PATH);

    const sb = recoveryClient();
    client.current = sb;
    if (!sb) return setPhase({ name: "invalid", message: "Password reset isn't available: the site isn't connected to Supabase." });

    (async () => {
      if (link.kind === "error") return setPhase({ name: "invalid", message: recoveryErrorMessage(link.code) });
      if (link.kind === "code") return setPhase({ name: "invalid", message: "This reset link can't be used here. Request a new one below." });
      if (link.kind === "none") return setPhase({ name: "invalid", message: "Open this page from the reset link in your email, or request a new link below." });
      const { error: e } =
        link.kind === "tokens"
          ? await sb.auth.setSession({ access_token: link.accessToken, refresh_token: link.refreshToken })
          : await sb.auth.verifyOtp({ token_hash: link.tokenHash, type: "recovery" });
      if (e) return setPhase({ name: "invalid", message: recoveryErrorMessage(e.code ?? "otp_expired") });
      setPhase({ name: "ready" });
    })();
  }, []);

  async function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    const invalid = validateNewPassword(password, confirm);
    if (invalid) return setError(invalid);
    const sb = client.current;
    if (!sb) return;
    setError("");
    setPhase({ name: "saving" });
    const { error: e } = await sb.auth.updateUser({ password });
    if (e) {
      const message = recoveryErrorMessage(e.code, e.code === "weak_password" ? e.message : undefined);
      if (["same_password", "weak_password"].includes(e.code ?? "")) {
        setError(message);
        return setPhase({ name: "ready" });
      }
      return setPhase({ name: "invalid", message });
    }
    form.reset();
    // End the recovery session, and any stale dashboard session in this browser.
    await sb.auth.signOut({ scope: "local" });
    await postJSON("/api/admin/logout", {});
    setPhase({ name: "done" });
    setTimeout(() => router.replace("/admin/login?reset=done"), 1500);
  }

  if (phase.name === "checking")
    return <p className="mt-8 text-muted" role="status">Checking your reset link…</p>;

  if (phase.name === "done")
    return (
      <div className="mt-8 rounded-2xl bg-turquoise-soft px-4 py-3 text-sm text-ink" role="status">
        Password updated. Taking you to sign in…{" "}
        <Link href="/admin/login?reset=done" className="font-semibold underline">Sign in now</Link>
      </div>
    );

  if (phase.name === "invalid")
    return (
      <div className="mt-8 grid gap-4">
        <p className="rounded-2xl bg-blush px-4 py-3 text-sm text-berry" role="alert">{phase.message}</p>
        <Link href="/admin/login?forgot=1" className="btn btn-primary w-full">Request a new link</Link>
      </div>
    );

  const saving = phase.name === "saving";
  return (
    <form
      className="mt-8 grid gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit(e.currentTarget);
      }}
    >
      <div className="field">
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" className="input" minLength={PASSWORD_MIN} maxLength={PASSWORD_MAX} required aria-describedby="password-hint" disabled={saving} />
        <p id="password-hint" className="text-xs text-muted">At least {PASSWORD_MIN} characters.</p>
      </div>
      <div className="field">
        <label htmlFor="confirm">Confirm new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="input" minLength={PASSWORD_MIN} maxLength={PASSWORD_MAX} required disabled={saving} />
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button className="btn btn-primary mt-2 w-full" disabled={saving}>{saving ? "Saving…" : "Set new password"}</button>
    </form>
  );
}
