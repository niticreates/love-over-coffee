import { randomBytes, randomUUID } from "node:crypto";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I

export function shortRef(prefix: string, len = 6): string {
  const bytes = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `${prefix}-${s}`;
}

export const uuid = () => randomUUID();
export const token = () => randomBytes(24).toString("base64url");
