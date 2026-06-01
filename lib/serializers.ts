// Bridge between Prisma's row types and the existing client-side types in
// lib/mockData.ts. The client UI expects category like "Web Dev" while
// Postgres enums can't have spaces (stored as Web_Dev). Centralizing the
// mapping keeps every API route consistent.

import type {
  Chapter as PrismaChapter,
  Course as PrismaCourse,
  CourseCategory as PrismaCategory,
} from "./generated/prisma/client";
import type { Chapter, Course, CourseCategory } from "./mockData";

const TO_CLIENT: Record<PrismaCategory, CourseCategory> = {
  Web_Dev: "Web Dev",
  Data_Science: "Data Science",
  Design: "Design",
  Business: "Business",
  Languages: "Languages",
  Math: "Math",
};

const TO_DB: Record<CourseCategory, PrismaCategory> = {
  "Web Dev": "Web_Dev",
  "Data Science": "Data_Science",
  Design: "Design",
  Business: "Business",
  Languages: "Languages",
  Math: "Math",
};

export function categoryToClient(c: PrismaCategory): CourseCategory {
  return TO_CLIENT[c];
}

export function categoryToDb(c: CourseCategory): PrismaCategory {
  return TO_DB[c];
}

export function toClientChapter(c: PrismaChapter): Chapter {
  return {
    id: c.id,
    title: c.title,
    duration: c.duration,
    videoUrl: c.videoUrl,
    resources: (c.resources as Chapter["resources"]) ?? undefined,
  };
}

export function toClientCourse(
  c: PrismaCourse & { chapters?: PrismaChapter[] },
): Course {
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    thumbnail: c.thumbnail,
    instructor: c.instructor,
    instructorAvatar: c.instructorAvatar ?? undefined,
    category: categoryToClient(c.category),
    level: c.level,
    price: c.price,
    durationMinutes: c.durationMinutes,
    rating: c.rating,
    reviews: c.reviews,
    tags: c.tags,
    chapters: (c.chapters ?? []).map(toClientChapter),
  };
}
