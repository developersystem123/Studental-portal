// Realistic, deterministic-ish seed data for the teacher portal's per-user
// localStorage features. Each generator takes the teacher's real courses and
// students and returns demo content scoped to them. Seeds only run on first
// visit (gated by useSeedOnce) — user edits afterward are preserved.

import type { Course, CourseCategory } from "@/lib/mockData";
import type { TeacherStudentRow } from "@/lib/store";
import { uid } from "@/lib/teacherStore";

const DAY = 1000 * 60 * 60 * 24;
const HOUR = 1000 * 60 * 60;
const MIN = 1000 * 60;

function daysFromNow(days: number, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function isoAgo(ms: number) {
  return new Date(Date.now() - ms).toISOString();
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

// ===================================================================
// Assignments
// ===================================================================

type AssignmentSeed = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  points: number;
  dueDate: string;
  status: "draft" | "open" | "closed";
  createdAt: string;
  submissions: {
    studentId: string;
    studentName: string;
    submittedAt: string;
    content: string;
    grade: number | null;
    feedback: string;
  }[];
};

const ASSIGNMENT_TEMPLATES: Record<CourseCategory, { title: string; description: string; points: number }[]> = {
  "Web Dev": [
    { title: "Build a Todo App with Local Storage", description: "Create a todo app that persists tasks in localStorage. Include add, edit, delete, and filter (all/active/completed). Submit a deployed link + source repo.", points: 100 },
    { title: "Reusable Component Library", description: "Build 5 reusable components (Button, Input, Card, Modal, Toast) with variants, accessibility, and Storybook stories. Submit a Storybook link.", points: 100 },
    { title: "Final Project — Full-Stack App", description: "Ship a full-stack app with authentication, a database, and at least 3 routes. Include a README explaining your architecture choices.", points: 200 },
  ],
  "Data Science": [
    { title: "Pandas Data Wrangling Lab", description: "Clean the provided messy dataset using Pandas. Drop duplicates, normalize columns, handle missing values, and produce a tidy CSV.", points: 100 },
    { title: "EDA + Visualization Report", description: "Pick any dataset from Kaggle. Produce an EDA notebook with at least 6 charts and a written summary of findings.", points: 100 },
    { title: "Capstone — Ship an ML Model", description: "Train, evaluate, and deploy a classification or regression model. Include a small Streamlit/Gradio app and a model card.", points: 200 },
  ],
  Design: [
    { title: "Wireframe a Mobile Checkout", description: "Wireframe a 4-screen mobile checkout flow (cart → address → payment → confirmation). Submit a Figma link with annotations.", points: 100 },
    { title: "Design System Foundations", description: "Build a small design system: typography scale, color tokens, spacing, and 3 components. Document each in Figma.", points: 100 },
    { title: "Final — Redesign an App", description: "Pick an existing app and redesign its main flow. Include before/after, user research, and a clickable prototype.", points: 200 },
  ],
  Business: [
    { title: "Idea Validation Memo", description: "Pick a startup idea. Write a 2-page memo covering customer segment, problem, market size, and 3 validation experiments you'd run.", points: 80 },
    { title: "Go-to-Market Plan", description: "Draft a 90-day GTM plan with channels, ICP, messaging, and weekly milestones. Slides or doc — your choice.", points: 100 },
    { title: "Pitch Deck", description: "Build a 10-slide investor pitch deck. Cover problem, solution, market, traction, team, and ask.", points: 120 },
  ],
  Languages: [
    { title: "Self-Introduction Recording", description: "Record a 60-second self-introduction. Use full sentences and at least 3 verb tenses. Submit an audio file.", points: 60 },
    { title: "Dialogue Writing", description: "Write a 2-character dialogue (~20 lines) set in a restaurant. Hand-in plus a recording reading it aloud.", points: 80 },
    { title: "Final Oral Exam Prep", description: "Prepare answers to the 10 oral exam prompts shared in class. Practice with a partner and submit a reflection.", points: 100 },
  ],
  Math: [
    { title: "Limits & Continuity Problem Set", description: "Complete problems 1–20 in Chapter 1. Show all working. Scanned handwritten work is fine.", points: 80 },
    { title: "Derivatives — Applied Problems", description: "Solve the 8 applied derivative problems (optimization, related rates). Justify each setup.", points: 100 },
    { title: "Final Exam Review", description: "Complete the full mock final. Time yourself (90 min). Submit your attempt and a self-assessment.", points: 120 },
  ],
};

const SAMPLE_SUBMISSION_TEXTS = [
  "Here's my deployed link: https://my-project.example.com — and the repo: https://github.com/student/project. I struggled with state management in the editor view but figured it out using a reducer.",
  "Attached PDF of my work. I focused on accessibility and used semantic HTML throughout. Lighthouse score is 98.",
  "Notebook attached. I tried two models — Random Forest and XGBoost. XGBoost gave 87% accuracy on the validation set.",
  "Submitting late, sorry! Had a family emergency. I'd appreciate any feedback you have time for.",
  "Done! Followed the rubric exactly. The README explains my design choices in detail.",
  "Took longer than I expected but I'm proud of the result. Open to feedback on the architecture.",
  "Quick submission — let me know if I missed anything in the requirements.",
];

const FEEDBACK_TEMPLATES = [
  "Great work overall. The structure is clean and your README is helpful. Consider adding error states for the edge cases we discussed.",
  "Solid effort. Your analysis is thorough but the visualizations could use better labels. Minor deductions for that.",
  "Excellent project — one of the strongest submissions this round. The deployment was smooth too.",
  "Good attempt. The core logic works but the UI needs polish. Try matching the Figma spec more closely next time.",
  "Strong write-up. Loved your section on trade-offs. Would have liked to see a small test suite.",
  "",
];

export function seedAssignments(courses: Course[], students: TeacherStudentRow[]): AssignmentSeed[] {
  const out: AssignmentSeed[] = [];
  for (const course of courses) {
    const templates = ASSIGNMENT_TEMPLATES[course.category] ?? ASSIGNMENT_TEMPLATES["Web Dev"];
    const enrolled = students.filter((s) => s.courseId === course.id);

    // 1) Closed past assignment — fully graded
    const closedTpl = templates[0];
    const closedDue = isoAgo(DAY * 18);
    out.push({
      id: uid("asn"),
      courseId: course.id,
      title: closedTpl.title,
      description: closedTpl.description,
      points: closedTpl.points,
      dueDate: closedDue,
      status: "closed",
      createdAt: isoAgo(DAY * 32),
      submissions: enrolled.slice(0, Math.min(6, enrolled.length)).map((s, i) => ({
        studentId: s.userId,
        studentName: s.userName,
        submittedAt: isoAgo(DAY * (20 + (i % 4))),
        content: pick(SAMPLE_SUBMISSION_TEXTS, i),
        grade: closedTpl.points - (i % 4) * 5,
        feedback: pick(FEEDBACK_TEMPLATES, i),
      })),
    });

    // 2) Open current assignment — mostly submitted, some pending
    const openTpl = templates[1];
    out.push({
      id: uid("asn"),
      courseId: course.id,
      title: openTpl.title,
      description: openTpl.description,
      points: openTpl.points,
      dueDate: daysFromNow(5),
      status: "open",
      createdAt: isoAgo(DAY * 7),
      submissions: enrolled.slice(0, Math.max(0, Math.floor(enrolled.length * 0.45))).map((s, i) => ({
        studentId: s.userId,
        studentName: s.userName,
        submittedAt: isoAgo(HOUR * (3 + i * 12)),
        content: pick(SAMPLE_SUBMISSION_TEXTS, i + 2),
        grade: i % 3 === 0 ? null : openTpl.points - (i % 4) * 6, // some graded already
        feedback: i % 3 === 0 ? "" : pick(FEEDBACK_TEMPLATES, i),
      })),
    });

    // 3) Final project — draft, not yet visible
    const finalTpl = templates[2];
    out.push({
      id: uid("asn"),
      courseId: course.id,
      title: finalTpl.title,
      description: finalTpl.description,
      points: finalTpl.points,
      dueDate: daysFromNow(28),
      status: "draft",
      createdAt: isoAgo(DAY * 2),
      submissions: [],
    });
  }
  return out;
}

// ===================================================================
// Quizzes
// ===================================================================

type QuizSeed = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  published: boolean;
  createdAt: string;
  questions: { id: string; prompt: string; options: string[]; answerIndex: number }[];
  attempts: { studentId: string; studentName: string; score: number; percentage: number; completedAt: string }[];
};

