import { LegalPage } from "@/components/public/LegalPage";

export const metadata = {
  title: "Terms of Service — EduPortal",
  description: "The rules of using EduPortal.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      lastUpdated="May 1, 2026"
      intro="By accessing or using EduPortal, you agree to these terms. Please read them carefully — they explain your rights and responsibilities when using our service."
      sections={[
        {
          id: "accounts",
          title: "Accounts",
          body: `You must be at least 13 years old to create an account. If you're under 18, a parent or guardian must agree to these terms on your behalf.

You're responsible for keeping your password safe and for everything that happens under your account. Notify us immediately if you suspect unauthorized access.

We may suspend or terminate accounts that violate these terms, abuse the service, or harm other users.`,
        },
        {
          id: "content",
          title: "Course content & licensing",
          body: `When you enroll in a course, we grant you a personal, non-transferable license to access that content for your own learning. You may not redistribute, resell, or publicly share course videos, assignments, or materials.

Instructors retain copyright over their content. EduPortal hosts and delivers content under license from instructors.

You retain ownership of submissions, forum posts, and notes you create. By posting publicly, you grant other users a license to read, quote, and respond.`,
        },
        {
          id: "ai-use",
          title: "AI assistant usage",
          body: `Our AI assistant is provided as a study aid. It can make mistakes, hallucinate facts, or give incomplete answers — always verify important information.

You may not use the AI to: cheat on graded assessments where AI use is prohibited, generate harmful or illegal content, or systematically extract training data.

Pro plan AI usage is "fair use." We may rate-limit accounts that exceed reasonable consumption.`,
        },
        {
          id: "conduct",
          title: "Community guidelines",
          body: `Be respectful. Don't post harassment, hate speech, or content that targets individuals or groups.

Don't spam, advertise without permission, or impersonate others.

Forum posts and messages can be reported. Repeated violations lead to account suspension.`,
        },
        {
          id: "payments",
          title: "Payments & billing",
          body: `Paid courses and Pro subscriptions are billed in advance. Subscriptions auto-renew until cancelled.

Prices are in USD unless stated otherwise. Local taxes may apply.

Refunds are governed by our separate Refund Policy.`,
        },
        {
          id: "termination",
          title: "Termination",
          body: `You can delete your account at any time from Settings. We can suspend access for violations of these terms.

Upon termination, you lose access to paid content. We may retain certain records as required by law.`,
        },
        {
          id: "disclaimers",
          title: "Disclaimers & limitations",
          body: `EduPortal is provided "as is." We don't guarantee that courses will lead to specific career outcomes, exam results, or income. Certificates reflect course completion, not professional licensure.

To the maximum extent permitted by law, our liability is limited to the amount you paid us in the prior 12 months.`,
        },
        {
          id: "changes",
          title: "Changes to these terms",
          body: `We may update these terms. We'll notify active users by email at least 14 days before material changes take effect.

Continued use after the effective date means you accept the updated terms.`,
        },
        {
          id: "law",
          title: "Governing law",
          body: `These terms are governed by the laws of the jurisdiction in which EduPortal is incorporated. Disputes are subject to the exclusive jurisdiction of those courts.`,
        },
      ]}
    />
  );
}
