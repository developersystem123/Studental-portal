import { LegalPage } from "@/components/public/LegalPage";

export const metadata = {
  title: "Privacy Policy — EduPortal",
  description: "How we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      lastUpdated="May 1, 2026"
      intro="Your privacy matters. This policy explains what we collect, why we collect it, and the choices you have. We try to keep it short and clear — if anything's unclear, ask us."
      sections={[
        {
          id: "what-we-collect",
          title: "What we collect",
          body: `**Account data** — name, email, password (hashed), phone (optional), education level (optional).

**Activity data** — courses you enroll in, lessons completed, quiz attempts, time spent learning, AI chat history.

**Payment data** — billing email and last 4 digits of cards. Full card numbers are never stored on our servers; payments are processed by Stripe.

**Device data** — browser type, IP address, and rough geographic region for security and analytics.`,
        },
        {
          id: "how-we-use",
          title: "How we use your data",
          body: `To provide the service: enroll you in courses, track progress, issue certificates, deliver AI tutoring, send notifications you've opted into.

To improve the product: aggregate usage analytics, A/B testing, bug investigation.

To communicate: account emails, security alerts, and (only if you opted in) marketing emails.

We never sell personal data to third parties.`,
        },
        {
          id: "ai-data",
          title: "AI assistant data",
          body: `Your chats with the AI tutor are sent to our model provider to generate responses. We don't use your conversations to train models without explicit consent.

You can clear AI chat history any time from Settings.`,
        },
        {
          id: "cookies",
          title: "Cookies & tracking",
          body: `We use essential cookies for login sessions and preferences. We also use privacy-friendly analytics to measure traffic. We don't use third-party advertising cookies.

You can clear cookies via your browser. Some features require cookies to function (e.g., staying signed in).`,
        },
        {
          id: "sharing",
          title: "Who we share data with",
          body: `**Service providers** — hosting (cloud provider), email (transactional email service), payments (Stripe), AI inference (model provider). They process data only on our behalf under strict contracts.

**Legal requests** — if compelled by law, we may disclose data. We push back on overreaching requests.

**Business transfers** — if EduPortal is acquired, your data transfers under the same privacy commitments.`,
        },
        {
          id: "rights",
          title: "Your rights",
          body: `You can access, correct, export, or delete your personal data. Most of these actions are self-serve in Settings.

For deletion or export requests we can't automate, email privacy@eduportal.example. We respond within 30 days.

Depending on where you live (GDPR, CCPA, PDPA), you may have additional rights. We honor them regardless of jurisdiction.`,
        },
        {
          id: "security",
          title: "Security",
          body: `We use HTTPS everywhere, hash passwords with strong algorithms, and encrypt sensitive data at rest. Access to production systems is limited and audited.

No system is perfectly secure. If we discover a breach affecting your data, we'll notify you promptly.`,
        },
        {
          id: "retention",
          title: "Data retention",
          body: `We keep account data while your account is active and for up to 90 days after deletion (for backups and disputes).

Certificate records may be kept longer for verification purposes — these contain only your name, course, and date, never sensitive data.`,
        },
        {
          id: "children",
          title: "Children's privacy",
          body: `EduPortal is not directed at children under 13. We don't knowingly collect data from anyone under 13. If you believe we have, please contact us and we'll delete it.`,
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: `When we update this policy materially, we'll email active users at least 14 days before changes take effect. Minor edits (typos, clarifications) may be made without notice.`,
        },
      ]}
    />
  );
}
