import { LegalPage } from "@/components/public/LegalPage";

export const metadata = {
  title: "Cookie Policy — EduPortal",
  description:
    "What cookies we use, why we use them, and how to control them. We keep tracking minimal and don't use third-party ad cookies.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      lastUpdated="May 1, 2026"
      intro="Cookies are small text files saved on your device. We use them sparingly — mostly to keep you signed in and to understand which parts of EduPortal are working. We never use third-party ad cookies."
      sections={[
        {
          id: "what-are-cookies",
          title: "What are cookies?",
          body: `Cookies are small files stored by your browser when you visit a website. They let the site remember things between visits (like staying signed in) and help us measure how the site is used.

Some cookies are first-party (set by EduPortal) and some are third-party (set by a service we use, like Stripe for payments). All cookies we use are listed below.`,
        },
        {
          id: "categories",
          title: "Categories of cookies we use",
          body: `**Essential cookies** — Required for the site to function. These keep you signed in, remember your theme, and protect against CSRF attacks. You can't opt out of these without breaking core functionality.

**Preference cookies** — Remember your settings: language, theme (light/dark), notification preferences. These don't track you across sites.

**Analytics cookies** — Help us understand how learners use EduPortal in aggregate. We use a privacy-friendly analytics provider that doesn't fingerprint users.

**Payment cookies** — Set by Stripe when you reach a payment page. These help prevent fraud and are required to process payments.

We don't use advertising cookies, retargeting cookies, or sell cookie data to third parties.`,
        },
        {
          id: "specific-cookies",
          title: "Specific cookies we set",
          body: `**eduportal_session** — Essential. Keeps you signed in. Expires after 30 days of inactivity.

**eduportal_theme** — Preference. Remembers your light/dark theme. Expires after 1 year.

**eduportal_csrf** — Essential. CSRF protection token. Session-only.

**_plausible_unique** — Analytics. Counts unique visitors (no personal data). Expires after 24 hours.

**__stripe_mid** / **__stripe_sid** — Payment (Stripe). Fraud prevention on checkout pages. Expires after 1 year / 30 minutes.`,
        },
        {
          id: "do-not-track",
          title: "Do Not Track",
          body: `We respect the Global Privacy Control (GPC) signal. If your browser sends GPC, we automatically disable analytics cookies for you.

We also honor "Do Not Track" headers where technically feasible.`,
        },
        {
          id: "controlling",
          title: "Controlling cookies",
          body: `Most browsers let you view, delete, and block cookies via Settings. You can also use Incognito / Private Browsing mode to start fresh each session.

Note: blocking essential cookies will sign you out and may break parts of the site. We won't be able to remember preferences or keep you logged in.

If you'd like to opt out of analytics specifically (while keeping the site working), you can do so from Settings → Privacy → Analytics.`,
        },
        {
          id: "third-party",
          title: "Third-party services",
          body: `When you watch a video, the player loads from a CDN (no cookies). When you start a Stripe checkout, Stripe sets its own cookies on its own domain. When you use Google sign-in, Google may set cookies on its own domain.

We never embed third-party tracking pixels, ad networks, or social-media share widgets that load tracking by default.`,
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: `When we change the list of cookies materially, we'll update this page and the "last updated" date at the top. For significant changes, we'll show a banner the next time you visit.`,
        },
      ]}
    />
  );
}
