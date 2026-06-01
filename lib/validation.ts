// Shared form-validation helpers. Every form in the app uses these so the
// rules — and the error messages — stay identical everywhere.
//
// Each `validate*` function returns an error string when the value is invalid,
// or `undefined` when it's fine.

// ---------- Phone numbers ----------
// Rule: 10–15 digits. Anything shorter or longer is rejected, and a number
// with more than 15 digits surfaces an explicit error (rather than silently
// truncating) so the user sees what went wrong.

export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 15;

// Strip characters a phone number can't contain. Capped at 20 chars so a user
// CAN type past 15 digits — that's what triggers the "too long" error.
export function cleanPhoneInput(raw: string): string {
  return raw.replace(/[^\d+\s-]/g, "").slice(0, 20);
}

// Count just the digits in a phone string.
export function phoneDigitCount(raw: string): number {
  return raw.replace(/\D/g, "").length;
}

export function validatePhone(raw: string, required = true): string | undefined {
  const v = (raw ?? "").trim();
  if (!v) return required ? "Phone number is required." : undefined;
  if (!/^\+?[\d\s-]+$/.test(v))
    return "Phone can only contain digits, spaces, hyphens and an optional leading +.";
  const digits = v.replace(/\D/g, "").length;
  if (digits < PHONE_MIN_DIGITS)
    return `Phone number must be at least ${PHONE_MIN_DIGITS} digits.`;
  if (digits > PHONE_MAX_DIGITS)
    return `Phone number cannot be more than ${PHONE_MAX_DIGITS} digits.`;
  return undefined;
}

// ---------- Email ----------
export function validateEmail(raw: string, required = true): string | undefined {
  const v = (raw ?? "").trim();
  if (!v) return required ? "Email is required." : undefined;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v))
    return "Enter a valid email address (e.g. you@example.com).";
  return undefined;
}

// ---------- Required / length ----------
export function validateRequired(raw: string, label = "This field"): string | undefined {
  return (raw ?? "").trim() ? undefined : `${label} is required.`;
}

export function validateLength(
  raw: string,
  label: string,
  min: number,
  max?: number,
  required = true,
): string | undefined {
  const v = (raw ?? "").trim();
  if (!v) return required ? `${label} is required.` : undefined;
  if (v.length < min) return `${label} must be at least ${min} characters.`;
  if (max !== undefined && v.length > max)
    return `${label} cannot be more than ${max} characters.`;
  return undefined;
}

// ---------- Person name ----------
// Letters, spaces, dots, hyphens and apostrophes only.
export function validateName(raw: string, label = "Name"): string | undefined {
  const v = (raw ?? "").trim();
  if (!v) return `${label} is required.`;
  if (v.length < 3) return `${label} must be at least 3 characters.`;
  if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(v))
    return `${label} can only contain letters, spaces, dots, hyphens and apostrophes.`;
  return undefined;
}

// ---------- Password ----------
export function validatePassword(raw: string, min = 6): string | undefined {
  if (!raw) return "Password is required.";
  if (raw.length < min) return `Password must be at least ${min} characters.`;
  return undefined;
}

// ---------- Whole-number field ----------
export function validateNumber(
  raw: string | number,
  label: string,
  opts: { min?: number; max?: number; integer?: boolean; required?: boolean } = {},
): string | undefined {
  const { min, max, integer, required = true } = opts;
  const str = String(raw ?? "").trim();
  if (!str) return required ? `${label} is required.` : undefined;
  const n = Number(str);
  if (!Number.isFinite(n)) return `${label} must be a valid number.`;
  if (integer && !Number.isInteger(n)) return `${label} must be a whole number.`;
  if (min !== undefined && n < min) return `${label} must be at least ${min}.`;
  if (max !== undefined && n > max) return `${label} cannot be more than ${max}.`;
  return undefined;
}

// True when every value in the record is `undefined` (i.e. no errors).
export function isClean(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).every((e) => !e);
}