const QUIZ_TEMPLATES: Record<CourseCategory, { title: string; description: string; questions: { prompt: string; options: string[]; answerIndex: number }[] }[]> = {
  "Web Dev": [
    {
      title: "JavaScript Fundamentals",
      description: "Basics of variables, scope, and types.",
      questions: [
        { prompt: "What does `typeof null` return in JavaScript?", options: ["null", "object", "undefined", "boolean"], answerIndex: 1 },
        { prompt: "Which keyword creates a block-scoped variable?", options: ["var", "let", "function", "global"], answerIndex: 1 },
        { prompt: "Which of these is NOT a primitive type?", options: ["string", "number", "object", "boolean"], answerIndex: 2 },
        { prompt: "What is the result of `'5' + 3` in JS?", options: ["8", "'53'", "'8'", "NaN"], answerIndex: 1 },
        { prompt: "Which array method does NOT mutate the original?", options: ["push", "splice", "map", "sort"], answerIndex: 2 },
      ],
    },
    {
      title: "React Hooks Quick Check",
      description: "useState, useEffect, useMemo.",
      questions: [
        { prompt: "Which hook runs a side effect after render?", options: ["useState", "useMemo", "useEffect", "useRef"], answerIndex: 2 },
        { prompt: "What does the dependency array control in useEffect?", options: ["Initial render only", "When the effect re-runs", "Whether the component mounts", "The cleanup function"], answerIndex: 1 },
        { prompt: "Which hook memoizes a computed value?", options: ["useMemo", "useCallback", "useReducer", "useContext"], answerIndex: 0 },
        { prompt: "What's the rule about hooks?", options: ["Call in loops", "Call inside conditions", "Call at the top level", "Call after returns"], answerIndex: 2 },
      ],
    },
  ],
  "Data Science": [
    {
      title: "Pandas Essentials",
      description: "Data wrangling refresher.",
      questions: [
        { prompt: "Which method drops rows containing nulls?", options: ["dropna()", "fillna()", "isnull()", "removena()"], answerIndex: 0 },
        { prompt: "What does `df.head(3)` return?", options: ["First 3 columns", "First 3 rows", "Last 3 rows", "Random 3 rows"], answerIndex: 1 },
        { prompt: "Which is used to group + aggregate?", options: ["pivot()", "groupby()", "filter()", "join()"], answerIndex: 1 },
        { prompt: "Pandas Series is most like which Python type?", options: ["list", "dict", "set", "tuple"], answerIndex: 1 },
      ],
    },
    {
      title: "ML Concepts",
      description: "Supervised vs unsupervised.",
      questions: [
        { prompt: "Linear regression is which type of learning?", options: ["Unsupervised", "Reinforcement", "Supervised", "Semi-supervised"], answerIndex: 2 },
        { prompt: "Overfitting means the model…", options: ["Memorizes training data", "Underperforms on training data", "Has too few parameters", "Is too simple"], answerIndex: 0 },
        { prompt: "Which metric is for classification?", options: ["MSE", "MAE", "F1 score", "R²"], answerIndex: 2 },
        { prompt: "K-means is for…", options: ["Classification", "Clustering", "Regression", "Ranking"], answerIndex: 1 },
      ],
    },
  ],
  Design: [
    {
      title: "Design Principles",
      description: "Color, hierarchy, alignment.",
      questions: [
        { prompt: "Which principle uses size & weight to guide the eye?", options: ["Hierarchy", "Symmetry", "Contrast", "Repetition"], answerIndex: 0 },
        { prompt: "The 60-30-10 rule applies to…", options: ["Spacing", "Color distribution", "Typography", "Grid columns"], answerIndex: 1 },
        { prompt: "Best practice for body text line-height?", options: ["1.0", "1.2-1.5", "2.0+", "0.8"], answerIndex: 1 },
        { prompt: "Which color model is for screen design?", options: ["CMYK", "RGB", "Pantone", "Lab"], answerIndex: 1 },
      ],
    },
  ],
  Business: [
    {
      title: "Startup Fundamentals",
      description: "PMF, validation, MVP.",
      questions: [
        { prompt: "PMF stands for…", options: ["Product Market Fit", "Project Management Framework", "Public Market Float", "Pre-Money Funding"], answerIndex: 0 },
        { prompt: "An MVP should be…", options: ["Feature-complete", "Bug-free", "The smallest test of the core hypothesis", "Polished UI"], answerIndex: 2 },
        { prompt: "CAC is…", options: ["Customer Acquisition Cost", "Cumulative Annual Cost", "Capital Asset Class", "Cost of All Channels"], answerIndex: 0 },
      ],
    },
  ],
  Languages: [
    {
      title: "Greetings & Vocabulary",
      description: "Beginner level.",
      questions: [
        { prompt: "How do you say 'Hello' in Spanish?", options: ["Hola", "Adiós", "Gracias", "Por favor"], answerIndex: 0 },
        { prompt: "'Buenos días' means…", options: ["Good night", "Good morning", "Goodbye", "Good evening"], answerIndex: 1 },
        { prompt: "The Spanish word for 'water' is…", options: ["Agua", "Fuego", "Aire", "Tierra"], answerIndex: 0 },
      ],
    },
  ],
  Math: [
    {
      title: "Limits & Derivatives",
      description: "Calc I refresher.",
      questions: [
        { prompt: "lim(x→0) sin(x)/x = ?", options: ["0", "1", "∞", "undefined"], answerIndex: 1 },
        { prompt: "d/dx [x^n] = ?", options: ["n·x^(n-1)", "x^n", "n·x^n", "x^(n+1)/n"], answerIndex: 0 },
        { prompt: "The derivative of a constant is…", options: ["1", "The constant itself", "0", "Undefined"], answerIndex: 2 },
        { prompt: "If f(x) = x², then f'(3) = ?", options: ["3", "6", "9", "12"], answerIndex: 1 },
      ],
    },
  ],
};

