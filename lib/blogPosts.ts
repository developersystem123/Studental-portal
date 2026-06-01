// Static blog content. In production, this would come from a CMS or DB.
export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: "Learning" | "Product" | "Career" | "Community";
  author: string;
  publishedAt: string; // ISO
  readMinutes: number;
  thumbnail: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-ai-changes-learning",
    title: "How AI is reshaping the way we learn",
    excerpt: "From personalized quizzes to 24/7 tutoring, AI is making education radically more accessible. Here's what's changing — and what isn't.",
    category: "Learning",
    author: "Ananya Sharma",
    publishedAt: "2026-05-10",
    readMinutes: 6,
    thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200",
    body: `Education has always evolved with technology — printing, radio, video, the internet. But AI is different. For the first time, every learner can have a patient, brilliant tutor available at 3 AM the night before an exam.

## What's actually changing

**Personalization at scale.** Until now, "adaptive learning" mostly meant branching quizzes. AI tutors can hold a real conversation — diagnose where you're stuck, generate fresh examples, and check your understanding by asking you to explain back.

**Instant feedback.** Practice without feedback is just repetition. AI grading on essays, code, and short answers means students can iterate dozens of times in the time it used to take a teacher to mark one assignment.

**Generation, not just delivery.** Need 20 more practice problems on conditional probability? You used to wait for a textbook. Now you generate them in seconds, calibrated to your level.

## What isn't changing

Motivation, curiosity, and the human relationships that fuel learning. The best teachers don't just transfer knowledge — they inspire, support, and hold students accountable. AI is a multiplier; teachers and mentors are still the engine.

## What we're betting on

At EduPortal we think the future of learning is **AI augmentation, not AI replacement**. Use AI to remove friction — instant feedback, infinite practice, on-demand explanations — and free up human time for the things only humans can do: storytelling, mentorship, and community.

If you've been on the fence about trying an AI study companion, this is the moment. The tools are good enough now that they actually help.`,
  },
  {
    slug: "5-habits-of-effective-learners",
    title: "5 habits that separate effective learners from everyone else",
    excerpt: "Talent is overrated. What actually matters is consistent, deliberate practice — and these five habits.",
    category: "Learning",
    author: "Rohan Verma",
    publishedAt: "2026-05-03",
    readMinutes: 4,
    thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200",
    body: `After studying how thousands of students learn on EduPortal, five habits stand out.

**1. They start before they feel ready.**
Most people wait until they "understand the basics" before practicing. Effective learners start producing from day one — even badly. Output sharpens input.

**2. They embrace boredom.**
The interesting topics get all the attention. But mastery lives in the boring middle — drilling the fundamentals until they're automatic. Effective learners trust the process.

**3. They explain it.**
The Feynman technique works: if you can't explain it simply, you don't understand it. Effective learners narrate, blog, tutor, or just talk to a rubber duck.

**4. They build a system, not goals.**
Goals are unreliable motivators. Systems compound. "Study for 30 minutes after breakfast every day" beats "learn JavaScript this year."

**5. They review brutally.**
Spaced repetition isn't a hack — it's the whole game. Effective learners revisit material on day 1, day 3, day 7, and day 21.

None of these are secrets. The hard part is doing them consistently.`,
  },
  {
    slug: "new-features-spring-2026",
    title: "What's new in EduPortal — Spring 2026 update",
    excerpt: "Live classes, a new discussion forum, faster AI, and a redesigned dashboard. Here's everything we shipped.",
    category: "Product",
    author: "Maya Patel",
    publishedAt: "2026-04-25",
    readMinutes: 5,
    thumbnail: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=1200",
    body: `We've been busy. Here's what's new this quarter.

## Live Classes
You can now join live sessions with your instructors — Q&A, deep dives, and project reviews. Recordings are available for everyone who registered, so missing one is fine.

## Forum
A long-requested feature: a built-in community forum, organized by course and category. Ask questions, share wins, help others. Best questions get pinned.

## Faster AI
Our new model loads 2× faster and handles much longer context. You can paste a whole chapter and ask follow-up questions without losing the thread.

## Redesigned dashboard
Cleaner, faster, and with better progress tracking. You'll see hours learned, category breakdown, and quiz history at a glance.

## What's next
Mobile app revamp, peer code reviews for programming courses, and a teacher gradebook. See you in summer's update.`,
  },
  {
    slug: "from-bootcamp-to-job",
    title: "From a bootcamp to your first job — a realistic guide",
    excerpt: "The bootcamp ends but the job hunt doesn't. Here's how to make the leap into your first dev role.",
    category: "Career",
    author: "Karan Mehta",
    publishedAt: "2026-04-12",
    readMinutes: 8,
    thumbnail: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200",
    body: `You finished the bootcamp. You can build a CRUD app. Now what?

## Build, don't tutor-binge
The biggest mistake bootcamp graduates make is enrolling in 5 more courses. Stop. You know enough to build. Now you need a portfolio with real projects — at least 3, deployed, with READMEs that explain *why* you built them.

## Pick problems you'd pay for
"Todo app" is fine for learning, but in interviews it screams "I built what the tutorial told me to." Build something you'd actually use — a tool that scratches an itch. Habit tracker, expense splitter, recipe scaler.

## Apply like it's a numbers game
The average junior dev sends 100+ applications before landing a role. Don't take rejections personally — most rejections are about timing, budget, or fit, not your skills.

## Network sideways
The strongest signal in your job hunt isn't recruiters — it's other juniors. Talk to people 6 months ahead of you. They remember what worked.

## Keep building publicly
A GitHub with steady, dated commits beats a polished portfolio site. Hiring managers want to see *consistency* — proof you'll keep growing once hired.

Good luck. The first one is the hardest.`,
  },
  {
    slug: "community-meetups-launched",
    title: "Announcing local meetups — find your study group",
    excerpt: "We're starting community-led meetups in 12 cities. Find one near you or volunteer to host.",
    category: "Community",
    author: "Maya Patel",
    publishedAt: "2026-04-01",
    readMinutes: 3,
    thumbnail: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200",
    body: `Online learning is great. Learning *with* people is better.

We're launching official EduPortal meetups in 12 cities, with more coming as we grow:

Karachi · Lahore · Mumbai · Delhi · Bangalore · Dubai · London · Toronto · NYC · LA · Singapore · Sydney.

## What happens at a meetup
- A 45-minute lightning talk by a member (often a working professional)
- Group coding/study session
- Casual networking with food

## How to join
Visit our Events page, find a city, and RSVP. Most meetups are free.

## Want to host?
If your city isn't listed and you'd like to start one, send us a note via Contact. We provide a starter kit, swag, and partial reimbursement for venues.

See you offline!`,
  },
];
