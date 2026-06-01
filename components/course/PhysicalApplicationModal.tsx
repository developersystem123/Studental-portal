"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Input,
  Label,
  Modal,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { useAuth, useData } from "@/lib/store";
import {
  BATCH_OPTIONS,
  CAMPUSES,
  EDUCATION_LEVELS,
  meetsMatriculationRequirement,
  type Course,
  type EducationLevel,
} from "@/lib/mockData";

export function PhysicalApplicationModal({
  course,
  open,
  onClose,
}: {
  course: Course | null;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { applyForPhysicalClass } = useData();
  const toast = useToast();

  const [fullName, setFullName] = React.useState("");
  const [fatherName, setFatherName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [cnic, setCnic] = React.useState("");
  const [dateOfBirth, setDateOfBirth] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [education, setEducation] = React.useState<EducationLevel>("None");
  const [institute, setInstitute] = React.useState("");
  const [passingYear, setPassingYear] = React.useState("");
  const [obtainedMarks, setObtainedMarks] = React.useState("");
  const [totalMarks, setTotalMarks] = React.useState("");
  const [campus, setCampus] = React.useState<string>(CAMPUSES[0]);
  const [batch, setBatch] = React.useState<string>(BATCH_OPTIONS[0]);
  const [motivation, setMotivation] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [hasAttempted, setHasAttempted] = React.useState(false);
  const todayISO = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const minDOBISO = React.useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 100);
    return d.toISOString().slice(0, 10);
  }, []);

  // Reset / pre-fill whenever the modal opens for a new course or user.
  React.useEffect(() => {
    if (!open) return;
    setFullName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setEducation((user?.education as EducationLevel) ?? "None");
    setFatherName("");
    setCnic("");
    setDateOfBirth("");
    setAddress("");
    setCity("");
    setInstitute("");
    setPassingYear("");
    setObtainedMarks("");
    setTotalMarks("");
    setCampus(CAMPUSES[0]);
    setBatch(BATCH_OPTIONS[0]);
    setMotivation("");
    setErrors({});
    setHasAttempted(false);
  }, [open, user]);

  if (!course) return null;

  const eligible = meetsMatriculationRequirement(education);
  const notSignedIn = !user;
  const wrongRole = !!user && user.role !== "Student";

  const validate = React.useCallback((): Record<string, string> => {
    const e: Record<string, string> = {};
    const NAME_RE = /^[A-Za-z][A-Za-z\s.'-]*$/;
    const CURRENT_YEAR = new Date().getFullYear();

    // Full name
    const trimmedName = fullName.trim();
    if (!trimmedName) e.fullName = "Full name is required.";
    else if (trimmedName.length < 3) e.fullName = "Name must be at least 3 characters.";
    else if (!NAME_RE.test(trimmedName))
      e.fullName = "Name can only contain letters, spaces, dots, hyphens and apostrophes.";

    // Father / Guardian
    const trimmedFather = fatherName.trim();
    if (!trimmedFather) e.fatherName = "Father / guardian name is required.";
    else if (trimmedFather.length < 3) e.fatherName = "Name must be at least 3 characters.";
    else if (!NAME_RE.test(trimmedFather))
      e.fatherName = "Name can only contain letters, spaces, dots, hyphens and apostrophes.";

    // Email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) e.email = "Email is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(trimmedEmail))
      e.email = "Enter a valid email address (e.g. you@example.com).";

    // Phone — 10–15 digits, optional leading +
    const phoneRaw = phone.trim();
    const phoneDigits = phoneRaw.replace(/\D/g, "");
    if (!phoneRaw) e.phone = "Phone number is required.";
    else if (!/^\+?[\d\s-]+$/.test(phoneRaw))
      e.phone = "Phone can only contain digits, spaces, hyphens and an optional leading +.";
    else if (phoneDigits.length < 10) e.phone = "Phone must have at least 10 digits.";
    else if (phoneDigits.length > 15) e.phone = "Phone can have at most 15 digits.";

    // CNIC — exactly 13 digits (Pakistani format)
    const cnicDigits = cnic.replace(/\D/g, "");
    if (!cnic.trim()) e.cnic = "CNIC / National ID is required.";
    else if (cnicDigits.length !== 13)
      e.cnic = "CNIC must be exactly 13 digits (e.g. 35202-1234567-1).";

    // Date of birth — past, between 14 and 100 years old
    if (!dateOfBirth) e.dateOfBirth = "Date of birth is required.";
    else {
      const dob = new Date(dateOfBirth);
      if (Number.isNaN(dob.getTime())) e.dateOfBirth = "Enter a valid date.";
      else {
        const now = new Date();
        if (dob > now) e.dateOfBirth = "Date of birth can't be in the future.";
        else {
          const ageMs = now.getTime() - dob.getTime();
          const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.2425);
          if (ageYears < 14) e.dateOfBirth = "You must be at least 14 years old to apply.";
          else if (ageYears > 100) e.dateOfBirth = "Please enter a valid date of birth.";
        }
      }
    }

    // Address
    const trimmedAddress = address.trim();
    if (!trimmedAddress) e.address = "Address is required.";
    else if (trimmedAddress.length < 8) e.address = "Enter a complete address (min 8 characters).";

    // City
    const trimmedCity = city.trim();
    if (!trimmedCity) e.city = "City is required.";
    else if (trimmedCity.length < 2) e.city = "Enter your city.";
    else if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(trimmedCity))
      e.city = "City can only contain letters.";

    // Education
    if (!meetsMatriculationRequirement(education))
      e.education = "Matriculation (or higher) is required to apply.";

    // Institute
    const trimmedInstitute = institute.trim();
    if (!trimmedInstitute) e.institute = "Institute / school is required.";
    else if (trimmedInstitute.length < 3) e.institute = "Institute name is too short.";

    // Passing year — 4 digits, between 1950 and current year
    if (!/^\d{4}$/.test(passingYear)) e.passingYear = "Enter a 4-digit year (e.g. 2022).";
    else {
      const year = Number(passingYear);
      if (year < 1950) e.passingYear = "Year must be 1950 or later.";
      else if (year > CURRENT_YEAR) e.passingYear = `Year can't be in the future (max ${CURRENT_YEAR}).`;
    }

    // Marks
    const obtained = Number(obtainedMarks);
    const total = Number(totalMarks);
    if (!obtainedMarks.trim()) e.obtainedMarks = "Obtained marks are required.";
    else if (!Number.isFinite(obtained) || obtained < 0)
      e.obtainedMarks = "Enter a valid non-negative number.";

    if (!totalMarks.trim()) e.totalMarks = "Total marks are required.";
    else if (!Number.isFinite(total) || total <= 0)
      e.totalMarks = "Total marks must be greater than zero.";

    if (
      Number.isFinite(obtained) &&
      Number.isFinite(total) &&
      total > 0 &&
      obtained > total
    ) {
      e.obtainedMarks = "Obtained marks can't exceed total marks.";
    } else if (
      !e.obtainedMarks &&
      Number.isFinite(obtained) &&
      Number.isFinite(total) &&
      total > 0 &&
      (obtained / total) * 100 < 33
    ) {
      // Pakistani matriculation passing grade is 33%.
      e.obtainedMarks = "Minimum 33% marks are required to qualify.";
    }

    return e;
  }, [
    fullName,
    fatherName,
    email,
    phone,
    cnic,
    dateOfBirth,
    address,
    city,
    education,
    institute,
    passingYear,
    obtainedMarks,
    totalMarks,
  ]);

  // After the first submit attempt, re-validate live so errors clear as the user fixes them.
  React.useEffect(() => {
    if (!hasAttempted) return;
    setErrors(validate());
  }, [hasAttempted, validate]);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (notSignedIn || wrongRole || !course) return;
    setHasAttempted(true);
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) {
      toast.push({
        title: "Please fix the errors",
        description: "Check the highlighted fields and try again.",
        tone: "danger",
      });
      return;
    }
    setSubmitting(true);
    const res = await applyForPhysicalClass({
      courseId: course.id,
      fullName: fullName.trim(),
      fatherName: fatherName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      cnic: cnic.trim(),
      dateOfBirth,
      address: address.trim(),
      city: city.trim(),
      education,
      institute: institute.trim(),
      passingYear,
      obtainedMarks,
      totalMarks,
      campus,
      batch,
      motivation: motivation.trim() || undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.push({ title: "Couldn't submit application", description: res.error, tone: "danger" });
      return;
    }
    toast.push({
      title: "Application submitted",
      description: "Our admissions team will review it within 2–3 working days.",
      tone: "success",
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Apply for In-Person Classes">
      <div className="p-5 space-y-5 max-h-[78vh] overflow-y-auto scrollbar-thin">
        {/* Course summary */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface-2)]">
          <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-[var(--surface)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{course.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="primary">{course.category}</Badge>
              <Badge variant="default">{course.level}</Badge>
              <span className="text-xs text-[var(--muted)]">Instructor: {course.instructor}</span>
            </div>
          </div>
        </div>

        {/* Eligibility / auth banners */}
        {notSignedIn ? (
          <Banner tone="warning" icon={<Icon.Lock size={16} />}>
            Please <Link href="/login" className="underline font-semibold">sign in</Link> as a student to
            apply for in-person classes.
          </Banner>
        ) : wrongRole ? (
          <Banner tone="warning" icon={<Icon.Lock size={16} />}>
            Only student accounts can apply for in-person classes. You&apos;re signed in as{" "}
            <strong>{user!.role}</strong>.
          </Banner>
        ) : !eligible ? (
          <Banner tone="danger" icon={<Icon.X size={16} />}>
            You must have completed at least <strong>Matriculation</strong> to apply. Update your
            education below to continue.
          </Banner>
        ) : (
          <Banner tone="success" icon={<Icon.CheckCircle size={16} />}>
            You meet the eligibility requirement. Fill the form below to submit your application.
          </Banner>
        )}

        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          {/* Personal */}
          <Section title="Personal information" icon={<Icon.User size={16} />}>
            <Field label="Full name" error={errors.fullName}>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value.replace(/[^A-Za-z\s.'-]/g, ""))}
                icon={<Icon.User size={16} />}
                maxLength={60}
                autoComplete="name"
              />
            </Field>
            <Field label="Father / Guardian name" error={errors.fatherName}>
              <Input
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value.replace(/[^A-Za-z\s.'-]/g, ""))}
                maxLength={60}
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Icon.Mail size={16} />}
                autoComplete="email"
              />
            </Field>
            <Field label="Phone number" error={errors.phone}>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 20))}
                placeholder="+92 300 0000000"
                inputMode="tel"
                autoComplete="tel"
              />
            </Field>
            <Field label="CNIC / National ID" error={errors.cnic}>
              <Input
                value={cnic}
                onChange={(e) => setCnic(formatCnic(e.target.value))}
                placeholder="35202-1234567-1"
                inputMode="numeric"
                maxLength={15}
              />
            </Field>
            <Field label="Date of birth" error={errors.dateOfBirth}>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={todayISO}
                min={minDOBISO}
              />
            </Field>
            <Field label="Address" className="sm:col-span-2" error={errors.address}>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House #, street, area"
                maxLength={120}
              />
            </Field>
            <Field label="City" error={errors.city}>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value.replace(/[^A-Za-z\s.'-]/g, ""))}
                maxLength={40}
              />
            </Field>
          </Section>

          {/* Education */}
          <Section title="Education" icon={<Icon.Award size={16} />}>
            <Field label="Highest qualification" error={errors.education}>
              <Select value={education} onChange={(e) => setEducation(e.target.value as EducationLevel)}>
                {EDUCATION_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl === "None" ? "Below Matriculation" : lvl}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Institute / School" error={errors.institute}>
              <Input
                value={institute}
                onChange={(e) => setInstitute(e.target.value)}
                maxLength={80}
              />
            </Field>
            <Field label="Passing year" error={errors.passingYear}>
              <Input
                value={passingYear}
                onChange={(e) => setPassingYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                placeholder="e.g. 2022"
                inputMode="numeric"
                maxLength={4}
              />
            </Field>
            <Field label="Obtained marks" error={errors.obtainedMarks}>
              <Input
                value={obtainedMarks}
                onChange={(e) => setObtainedMarks(cleanDecimal(e.target.value))}
                placeholder="e.g. 820"
                inputMode="decimal"
                maxLength={6}
              />
            </Field>
            <Field label="Total marks" error={errors.totalMarks}>
              <Input
                value={totalMarks}
                onChange={(e) => setTotalMarks(cleanDecimal(e.target.value))}
                placeholder="e.g. 1100"
                inputMode="decimal"
                maxLength={6}
              />
            </Field>
          </Section>

          {/* Class preferences */}
          <Section title="Class preferences" icon={<Icon.Calendar size={16} />}>
            <Field label="Preferred campus">
              <Select value={campus} onChange={(e) => setCampus(e.target.value)}>
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Preferred batch / timing">
              <Select value={batch} onChange={(e) => setBatch(e.target.value)}>
                {BATCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Why do you want to join? (optional)" className="sm:col-span-2">
              <Textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Tell us about your goals for this course."
              />
            </Field>
          </Section>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={notSignedIn || wrongRole}>
              <Icon.Send size={16} /> Submit application
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        <span className="h-7 w-7 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
          {icon}
        </span>
        {title}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1.5 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

// Pakistani CNIC mask: 5 digits - 7 digits - 1 digit (XXXXX-XXXXXXX-X)
function formatCnic(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

// Keep only digits and a single decimal point.
function cleanDecimal(raw: string): string {
  const stripped = raw.replace(/[^0-9.]/g, "");
  const firstDot = stripped.indexOf(".");
  if (firstDot === -1) return stripped;
  return stripped.slice(0, firstDot + 1) + stripped.slice(firstDot + 1).replace(/\./g, "");
}

type BannerTone = "success" | "warning" | "danger";
const BANNER_STYLES: Record<BannerTone, string> = {
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  danger: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
};

function Banner({
  tone,
  icon,
  children,
}: {
  tone: BannerTone;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-sm ${BANNER_STYLES[tone]}`}>
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