export function seedQuizzes(courses: Course[], students: TeacherStudentRow[]): QuizSeed[] {
  const out: QuizSeed[] = [];
  for (const course of courses) {
    const templates = QUIZ_TEMPLATES[course.category] ?? QUIZ_TEMPLATES["Web Dev"];
    const enrolled = students.filter((s) => s.courseId === course.id);

    templates.forEach((tpl, ti) => {
      const questions = tpl.questions.map((q) => ({ id: uid("q"), ...q }));
      const totalQ = questions.length || 1;
      const isPublished = ti === 0;

      const attempts = isPublished
        ? enrolled.slice(0, Math.max(0, Math.floor(enrolled.length * 0.7))).map((s, i) => {
            const correct = Math.max(1, Math.min(totalQ, totalQ - (i % 3)));
            return {
              studentId: s.userId,
              studentName: s.userName,
              score: correct,
              percentage: Math.round((correct / totalQ) * 100),
              completedAt: isoAgo(DAY * (1 + (i % 6))),
            };
          })
        : [];

      out.push({
        id: uid("qz"),
        courseId: course.id,
        title: tpl.title,
        description: tpl.description,
        durationMinutes: 15,
        passingScore: 60,
        published: isPublished,
        createdAt: isoAgo(DAY * (ti === 0 ? 14 : 4)),
        questions,
        attempts,
      });
    });
  }
  return out;
}

