"use client";

import * as React from "react";
import {
  COURSES,
  type ApplicationStatus,
  type Certificate,
  type Course,
  type EducationLevel,
  type Enrollment,
  type Notification,
  type PhysicalApplication,
} from "./mockData";

export type Role = "Student" | "Instructor" | "Admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  banner?: string | null;
  bio?: string;
  phone?: string;
  education?: EducationLevel;
  googleConnected?: boolean;
  createdAt?: string;
  plan?: string;
};

type Auth = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: User }>;
  loginWithGoogle: () => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: Role;
    education?: EducationLevel;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<{ ok: boolean; error?: string }>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

type ApplyInput = Omit<
  PhysicalApplication,
  "id" | "studentId" | "status" | "submittedAt" | "reviewedAt" | "reviewNote"
>;

type Data = {
  enrollments: Enrollment[];
  certificates: Certificate[];
  notifications: Notification[];
  courses: Course[];
  applications: PhysicalApplication[];
  enroll: (courseId: string) => Promise<void>;
  toggleChapter: (courseId: string, chapterId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (n: Omit<Notification, "id" | "createdAt" | "read">) => Promise<void>;
  awardCertificate: (courseId: string, score: number) => Promise<Certificate>;
  getCourse: (id: string) => Course | undefined;
  applyForPhysicalClass: (
    input: ApplyInput,
  ) => Promise<{ ok: boolean; error?: string; application?: PhysicalApplication }>;
  withdrawApplication: (id: string) => Promise<void>;
};

export type StudentSummary = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  education?: string;
  createdAt?: string;
  enrolledCount: number;
  completedCount: number;
  certificateCount: number;
};

export type TeacherSummary = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  createdAt?: string;
  courseCount: number;
  studentCount: number;
};

export type EnrollmentRow = {
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  instructor: string;
  enrolledAt: string;
  progress: number;
  completed: boolean;
  certificateId?: string;
};

export type ApplicationRow = PhysicalApplication & {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  courseCategory: string;
  instructor: string;
  // Set once the application is approved and placed into a batch.
  physicalClassTitle?: string;
};

type AdminStats = {
  students: number;
  teachers: number;
  courses: number;
  enrollments: number;
  certificates: number;
  pendingApplications: number;
};

type Admin = {
  listStudents: () => StudentSummary[];
  createStudent: (data: { name: string; email: string; password: string; phone?: string }) => Promise<{ ok: boolean; error?: string }>;
  updateStudent: (id: string, data: Partial<Pick<User, "name" | "email" | "phone" | "bio">>) => Promise<{ ok: boolean; error?: string }>;
  deleteStudent: (id: string) => Promise<void>;
  resetStudentPassword: (id: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  listTeachers: () => TeacherSummary[];
  createTeacher: (data: { name: string; email: string; password: string; phone?: string; bio?: string }) => Promise<{ ok: boolean; error?: string }>;
  updateTeacher: (id: string, data: Partial<Pick<User, "name" | "email" | "phone" | "bio">>) => Promise<{ ok: boolean; error?: string }>;
  deleteTeacher: (id: string) => Promise<void>;
  resetTeacherPassword: (id: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  addCourse: (data: Omit<Course, "id" | "slug" | "chapters" | "rating" | "reviews"> & Partial<Pick<Course, "slug" | "chapters" | "rating" | "reviews">>) => Promise<Course>;
  updateCourse: (id: string, data: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  listEnrollments: () => EnrollmentRow[];
  awardCertificateFor: (userId: string, courseId: string, score: number) => Promise<Certificate | null>;
  revokeCertificate: (userId: string, certificateId: string) => Promise<void>;
  listApplications: () => ApplicationRow[];
  setApplicationStatus: (
    id: string,
    status: ApplicationStatus,
    note?: string,
    physicalClassId?: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  stats: () => AdminStats;
  refresh: () => Promise<void>;
};

export type TeacherStudentRow = {
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  progress: number;
  completed: boolean;
  certificateId?: string;
};

type Teacher = {
  myCourses: () => Course[];
  myStudents: () => TeacherStudentRow[];
  updateMyCourse: (id: string, data: Partial<Course>) => Promise<{ ok: boolean; error?: string }>;
  stats: () => { courses: number; students: number; completions: number };
  loaded: () => boolean;
};

type Theme = "light" | "dark" | "system";
type ThemeCtx = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void; resolvedTheme: "light" | "dark" };

const AuthContext = React.createContext<Auth | null>(null);
const DataContext = React.createContext<Data | null>(null);
const AdminContext = React.createContext<Admin | null>(null);
const TeacherContext = React.createContext<Teacher | null>(null);
const ThemeContext = React.createContext<ThemeCtx | null>(null);

const LS_THEME = "eduportal:theme";
const SS_USER_KEY = "eduportal:user";

function readCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SS_USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(u: User | null): void {
  try {
    if (u) sessionStorage.setItem(SS_USER_KEY, JSON.stringify(u));
    else sessionStorage.removeItem(SS_USER_KEY);
  } catch {}
}

// ---------- Tiny fetch wrapper ----------

async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const message = (data && (data as { error?: string }).error) || `Request failed (${r.status}).`;
    throw new Error(message);
  }
  return data as T;
}

type ApiResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

async function tryApi<T = unknown>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const data = await api<T>(path, init);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Request failed." };
  }
}

