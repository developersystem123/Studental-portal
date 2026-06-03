// TOTP (RFC 6238) implementation using the Web Crypto API — no external packages needed.
// Generates and verifies 6-digit time-based one-time passwords.

const DIGITS = 6;
const STEP   = 30; // seconds per window
const WINDOW = 1;  // ±1 window tolerance for clock drift

// Base32 decode (RFC 4648 alphabet, no padding required)
function base32Decode(input: string): Uint8Array {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const s = input.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(Math.floor((s.length * 5) / 8));
  for (const char of s) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return output;
}

// Base32 encode
function base32Encode(bytes: Uint8Array): string {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

// Generate a cryptographically random 20-byte (160-bit) secret, base32-encoded
export async function generateTotpSecret(): Promise<string> {
  const buf   = new ArrayBuffer(20);
  const bytes = new Uint8Array(buf);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

// Compute one TOTP token for a given secret + timestamp (in seconds)
async function computeTotp(secret: string, ts: number): Promise<string> {
  const counter = Math.floor(ts / STEP);
  const msgBuf  = new ArrayBuffer(8);
  const msg     = new Uint8Array(msgBuf);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = tmp & 0xff;
    tmp >>>= 8;
  }
  const secretBytes = base32Decode(secret);
  const keyBuf      = secretBytes.buffer.slice(secretBytes.byteOffset, secretBytes.byteOffset + secretBytes.byteLength) as ArrayBuffer;
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig    = await crypto.subtle.sign("HMAC", key, msgBuf);
  const hash   = new Uint8Array(sig);
  const offset = hash[hash.length - 1] & 0xf;
  const code   = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                  (hash[offset + 3] & 0xff);
  return String(code % 10 ** DIGITS).padStart(DIGITS, "0");
}

// Verify a 6-digit token against a secret, tolerating ±WINDOW time steps
export async function verifyTotp(secret: string, token: string): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  for (let delta = -WINDOW; delta <= WINDOW; delta++) {
    const expected = await computeTotp(secret, now + delta * STEP);
    if (expected === token) return true;
  }
  return false;
}

// Build the otpauth:// URI for QR code generation (Google Authenticator compatible)
export function totpUri(secret: string, account: string, issuer = "EduPortal"): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP),
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?${params}`;
}
