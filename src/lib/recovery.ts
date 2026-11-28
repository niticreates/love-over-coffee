// Password-recovery helpers shared by the browser reset page and its tests. No secrets here:
// the link's tokens are read once, handed to Supabase Auth and wiped from the address bar.

export const RESET_PATH = "/auth/reset-password";
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72; // bcrypt, which Supabase Auth uses, ignores bytes past 72

export type RecoveryLink =
  | { kind: "tokens"; accessToken: string; refreshToken: string }
  | { kind: "token_hash"; tokenHash: string }
  | { kind: "code" }
  | { kind: "error"; code: string; description: string }
  | { kind: "none" };

/**
 * Reads a Supabase recovery link. Supports:
 * - the implicit flow: `#access_token=…&refresh_token=…&type=recovery` (what Supabase sends by default),
 * - a token-hash email template: `?token_hash=…&type=recovery`,
 * - error redirects: `#error=…&error_code=otp_expired&error_description=…`,
 * - a PKCE `?code=…`, which can't be completed here (its verifier lives in the browser that asked).
 */
export function parseRecoveryLink(hash: string, search: string): RecoveryLink {
  const h = new URLSearchParams(hash.replace(/^#/, ""));
  const q = new URLSearchParams(search.replace(/^\?/, ""));
  const errorCode = h.get("error_code") ?? q.get("error_code") ?? h.get("error") ?? q.get("error");
  if (errorCode) return { kind: "error", code: errorCode, description: h.get("error_description") ?? q.get("error_description") ?? "" };
  const accessToken = h.get("access_token");
  const refreshToken = h.get("refresh_token");
  if (accessToken && refreshToken && (h.get("type") ?? "recovery") === "recovery") return { kind: "tokens", accessToken, refreshToken };
  const tokenHash = q.get("token_hash");
  if (tokenHash && q.get("type") === "recovery") return { kind: "token_hash", tokenHash };
  if (q.get("code")) return { kind: "code" };
  return { kind: "none" };
}

/** True for a URL fragment that belongs to a Supabase recovery link (or its error redirect). */
export function isRecoveryFragment(hash: string): boolean {
  const h = new URLSearchParams(hash.replace(/^#/, ""));
  if (h.get("type") === "recovery" && h.get("access_token")) return true;
  return Boolean(h.get("error_code") && (h.get("error") || h.get("error_description")));
}

export function validateNewPassword(password: string, confirm: string): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (new TextEncoder().encode(password).length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  if (!password.trim()) return "The password can't be only spaces.";
  if (password !== confirm) return "The two passwords don't match.";
  return null;
}

/** Plain-language message for a Supabase Auth error code. Never echoes tokens or passwords. */
export function recoveryErrorMessage(code: string | undefined, fallback?: string): string {
  switch (code) {
    case "otp_expired":
    case "access_denied":
    case "session_expired":
    case "session_not_found":
    case "bad_jwt":
    case "refresh_token_not_found":
    case "refresh_token_already_used":
    case "flow_state_expired":
    case "flow_state_not_found":
      return "This reset link has expired or was already used. Request a new one below.";
    case "same_password":
      return "Choose a password different from your current one.";
    case "weak_password":
      return fallback || "That password is too weak. Try a longer one.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    default:
      return "Something went wrong. Please request a new reset link and try again.";
  }
}