// ===================================================================
// Schedule
// ===================================================================

type ScheduleSeed = {
  id: string;
  courseId: string;
  title: string;
  kind: "class" | "office_hours" | "deadline" | "exam";
  startsAt: string;
  durationMinutes: number;
  location: string;
  notes: string;
};

export function seedSchedule(courses: Course[]): ScheduleSeed[] {
  const out: ScheduleSeed[] = [];
  courses.forEach((course, ci) => {
    const slot = 14 + ci * 1; // stagger hours per course
    // Next two weekly classes
    out.push({
      id: uid("ev"),
      courseId: course.id,
      title: `${course.title} — Lecture`,
      kind: "class",
      startsAt: daysFromNow(2 + ci, slot % 18, 0),
      durationMinutes: 60,
      location: "Online · Zoom",
      notes: "Bring questions from this week's chapters.",
    });
    out.push({
      id: uid("ev"),
      courseId: course.id,
      title: `${course.title} — Lecture`,
      kind: "class",
      startsAt: daysFromNow(9 + ci, slot % 18, 0),
      durationMinutes: 60,
      location: "Online · Zoom",
      notes: "",
    });
    // Office hours
    out.push({
      id: uid("ev"),
      courseId: course.id,
      title: "Office hours",
      kind: "office_hours",
      startsAt: daysFromNow(4 + ci, 17, 0),
      durationMinutes: 45,
      location: "Room 204 / Drop-in Zoom",
      notes: "Open Q&A — bring anything!",
    });
    // Mid-term exam in 3 weeks
    if (ci === 0) {
      out.push({
        id: uid("ev"),
        courseId: course.id,
        title: "Mid-term exam",
        kind: "exam",
        startsAt: daysFromNow(21, 10, 0),
        durationMinutes: 90,
        location: "Hall A",
        notes: "Covers chapters 1–4. Open-book allowed.",
      });
    }
    // Deadline reminder
    out.push({
      id: uid("ev"),
      courseId: course.id,
      title: "Assignment 2 due",
      kind: "deadline",
      startsAt: daysFromNow(5 + ci, 23, 59),
      durationMinutes: 0,
      location: "Submit on portal",
      notes: "",
    });
  });
  return out;
}

