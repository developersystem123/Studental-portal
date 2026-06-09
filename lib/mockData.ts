export type CourseCategory = "Web Dev" | "Data Science" | "Design" | "Business" | "Languages" | "Math";
export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export type Chapter = {
  id: string;
  title: string;
  duration: number; // seconds
  videoUrl: string;
  resources?: { name: string; url: string }[];
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  instructor: string;
  instructorAvatar?: string;
  category: CourseCategory;
  level: CourseLevel;
  price: number;
  durationMinutes: number;
  rating: number;
  reviews: number;
  chapters: Chapter[];
  tags: string[];
};

export type Enrollment = {
  courseId: string;
  enrolledAt: string;
  progress: number; // 0..100
  completedChapters: string[];
  completed: boolean;
};

export type Certificate = {
  id: string;
  courseId: string;
  issuedAt: string;
  score: number;
  verifyCode: string;
};

export type Notification = {
  id: string;
  type: "assignment" | "announcement" | "reminder" | "achievement";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

// ----- Education + physical (in-person) class applications -----

export const EDUCATION_LEVELS = [
  "None",
  "Matriculation",
  "Intermediate",
  "Bachelor",
  "Master",
  "PhD",
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

// Anything from Matriculation upward is eligible.
export function meetsMatriculationRequirement(level?: string | null) {
  if (!level) return false;
  const idx = (EDUCATION_LEVELS as readonly string[]).indexOf(level);
  return idx >= 1;
}

export const CAMPUSES = [
  "Main Campus — Lahore",
  "North Campus — Islamabad",
  "South Campus — Karachi",
  "East Campus — Faisalabad",
] as const;

export const BATCH_OPTIONS = [
  "Morning (9:00 AM – 12:00 PM)",
  "Afternoon (1:00 PM – 4:00 PM)",
  "Evening (5:00 PM – 8:00 PM)",
  "Weekend (Sat–Sun)",
] as const;

export type ApplicationStatus = "pending" | "approved" | "rejected";

export type PhysicalApplication = {
  id: string;
  studentId: string;
  courseId: string;
  // Applicant details (snapshot at submit time)
  fullName: string;
  fatherName: string;
  email: string;
  phone: string;
  cnic: string;
  dateOfBirth: string; // YYYY-MM-DD
  address: string;
  city: string;
  // Education
  education: EducationLevel;
  institute: string;
  passingYear: string;
  obtainedMarks: string;
  totalMarks: string;
  // Class preferences
  campus: string;
  batch: string;
  motivation?: string;
  // Workflow
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  // Set once approved + placed into a physical class batch.
  physicalClassId?: string;
};

// ----- Physical (in-person) classes -----
// Once a PhysicalApplication is approved the admin places the student into a
// PhysicalClass (a real, scheduled batch). Teachers run those batches and mark
// attendance; students follow their schedule and track their attendance rate.

export type PhysicalClassStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type PhysicalEnrollmentStatus = "active" | "completed" | "dropped";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export const PHYSICAL_CLASS_STATUSES: PhysicalClassStatus[] = [
  "upcoming",
  "ongoing",
  "completed",
  "cancelled",
];
export const ATTENDANCE_STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// A physical class batch, flattened with its course + instructor display fields.
export type PhysicalClass = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string;
  courseCategory: CourseCategory;
  courseLevel: CourseLevel;
  instructorId: string;
  instructorName: string;
  title: string;
  campus: string;
  room: string;
  batch: string;
  capacity: number;
  enrolledCount: number;
  startDate: string;
  endDate: string;
  daysOfWeek: string[];
  status: PhysicalClassStatus;
  notes?: string;
  createdAt: string;
};

export type AttendanceRecord = {
  date: string; // ISO date of the session
  status: AttendanceStatus;
  note?: string;
};

// A student's own physical-class enrollment with their attendance summary.
export type MyPhysicalClass = {
  enrollmentId: string;
  enrollmentStatus: PhysicalEnrollmentStatus;
  enrolledAt: string;
  classmateCount: number;
  attendance: AttendanceRecord[];
  present: number;
  absent: number;
  late: number;
  excused: number;
  sessionsHeld: number;
  attendanceRate: number;
  class: PhysicalClass;
};

// One roster row — shared by the teacher and admin batch views.
export type PhysicalClassRosterEntry = {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrollmentStatus: PhysicalEnrollmentStatus;
  enrolledAt: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  sessionsHeld: number;
  attendanceRate: number;
};

const gradientThumb = (a: string, b: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='600' height='400' fill='url(%23g)'/><g fill='white' opacity='0.18'><circle cx='480' cy='80' r='120'/><circle cx='120' cy='340' r='90'/></g></svg>`,
  )}`;

export const COURSES: Course[] = [
  {
    id: "c1",
    title: "Full-Stack Web Development with Next.js",
    slug: "fullstack-nextjs",
    description:
      "Build modern, production-ready apps using React, Next.js App Router, Tailwind, and Prisma. From routing and server actions to deployments — everything you need to ship.",
    thumbnail:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    instructor: "Demo Instructor",
    category: "Web Dev",
    level: "Intermediate",
    price: 14000,
    durationMinutes: 720,
    rating: 4.8,
    reviews: 2340,
    tags: ["React", "Next.js", "TypeScript", "Tailwind"],
    chapters: [
      { id: "c1ch1", title: "Welcome & Setup", duration: 480, videoUrl: "" },
      { id: "c1ch2", title: "App Router Fundamentals", duration: 720, videoUrl: "" },
      { id: "c1ch3", title: "Server vs Client Components", duration: 900, videoUrl: "" },
      { id: "c1ch4", title: "Data Fetching & Mutations", duration: 1020, videoUrl: "" },
      { id: "c1ch5", title: "Authentication & Deploy", duration: 1140, videoUrl: "" },
    ],
  },
  {
    id: "c2",
    title: "Data Science Bootcamp: Python to Production",
    slug: "data-science-bootcamp",
    description:
      "Master Python, Pandas, NumPy, ML algorithms, and learn how to ship real models to production. Includes hands-on projects.",
    thumbnail:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    instructor: "Demo Instructor",
    category: "Data Science",
    level: "Beginner",
    price: 17000,
    durationMinutes: 960,
    rating: 4.7,
    reviews: 1820,
    tags: ["Python", "Pandas", "ML"],
    chapters: [
      { id: "c2ch1", title: "Python Crash Course", duration: 720, videoUrl: "" },
      { id: "c2ch2", title: "Pandas & Data Wrangling", duration: 840, videoUrl: "" },
      { id: "c2ch3", title: "Visualization with Matplotlib", duration: 660, videoUrl: "" },
      { id: "c2ch4", title: "Intro to Machine Learning", duration: 1020, videoUrl: "" },
      { id: "c2ch5", title: "Deploying Models", duration: 900, videoUrl: "" },
    ],
  },
  {
    id: "c3",
    title: "UI/UX Design: From Wireframes to Pixel-Perfect",
    slug: "ui-ux-design",
    description:
      "Learn the principles of great design, prototype with Figma, and craft delightful user experiences for web and mobile.",
    thumbnail:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=800&q=80",
    instructor: "Demo Instructor",
    category: "Design",
    level: "Beginner",
    price: 11000,
    durationMinutes: 540,
    rating: 4.9,
    reviews: 3120,
    tags: ["Figma", "UX", "Design Systems"],
    chapters: [
      { id: "c3ch1", title: "Design Principles", duration: 540, videoUrl: "" },
      { id: "c3ch2", title: "User Research", duration: 660, videoUrl: "" },
      { id: "c3ch3", title: "Wireframing in Figma", duration: 780, videoUrl: "" },
      { id: "c3ch4", title: "Prototyping & Handoff", duration: 720, videoUrl: "" },
      { id: "c3ch5", title: "Design Systems", duration: 900, videoUrl: "" },
    ],
  },
  {
    id: "c4",
    title: "Business Strategy & Entrepreneurship 101",
    slug: "business-101",
    description:
      "Frameworks, case studies, and practical playbooks for launching, growing, and scaling a startup or business unit.",
    thumbnail:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    instructor: "Karan Mehta",
    category: "Business",
    level: "Intermediate",
    price: 0,
    durationMinutes: 480,
    rating: 4.6,
    reviews: 980,
    tags: ["Startups", "Strategy", "Marketing"],
    chapters: [
      { id: "c4ch1", title: "Idea Validation", duration: 540, videoUrl: "" },
      { id: "c4ch2", title: "MVP & Product-Market Fit", duration: 600, videoUrl: "" },
      { id: "c4ch3", title: "Go-to-Market Strategy", duration: 720, videoUrl: "" },
      { id: "c4ch4", title: "Fundraising Basics", duration: 660, videoUrl: "" },
      { id: "c4ch5", title: "Scaling Operations", duration: 780, videoUrl: "" },
    ],
  },
  {
    id: "c5",
    title: "Spanish for Beginners: Conversational Fluency",
    slug: "spanish-for-beginners",
    description:
      "Build conversational fluency in Spanish with practical lessons, native pronunciation, and real-world dialogues.",
    thumbnail:
      "https://images.unsplash.com/photo-1551018612-9715965c6742?auto=format&fit=crop&w=800&q=80",
    instructor: "Lucía Ramírez",
    category: "Languages",
    level: "Beginner",
    price: 8000,
    durationMinutes: 600,
    rating: 4.8,
    reviews: 4310,
    tags: ["Spanish", "Conversation"],
    chapters: [
      { id: "c5ch1", title: "Greetings & Introductions", duration: 480, videoUrl: "" },
      { id: "c5ch2", title: "Everyday Vocabulary", duration: 540, videoUrl: "" },
      { id: "c5ch3", title: "Verb Tenses", duration: 720, videoUrl: "" },
      { id: "c5ch4", title: "Travel Conversations", duration: 660, videoUrl: "" },
      { id: "c5ch5", title: "Cultural Nuances", duration: 540, videoUrl: "" },
    ],
  },
  {
    id: "c6",
    title: "Calculus I: Limits, Derivatives, and Beyond",
    slug: "calculus-1",
    description:
      "A clear, intuitive introduction to calculus — limits, derivatives, applications, and the fundamental theorem.",
    thumbnail:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
    instructor: "Prof. Sameer Ali",
    category: "Math",
    level: "Advanced",
    price: 10000,
    durationMinutes: 840,
    rating: 4.5,
    reviews: 670,
    tags: ["Calculus", "Math"],
    chapters: [
      { id: "c6ch1", title: "Limits & Continuity", duration: 660, videoUrl: "" },
      { id: "c6ch2", title: "Derivatives", duration: 780, videoUrl: "" },
      { id: "c6ch3", title: "Applications of Derivatives", duration: 900, videoUrl: "" },
      { id: "c6ch4", title: "Integration", duration: 1020, videoUrl: "" },
      { id: "c6ch5", title: "Fundamental Theorem", duration: 840, videoUrl: "" },
    ],
  },
];

export const DEFAULT_ENROLLMENTS: Enrollment[] = [
  {
    courseId: "c1",
    enrolledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    progress: 60,
    completedChapters: ["c1ch1", "c1ch2", "c1ch3"],
    completed: false,
  },
  {
    courseId: "c3",
    enrolledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    progress: 100,
    completedChapters: ["c3ch1", "c3ch2", "c3ch3", "c3ch4", "c3ch5"],
    completed: true,
  },
  {
    courseId: "c5",
    enrolledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    progress: 20,
    completedChapters: ["c5ch1"],
    completed: false,
  },
];

export const DEFAULT_CERTIFICATES: Certificate[] = [
  {
    id: "cert1",
    courseId: "c3",
    issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    score: 92,
    verifyCode: "EDU-CERT-9F2A8X",
  },
];

export const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "assignment",
    title: "New assignment posted",
    message: "Calculus I — submit Chapter 2 problem set by Friday.",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "n2",
    type: "announcement",
    title: "Live session this Saturday",
    message: "Join Ananya Sharma for a Q&A on Next.js routing.",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "n3",
    type: "reminder",
    title: "Resume your Spanish course",
    message: "You haven't watched a chapter in 2 days. Keep the streak going!",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "n4",
    type: "achievement",
    title: "Certificate earned!",
    message: "Congrats on completing UI/UX Design.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "n5",
    type: "announcement",
    title: "Platform update",
    message: "New AI Assignment Helper is live. Try it now from the sidebar.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

export const DEFAULT_DEADLINES = [
  { id: "d1", course: "Calculus I", title: "Problem Set 2", due: "in 2 days" },
  { id: "d2", course: "Web Dev", title: "Project Submission", due: "in 5 days" },
  { id: "d3", course: "Spanish", title: "Speaking Practice", due: "in 1 week" },
];

export const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "a1",
    author: "Ananya Sharma",
    role: "Instructor",
    message: "Live Q&A on Next.js routing this Saturday — see Notifications for the link.",
    when: "3h ago",
  },
  {
    id: "a2",
    author: "EduPortal Team",
    role: "Platform",
    message: "New AI Assignment Helper now available under the AI Suite.",
    when: "2d ago",
  },
];

