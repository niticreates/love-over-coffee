import { describe, expect, it } from "vitest";
import { isRecoveryFragment, parseRecoveryLink, recoveryErrorMessage, validateNewPassword } from "@/lib/recovery";

describe("recovery link parsing", () => {
  it("reads the implicit-flow fragment Supabase sends by default", () => {
    const l = parseRecoveryLink("#access_token=AT&expires_in=3600&refresh_token=RT&token_type=bearer&type=recovery", "");
    expect(l).toEqual({ kind: "tokens", accessToken: "AT", refreshToken: "RT" });
  });
  it("reads a token-hash link", () => {
    expect(parseRecoveryLink("", "?token_hash=TH&type=recovery")).toEqual({ kind: "token_hash", tokenHash: "TH" });
    expect(parseRecoveryLink("", "?token_hash=TH&type=signup").kind).toBe("none");
  });
  it("ignores non-recovery tokens", () => {
    expect(parseRecoveryLink("#access_token=AT&refresh_token=RT&type=magiclink", "").kind).toBe("none");
  });
  it("reports expired links", () => {
    const l = parseRecoveryLink("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired", "");
    expect(l).toMatchObject({ kind: "error", code: "otp_expired" });
    expect(recoveryErrorMessage("otp_expired")).toMatch(/expired/);
  });
  it("flags PKCE codes and empty visits", () => {
    expect(parseRecoveryLink("", "?code=abc").kind).toBe("code");
    expect(parseRecoveryLink("", "").kind).toBe("none");
  });
  it("detects recovery fragments for the homepage redirect", () => {
    expect(isRecoveryFragment("#access_token=AT&refresh_token=RT&type=recovery")).toBe(true);
    expect(isRecoveryFragment("#error=access_denied&error_code=otp_expired&error_description=x")).toBe(true);
    expect(isRecoveryFragment("#menu")).toBe(false);
    expect(isRecoveryFragment("")).toBe(false);
  });
});

describe("new password rules", () => {
  it("needs 8+ characters, at most 72 bytes, and a matching confirmation", () => {
    expect(validateNewPassword("short", "short")).toMatch(/at least 8/);
    expect(validateNewPassword("        ", "        ")).toMatch(/spaces/);
    expect(validateNewPassword("a".repeat(73), "a".repeat(73))).toMatch(/at most 72/);
    expect(validateNewPassword("long-enough-1", "long-enough-2")).toMatch(/don't match/);
    expect(validateNewPassword("long-enough-1", "long-enough-1")).toBeNull();
  });
});