// ===================================================================
// Live classes
// ===================================================================

type LiveSeed = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  startsAt: string;
  durationMinutes: number;
  meetingUrl: string;
  status: "scheduled" | "live" | "ended";
  attendees: number;
};

export function seedLive(courses: Course[]): LiveSeed[] {
  if (courses.length === 0) return [];
  const out: LiveSeed[] = [];

  // Recent ended session
  out.push({
    id: uid("lc"),
    courseId: courses[0].id,
    title: "Live Q&A — last week's chapters",
    description: "Answered questions on the past 3 chapters and walked through the optional bonus exercise.",
    startsAt: isoAgo(DAY * 6 - HOUR * 2),
    durationMinutes: 60,
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    status: "ended",
    attendees: 32,
  });

  // Upcoming this week
  out.push({
    id: uid("lc"),
    courseId: courses[Math.min(1, courses.length - 1)].id,
    title: "Project workshop",
    description: "Hands-on lab session — bring your work-in-progress and we'll review live.",
    startsAt: daysFromNow(2, 18, 0),
    durationMinutes: 90,
    meetingUrl: "https://meet.google.com/xyz-abcd-efg",
    status: "scheduled",
    attendees: 0,
  });

  // Next week
  out.push({
    id: uid("lc"),
    courseId: courses[0].id,
    title: "Mid-term review",
    description: "Walk-through of the mid-term study guide and example problems.",
    startsAt: daysFromNow(8, 19, 0),
    durationMinutes: 75,
    meetingUrl: "https://meet.google.com/rev-iew-mid",
    status: "scheduled",
    attendees: 0,
  });

  return out;
}

// ===================================================================
// Grades — columns + entries
// ===================================================================

type ColumnSeed = { id: string; label: string; weight: number; courseId: string };
type GradesMap = Record<string, Record<string, number | null>>;

export function seedGradeColumns(courses: Course[]): ColumnSeed[] {
  const out: ColumnSeed[] = [];
  for (const course of courses) {
    const cid = course.id;
    out.push(
      { id: `col_${cid}_hw`, label: "Homework", weight: 20, courseId: cid },
      { id: `col_${cid}_proj`, label: "Project", weight: 25, courseId: cid },
      { id: `col_${cid}_mid`, label: "Mid-term", weight: 25, courseId: cid },
      { id: `col_${cid}_fin`, label: "Final", weight: 30, courseId: cid },
    );
  }
  return out;
}

