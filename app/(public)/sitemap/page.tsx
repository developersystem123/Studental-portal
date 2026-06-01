import Link from "next/link";
import Icon from "@/components/icons";
import { Card, CardBody } from "@/components/ui";

export const metadata = {
  title: "Sitemap — EduPortal",
  description: "Every public page on EduPortal, in one place.",
};

const sections: {
  title: string;
  icon: React.ReactNode;
  links: { href: string; label: string; description?: string }[];
}[] = [
  {
    title: "Product",
    icon: <Icon.Sparkles size={20} />,
    links: [
      { href: "/", label: "Home", description: "Landing & overview" },
      { href: "/courses", label: "Courses", description: "Full catalog" },
      { href: "/pricing", label: "Pricing", description: "Plans & comparison" },
      { href: "/business", label: "For Business", description: "Teams & enterprise" },
      { href: "/teach", label: "Become a Teacher", description: "Apply to teach" },
    ],
  },
  {
    title: "Company",
    icon: <Icon.Users size={20} />,
    links: [
      { href: "/about", label: "About", description: "Our story & team" },
      { href: "/careers", label: "Careers", description: "Open roles" },
      { href: "/press", label: "Press & Media", description: "News and brand kit" },
      { href: "/contact", label: "Contact", description: "Get in touch" },
      { href: "/testimonials", label: "Testimonials", description: "Stories from learners" },
    ],
  },
  {
    title: "Resources",
    icon: <Icon.Book size={20} />,
    links: [
      { href: "/help", label: "Help Center", description: "Articles & how-tos" },
      { href: "/faq", label: "FAQ", description: "Frequently asked questions" },
      { href: "/blog", label: "Blog", description: "Articles & guides" },
      { href: "/affiliate", label: "Affiliate Program", description: "Earn while sharing" },
      { href: "/status", label: "Service Status", description: "Uptime & incidents" },
    ],
  },
  {
    title: "Account",
    icon: <Icon.User size={20} />,
    links: [
      { href: "/login", label: "Sign in", description: "Returning learners" },
      { href: "/register", label: "Create account", description: "Free to start" },
      { href: "/dashboard", label: "Student dashboard", description: "Continue learning (signed-in)" },
      { href: "/teacher", label: "Teacher portal", description: "For instructors" },
      { href: "/admin", label: "Admin console", description: "For administrators" },
    ],
  },
  {
    title: "Legal",
    icon: <Icon.Lock size={20} />,
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/cookies", label: "Cookie Policy" },
      { href: "/refund", label: "Refund Policy" },
      { href: "/accessibility", label: "Accessibility Statement" },
    ],
  },
];

export default function SitemapPage() {
  const totalLinks = sections.reduce((sum, s) => sum + s.links.length, 0);

  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 lg:pt-20 lg:pb-12 text-center">
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Sitemap</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight">
          Every page, in <span className="gradient-text">one place</span>
        </h1>
        <p className="mt-4 text-lg text-[var(--muted)] max-w-2xl mx-auto">
          A quick overview of {totalLinks} public pages. If you&apos;re looking for something specific, try the search
          in our{" "}
          <Link href="/help" className="text-[var(--primary)] hover:underline">
            Help Center
          </Link>
          .
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map((s) => (
          <Card key={s.title} className="h-full">
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                  {s.icon}
                </div>
                <h2 className="text-lg font-semibold">{s.title}</h2>
              </div>
              <ul className="space-y-1">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="group flex items-start gap-2 py-2 px-2 -mx-2 rounded-lg hover:bg-[var(--surface-2)] transition"
                    >
                      <Icon.ChevronRight
                        size={14}
                        className="text-[var(--muted-2)] mt-1 group-hover:text-[var(--primary)] transition shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="text-sm font-medium group-hover:text-[var(--primary)] transition block leading-snug">
                          {l.label}
                        </span>
                        {l.description && (
                          <span className="text-xs text-[var(--muted)] block">{l.description}</span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </section>
    </div>
  );
}
