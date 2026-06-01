"use client";

// Lightweight client-side persistence for teacher-only features that don't
// have a dedicated server table yet (assignments, quizzes, attendance, etc.).
// Everything is keyed per-user so multiple teachers on the same browser
// don't trample one another.

import * as React from "react";

function key(userId: string, slug: string) {
  return `eduportal:teacher:${userId}:${slug}`;
}

export function useLocalList<T>(userId: string | undefined, slug: string, seed: T[] = []) {
  const [items, setItems] = React.useState<T[]>(seed);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(key(userId, slug));
      if (raw) setItems(JSON.parse(raw));
      else setItems(seed);
    } catch {
      setItems(seed);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, slug]);

  React.useEffect(() => {
    if (!hydrated || !userId) return;
    try {
      localStorage.setItem(key(userId, slug), JSON.stringify(items));
    } catch {
      /* quota errors are non-fatal */
    }
  }, [items, hydrated, userId, slug]);

  return [items, setItems, hydrated] as const;
}

export function useLocalRecord<T>(userId: string | undefined, slug: string, seed: T) {
  const [value, setValue] = React.useState<T>(seed);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(key(userId, slug));
      if (raw) setValue(JSON.parse(raw));
      else setValue(seed);
    } catch {
      setValue(seed);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, slug]);

  React.useEffect(() => {
    if (!hydrated || !userId) return;
    try {
      localStorage.setItem(key(userId, slug), JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [value, hydrated, userId, slug]);

  return [value, setValue, hydrated] as const;
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

// Run a seed function once per (userId, slug) and persist a marker so it
// never re-runs — even if the user later empties the data.
export function useSeedOnce(
  userId: string | undefined,
  slug: string,
  ready: boolean,
  seed: () => void,
) {
  const seedRef = React.useRef(seed);
  seedRef.current = seed;
  React.useEffect(() => {
    if (!userId || !ready) return;
    const k = `eduportal:teacher:${userId}:${slug}:seeded-v1`;
    try {
      if (localStorage.getItem(k)) return;
      seedRef.current();
      localStorage.setItem(k, "1");
    } catch {
      /* ignore */
    }
  }, [userId, slug, ready]);
}