export function seedGrades(courses: Course[], students: TeacherStudentRow[]): GradesMap {
  const cols = seedGradeColumns(courses);
  const map: GradesMap = {};
  for (const s of students) {
    const courseCols = cols.filter((c) => c.courseId === s.courseId);
    const k = `${s.userId}::${s.courseId}`;
    const row: Record<string, number | null> = {};
    // Base grade derived from progress with some variation
    const base = Math.max(40, Math.min(100, s.completed ? 88 : 50 + Math.round(s.progress * 0.45)));
    for (let i = 0; i < courseCols.length; i++) {
      const col = courseCols[i];
      const jitter = ((s.userId.charCodeAt(0) + i * 7) % 12) - 6; // -6..+5
      const val = Math.max(0, Math.min(100, base + jitter));
      // Final column may not be graded yet for in-progress students
      if (col.label === "Final" && !s.completed && s.progress < 80) {
        row[col.id] = null;
      } else {
        row[col.id] = val;
      }
    }
    map[k] = row;
  }
  return map;
}

// ===================================================================
// Attendance
// ===================================================================

type AttendanceMap = Record<string, Record<string, Record<string, "present" | "absent" | "late" | "excused" | null>>>;

export function seedAttendance(courses: Course[], students: TeacherStudentRow[]): AttendanceMap {
  const map: AttendanceMap = {};
  for (const course of courses) {
    const enrolled = students.filter((s) => s.courseId === course.id);
    if (enrolled.length === 0) continue;

    const sessions: Record<string, Record<string, "present" | "absent" | "late" | "excused" | null>> = {};
    // 4 past sessions, one every 7 days
    for (let s = 0; s < 4; s++) {
      const d = new Date();
      d.setDate(d.getDate() - (s * 7 + 1));
      const key = d.toISOString().slice(0, 10);
      const session: Record<string, "present" | "absent" | "late" | "excused" | null> = {};
      enrolled.forEach((stu, i) => {
        // Roughly 75% present, 10% late, 10% absent, 5% excused, deterministic via index
        const r = (stu.userId.charCodeAt(0) + i * 3 + s * 5) % 20;
        if (r < 14) session[stu.userId] = "present";
        else if (r < 16) session[stu.userId] = "late";
        else if (r < 18) session[stu.userId] = "absent";
        else session[stu.userId] = "excused";
      });
      sessions[key] = session;
    }
    map[course.id] = sessions;
  }
  return map;
}

// ===================================================================
// Messages
// ===================================================================

type Message = { id: string; from: "me" | "them"; text: string; at: string };
type MessageThreads = Record<string, Message[]>;

const MESSAGE_CONVOS: { them: string; me: string }[][] = [
  [
    { them: "Hi! Quick question on Assignment 2 — does it need to include tests?", me: "Hey — tests aren't required but they boost the grade. Aim for the happy path at minimum." },
    { them: "Got it, thanks!", me: "👍" },
  ],
  [
    { them: "I'll be 10 min late to today's class, family thing.", me: "No worries, I'll share the recording after." },
  ],
  [
    { them: "Can I get an extension on the final project? I'm overloaded this week.", me: "How much extra time would help? I can give 3 days if you submit a brief progress update by Friday." },
    { them: "3 days is perfect, thank you so much.", me: "Sounds good — looking forward to seeing it." },
  ],
  [
    { them: "Loved today's lecture. The state management section finally clicked.", me: "So glad to hear that. Keep going — the next chapter ties it all together." },
  ],
];

export function seedMessages(students: TeacherStudentRow[]): MessageThreads {
  const out: MessageThreads = {};
  const seen = new Set<string>();
  let convoIdx = 0;
  for (const s of students) {
    if (seen.has(s.userId)) continue;
    seen.add(s.userId);
    if (convoIdx >= MESSAGE_CONVOS.length) break;
    const convo = MESSAGE_CONVOS[convoIdx++];
    const msgs: Message[] = [];
    let t = Date.now() - DAY * (2 + convoIdx) - HOUR * 3;
    convo.forEach((turn, i) => {
      msgs.push({ id: uid("m"), from: "them", text: turn.them, at: new Date(t).toISOString() });
      t += MIN * (3 + (i % 5));
      msgs.push({ id: uid("m"), from: "me", text: turn.me, at: new Date(t).toISOString() });
      t += MIN * (5 + (i % 4));
    });
    out[s.userId] = msgs;
  }
  return out;
}

