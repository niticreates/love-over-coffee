import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { assertDemoSafe, dataMode, env, memoryStoreAllowed } from "./config";
import { hasRole, SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession, type Role, type SessionPayload } from "./session";

export async function authenticate(email: string, password: string): Promise<SessionPayload | { error: string }> {
  assertDemoSafe(); // an unsafe demo must never reach Supabase Auth
  if (dataMode() === "memory") {
    if (!memoryStoreAllowed()) return { error: "Sign-in is unavailable: the database isn't configured." };
    const expected = env.demoAdminPassword;
    if (!expected) return { error: "Admin is disabled: set DEMO_ADMIN_PASSWORD for preview mode, or configure Supabase." };
    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { error: "Incorrect email or password." };
    return { uid: "demo-owner", name: "Preview owner", role: "owner", exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  }
  const anon = createClient(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Incorrect email or password." };
  const svc = createClient(env.supabaseUrl, env.supabaseServiceKey, { auth: { persistSession: false } });
  const { data: profile } = await svc.from("admin_profiles").select("display_name, role, is_active").eq("user_id", data.user.id).maybeSingle();
  if (!profile?.is_active) return { error: "This account doesn't have dashboard access." };
  return { uid: data.user.id, name: profile.display_name, role: profile.role, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
}

export async function startSession(p: SessionPayload) {
  (await cookies()).set(SESSION_COOKIE, await signSession(p), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Current admin, re-validated against admin_profiles so deactivated staff lose access immediately. */
export async function currentAdmin(): Promise<SessionPayload | null> {
  assertDemoSafe();
  const p = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!p) return null;
  if (dataMode() === "supabase") {
    const svc = createClient(env.supabaseUrl, env.supabaseServiceKey, { auth: { persistSession: false } });
    const { data } = await svc.from("admin_profiles").select("role, is_active").eq("user_id", p.uid).maybeSingle();
    if (!data?.is_active) return null;
    return { ...p, role: data.role };
  }
  return memoryStoreAllowed() ? p : null;
}

export class AuthError extends Error {
  constructor(public status: 401 | 403) {
    super(status === 401 ? "Please sign in." : "You don't have permission for this.");
  }
}

export async function requireAdmin(need: Role = "staff"): Promise<SessionPayload> {
  const a = await currentAdmin();
  if (!a) throw new AuthError(401);
  if (!hasRole(a.role, need)) throw new AuthError(403);
  return a;
}

/** For server-rendered admin pages: redirect instead of throwing. */
export async function guard(need: Role = "staff"): Promise<SessionPayload> {
  const a = await currentAdmin();
  if (!a) redirect("/admin/login");
  if (!hasRole(a.role, need)) redirect("/admin");
  return a;
}
