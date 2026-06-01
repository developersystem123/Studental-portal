// Thin Stripe helper. Uses fetch directly (no SDK install required) and the
// caller falls back to a simulated charge when STRIPE_SECRET_KEY is not set,
// so the billing flow stays fully functional without API keys — mirroring the
// graceful-fallback approach in lib/claude.ts.
//
// To go live: set STRIPE_SECRET_KEY (sk_test_… or sk_live_…) in .env.

const STRIPE_API = "https://api.stripe.com/v1";
const SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export function hasStripeKey(): boolean {
  return Boolean(SECRET_KEY && SECRET_KEY.startsWith("sk_"));
}

function encodeForm(params: Record<string, string | number>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) sp.append(k, String(v));
  return sp.toString();
}

export type CheckoutSession = { id: string; url: string };

/** Create a Stripe Checkout Session and return its id + hosted payment URL. */
export async function createCheckoutSession(opts: {
  amount: number; // smallest currency unit (e.g. cents)
  currency?: string;
  productName: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}): Promise<CheckoutSession> {
  if (!hasStripeKey()) throw new Error("STRIPE_SECRET_KEY not set");

  const params: Record<string, string | number> = {
    mode: "payment",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    "line_items[0][quantity]": 1,
    "line_items[0][price_data][currency]": (opts.currency ?? "usd").toLowerCase(),
    "line_items[0][price_data][unit_amount]": opts.amount,
    "line_items[0][price_data][product_data][name]": opts.productName,
  };
  if (opts.customerEmail) params.customer_email = opts.customerEmail;
  for (const [k, v] of Object.entries(opts.metadata ?? {})) {
    params[`metadata[${k}]`] = v;
  }

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encodeForm(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `Stripe error ${res.status}`);
  return { id: data.id as string, url: data.url as string };
}

/** Look up a Checkout Session to confirm whether it was actually paid. */
export async function retrieveCheckoutSession(
  id: string,
): Promise<{ id: string; paymentStatus: string; amountTotal: number | null }> {
  if (!hasStripeKey()) throw new Error("STRIPE_SECRET_KEY not set");

  const res = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${SECRET_KEY}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `Stripe error ${res.status}`);
  return {
    id: data.id as string,
    paymentStatus: (data.payment_status as string) ?? "unpaid",
    amountTotal: (data.amount_total as number) ?? null,
  };
}
