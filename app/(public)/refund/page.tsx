import { LegalPage } from "@/components/public/LegalPage";

export const metadata = {
  title: "Refund Policy — EduPortal",
  description: "When and how you can request a refund.",
};

export default function RefundPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Refund Policy"
      lastUpdated="May 1, 2026"
      intro="We want you to be confident learning with EduPortal. If a course isn't right for you, here's how refunds work. Short version: 14 days, less than 25% completed, easy to request."
      sections={[
        {
          id: "eligibility",
          title: "Refund eligibility",
          body: `**Individual courses** — full refund if you request within 14 days of purchase AND you've completed less than 25% of the course content.

**Pro / Team subscriptions** — full refund within 7 days of first sign-up, provided AI usage is below our fair-use threshold for the period.

**Renewals** — pro-rated refunds are not provided for mid-cycle cancellations. Cancel anytime to prevent future renewal.

**Live class one-time tickets** — refunds available up to 24 hours before the session start.`,
        },
        {
          id: "not-eligible",
          title: "Not eligible for refund",
          body: `• Courses with more than 25% content completed
• Certificates already issued (course was completed)
• Bundle packages where one or more courses are completed
• Refund requests made after 14 days
• Cases of clear abuse (e.g., bulk-buying for redistribution)

We may make exceptions for accessibility or hardship — contact us.`,
        },
        {
          id: "how-to-request",
          title: "How to request a refund",
          body: `1. Open a ticket in **Help & Support** with the subject "Refund request"
2. Include the course/plan name and reason (helps us improve)
3. We review within 3 business days
4. Approved refunds reach your original payment method in 5–10 business days, depending on your bank

You can also email refunds@eduportal.example with the same details.`,
        },
        {
          id: "currency-tax",
          title: "Currency and taxes",
          body: `Refunds are issued in the same currency as the original payment. Exchange rate differences are not compensated.

Local taxes (VAT, GST) are refunded along with the principal where the law requires.`,
        },
        {
          id: "subscriptions",
          title: "Cancelling subscriptions",
          body: `You can cancel Pro/Team at any time from Billing → Manage subscription. You'll keep access until the end of your current billing period.

No partial refunds for unused days within a cycle, but you also won't be charged again.`,
        },
        {
          id: "disputes",
          title: "Disputes and chargebacks",
          body: `Please contact us before filing a chargeback — we almost always resolve disputes faster directly. Chargebacks may result in account suspension while under review.`,
        },
        {
          id: "contact",
          title: "Contact",
          body: `For refund-related questions: refunds@eduportal.example
For general support: support@eduportal.example
Average response time: under 24 hours, Mon–Fri.`,
        },
      ]}
    />
  );
}
