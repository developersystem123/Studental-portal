"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { cn, initials } from "@/lib/utils";
import Icon from "./icons";

/* ---------- Button ---------- */
type BtnVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "soft";
type BtnSize = "sm" | "md" | "lg" | "icon";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: BtnVariant;
    size?: BtnSize;
    loading?: boolean;
  }
>(({ className, variant = "primary", size = "md", loading, children, disabled, type, ...props }, ref) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
  const sizes: Record<BtnSize, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-9 w-9",
  };
  const variants: Record<BtnVariant, string> = {
    primary: "btn-primary shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0",
    secondary: "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--muted)_15%,var(--surface-2))] hover:-translate-y-px active:translate-y-0",
    outline: "border border-[var(--border-strong)] bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-2)] hover:border-[var(--primary)]/40 hover:-translate-y-px active:translate-y-0",
    ghost: "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-2)]",
    danger: "bg-[var(--danger)] text-white hover:brightness-110 hover:-translate-y-px active:translate-y-0 shadow-sm hover:shadow-md",
    soft: "bg-[var(--primary-soft)] text-[var(--primary)] hover:brightness-105 hover:-translate-y-px active:translate-y-0",
  };
  return (
    <button
      ref={ref}
      // Default to "button" to prevent accidental form submission when used outside a submit context.
      type={type ?? "button"}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {loading && <Icon.Loader size={16} />}
      {children}
    </button>
  );
});
Button.displayName = "Button";

/* ---------- Card ---------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-[var(--surface)] border border-[var(--border)] card-shadow transition-shadow duration-200",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 border-b border-[var(--border)]", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold text-[var(--foreground)]", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[var(--muted)] mt-1", className)} {...props} />;
}

/* ---------- Input ---------- */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode; error?: string }
>(({ className, icon, error, ...props }, ref) => {
  return (
    <div className="w-full">
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted)] pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full h-11 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-2)] px-4 text-sm transition-all",
            "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent",
            icon && "pl-10",
            error && "border-[var(--danger)] focus:ring-[var(--danger)]",
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";

/* ---------- Textarea ---------- */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(({ className, error, ...props }, ref) => {
  return (
    <div className="w-full">
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-2)] px-4 py-3 text-sm transition-all min-h-[100px] resize-y",
          "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent",
          error && "border-[var(--danger)]",
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
});
Textarea.displayName = "Textarea";

/* ---------- Label ---------- */
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-medium text-[var(--foreground)] mb-1.5 block", className)}
      {...props}
    />
  );
}

/* ---------- Badge ---------- */
type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";
export function Badge({
  variant = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-[var(--surface-2)] text-[var(--muted)]",
    primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
    success: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-500 dark:text-amber-400",
    danger: "bg-red-500/10 text-red-500 dark:text-red-400",
    info: "bg-sky-500/10 text-sky-500 dark:text-sky-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Avatar ---------- */
export function Avatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={cn(
        "rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-semibold inline-flex items-center justify-center select-none",
        className,
      )}
    >
      {initials(name) || "?"}
    </div>
  );
}