export const WEEKLY_HOURS = [
  { day: "Mon", hours: 1.2 },
  { day: "Tue", hours: 2.4 },
  { day: "Wed", hours: 0.6 },
  { day: "Thu", hours: 3.1 },
  { day: "Fri", hours: 2.0 },
  { day: "Sat", hours: 4.2 },
  { day: "Sun", hours: 1.8 },
];

/* ----------------------------- Extra analytics ----------------------------
 * Data used by the student dashboard and analytics pages. Values are
 * illustrative — the activity heatmap is generated deterministically so
 * SSR and CSR produce the same markup (no hydration mismatch). */

export const STUDY_STREAK = {
  current: 14,
  longest: 28,
  weeklyGoalSessions: 5,
  thisWeekSessions: 4,
  daysActiveThisYear: 142,
};

export const XP_DATA = {
  level: 7,
  xp: 3420,
  xpForNext: 4500,
  rank: "Diligent learner",
  weeklyXp: 420,
};

export const WEEKLY_GOAL = {
  goalHours: 12,
  doneHours: 9.3,
};

export const SKILL_MASTERY: { category: CourseCategory; mastery: number; color: string }[] = [
  { category: "Web Dev",      mastery: 78, color: "#8b5cf6" },
  { category: "Data Science", mastery: 62, color: "#06b6d4" },
  { category: "Design",       mastery: 41, color: "#ec4899" },
  { category: "Business",     mastery: 55, color: "#f59e0b" },
  { category: "Languages",    mastery: 30, color: "#10b981" },
  { category: "Math",         mastery: 84, color: "#3b82f6" },
];

