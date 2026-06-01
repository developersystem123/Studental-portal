"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Input, Label, Modal, Select, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { useAuth } from "@/lib/store";
import { EDUCATION_LEVELS, type EducationLevel } from "@/lib/mockData";
import { isProfileComplete } from "@/lib/profileComplete";
import { cleanPhoneInput, validateEmail, validatePassword, validatePhone } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
};

export function EnrollmentGateModal({ open, onClose, onComplete }: Props) {
  const { user, login, register, loginWithGoogle, updateUser } = useAuth();
  const toast = useToast();

  // Stable callback ref — avoids useEffect dep on recreated inline functions.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const completionFired = useRef(false);

  // Auth step state
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [gLoading, setGLoading] = useState(false);

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPw, setRegPw] = useState("");
  const [regShowPw, setRegShowPw] = useState(false);
  const [regEdu, setRegEdu] = useState<EducationLevel>("Matriculation");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Profile completion form
  const [profPhone, setProfPhone] = useState("");
  const [profEdu, setProfEdu] = useState<EducationLevel>("Matriculation");
  const [profLoading, setProfLoading] = useState(false);
  const [profError, setProfError] = useState<string | null>(null);

  // Reset completion flag when modal closes; sync profile fields when user changes.
  useEffect(() => {
    if (!open) {
      completionFired.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (user) {
      setProfPhone(user.phone ?? "");
      setProfEdu(
        user.education && user.education !== "None"
          ? (user.education as EducationLevel)
          : "Matriculation",
      );
    }
  }, [user]);

  // Fire onComplete when the user is logged in AND profile is complete.
  useEffect(() => {
    if (!open) return;
    if (completionFired.current) return;
    if (user && isProfileComplete(user)) {
      completionFired.current = true;
      onCompleteRef.current();
    }
  }, [open, user]);

  if (!open) return null;

  const step = !user ? "auth" : "profile";
  const needsPhone = !user?.phone?.trim();
  const needsEdu =
    user?.role === "Student" && (!user?.education || user.education === "None");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const emailErr = validateEmail(loginEmail);
    if (emailErr) { setLoginError(emailErr); return; }
    const pwErr = validatePassword(loginPw);
    if (pwErr) { setLoginError(pwErr); return; }
    setLoginLoading(true);
    const res = await login(loginEmail, loginPw);
    setLoginLoading(false);
    if (!res.ok) setLoginError(res.error ?? "Sign in failed. Check your email and password.");
  }

  async function handleGoogle() {
    setGLoading(true);
    await loginWithGoogle();
    setGLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError(null);
    if (!regName.trim() || regName.trim().length < 2) {
      setRegError("Please enter your full name (min 2 characters).");
      return;
    }
    const emailErr = validateEmail(regEmail);
    if (emailErr) { setRegError(emailErr); return; }
    const phoneErr = validatePhone(regPhone);
    if (phoneErr) { setRegError(phoneErr); return; }
    const pwErr = validatePassword(regPw);
    if (pwErr) { setRegError(pwErr); return; }
    setRegLoading(true);
    const res = await register({
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      password: regPw,
      role: "Student",
      education: regEdu,
    });
    setRegLoading(false);
    if (!res.ok) setRegError(res.error ?? "Registration failed. Please try again.");
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfError(null);
    if (needsPhone) {
      const phoneErr = validatePhone(profPhone);
      if (phoneErr) { setProfError(phoneErr); return; }
    }
    if (needsEdu && (!profEdu || profEdu === "None")) {
      setProfError("Please select your highest qualification.");
      return;
    }
    setProfLoading(true);
    try {
      const patch: { phone?: string; education?: EducationLevel } = {};
      if (needsPhone) patch.phone = profPhone.trim();
      if (needsEdu) patch.education = profEdu;
      await updateUser(patch);
      toast.push({ title: "Profile updated!", tone: "success" });
    } catch (err) {
      setProfError(err instanceof Error ? err.message : "Couldn't save. Please try again.");
    } finally {
      setProfLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === "auth" ? "Sign in to enroll" : "Complete your profile"}
      description={
        step === "auth"
          ? "Sign in or create a free account to join this learning path."
          : "A few more details are needed before you can enroll."
      }
      size="md"
    >
      {step === "auth" ? (
        <div className="p-5 space-y-5">
          {/* Tab switcher */}
          <div className="flex rounded-xl overflow-hidden border border-[var(--border)]">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAuthTab(t)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium transition",
                  authTab === t
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {authTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                  {loginError}
                </p>
              )}
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  icon={<Icon.Mail size={16} />}
                  autoComplete="email"
                />
              </div>
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={loginShowPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPw}
                    onChange={(e) => setLoginPw(e.target.value)}
                    icon={<Icon.Lock size={16} />}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setLoginShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    {loginShowPw ? <Icon.EyeOff size={18} /> : <Icon.Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="submit" loading={loginLoading} className="w-full">
                Sign in
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                loading={gLoading}
              >
                <Icon.Google size={18} /> Continue with Google
              </Button>
              <p className="text-xs text-center text-[var(--muted)]">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthTab("register")}
                  className="text-[var(--primary)] font-medium hover:underline"
                >
                  Create one
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {regError && (
                <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                  {regError}
                </p>
              )}
              <div>
                <Label>Full name</Label>
                <Input
                  placeholder="Aarav Sharma"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  icon={<Icon.User size={16} />}
                  maxLength={60}
                  autoComplete="name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  icon={<Icon.Mail size={16} />}
                  autoComplete="email"
                />
              </div>
              <div>
                <Label>Phone number</Label>
                <Input
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={regPhone}
                  onChange={(e) => setRegPhone(cleanPhoneInput(e.target.value))}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
              <div>
                <Label>Highest qualification</Label>
                <Select
                  value={regEdu}
                  onChange={(e) => setRegEdu(e.target.value as EducationLevel)}
                >
                  {EDUCATION_LEVELS.filter((lvl) => lvl !== "None").map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={regShowPw ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={regPw}
                    onChange={(e) => setRegPw(e.target.value)}
                    icon={<Icon.Lock size={16} />}
                    maxLength={64}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    {regShowPw ? <Icon.EyeOff size={18} /> : <Icon.Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="submit" loading={regLoading} className="w-full">
                Create account <Icon.ChevronRight size={14} />
              </Button>
              <p className="text-xs text-center text-[var(--muted)]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthTab("login")}
                  className="text-[var(--primary)] font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      ) : (
        /* Profile completion step */
        <form onSubmit={handleProfileSave} className="p-5 space-y-4">
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2.5">
            <Icon.AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>
              To enroll in courses and learning paths, please complete the fields below.
              This only needs to be done once.
            </span>
          </div>

          {needsPhone && (
            <div>
              <Label>Phone number</Label>
              <Input
                type="tel"
                placeholder="+92 300 1234567"
                value={profPhone}
                onChange={(e) => setProfPhone(cleanPhoneInput(e.target.value))}
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
          )}

          {needsEdu && (
            <div>
              <Label>Highest qualification</Label>
              <Select
                value={profEdu}
                onChange={(e) => setProfEdu(e.target.value as EducationLevel)}
              >
                {EDUCATION_LEVELS.filter((lvl) => lvl !== "None").map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </Select>
            </div>
          )}

          {profError && (
            <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
              {profError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={profLoading} className="flex-1">
              Save & continue <Icon.ChevronRight size={14} />
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