// ===================================================================
// Forum
// ===================================================================

type ForumThread = {
  id: string;
  courseId: string;
  title: string;
  body: string;
  authorName: string;
  authorRole: "Instructor" | "Student";
  pinned: boolean;
  locked: boolean;
  flagged: boolean;
  createdAt: string;
  replies: { id: string; authorName: string; authorRole: "Instructor" | "Student"; text: string; at: string }[];
};

const FORUM_AUTHORS = ["Ayesha N.", "Daniyal S.", "Hina K.", "Bilal M.", "Maira R.", "Usman T.", "Sofia A."];

const FORUM_TEMPLATES = [
  {
    title: "Stuck on the second exercise — am I missing something?",
    body: "I tried two approaches but neither passes the test cases. Any hint without spoiling it?",
    replies: [
      { who: "Student", name: "Daniyal S.", text: "Check the edge case where the input is empty — that one bit me too." },
      { who: "Instructor", name: "instructor", text: "Daniyal's hint is the right one — and remember to handle off-by-one on the upper bound." },
    ],
  },
  {
    title: "Resources for going deeper after this course?",
    body: "Loving the material. What would you recommend as next steps once we finish?",
    replies: [
      { who: "Instructor", name: "instructor", text: "I'd suggest the advanced track plus the optional reading I shared in week 3. Will pin a longer list soon." },
    ],
  },
  {
    title: "Study group for the mid-term?",
    body: "Anyone interested in a study group? Thinking Wed evenings starting next week.",
    replies: [
      { who: "Student", name: "Hina K.", text: "I'm in!" },
      { who: "Student", name: "Bilal M.", text: "Count me in too — DM me." },
    ],
  },
];

export function seedForum(courses: Course[], instructorName: string): ForumThread[] {
  const out: ForumThread[] = [];
  for (const course of courses) {
    FORUM_TEMPLATES.forEach((tpl, i) => {
      const author = FORUM_AUTHORS[(i + course.id.charCodeAt(course.id.length - 1)) % FORUM_AUTHORS.length];
      out.push({
        id: uid("th"),
        courseId: course.id,
        title: tpl.title,
        body: tpl.body,
        authorName: author,
        authorRole: "Student",
        pinned: i === 1, // pin the resources thread
        locked: false,
        flagged: false,
        createdAt: isoAgo(DAY * (1 + i * 2)),
        replies: tpl.replies.map((r, ri) => ({
          id: uid("r"),
          authorName: r.name === "instructor" ? instructorName : r.name,
          authorRole: r.who as "Instructor" | "Student",
          text: r.text,
          at: isoAgo(DAY * (1 + i * 2) - HOUR * (3 + ri * 2)),
        })),
      });
    });
  }
  return out;
}

// ===================================================================
// Announcements
// ===================================================================

type Announcement = {
  id: string;
  courseId: string | "all";
  title: string;
  body: string;
  priority: "normal" | "important" | "urgent";
  pinned: boolean;
  createdAt: string;
};

export function seedAnnouncements(courses: Course[]): Announcement[] {
  return [
    {
      id: uid("an"),
      courseId: "all",
      title: "Welcome to the new term 🎉",
      body: "Excited to have you all here. Office hours are on the schedule page. Drop in any time with questions — there are no silly ones.",
      priority: "normal",
      pinned: true,
      createdAt: isoAgo(DAY * 12),
    },
    {
      id: uid("an"),
      courseId: courses[0]?.id ?? "all",
      title: "Mid-term schedule confirmed",
      body: "Mid-term will be 3 weeks from today. Study guide is on the resources page. We'll do a review session the day before — see the schedule.",
      priority: "important",
      pinned: false,
      createdAt: isoAgo(DAY * 4),
    },
    {
      id: uid("an"),
      courseId: "all",
      title: "Assignment 2 deadline reminder",
      body: "Submissions close Friday at midnight. Late work loses 10% per day — please reach out early if you need an extension.",
      priority: "important",
      pinned: false,
      createdAt: isoAgo(DAY * 2),
    },
    {
      id: uid("an"),
      courseId: courses[Math.min(1, Math.max(0, courses.length - 1))]?.id ?? "all",
      title: "Optional reading shared",
      body: "I dropped a short bonus reading in the resources for anyone interested in going deeper on this week's topic. Not graded — just for the curious.",
      priority: "normal",
      pinned: false,
      createdAt: isoAgo(HOUR * 8),
    },
  ];
}