// ---------- Providers ----------

export function Providers({ children }: { children: React.ReactNode }) {
  // ---------- Theme ----------
  const [theme, setThemeState] = React.useState<Theme>("light");
  const [sysDark, setSysDark] = React.useState(false);

  React.useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setSysDark(mq.matches);
      const handler = (e: MediaQueryListEvent) => setSysDark(e.matches);
      mq.addEventListener("change", handler);
      const stored = localStorage.getItem(LS_THEME) as Theme | null;
      setThemeState(stored ?? "light");
      return () => mq.removeEventListener("change", handler);
    } catch { /* ignore */ }
  }, []);

  const resolvedTheme: "light" | "dark" = theme === "system" ? (sysDark ? "dark" : "light") : theme;

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    try { localStorage.setItem(LS_THEME, theme); } catch { /* ignore */ }
  }, [theme, resolvedTheme]);

  const setTheme = React.useCallback((t: Theme) => setThemeState(t), []);

  const themeCtx: ThemeCtx = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      toggle: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      setTheme,
    }),
    [theme, resolvedTheme, setTheme],
  );

  // ---------- Auth ----------
  const [user, setUser] = React.useState<User | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    // Restore from session cache for instant UI — then validate in background.
    const cached = readCachedUser();
    if (cached) {
      setUser(cached);
      setAuthLoading(false);
    }
    (async () => {
      const res = await tryApi<{ user: User | null }>("/api/auth/me");
      if (cancelled) return;
      const fresh = res.ok ? res.data.user : null;
      writeCachedUser(fresh);
      setUser(fresh);
      if (!cached) setAuthLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const auth: Auth = React.useMemo(
    () => ({
      user,
      loading: authLoading,
      login: async (email, password) => {
        const res = await tryApi<{ user: User }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) return { ok: false, error: res.error };
        writeCachedUser(res.data.user);
        setUser(res.data.user);
        return { ok: true, user: res.data.user };
      },
      loginWithGoogle: async () => {
        // Redirect the browser to the OAuth initiation endpoint.
        // The server handles the Google consent screen, token exchange,
        // and session creation, then redirects back to the app.
        window.location.href = "/api/auth/google";
      },
      register: async (input) => {
        const res = await tryApi<{ user: User }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(input),
        });
        if (!res.ok) return { ok: false, error: res.error };
        writeCachedUser(res.data.user);
        setUser(res.data.user);
        return { ok: true };
      },
      logout: async () => {
        await tryApi("/api/auth/logout", { method: "POST" });
        writeCachedUser(null);
        setUser(null);
      },
      updateUser: async (data) => {
        // Optimistic update so the UI is snappy; revert on failure.
        const previous = user;
        if (user) setUser({ ...user, ...data });
        const res = await tryApi<{ user: User }>("/api/user", {
          method: "PUT",
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          setUser(previous);
          throw new Error(res.error);
        }
        writeCachedUser(res.data.user);
        setUser(res.data.user);
      },
      changePassword: async (current, next) => {
        const res = await tryApi("/api/auth/password", {
          method: "PUT",
          body: JSON.stringify({ current, next }),
        });
        return res.ok ? { ok: true } : { ok: false, error: res.error };
      },
      deleteAccount: async () => {
        const res = await tryApi("/api/auth/account", { method: "DELETE" });
        if (!res.ok) throw new Error(res.error);
        writeCachedUser(null);
        setUser(null);
      },
      refreshUser: async () => {
        const res = await tryApi<{ user: User | null }>("/api/auth/me");
        if (res.ok) { writeCachedUser(res.data.user); setUser(res.data.user); }
      },
    }),
    [user, authLoading],
  );

  // ---------- Per-user data (courses, enrollments, certs, notifs, applications) ----------
  const [courses, setCourses] = React.useState<Course[]>(COURSES);
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([]);
  const [certificates, setCertificates] = React.useState<Certificate[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [applications, setApplications] = React.useState<PhysicalApplication[]>([]);

  // Always fetch courses (they're public).
  const refreshCourses = React.useCallback(async () => {
    const res = await tryApi<{ courses: Course[] }>("/api/courses");
    if (res.ok) setCourses(res.data.courses);
  }, []);

  React.useEffect(() => {
    refreshCourses();
  }, [refreshCourses]);

  // Per-user data: fetch whenever the user changes.
  React.useEffect(() => {
    if (!user) {
      setEnrollments([]);
      setCertificates([]);
      setNotifications([]);
      setApplications([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const [eRes, cRes, nRes, aRes] = await Promise.all([
        tryApi<{ enrollments: Enrollment[] }>("/api/enrollments"),
        tryApi<{ certificates: Certificate[] }>("/api/certificates"),
        tryApi<{ notifications: Notification[] }>("/api/notifications"),
        user.role === "Student"
          ? tryApi<{ applications: PhysicalApplication[] }>("/api/applications")
          : Promise.resolve({ ok: true as const, data: { applications: [] } }),
      ]);
      if (cancelled) return;
      if (eRes.ok) setEnrollments(eRes.data.enrollments);
      if (cRes.ok) setCertificates(cRes.data.certificates);
      if (nRes.ok) setNotifications(nRes.data.notifications);
      if (aRes.ok) setApplications(aRes.data.applications);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const data: Data = React.useMemo(
    () => ({
      enrollments,
      certificates,
      notifications,
      courses,
      applications,
      getCourse: (id) => courses.find((c) => c.id === id),
      enroll: async (courseId) => {
        const res = await tryApi<{ enrollment: Enrollment }>("/api/enrollments", {
          method: "POST",
          body: JSON.stringify({ courseId }),
        });
        if (res.ok) {
          setEnrollments((prev) =>
            prev.find((e) => e.courseId === courseId) ? prev : [...prev, res.data.enrollment],
          );
        }
      },
      toggleChapter: async (courseId, chapterId) => {
        const res = await tryApi<{ enrollment: Enrollment }>(
          `/api/enrollments/${encodeURIComponent(courseId)}/chapter/${encodeURIComponent(chapterId)}`,
          { method: "PUT" },
        );
        if (res.ok) {
          setEnrollments((prev) =>
            prev.map((e) => (e.courseId === courseId ? res.data.enrollment : e)),
          );
        }
      },
      markAllNotificationsRead: async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        await tryApi("/api/notifications", { method: "PATCH" });
      },
      markNotificationRead: async (id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        await tryApi(`/api/notifications/${encodeURIComponent(id)}`, { method: "PATCH" });
      },
      deleteNotification: async (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        await tryApi(`/api/notifications/${encodeURIComponent(id)}`, { method: "DELETE" });
      },
      addNotification: async (n) => {
        const res = await tryApi<{ notification: Notification }>("/api/notifications", {
          method: "POST",
          body: JSON.stringify(n),
        });
        if (res.ok) setNotifications((prev) => [res.data.notification, ...prev]);
      },
      awardCertificate: async (courseId, score) => {
        const res = await tryApi<{ certificate: Certificate }>("/api/certificates", {
          method: "POST",
          body: JSON.stringify({ courseId, score }),
        });
        if (!res.ok) throw new Error(res.error);
        setCertificates((prev) => [...prev, res.data.certificate]);
        return res.data.certificate;
      },
      applyForPhysicalClass: async (input) => {
        const res = await tryApi<{ application: PhysicalApplication }>("/api/applications", {
          method: "POST",
          body: JSON.stringify(input),
        });
        if (!res.ok) return { ok: false, error: res.error };
        setApplications((prev) => [res.data.application, ...prev]);
        // Keep local user education in sync if it changed.
        if (user && input.education && input.education !== user.education) {
          setUser({ ...user, education: input.education });
        }
        return { ok: true, application: res.data.application };
      },
      withdrawApplication: async (id) => {
        const res = await tryApi(`/api/applications/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(res.error);
        setApplications((prev) => prev.filter((a) => a.id !== id));
      },
    }),
    [enrollments, certificates, notifications, courses, applications, user],
  );

  // ---------- Admin ----------
  // Lazy-load and cache the various admin lists. The methods return the current
  // cache synchronously to preserve the existing call-site shape; mutations
  // refresh the cache after a successful API call.
  const [students, setStudents] = React.useState<StudentSummary[]>([]);
  const [teachers, setTeachers] = React.useState<TeacherSummary[]>([]);
  const [adminEnrollments, setAdminEnrollments] = React.useState<EnrollmentRow[]>([]);
  const [adminApplications, setAdminApplications] = React.useState<ApplicationRow[]>([]);
  const [adminStats, setAdminStats] = React.useState<AdminStats>({
    students: 0,
    teachers: 0,
    courses: 0,
    enrollments: 0,
    certificates: 0,
    pendingApplications: 0,
  });

  const refreshStudents = React.useCallback(async () => {
    const r = await tryApi<{ students: StudentSummary[] }>("/api/admin/students");
    if (r.ok) setStudents(r.data.students);
  }, []);
  const refreshTeachers = React.useCallback(async () => {
    const r = await tryApi<{ teachers: TeacherSummary[] }>("/api/admin/teachers");
    if (r.ok) setTeachers(r.data.teachers);
  }, []);
  const refreshAdminEnrollments = React.useCallback(async () => {
    const r = await tryApi<{ enrollments: EnrollmentRow[] }>("/api/admin/enrollments");
    if (r.ok) setAdminEnrollments(r.data.enrollments);
  }, []);
  const refreshAdminApplications = React.useCallback(async () => {
    const r = await tryApi<{ applications: ApplicationRow[] }>("/api/admin/applications");
    if (r.ok) setAdminApplications(r.data.applications);
  }, []);
  const refreshAdminStats = React.useCallback(async () => {
    const r = await tryApi<{ stats: AdminStats }>("/api/admin/stats");
    if (r.ok) setAdminStats(r.data.stats);
  }, []);

  React.useEffect(() => {
    if (!user || user.role !== "Admin") return;
    refreshStudents();
    refreshTeachers();
    refreshAdminEnrollments();
    refreshAdminApplications();
    refreshAdminStats();
  }, [user, refreshStudents, refreshTeachers, refreshAdminEnrollments, refreshAdminApplications, refreshAdminStats]);

  const admin: Admin = React.useMemo(
    () => ({
      listStudents: () => students,
      listTeachers: () => teachers,
      listEnrollments: () => adminEnrollments,
      listApplications: () => adminApplications,
      stats: () => adminStats,
      refresh: async () => {
        await Promise.all([
          refreshStudents(),
          refreshTeachers(),
          refreshAdminEnrollments(),
          refreshAdminApplications(),
          refreshAdminStats(),
        ]);
      },

      createStudent: async (data) => {
        const res = await tryApi("/api/admin/students", {
          method: "POST",
          body: JSON.stringify(data),
        });
        if (!res.ok) return { ok: false, error: res.error };
        await Promise.all([refreshStudents(), refreshAdminStats()]);
        return { ok: true };
      },
      updateStudent: async (id, data) => {
        const res = await tryApi(`/api/admin/students/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        if (!res.ok) return { ok: false, error: res.error };
        await refreshStudents();
        return { ok: true };
      },
      deleteStudent: async (id) => {
        await tryApi(`/api/admin/students/${encodeURIComponent(id)}`, { method: "DELETE" });
        await Promise.all([refreshStudents(), refreshAdminEnrollments(), refreshAdminApplications(), refreshAdminStats()]);
      },
      resetStudentPassword: async (id, password) => {
        const res = await tryApi(`/api/admin/students/${encodeURIComponent(id)}/password`, {
          method: "POST",
          body: JSON.stringify({ password }),
        });
        return res.ok ? { ok: true } : { ok: false, error: res.error };
      },

      createTeacher: async (data) => {
        const res = await tryApi("/api/admin/teachers", {
          method: "POST",
          body: JSON.stringify(data),
        });
        if (!res.ok) return { ok: false, error: res.error };
        await Promise.all([refreshTeachers(), refreshAdminStats()]);
        return { ok: true };
      },
      updateTeacher: async (id, data) => {
        const res = await tryApi(`/api/admin/teachers/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        if (!res.ok) return { ok: false, error: res.error };
        await Promise.all([refreshTeachers(), refreshCourses()]);
        return { ok: true };
      },
      deleteTeacher: async (id) => {
        await tryApi(`/api/admin/teachers/${encodeURIComponent(id)}`, { method: "DELETE" });
        await Promise.all([refreshTeachers(), refreshCourses(), refreshAdminStats()]);
      },
      resetTeacherPassword: async (id, password) => {
        const res = await tryApi(`/api/admin/teachers/${encodeURIComponent(id)}/password`, {
          method: "POST",
          body: JSON.stringify({ password }),
        });
        return res.ok ? { ok: true } : { ok: false, error: res.error };
      },

      addCourse: async (input) => {
        const res = await tryApi<{ course: Course }>("/api/admin/courses", {
          method: "POST",
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(res.error);
        await Promise.all([refreshCourses(), refreshAdminStats()]);
        return res.data.course;
      },
      updateCourse: async (id, data) => {
        await tryApi(`/api/admin/courses/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        await refreshCourses();
      },
      deleteCourse: async (id) => {
        await tryApi(`/api/admin/courses/${encodeURIComponent(id)}`, { method: "DELETE" });
        await Promise.all([refreshCourses(), refreshAdminEnrollments(), refreshAdminApplications(), refreshAdminStats()]);
      },

      awardCertificateFor: async (userId, courseId, score) => {
        const res = await tryApi<{ certificate: Certificate }>("/api/admin/certificates", {
          method: "POST",
          body: JSON.stringify({ userId, courseId, score }),
        });
        if (!res.ok) return null;
        await Promise.all([refreshAdminEnrollments(), refreshStudents(), refreshAdminStats()]);
        return res.data.certificate;
      },
      revokeCertificate: async (_userId, certificateId) => {
        await tryApi(`/api/admin/certificates/${encodeURIComponent(certificateId)}`, {
          method: "DELETE",
        });
        await Promise.all([refreshAdminEnrollments(), refreshStudents(), refreshAdminStats()]);
      },

      setApplicationStatus: async (id, status, note, physicalClassId) => {
        const res = await tryApi(`/api/admin/applications/${encodeURIComponent(id)}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status, note, physicalClassId }),
        });
        if (!res.ok) return { ok: false, error: res.error };
        await Promise.all([refreshAdminApplications(), refreshAdminStats()]);
        return { ok: true };
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, teachers, adminEnrollments, adminApplications, adminStats],
  );

  // ---------- Teacher ----------
  const [myCourses, setMyCourses] = React.useState<Course[]>([]);
  const [myStudents, setMyStudents] = React.useState<TeacherStudentRow[]>([]);
  const [teacherStats, setTeacherStats] = React.useState({ courses: 0, students: 0, completions: 0 });
  const [teacherLoaded, setTeacherLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!user || user.role !== "Instructor") return;
    let cancelled = false;
    (async () => {
      const [cRes, sRes, stRes] = await Promise.all([
        tryApi<{ courses: Course[] }>("/api/teacher/courses"),
        tryApi<{ students: TeacherStudentRow[] }>("/api/teacher/students"),
        tryApi<{ stats: { courses: number; students: number; completions: number } }>("/api/teacher/stats"),
      ]);
      if (cancelled) return;
      if (cRes.ok) setMyCourses(cRes.data.courses);
      if (sRes.ok) setMyStudents(sRes.data.students);
      if (stRes.ok) setTeacherStats(stRes.data.stats);
      setTeacherLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const teacher: Teacher = React.useMemo(
    () => ({
      myCourses: () => myCourses,
      myStudents: () => myStudents,
      stats: () => teacherStats,
      loaded: () => teacherLoaded,
      updateMyCourse: async (id, data) => {
        const res = await tryApi<{ course: Course }>("/api/teacher/courses", {
          method: "PATCH",
          body: JSON.stringify({ id, ...data }),
        });
        if (!res.ok) return { ok: false, error: res.error };
        setMyCourses((prev) => prev.map((c) => (c.id === id ? res.data.course : c)));
        // Also keep the global course list in sync.
        setCourses((prev) => prev.map((c) => (c.id === id ? res.data.course : c)));
        return { ok: true };
      },
    }),
    [myCourses, myStudents, teacherStats, teacherLoaded],
  );

  return (
    <ThemeContext.Provider value={themeCtx}>
      <AuthContext.Provider value={auth}>
        <DataContext.Provider value={data}>
          <AdminContext.Provider value={admin}>
            <TeacherContext.Provider value={teacher}>{children}</TeacherContext.Provider>
          </AdminContext.Provider>
        </DataContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within Providers");
  return ctx;
}

export function useData() {
  const ctx = React.useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within Providers");
  return ctx;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within Providers");
  return ctx;
}

export function useAdmin() {
  const ctx = React.useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within Providers");
  return ctx;
}

export function useTeacher() {
  const ctx = React.useContext(TeacherContext);
  if (!ctx) throw new Error("useTeacher must be used within Providers");
  return ctx;
}
