// Signed admin session cookie (HMAC-SHA256 via Web Crypto — works in Node and Edge middleware).
export const SESSION_COOKIE = "loc_admin";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export type Role = "owner" | "manager" | "staff";
export interface SessionPayload {
  uid: string;
  name: string;
  role: Role;
  exp: number; // epoch seconds
}

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function key(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export function sessionSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SUPABASE_URL)
    throw new Error("ADMIN_SESSION_SECRET (32+ chars) is required in production");
  // Preview/dev fallback: stable per process.
  const g = globalThis as unknown as { __locDevSecret?: string };
  g.__locDevSecret ??= b64url(crypto.getRandomValues(new Uint8Array(32)));
  return g.__locDevSecret;
}

export async function signSession(p: SessionPayload, secret = sessionSecret()): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(p)));
  const sig = await crypto.subtle.sign("HMAC", await key(secret), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined, secret = sessionSecret()): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(secret), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    if (typeof p.exp !== "number" || p.exp < Date.now() / 1000) return null;
    return p;
  } catch {
    return null;
  }
}

const RANK: Record<Role, number> = { staff: 1, manager: 2, owner: 3 };
export const hasRole = (have: Role, need: Role) => RANK[have] >= RANK[need];
