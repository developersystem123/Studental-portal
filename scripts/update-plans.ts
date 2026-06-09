import { prisma } from "../lib/db";

async function main() {
  // Rename "free" → "starter" and set new prices, or create if missing
  const updates = [
    {
      key: "free",
      newKey: "starter",
      name: "Starter",
      tagline: "Everything you need to get going.",
      monthlyPrice: 499,
      annualPrice: 4790,
      order: 0,
      features: [
        "Access to all free courses",
        "Community forum",
        "Track up to 10 enrolled courses",
        "AI chat (20 queries/day)",
        "Mobile app access",
        "Email support",
      ],
    },
    {
      key: "pro",
      newKey: "pro",
      name: "Pro",
      tagline: "Everything you need to master a skill.",
      monthlyPrice: 999,
      annualPrice: 9590,
      order: 1,
      features: [
        "All Starter features",
        "Unlimited AI chat & quiz generation",
        "Access to all paid courses",
        "Live class participation",
        "Verifiable certificates",
        "Offline downloads (mobile)",
        "Priority support",
      ],
    },
    {
      key: "team",
      newKey: "team",
      name: "Team",
      tagline: "For study groups, families, or small teams.",
      monthlyPrice: 1999,
      annualPrice: 19190,
      order: 2,
      features: [
        "All Pro features",
        "Up to 5 team members",
        "Team progress dashboard",
        "Shared notes & discussions",
        "Admin invoicing",
        "Dedicated account manager",
      ],
    },
  ];

  for (const u of updates) {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { key: u.key } });
    if (existing) {
      await prisma.subscriptionPlan.update({
        where: { key: u.key },
        data: {
          key: u.newKey,
          name: u.name,
          tagline: u.tagline,
          monthlyPrice: u.monthlyPrice,
          annualPrice: u.annualPrice,
          order: u.order,
          features: u.features,
        },
      });
      console.log(`  ✓ Updated plan: ${u.key} → ${u.newKey} (Rs ${u.monthlyPrice}/mo)`);
    } else {
      // Try finding by newKey (already updated)
      const existing2 = await prisma.subscriptionPlan.findUnique({ where: { key: u.newKey } });
      if (existing2) {
        await prisma.subscriptionPlan.update({
          where: { key: u.newKey },
          data: {
            name: u.name,
            tagline: u.tagline,
            monthlyPrice: u.monthlyPrice,
            annualPrice: u.annualPrice,
            order: u.order,
            features: u.features,
          },
        });
        console.log(`  ✓ Updated plan: ${u.newKey} (Rs ${u.monthlyPrice}/mo)`);
      } else {
        console.log(`  ⚠ Plan not found: ${u.key}`);
      }
    }
  }

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