export const HOURS_BY_CATEGORY = [
  { label: "Web Dev",      value: 24 },
  { label: "Data Sci.",    value: 18 },
  { label: "Math",         value: 12 },
  { label: "Business",     value: 9 },
  { label: "Design",       value: 6 },
  { label: "Languages",    value: 4 },
];

export const QUIZ_SCORE_HISTORY = [
  { quiz: "JS Basics",      score: 72 },
  { quiz: "DOM & Events",   score: 78 },
  { quiz: "Async JS",       score: 70 },
  { quiz: "Promises",       score: 82 },
  { quiz: "React Intro",    score: 88 },
  { quiz: "Hooks I",        score: 84 },
  { quiz: "Hooks II",       score: 91 },
  { quiz: "Routing",        score: 87 },
  { quiz: "State Mgmt",     score: 93 },
  { quiz: "Testing",        score: 89 },
  { quiz: "Perf",           score: 95 },
  { quiz: "Deployment",     score: 92 },
];

/** A 12-week activity heatmap: 12 weeks * 7 days = 84 cells.
 *  Values are 0..4 (none → very heavy). Generated deterministically so
 *  the SSR snapshot matches the client render. */
export const ACTIVITY_HEATMAP: { day: number; week: number; value: number }[] = (() => {
  const cells: { day: number; week: number; value: number }[] = [];
  for (let week = 0; week < 12; week++) {
    for (let day = 0; day < 7; day++) {
      // Deterministic pseudo-random: small hash of (week, day).
      const seed = (week * 31 + day * 7 + 11) % 17;
      // Bias weekends slightly higher, recent weeks slightly higher.
      let v = seed % 5;
      if (day === 5 || day === 6) v = Math.min(4, v + 1);
      if (week >= 9) v = Math.min(4, v + (seed % 2));
      if (seed === 0) v = 0; // sprinkle quiet days
      cells.push({ day, week, value: v });
    }
  }
  return cells;
})();