// ===================================================================
// Payouts
// ===================================================================

type Payout = {
  id: string;
  amount: number;
  method: "Bank" | "PayPal" | "Stripe";
  status: "pending" | "paid" | "failed";
  requestedAt: string;
  paidAt?: string;
};

export function seedPayouts(): Payout[] {
  return [
    {
      id: uid("po"),
      amount: 482.5,
      method: "Bank",
      status: "paid",
      requestedAt: isoAgo(DAY * 60),
      paidAt: isoAgo(DAY * 57),
    },
    {
      id: uid("po"),
      amount: 615.75,
      method: "PayPal",
      status: "paid",
      requestedAt: isoAgo(DAY * 30),
      paidAt: isoAgo(DAY * 27),
    },
  ];
}

// ===================================================================
// Reviews
// ===================================================================

type Review = {
  id: string;
  courseId: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
  reply?: { body: string; at: string };
  hidden?: boolean;
};

const REVIEW_AUTHORS = [
  "Ayesha N.",
  "Daniyal Sheikh",
  "Hina Khan",
  "Bilal Mehmood",
  "Maira Raza",
  "Usman Tariq",
  "Sofia Ahmed",
  "Kashif Iqbal",
];

const REVIEW_TEMPLATES: { rating: number; body: string }[] = [
  { rating: 5, body: "Best course I've taken on this topic. The pacing was perfect and the projects actually taught me something I could put on my resume." },
  { rating: 5, body: "Loved every minute. The instructor explains complex ideas in a way that just clicks. Highly recommend." },
  { rating: 4, body: "Great course overall. Some chapters could be a bit more in-depth but the fundamentals are rock-solid." },
  { rating: 4, body: "Excellent material and very practical. Audio quality dipped in a couple of videos but content makes up for it." },
  { rating: 3, body: "Solid content but I wish there were more exercises after each section. Felt like I was watching more than doing." },
  { rating: 5, body: "The instructor actually replies in the forum and that made a huge difference. Felt supported throughout." },
  { rating: 4, body: "Practical, focused, no fluff. Exactly what I was looking for after struggling with other courses." },
];

const REVIEW_REPLIES = [
  "Thank you so much — really appreciate the kind words. Glad it helped!",
  "Thanks for the honest feedback. I'm working on a deeper exercise pack for the chapters you mentioned — will share when it's ready.",
  "Means a lot, thank you! See you in the next cohort.",
];

export function seedReviews(courses: Course[]): Review[] {
  const out: Review[] = [];
  for (const course of courses) {
    const count = 4 + (course.id.charCodeAt(course.id.length - 1) % 3); // 4-6 per course
    for (let i = 0; i < count; i++) {
      const tpl = REVIEW_TEMPLATES[(i * 3 + course.id.charCodeAt(0)) % REVIEW_TEMPLATES.length];
      const author = REVIEW_AUTHORS[(i + course.id.charCodeAt(course.id.length - 1)) % REVIEW_AUTHORS.length];
      const withReply = i % 3 === 0;
      out.push({
        id: uid("rv"),
        courseId: course.id,
        authorName: author,
        rating: tpl.rating,
        body: tpl.body,
        createdAt: isoAgo(DAY * (3 + i * 5)),
        reply: withReply
          ? {
              body: REVIEW_REPLIES[i % REVIEW_REPLIES.length],
              at: isoAgo(DAY * (3 + i * 5) - HOUR * 6),
            }
          : undefined,
      });
    }
  }
  return out;
}
