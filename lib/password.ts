// Password hashing using Node's built-in scrypt. No external deps.
// Stored format: `scrypt$<saltHex>$<hashHex>`

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;
const SALT_BYTES = 16;
const PREFIX = "scrypt";

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(password, salt, KEYLEN);
  return `${PREFIX}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  // Backwards-compat: if the stored value is plaintext (legacy seed),
  // use a timing-safe comparison to avoid timing attacks.
  if (!stored.startsWith(`${PREFIX}$`)) {
    const storedBuf = Buffer.from(stored);
    const passwordBuf = Buffer.from(password);
    if (storedBuf.length !== passwordBuf.length) return false;
    return timingSafeEqual(storedBuf, passwordBuf);
  }
  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
