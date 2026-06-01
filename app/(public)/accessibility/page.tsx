import { LegalPage } from "@/components/public/LegalPage";

export const metadata = {
  title: "Accessibility Statement — EduPortal",
  description:
    "Our commitment to making EduPortal usable by everyone — including learners who rely on assistive technologies.",
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Accessibility Statement"
      lastUpdated="May 1, 2026"
      intro="Learning is for everyone. We're committed to making EduPortal usable by people of all abilities, and to fixing accessibility issues quickly when they surface. This statement explains where we are today and how to report problems."
      sections={[
        {
          id: "commitment",
          title: "Our commitment",
          body: `EduPortal aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA across our website, web app, and mobile apps.

Accessibility is part of every product review — not a checklist done once. We test with screen readers, keyboard-only navigation, and reduced-motion settings before shipping.`,
        },
        {
          id: "what-we-do",
          title: "What we do today",
          body: `**Keyboard navigation** — Every interactive element is reachable via Tab, with visible focus rings and logical order.

**Screen readers** — We test with NVDA (Windows), VoiceOver (macOS/iOS), and TalkBack (Android). All buttons, links, and form fields have accessible labels.

**Color & contrast** — Text and meaningful UI elements meet WCAG AA contrast ratios. We also offer a dark theme and respect your system preference.

**Motion** — We honor \`prefers-reduced-motion\`. Decorative animations stop; informational ones become instant transitions.

**Captions & transcripts** — Every course video includes editor-reviewed captions. Transcripts are downloadable from the chapter page.

**Text resizing** — Layouts adapt up to 200% zoom without horizontal scrolling.`,
        },
        {
          id: "known-issues",
          title: "Known issues we're working on",
          body: `**Older course catalog (~5% of courses)** — Some legacy videos have auto-generated captions only. We're re-captioning these and expect to finish by Q3 2026.

**Live class chat** — Screen-reader announcements during high-volume chat can be noisy. We're shipping a "polite" mode in the next release.

**PDF assignments** — A handful of older PDFs are image-based and not screen-reader-accessible. We're replacing them with HTML versions.

If you hit a barrier not listed here, please tell us so we can prioritize.`,
        },
        {
          id: "assistive-tech",
          title: "Compatible assistive technology",
          body: `EduPortal is tested with:

- **Screen readers** — NVDA 2024+, JAWS 2024+, VoiceOver (latest macOS/iOS), TalkBack (Android 13+)
- **Magnification** — ZoomText, native browser zoom up to 400%
- **Voice control** — Dragon NaturallySpeaking, Voice Control (macOS/iOS), Voice Access (Android)
- **Keyboards & switches** — Full keyboard navigation; we don't trap focus inside modals or menus.

We support the latest two versions of Chrome, Safari, Firefox, and Edge on desktop, plus iOS Safari and Android Chrome.`,
        },
        {
          id: "feedback",
          title: "Report an issue",
          body: `Did you run into something that didn't work for you? Please let us know. We aim to acknowledge accessibility reports within 2 business days and to fix issues within 30 days, depending on complexity.

Email: accessibility@eduportal.example
Subject: include "Accessibility" and a brief description of the issue.

If helpful, include: the URL, your browser and assistive tech, and what you expected to happen.`,
        },
        {
          id: "alternative",
          title: "Alternative formats",
          body: `If you can't access content in its current form, we can usually provide an alternative — a transcript, a printable PDF, or a one-on-one walkthrough. Email accessibility@eduportal.example and we'll arrange it.`,
        },
        {
          id: "third-party",
          title: "Third-party content",
          body: `Some content is contributed by external instructors. We provide an accessibility checklist and pre-publish review, but issues may still appear. Please report them — we treat external-content accessibility issues with the same priority as our own.`,
        },
        {
          id: "review-date",
          title: "Last reviewed",
          body: `This statement was last reviewed on May 1, 2026 by our Accessibility team and an external auditor. We re-audit at least twice a year and after every major release.`,
        },
      ]}
    />
  );
}