export const STUDY_TIME_OF_DAY = [
  { bucket: "12am", minutes: 8 },
  { bucket: "4am",  minutes: 0 },
  { bucket: "8am",  minutes: 42 },
  { bucket: "12pm", minutes: 35 },
  { bucket: "4pm",  minutes: 58 },
  { bucket: "8pm",  minutes: 76 },
  { bucket: "11pm", minutes: 24 },
];

export const RECENT_BADGES = [
  { id: "b1", name: "10-day streak",   icon: "flame",  earnedAt: "2026-05-15", description: "Studied 10 days in a row." },
  { id: "b2", name: "Perfect quiz",    icon: "star",   earnedAt: "2026-05-12", description: "Scored 100% on a quiz." },
  { id: "b3", name: "First certificate", icon: "award", earnedAt: "2026-05-08", description: "Earned your first verified certificate." },
  { id: "b4", name: "Night owl",       icon: "moon",   earnedAt: "2026-05-02", description: "Studied past 11pm five times." },
];

export const UPCOMING_LIVE_SESSIONS = [
  { id: "ls1", title: "Async JS — deep dive Q&A", host: "Ananya Sharma",  at: "Sat 4:00 pm", course: "Full-Stack Web Development" },
  { id: "ls2", title: "Bayesian thinking",        host: "Dr. Rohan Verma", at: "Mon 6:30 pm", course: "Data Science Bootcamp" },
  { id: "ls3", title: "Design critique session",  host: "Maya Patel",      at: "Wed 7:00 pm", course: "UI/UX Design" },
];

