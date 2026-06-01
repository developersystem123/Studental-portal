import Link from "next/link";
import Icon from "@/components/icons";
import { Avatar, Badge, Button, Card, CardBody } from "@/components/ui";

export const metadata = {
  title: "Student Stories — EduPortal",
  description: "What our learners say about EduPortal.",
};

const FEATURED = {
  name: "Priya Anand",
  role: "Software Engineer, Razorpay",
  cohort: "Web Dev Bootcamp '25",
  avatar: null,
  quote:
    "Six months ago I was an accountant teaching myself JavaScript on weekends. Today I'm a software engineer at a company I admired from afar. EduPortal didn't just teach me to code — the AI tutor felt like a patient senior dev on call 24/7.",
  videoThumbnail: "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=1200",
};

const STORIES = [
  {
    name: "Aman Khan",
    role: "Junior Data Analyst",
    cohort: "Data Science Path",
    rating: 5,
    quote:
      "The Python + pandas track is the best I've taken — and I tried three. Real datasets, real problems, instant AI feedback when I got stuck. Got my first analyst role two weeks after finishing.",
  },
  {
    name: "Sara Mehmood",
    role: "Product Designer",
    cohort: "UI/UX Foundations",
    rating: 5,
    quote:
      "Coming from graphic design, I thought UX would be a small leap. The structured curriculum showed me how big the gap was — and how to close it. The portfolio reviews changed my whole approach.",
  },
  {
    name: "Tanay Joshi",
    role: "Bootcamp Grad → Frontend Dev",
    cohort: "React Advanced",
    rating: 5,
    quote:
      "Live classes were a game-changer. Asking questions in real-time and seeing other people's solutions taught me more than any tutorial.",
  },
  {
    name: "Hira Sheikh",
    role: "Marketing Manager",
    cohort: "Digital Marketing",
    rating: 4,
    quote:
      "I was nervous about going back to learn at 35 with a full-time job. Self-paced + the schedule reminders kept me on track. Got promoted within 4 months of completion.",
  },
  {
    name: "Daniyal Ahmed",
    role: "Self-taught Developer",
    cohort: "Full-Stack Path",
    rating: 5,
    quote:
      "I quit my job to learn full-time. The Pro plan paid for itself in week one — unlimited AI tutoring meant I never got stuck for more than 10 minutes.",
  },
  {
    name: "Ayesha Malik",
    role: "Math Teacher",
    cohort: "Math for Educators",
    rating: 5,
    quote:
      "As a teacher, I'm picky about pedagogy. EduPortal's instructors actually understand how people learn — not just how to do the thing.",
  },
  {
    name: "Faizan Iqbal",
    role: "Business Analyst",
    cohort: "Excel & SQL",
    rating: 4,
    quote:
      "I just wanted to level up my SQL. Ended up taking 3 more courses because the platform is so good. Worth it.",
  },
  {
    name: "Mishaal Raza",
    role: "High School Student",
    cohort: "Intro to Programming",
    rating: 5,
    quote:
      "My school didn't offer CS. I learned Python here in 11th grade and won my first hackathon a year later. Forever grateful.",
  },
];

const STATS = [
  { value: "94%", label: "Would recommend to a friend" },
  { value: "4.8", label: "Average course rating" },
  { value: "65%", label: "Land role within 6 months" },
  { value: "48k+", label: "Active learners" },
];

export default function TestimonialsPage() {
  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 lg:pt-20 text-center">
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Student Stories</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight">
          Real outcomes from <span className="gradient-text">real learners</span>
        </h1>
        <p className="mt-4 text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Career switches, salary jumps, first jobs, side projects. Here&apos;s what our community has built.
        </p>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold gradient-text">{s.value}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="overflow-hidden grid md:grid-cols-2 gap-0">
          <div className="relative h-72 md:h-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={FEATURED.videoThumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <button className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition group">
              <span className="h-16 w-16 rounded-full bg-white text-[var(--primary)] flex items-center justify-center shadow-2xl group-hover:scale-110 transition">
                <Icon.Play size={24} />
              </span>
            </button>
          </div>
          <CardBody className="p-8 flex flex-col justify-center">
            <Badge variant="primary">Featured story</Badge>
            <p className="mt-4 text-lg italic leading-relaxed">
              &ldquo;{FEATURED.quote}&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Avatar name={FEATURED.name} size={44} />
              <div>
                <p className="font-semibold">{FEATURED.name}</p>
                <p className="text-xs text-[var(--muted)]">{FEATURED.role} · {FEATURED.cohort}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-bold mb-6">More stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STORIES.map((s) => (
            <Card key={s.name}>
              <CardBody className="flex flex-col h-full">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: s.rating }).map((_, i) => (
                    <Icon.Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-[var(--foreground)] leading-relaxed italic flex-1">
                  &ldquo;{s.quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                  <Avatar name={s.name} size={36} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{s.role}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Card className="bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
          <CardBody className="p-10 text-center">
            <p className="text-2xl sm:text-3xl font-bold">Your story could be next.</p>
            <p className="mt-3 text-white/85">Join 48,000+ learners building real skills with EduPortal.</p>
            <div className="mt-6 flex justify-center gap-3 flex-wrap">
              <Link href="/register"><Button variant="secondary">Start free</Button></Link>
              <Link href="/courses"><Button variant="outline" className="text-white border-white/30 hover:bg-white/10">Browse courses</Button></Link>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