/* ---------- Progress ---------- */
export function Progress({
  value,
  className,
  showLabel,
  glow,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
  glow?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 w-full bg-[var(--surface-2)] rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-700",
            glow && v > 5 && "shadow-[0_0_6px_1px_color-mix(in_oklab,var(--accent)_55%,transparent)]",
          )}
          style={{ width: `${v}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-[var(--muted)]">
          <span className="font-medium text-[var(--foreground)]">{Math.round(v)}%</span> complete
        </p>
      )}
    </div>
  );
}

/* ---------- Switch ---------- */
export function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={cn(
        "w-10 h-6 rounded-full relative transition-colors",
        checked ? "bg-[var(--primary)]" : "bg-[var(--surface-2)]",
        disabled && "opacity-50",
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform",
          checked && "translate-x-4",
        )}
      />
    </button>
  );
}

/* ---------- Select ---------- */
type SelectOption = { value: string; label: string; disabled?: boolean };

function parseOptions(children: React.ReactNode): SelectOption[] {
  return React.Children.toArray(children)
    .filter((c): c is React.ReactElement<Record<string, unknown>> => React.isValidElement(c))
    .flatMap((c) => {
      // <optgroup> — recurse into its children
      if (c.type === "optgroup") return parseOptions(c.props.children as React.ReactNode);
      const val = String(c.props.value ?? "");
      const raw = c.props.children;
      const label = typeof raw === "string" ? raw : val;
      return [{ value: val, label, disabled: !!c.props.disabled }];
    });
}

export function Select({
  className,
  children,
  value,
  onChange,
  disabled,
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [open, setOpen] = React.useState(false);
  const [focused, setFocused] = React.useState<number>(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const options = React.useMemo(() => parseOptions(children), [children]);
  const selectedIdx = options.findIndex((o) => o.value === String(value ?? ""));
  const selected = options[selectedIdx] ?? null;

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Scroll focused item into view
  React.useEffect(() => {
    if (!open) return;
    const idx = focused >= 0 ? focused : selectedIdx;
    const el = listRef.current?.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, focused, selectedIdx]);

  function pick(opt: SelectOption) {
    if (opt.disabled) return;
    onChange?.({ target: { value: opt.value } } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    setFocused(-1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault(); setOpen(true); setFocused(selectedIdx >= 0 ? selectedIdx : 0);
      }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); setFocused(-1); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused((f) => { let n = f < 0 ? selectedIdx : f; do { n = (n + 1) % options.length; } while (options[n].disabled && n !== f); return n; });
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((f) => { let n = f < 0 ? selectedIdx : f; do { n = (n - 1 + options.length) % options.length; } while (options[n].disabled && n !== f); return n; });
    }
    if ((e.key === "Enter" || e.key === " ") && focused >= 0) {
      e.preventDefault(); pick(options[focused]);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onKeyDown={onKeyDown}
        onClick={() => { if (!disabled) { setOpen((o) => !o); setFocused(selectedIdx >= 0 ? selectedIdx : 0); } }}
        className={cn(
          "flex items-center justify-between w-full h-11 rounded-xl px-4 text-sm transition-all text-left",
          "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]",
          "hover:border-[var(--border-strong)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:border-transparent",
          open && "border-[var(--primary)] ring-2 ring-[var(--ring)]/40",
          disabled && "opacity-50 pointer-events-none",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn("truncate flex-1 mr-2", !selected && "text-[var(--muted)]")}>
          {selected?.label ?? "Select…"}
        </span>
        <Icon.ChevronDown
          size={16}
          className={cn("shrink-0 text-[var(--muted)] transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden select-dropdown-in">
          <ul
            ref={listRef}
            role="listbox"
            className="py-1.5 max-h-64 overflow-y-auto scrollbar-thin"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === String(value ?? "");
              const isFocused = focused === i;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onMouseEnter={() => setFocused(i)}
                  onClick={() => pick(opt)}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer select-none transition-colors",
                    isSelected
                      ? "bg-[var(--primary-soft)] text-[var(--primary)] font-semibold"
                      : isFocused
                        ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                        : "text-[var(--foreground)] hover:bg-[var(--surface-2)]",
                    opt.disabled && "opacity-40 pointer-events-none cursor-not-allowed",
                  )}
                >
                  <span className={cn("h-4 w-4 shrink-0 flex items-center justify-center rounded-full transition-all", isSelected ? "bg-[var(--primary)]" : "border border-[var(--border)]")}>
                    {isSelected && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
Select.displayName = "Select";

/* ---------- Tabs ---------- */
export function Tabs({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: React.ReactNode; count?: number }[];
  className?: string;
}) {
  return (
    <div className={cn("inline-flex p-1 rounded-xl bg-[var(--surface-2)] gap-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 h-9 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
            value === o.value
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)]",
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                value === o.value ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "bg-[var(--surface-2)]",
              )}
            >
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------- Modal ----------
   Rendered via React Portal at document.body so the modal is always
   centered relative to the viewport — never inside a transformed /
   backdrop-filtered ancestor (which would create a new containing block
   and push the modal off-center).
*/
export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  // Lock body scroll while a modal is open + close on Escape.
  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "relative w-full max-h-[92vh] flex flex-col bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl pop-in overflow-hidden",
          sizes[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-[var(--border)] bg-gradient-to-b from-[var(--primary-soft)]/35 to-transparent">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-[var(--foreground)] truncate">{title}</h3>
              {description && (
                <p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 h-8 w-8 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] flex items-center justify-center transition"
            >
              <Icon.X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto scrollbar-thin">{children}</div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(node, document.body);
}

/* ---------- Empty State ---------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      {icon && (
        <div className="relative mb-5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--primary-soft)] to-[color-mix(in_oklab,var(--primary-soft)_60%,var(--surface-2))] text-[var(--primary)] flex items-center justify-center shadow-sm border border-[var(--border)]">
            {icon}
          </div>
          <div className="absolute inset-0 rounded-2xl bg-[var(--primary)]/5 blur-xl -z-10 scale-150" />
        </div>
      )}
      <h4 className="text-base font-semibold mb-1.5 text-[var(--foreground)]">{title}</h4>
      {description && <p className="text-sm text-[var(--muted)] max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Stat Card ---------- */
export function StatCard({
  label,
  value,
  delta,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: React.ReactNode;
  tone?: "primary" | "accent" | "success" | "warning";
}) {
  const tones: Record<string, { iconBg: string; iconText: string; glow: string; delta: string }> = {
    primary: {
      iconBg: "bg-gradient-to-br from-green-500/15 to-emerald-400/10",
      iconText: "text-[var(--primary)]",
      glow: "group-hover:shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_12%,transparent)]",
      delta: "text-emerald-600 dark:text-emerald-400",
    },
    accent: {
      iconBg: "bg-gradient-to-br from-emerald-400/15 to-green-300/10",
      iconText: "text-emerald-600 dark:text-emerald-400",
      glow: "group-hover:shadow-[0_0_20px_color-mix(in_oklab,var(--accent)_12%,transparent)]",
      delta: "text-emerald-600 dark:text-emerald-400",
    },
    success: {
      iconBg: "bg-gradient-to-br from-teal-500/15 to-emerald-400/10",
      iconText: "text-teal-600 dark:text-teal-400",
      glow: "group-hover:shadow-[0_0_20px_color-mix(in_oklab,var(--success)_12%,transparent)]",
      delta: "text-teal-600 dark:text-teal-400",
    },
    warning: {
      iconBg: "bg-gradient-to-br from-amber-500/15 to-orange-400/10",
      iconText: "text-amber-600 dark:text-amber-400",
      glow: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.12)]",
      delta: "text-amber-600 dark:text-amber-400",
    },
  };
  const t = tones[tone];
  return (
    <Card className={cn("overflow-hidden group transition-all duration-200 hover:-translate-y-0.5", t.glow)}>
      <CardBody className="flex items-start gap-4">
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[var(--border)]",
          t.iconBg,
          t.iconText,
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-0.5 tracking-tight">{value}</p>
          {delta && (
            <p className={cn("text-xs mt-1.5 flex items-center gap-1 font-medium", t.delta)}>
              <Icon.TrendingUp size={11} />
              {delta}
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

/* ---------- Toast ---------- */
type ToastTone = "success" | "danger" | "info" | "warning";
type Toast = { id: string; title: string; description?: string; tone?: ToastTone };
const ToastCtx = React.createContext<{ push: (t: Omit<Toast, "id">) => void } | null>(null);

const TOAST_DURATION_MS = 4200;

const TOAST_STYLES: Record<ToastTone | "default", {
  ring: string;
  bar: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}> = {
  success: {
    ring: "border-emerald-500/40",
    bar: "bg-gradient-to-b from-emerald-400 to-emerald-600",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    icon: <Icon.CheckCircle size={18} />,
  },
  danger: {
    ring: "border-red-500/40",
    bar: "bg-gradient-to-b from-red-400 to-red-600",
    iconBg: "bg-red-500/15",
    iconColor: "text-red-600 dark:text-red-400",
    icon: <Icon.AlertCircle size={18} />,
  },
  info: {
    ring: "border-sky-500/40",
    bar: "bg-gradient-to-b from-sky-400 to-blue-600",
    iconBg: "bg-sky-500/15",
    iconColor: "text-sky-600 dark:text-sky-400",
    icon: <Icon.Bell size={18} />,
  },
  warning: {
    ring: "border-amber-500/40",
    bar: "bg-gradient-to-b from-amber-400 to-amber-600",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    icon: <Icon.AlertCircle size={18} />,
  },
  default: {
    ring: "border-[var(--border-strong)]",
    bar: "bg-gradient-to-b from-[var(--primary)] to-[var(--accent)]",
    iconBg: "bg-[var(--primary-soft)]",
    iconColor: "text-[var(--primary)]",
    icon: <Icon.Bell size={18} />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 right-4 z-[60] flex flex-col gap-3 max-w-sm w-[calc(100vw-2rem)] sm:w-96 pointer-events-none"
      >
        {toasts.map((t) => {
          const style = TOAST_STYLES[t.tone ?? "default"];
          return (
            <div
              key={t.id}
              role="alert"
              className={cn(
                "pointer-events-auto relative overflow-hidden flex gap-3 rounded-xl border bg-[var(--surface)] pl-3 pr-3 py-3 card-shadow toast-in",
                style.ring,
              )}
            >
              {/* Left color bar */}
              <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", style.bar)} />

              {/* Icon */}
              <span
                aria-hidden
                className={cn(
                  "shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ml-1",
                  style.iconBg,
                  style.iconColor,
                )}
              >
                {style.icon}
              </span>

              {/* Body */}
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-[var(--foreground)] leading-snug">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">{t.description}</p>
                )}
              </div>

              {/* Close */}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 h-7 w-7 -mr-1 rounded-md text-[var(--muted-2)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] flex items-center justify-center transition"
              >
                <Icon.X size={14} />
              </button>

              {/* Progress bar */}
              <span
                aria-hidden
                className={cn("absolute bottom-0 left-0 h-[2px] origin-left", style.bar)}
                style={{ animation: `toastProgress ${TOAST_DURATION_MS}ms linear forwards` }}
              />
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) return { push: (_: Omit<Toast, "id">) => {} };
  return ctx;
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-[var(--surface-2)] shimmer", className)} />;
}

/* ---------- Checkbox ---------- */
export function Checkbox({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  id?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none" htmlFor={id}>
      <span
        className={cn(
          "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
          checked
            ? "bg-[var(--primary)] border-[var(--primary)] text-white"
            : "bg-[var(--surface)] border-[var(--border-strong)]",
        )}
      >
        {checked && <Icon.Check size={14} strokeWidth={3} />}
      </span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {label && <span className="text-sm text-[var(--foreground)]">{label}</span>}
    </label>
  );
}