export const RECOMMENDED_NEXT = [
  { id: "r1", title: "useEffect pitfalls",       course: "Full-Stack Web Development", durationMin: 14, reason: "You just finished useState basics" },
  { id: "r2", title: "Plotting with matplotlib", course: "Data Science Bootcamp",      durationMin: 22, reason: "Aligned with your weekly goal" },
  { id: "r3", title: "Color theory primer",      course: "UI/UX Design",                durationMin: 11, reason: "Picks up from your last session" },
];

export const LEADERBOARD = [
  { id: "l1", name: "Priya R.",  hours: 18.4, you: false },
  { id: "l2", name: "You",       hours: 15.2, you: true  },
  { id: "l3", name: "Marco D.",  hours: 14.6, you: false },
  { id: "l4", name: "Aisha K.",  hours: 12.9, you: false },
  { id: "l5", name: "Hiroshi N.", hours: 11.1, you: false },
];

export const RECENT_SESSIONS = [
  { id: "s1", title: "useState in React",   course: "Full-Stack Web Development", durationMin: 42, at: "Today, 6:12 pm" },
  { id: "s2", title: "Linear regression",   course: "Data Science Bootcamp",      durationMin: 35, at: "Today, 11:08 am" },
  { id: "s3", title: "Spanish — past tense", course: "Conversational Spanish",     durationMin: 18, at: "Yesterday, 9:40 pm" },
  { id: "s4", title: "Wireframe drills",    course: "UI/UX Design",                durationMin: 28, at: "Yesterday, 2:55 pm" },
];

export function getCourseById(id: string) {
  return COURSES.find((c) => c.id === id);
}
