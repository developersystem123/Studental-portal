// Seeds the local Postgres DB with the same demo content the in-memory
// store uses today, so the database mirrors the running app on day one.
//
// Run with:   npm run db:seed
// (or `prisma db seed` once seed config is in prisma.config.ts)

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type CourseCategory } from "../lib/generated/prisma/client.js";
import { hashPassword } from "../lib/password";
import {
  COURSES,
  DEFAULT_CERTIFICATES,
  DEFAULT_ENROLLMENTS,
  DEFAULT_NOTIFICATIONS,
} from "../lib/mockData";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Check your .env file.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// Demo accounts. Passwords are hashed at seed time via scrypt — login routes
// verify with the matching helper in lib/password.ts.
const DEMO_USERS = [
  {
    id: "u-demo",
    name: "Demo Student",
    email: "student@demo.com",
    password: "demo1234",
    role: "Student" as const,
    bio: "Lifelong learner exploring web dev, design, and languages.",
    phone: "+92 90000 00000",
    education: "Intermediate" as const,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
  {
    id: "u-teacher",
    name: "Demo Instructor",
    email: "teacher@demo.com",
    password: "demo1234",
    role: "Instructor" as const,
    bio: "Web Dev instructor & community mentor.",
    phone: "+92 90000 00001",
    education: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
  },
  {
    id: "u-admin",
    name: "Office Admin",
    email: "admin@demo.com",
    password: "demo1234",
    role: "Admin" as const,
    bio: "Office administrator.",
    phone: "+92 90000 00099",
    education: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
  },
];

// Map the human-readable categories in mockData to the Prisma enum values
// (Prisma can't have enum members with spaces, so "Web Dev" -> Web_Dev).
const CATEGORY_MAP: Record<string, CourseCategory> = {
  "Web Dev": "Web_Dev",
  "Data Science": "Data_Science",
  Design: "Design",
  Business: "Business",
  Languages: "Languages",
  Math: "Math",
};

async function main() {
  console.log("Seeding database…");

  // Clear in dependency-safe order so the script is rerunnable.
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.learningPathEnrollment.deleteMany();
  await prisma.learningPathCourse.deleteMany();
  await prisma.learningPath.deleteMany();
  await prisma.review.deleteMany();
  await prisma.supportReply.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.forumReply.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.liveClass.deleteMany();
  await prisma.scheduleEvent.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.physicalAttendance.deleteMany();
  await prisma.physicalClassEnrollment.deleteMany();
  await prisma.physicalClass.deleteMany();
  await prisma.physicalApplication.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // -------- Users --------
  for (const u of DEMO_USERS) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: hashPassword(u.password),
        role: u.role,
        bio: u.bio,
        phone: u.phone,
        education: u.education,
        createdAt: u.createdAt,
      },
    });
  }
  console.log(`  ✓ ${DEMO_USERS.length} users`);

  // -------- Courses + Chapters --------
  for (const c of COURSES) {
    await prisma.course.create({
      data: {
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        thumbnail: c.thumbnail,
        instructor: c.instructor,
        instructorAvatar: c.instructorAvatar,
        category: CATEGORY_MAP[c.category],
        level: c.level,
        price: c.price,
        durationMinutes: c.durationMinutes,
        rating: c.rating,
        reviews: c.reviews,
        tags: c.tags,
        chapters: {
          create: c.chapters.map((ch, idx) => ({
            id: ch.id,
            title: ch.title,
            duration: ch.duration,
            videoUrl: ch.videoUrl,
            resources: ch.resources ? JSON.parse(JSON.stringify(ch.resources)) : null,
            order: idx,
          })),
        },
      },
    });
  }
  console.log(`  ✓ ${COURSES.length} courses (+ chapters)`);

  // -------- Enrollments (all attached to the demo student) --------
  for (const e of DEFAULT_ENROLLMENTS) {
    await prisma.enrollment.create({
      data: {
        userId: "u-demo",
        courseId: e.courseId,
        enrolledAt: new Date(e.enrolledAt),
        progress: e.progress,
        completed: e.completed,
        completedChapterIds: e.completedChapters,
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_ENROLLMENTS.length} enrollments`);

  // -------- Certificates --------
  for (const c of DEFAULT_CERTIFICATES) {
    await prisma.certificate.create({
      data: {
        id: c.id,
        userId: "u-demo",
        courseId: c.courseId,
        issuedAt: new Date(c.issuedAt),
        score: c.score,
        verifyCode: c.verifyCode,
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_CERTIFICATES.length} certificates`);

  // -------- Notifications (broadcast — no userId) --------
  for (const n of DEFAULT_NOTIFICATIONS) {
    await prisma.notification.create({
      data: {
        id: n.id,
        userId: null,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: new Date(n.createdAt),
      },
    });
  }
  console.log(`  ✓ ${DEFAULT_NOTIFICATIONS.length} notifications`);

  // -------- Assignments + Submissions --------
  const courseIds = COURSES.map((c) => c.id);
  const now = Date.now();
  const days = (n: number) => new Date(now + n * 86400_000);

  if (courseIds.length > 0) {
    const a1 = await prisma.assignment.create({
      data: {
        courseId: courseIds[0],
        title: "Build a responsive landing page",
        description:
          "Use semantic HTML + Tailwind to create a responsive marketing page with a hero, features, and footer.",
        points: 100,
        dueDate: days(5),
        status: "open",
      },
    });
    const a2 = await prisma.assignment.create({
      data: {
        courseId: courseIds[0],
        title: "JavaScript quiz: Closures & Scope",
        description: "Submit a short write-up explaining closures with two code examples.",
        points: 50,
        dueDate: days(-2),
        status: "closed",
      },
    });
    if (courseIds[1]) {
      await prisma.assignment.create({
        data: {
          courseId: courseIds[1],
          title: "Data cleaning lab",
          description: "Clean the provided dataset and submit a Jupyter notebook with your steps.",
          points: 80,
          dueDate: days(7),
          status: "open",
        },
      });
    }
    // submission for the closed one (graded)
    await prisma.assignmentSubmission.create({
      data: {
        assignmentId: a2.id,
        userId: "u-demo",
        content: "Closures preserve variable references from outer scopes...",
        status: "graded",
        grade: 45,
        feedback: "Solid explanation! Add one more real-world example next time.",
        submittedAt: days(-3),
        gradedAt: days(-1),
      },
    });
    console.log(`  ✓ 3 assignments (+ 1 graded submission)`);

    // -------- Quizzes --------
    const q1 = await prisma.quiz.create({
      data: {
        courseId: courseIds[0],
        title: "HTML & CSS basics",
        description: "Quick check on fundamentals.",
        durationMinutes: 15,
        passingScore: 60,
        questions: {
          create: [
            {
              question: "Which HTML tag is used for the largest heading?",
              options: ["<h6>", "<heading>", "<h1>", "<head>"],
              correctIndex: 2,
              points: 1,
              order: 0,
            },
            {
              question: "Which CSS property controls text size?",
              options: ["text-size", "font-style", "font-size", "text-style"],
              correctIndex: 2,
              points: 1,
              order: 1,
            },
            {
              question: "What does HTML stand for?",
              options: [
                "Hyper Trainer Marking Language",
                "Hyper Text Markup Language",
                "Hyper Tool Multi Language",
                "Home Tool Markup Language",
              ],
              correctIndex: 1,
              points: 1,
              order: 2,
            },
          ],
        },
      },
    });
    if (courseIds[1]) {
      await prisma.quiz.create({
        data: {
          courseId: courseIds[1],
          title: "Data Science fundamentals",
          description: "Statistics, NumPy and pandas basics.",
          durationMinutes: 20,
          passingScore: 70,
          questions: {
            create: [
              {
                question: "Which library is primarily used for dataframes in Python?",
                options: ["NumPy", "pandas", "Matplotlib", "scikit-learn"],
                correctIndex: 1,
                points: 1,
                order: 0,
              },
              {
                question: "Median is a measure of …",
                options: ["Variability", "Central tendency", "Skewness", "Kurtosis"],
                correctIndex: 1,
                points: 1,
                order: 1,
              },
            ],
          },
        },
      });
    }
    // One completed attempt for the demo student
    await prisma.quizAttempt.create({
      data: {
        quizId: q1.id,
        userId: "u-demo",
        score: 3,
        percentage: 100,
        passed: true,
        answers: { q0: 2, q1: 2, q2: 1 },
        startedAt: days(-1),
        completedAt: days(-1),
      },
    });
    console.log(`  ✓ 2 quizzes (+ 1 completed attempt)`);

    // -------- Live Classes --------
    await prisma.liveClass.createMany({
      data: [
        {
          courseId: courseIds[0],
          title: "Live: Building a portfolio with Next.js",
          description: "Hands-on session — bring your own ideas, we'll build a portfolio together.",
          instructor: "Demo Instructor",
          meetingUrl: "https://meet.example.com/portfolio-session",
          scheduledAt: days(2),
          durationMinutes: 60,
          status: "upcoming",
          maxAttendees: 100,
          attendees: 34,
        },
        {
          courseId: courseIds[0],
          title: "Office hours — Q&A",
          description: "Drop in with any questions about this week's material.",
          instructor: "Demo Instructor",
          meetingUrl: "https://meet.example.com/office-hours",
          scheduledAt: days(5),
          durationMinutes: 45,
          status: "upcoming",
          attendees: 12,
        },
        {
          courseId: courseIds[0],
          title: "Recorded: Flexbox deep-dive",
          description: "Previously recorded — covers flex layouts end-to-end.",
          instructor: "Demo Instructor",
          meetingUrl: "https://meet.example.com/flexbox-recap",
          scheduledAt: days(-7),
          durationMinutes: 50,
          status: "ended",
          attendees: 67,
        },
      ],
    });
    console.log(`  ✓ 3 live classes`);

    // -------- Schedule Events (personal calendar) --------
    await prisma.scheduleEvent.createMany({
      data: [
        {
          userId: "u-demo",
          courseId: courseIds[0],
          title: "Web Dev — Module 3 class",
          type: "class",
          startTime: days(1),
          endTime: new Date(days(1).getTime() + 90 * 60_000),
          location: "Campus A · Room 204",
        },
        {
          userId: "u-demo",
          courseId: courseIds[0],
          title: "Mid-term exam",
          type: "exam",
          startTime: days(10),
          endTime: new Date(days(10).getTime() + 120 * 60_000),
          location: "Main Hall",
        },
        {
          userId: "u-demo",
          title: "Personal study time",
          type: "event",
          description: "Practice CSS layouts.",
          startTime: days(0),
          endTime: new Date(days(0).getTime() + 60 * 60_000),
        },
      ],
    });
    console.log(`  ✓ 3 schedule events`);

    // -------- Forum Posts + Replies --------
    const fp1 = await prisma.forumPost.create({
      data: {
        courseId: courseIds[0],
        userId: "u-demo",
        title: "Best tools for learning CSS Grid?",
        body: "I'm getting started with grid and looking for recommendations — videos, articles, or interactive sandboxes.",
        category: "question",
        views: 42,
      },
    });
    await prisma.forumPost.create({
      data: {
        courseId: courseIds[0],
        userId: "u-teacher",
        title: "📌 Welcome — community guidelines",
        body: "Please keep the forum supportive. Search before posting. Mark answers as helpful.",
        category: "announcement",
        pinned: true,
        views: 220,
      },
    });
    await prisma.forumReply.createMany({
      data: [
        {
          postId: fp1.id,
          userId: "u-teacher",
          body: "CSS Grid Garden is a great interactive game. Also try Kevin Powell on YouTube.",
        },
        {
          postId: fp1.id,
          userId: "u-demo",
          body: "Thank you! Just started CSS Grid Garden 🌱",
        },
      ],
    });
    console.log(`  ✓ 2 forum posts (+ 2 replies)`);

    // -------- Messages --------
    const convId = ["u-demo", "u-teacher"].sort().join(":");
    await prisma.message.createMany({
      data: [
        {
          conversationId: convId,
          fromUserId: "u-teacher",
          toUserId: "u-demo",
          body: "Hi! Welcome to the course — let me know if anything is unclear.",
          read: true,
          createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
        },
        {
          conversationId: convId,
          fromUserId: "u-demo",
          toUserId: "u-teacher",
          body: "Thanks! Loving the first module 🙏",
          read: true,
          createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        },
        {
          conversationId: convId,
          fromUserId: "u-teacher",
          toUserId: "u-demo",
          body: "Quick reminder: assignment 1 is due Friday.",
          read: false,
          createdAt: new Date(now - 1000 * 60 * 30),
        },
      ],
    });
    console.log(`  ✓ 3 messages`);

    // -------- Payments --------
    await prisma.payment.createMany({
      data: [
        {
          userId: "u-demo",
          courseId: courseIds[0],
          amount: 14000,
          currency: "PKR",
          status: "completed",
          method: "card",
          txnId: "txn_demo_001",
          description: "Course enrollment — " + COURSES[0].title,
          createdAt: new Date(now - 1000 * 60 * 60 * 24 * 30),
        },
        {
          userId: "u-demo",
          courseId: courseIds[1] ?? courseIds[0],
          amount: 17000,
          currency: "PKR",
          status: "completed",
          method: "jazzcash",
          txnId: "txn_demo_002",
          description: "Course enrollment — " + (COURSES[1]?.title ?? COURSES[0].title),
          createdAt: new Date(now - 1000 * 60 * 60 * 24 * 12),
        },
        {
          userId: "u-demo",
          amount: 999,
          currency: "PKR",
          status: "pending",
          method: "bank_transfer",
          description: "Pro plan — monthly",
          createdAt: new Date(now - 1000 * 60 * 60 * 2),
        },
      ],
    });
    console.log(`  ✓ 3 payments`);

    // -------- Wishlist --------
    if (courseIds.length > 2) {
      await prisma.wishlistItem.createMany({
        data: [
          { userId: "u-demo", courseId: courseIds[2] },
          ...(courseIds[3] ? [{ userId: "u-demo", courseId: courseIds[3] }] : []),
        ],
      });
      console.log(`  ✓ wishlist items`);
    }

    // -------- Support Tickets --------
    const t1 = await prisma.supportTicket.create({
      data: {
        userId: "u-demo",
        subject: "Can't access course video",
        body: "Chapter 3 video keeps buffering and never plays. I'm on Chrome on Windows.",
        category: "technical",
        priority: "high",
        status: "in_progress",
      },
    });
    await prisma.supportReply.create({
      data: {
        ticketId: t1.id,
        userId: "u-admin",
        body: "Thanks for reporting — we're looking into the CDN. Could you try clearing the cache and retrying?",
        isStaff: true,
      },
    });
    console.log(`  ✓ 1 support ticket (+ staff reply)`);

    // -------- User Settings --------
    await prisma.userSettings.create({
      data: {
        userId: "u-demo",
        emailNotifications: true,
        pushNotifications: true,
        weeklyDigest: true,
        marketingEmails: false,
        language: "en",
        timezone: "Asia/Karachi",
        theme: "auto",
      },
    });
    console.log(`  ✓ default user settings`);
  }

  // -------- Course Reviews --------
  // A handful of student reviewers so the review feature has real data on
  // course pages and the instructor's Reviews dashboard.
  if (courseIds.length > 0) {
    const REVIEWERS = [
      "Ali Raza", "Hina Khan", "Daniyal Sheikh", "Mahnoor Iqbal",
      "Usman Tariq", "Sofia Ahmed", "Bilal Mehmood", "Zara Khan",
    ];
    const REVIEW_TEXTS = [
      "Loved the pacing — every chapter built on the last and the projects made it stick.",
      "Clear explanations and the instructor replied to questions quickly. Highly recommend.",
      "Solid course. I'd have liked a few more exercises at the end of each section.",
      "Best course I've taken on this topic. The hands-on parts were worth it.",
      "Good content overall, though audio quality dipped in a couple of lectures.",
      "Practical and to the point — exactly what I needed to get unstuck.",
      "Great for beginners. Took me from zero to building real things.",
      "Well structured — the deep-dive chapters really tied everything together.",
    ];
    const RATINGS = [5, 4, 5, 5, 4, 3, 5, 4];

    let reviewCount = 0;
    for (let i = 0; i < REVIEWERS.length; i++) {
      const reviewer = await prisma.user.create({
        data: {
          id: `u-rev-${i + 1}`,
          name: REVIEWERS[i],
          email: `${REVIEWERS[i].toLowerCase().replace(/\s+/g, ".")}@demo.com`,
          password: hashPassword("demo1234"),
          role: "Student",
          createdAt: new Date(now - 1000 * 60 * 60 * 24 * (20 + i * 3)),
        },
      });
      // Each reviewer "completed" 3 courses and left a review on each.
      for (let k = 0; k < 3; k++) {
        const courseId = courseIds[(i + k) % courseIds.length];
        await prisma.enrollment.create({
          data: { userId: reviewer.id, courseId, progress: 100, completed: true },
        });
        await prisma.review.create({
          data: {
            courseId,
            userId: reviewer.id,
            rating: RATINGS[(i + k) % RATINGS.length],
            body: REVIEW_TEXTS[(i + k) % REVIEW_TEXTS.length],
            createdAt: new Date(now - 1000 * 60 * 60 * 24 * (i * 2 + k)),
          },
        });
        reviewCount++;
      }
    }
    console.log(`  ✓ ${REVIEWERS.length} reviewers (+ ${reviewCount} reviews)`);

    // Recompute each course's cached rating + review count from real reviews.
    for (const cid of courseIds) {
      const agg = await prisma.review.aggregate({
        where: { courseId: cid, hidden: false },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await prisma.course.update({
        where: { id: cid },
        data: {
          rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
          reviews: agg._count._all,
        },
      });
    }
    console.log(`  ✓ recomputed course ratings from reviews`);
  }

  // -------- Subscription Plans --------
  const PLANS = [
    {
      key: "starter",
      name: "Starter",
      tagline: "Everything you need to get going.",
      monthlyPrice: 900,
      annualPrice: 8640,
      highlight: false,
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
      name: "Pro",
      tagline: "Everything you need to master a skill.",
      monthlyPrice: 1900,
      annualPrice: 18240,
      highlight: true,
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
      name: "Team",
      tagline: "For study groups, families, or small teams.",
      monthlyPrice: 2900,
      annualPrice: 27840,
      highlight: false,
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
  const planRows: Record<string, string> = {};
  for (const p of PLANS) {
    const row = await prisma.subscriptionPlan.create({ data: p });
    planRows[p.key] = row.id;
  }
  console.log(`  ✓ ${PLANS.length} subscription plans`);

  // Give the demo student an active Pro subscription.
  await prisma.subscription.create({
    data: {
      userId: "u-demo",
      planId: planRows["pro"],
      interval: "monthly",
      status: "active",
      currentPeriodEnd: new Date(now + 1000 * 60 * 60 * 24 * 21),
    },
  });
  console.log(`  ✓ demo student subscribed to Pro`);

  // -------- Learning Paths --------
  // Each path bundles every course in a category into an ordered track.
  if (courseIds.length > 0) {
    const PATHS = [
      {
        slug: "full-stack-web-developer",
        title: "Full-Stack Web Developer",
        description:
          "Go from the fundamentals to deploying full-stack apps. A complete, ordered track covering front-end, back-end, and everything between.",
        category: "Web Dev" as const,
        level: "Beginner" as const,
        featured: true,
        image:
          "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
      },
      {
        slug: "data-science-foundations",
        title: "Data Science Foundations",
        description:
          "Master Python, statistics, and machine-learning fundamentals through a structured sequence of hands-on courses.",
        category: "Data Science" as const,
        level: "Intermediate" as const,
        featured: true,
        image:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      },
      {
        slug: "creative-design-pro",
        title: "Creative Design Pro",
        description:
          "Build a professional design skillset — from visual fundamentals to polished, portfolio-ready work.",
        category: "Design" as const,
        level: "Beginner" as const,
        featured: false,
        image:
          "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=800&q=80",
      },
      {
        slug: "business-and-career-essentials",
        title: "Business & Career Essentials",
        description:
          "Practical business, communication, and career skills to help you grow, lead, and stand out.",
        category: "Business" as const,
        level: "Beginner" as const,
        featured: false,
        image:
          "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
      },
    ];

    let pathCount = 0;
    let firstPathId: string | null = null;
    for (const p of PATHS) {
      const inCategory = COURSES.filter((c) => c.category === p.category);
      if (inCategory.length === 0) continue;
      const created = await prisma.learningPath.create({
        data: {
          slug: p.slug,
          title: p.title,
          description: p.description,
          thumbnail: p.image,
          category: CATEGORY_MAP[p.category],
          level: p.level,
          featured: p.featured,
          courses: {
            create: inCategory.map((c, idx) => ({ courseId: c.id, order: idx })),
          },
        },
      });
      if (!firstPathId) firstPathId = created.id;
      pathCount++;
    }
    console.log(`  ✓ ${pathCount} learning paths`);

    // Enroll the demo student in the first path.
    if (firstPathId) {
      await prisma.learningPathEnrollment.create({
        data: { userId: "u-demo", pathId: firstPathId },
      });
      console.log(`  ✓ demo student enrolled in a learning path`);
    }
  }

  // -------- Physical (in-person) classes --------
  // Midnight-UTC of a day N days from now — matches how the app stores the
  // date of an attendance session.
  const dayUTC = (n: number) => {
    const d = new Date(now + n * 86400_000);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  };

  if (courseIds.length >= 2) {
    const ongoing = await prisma.physicalClass.create({
      data: {
        courseId: courseIds[0],
        instructorId: "u-teacher",
        title: `${COURSES[0].title.split(":")[0].trim()} — Morning Batch`,
        campus: "Main Campus — Lahore",
        room: "B-204",
        batch: "Morning (9:00 AM – 12:00 PM)",
        capacity: 30,
        startDate: days(-30),
        endDate: days(60),
        daysOfWeek: ["Mon", "Wed", "Fri"],
        status: "ongoing",
        notes: "Bring a laptop. Arrive 10 minutes early for the first session.",
      },
    });

    await prisma.physicalClass.create({
      data: {
        courseId: courseIds[1],
        instructorId: "u-teacher",
        title: `${COURSES[1].title.split(":")[0].trim()} — Evening Batch`,
        campus: "North Campus — Islamabad",
        room: "A-101",
        batch: "Evening (5:00 PM – 8:00 PM)",
        capacity: 25,
        startDate: days(14),
        endDate: days(110),
        daysOfWeek: ["Tue", "Thu"],
        status: "upcoming",
      },
    });

    await prisma.physicalClass.create({
      data: {
        courseId: courseIds[courseIds.length > 2 ? 2 : 0],
        instructorId: "u-teacher",
        title: `${COURSES[courseIds.length > 2 ? 2 : 0].title.split(":")[0].trim()} — Weekend Batch`,
        campus: "South Campus — Karachi",
        room: "C-007",
        batch: "Weekend (Sat–Sun)",
        capacity: 20,
        startDate: days(-160),
        endDate: days(-20),
        daysOfWeek: ["Sat", "Sun"],
        status: "completed",
      },
    });

    // Approved application → demo student placed into the ongoing batch.
    const approvedApp = await prisma.physicalApplication.create({
      data: {
        id: "pa-seed-approved",
        studentId: "u-demo",
        courseId: courseIds[0],
        fullName: "Demo Student",
        fatherName: "Abdul Karim",
        email: "student@demo.com",
        phone: "+92 300 1112223",
        cnic: "35202-1234567-1",
        dateOfBirth: "2003-04-12",
        address: "House 12, Street 4, Gulberg",
        city: "Lahore",
        education: "Intermediate",
        institute: "Government College",
        passingYear: "2021",
        obtainedMarks: "880",
        totalMarks: "1100",
        campus: "Main Campus — Lahore",
        batch: "Morning (9:00 AM – 12:00 PM)",
        motivation: "I learn better in a classroom with hands-on guidance.",
        status: "approved",
        submittedAt: days(-35),
        reviewedAt: days(-32),
        reviewNote: "Welcome aboard! Classes begin Monday.",
      },
    });

    await prisma.physicalClassEnrollment.create({
      data: {
        physicalClassId: ongoing.id,
        studentId: "u-demo",
        applicationId: approvedApp.id,
        status: "active",
        enrolledAt: days(-31),
      },
    });

    // Past attendance for the demo student in the ongoing batch.
    const sessions: { d: number; s: "present" | "absent" | "late" | "excused" }[] = [
      { d: -28, s: "present" },
      { d: -26, s: "present" },
      { d: -21, s: "late" },
      { d: -19, s: "absent" },
      { d: -14, s: "present" },
      { d: -12, s: "present" },
      { d: -7, s: "excused" },
      { d: -5, s: "present" },
    ];
    for (const ses of sessions) {
      await prisma.physicalAttendance.create({
        data: {
          physicalClassId: ongoing.id,
          studentId: "u-demo",
          date: dayUTC(ses.d),
          status: ses.s,
          markedById: "u-teacher",
        },
      });
    }

    // A pending application for another course — something for admins to review.
    await prisma.physicalApplication.create({
      data: {
        id: "pa-seed-pending",
        studentId: "u-demo",
        courseId: courseIds[1],
        fullName: "Demo Student",
        fatherName: "Abdul Karim",
        email: "student@demo.com",
        phone: "+92 300 1112223",
        cnic: "35202-1234567-1",
        dateOfBirth: "2003-04-12",
        address: "House 12, Street 4, Gulberg",
        city: "Lahore",
        education: "Intermediate",
        institute: "Government College",
        passingYear: "2021",
        obtainedMarks: "880",
        totalMarks: "1100",
        campus: "North Campus — Islamabad",
        batch: "Evening (5:00 PM – 8:00 PM)",
        status: "pending",
        submittedAt: days(-3),
      },
    });

    console.log("  ✓ 3 physical classes (+ 1 enrollment, attendance, 2 applications)");
  }

  // -------- Message templates (email / SMS) --------
  // Self-contained & rerunnable: clear then recreate.
  await prisma.messageTemplate.deleteMany();
  await prisma.messageTemplate.createMany({
    data: [
      {
        key: "welcome_email",
        name: "Welcome email",
        channel: "email",
        subject: "Welcome to EduPortal, {{name}}!",
        body:
          "Hi {{name}},\n\nWelcome aboard! Your account is ready and thousands of courses are waiting for you.\n\nStart learning: {{link}}\n\n— The EduPortal Team",
        variables: ["name", "link"],
        enabled: true,
      },
      {
        key: "enrollment_confirmation",
        name: "Enrollment confirmation",
        channel: "both",
        subject: "You're enrolled in {{courseTitle}}",
        body:
          "Hi {{name}},\n\nYou've successfully enrolled in {{courseTitle}}. Jump back in any time at {{link}}.\n\nHappy learning!",
        variables: ["name", "courseTitle", "link"],
        enabled: true,
      },
      {
        key: "payment_receipt",
        name: "Payment receipt",
        channel: "email",
        subject: "Your receipt — {{amount}}",
        body:
          "Hi {{name}},\n\nWe've received your payment of {{amount}} on {{date}}. Thank you!\n\nView your invoice: {{link}}",
        variables: ["name", "amount", "date", "link"],
        enabled: true,
      },
      {
        key: "class_reminder_sms",
        name: "Live class reminder (SMS)",
        channel: "sms",
        subject: null,
        body: "Reminder: your live class \"{{courseTitle}}\" starts soon. Join: {{link}}",
        variables: ["courseTitle", "link"],
        enabled: true,
      },
      {
        key: "password_reset",
        name: "Password reset",
        channel: "email",
        subject: "Reset your EduPortal password",
        body:
          "Hi {{name}},\n\nWe received a request to reset your password. Use the link below — it expires in 30 minutes.\n\n{{link}}\n\nIf you didn't request this, you can safely ignore this email.",
        variables: ["name", "link"],
        enabled: false,
      },
    ],
  });
  console.log("  ✓ 5 message templates");

  console.log("\nSeed complete.");
  console.log("Demo logins:");
  for (const u of DEMO_USERS) {
    console.log(`  ${u.email.padEnd(20)} / ${u.password}  (${u.role})`);
  }
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
