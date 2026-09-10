"use client";

import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 bg-panel/40 px-8 py-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** Lighter header for pages that already sit inside the pack workspace tabs. */
export function SectionBar({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-8 pb-2 pt-6">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-panel/50 p-5 ${className}`}>
      {children}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function Button({ variant = "ghost", className = "", ...props }: ButtonProps) {
  const styles = {
    primary: "bg-indigo-500 text-white hover:bg-indigo-400 disabled:bg-indigo-500/40",
    ghost: "border border-white/15 text-slate-200 hover:bg-white/5",
    danger: "border border-rose-500/40 text-rose-300 hover:bg-rose-500/10",
  }[variant];

  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`${inputBase} font-mono leading-relaxed ${props.className ?? ""}`} />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    slate: "bg-white/5 text-slate-300 ring-white/10",
    indigo: "bg-indigo-500/15 text-indigo-200 ring-indigo-400/30",
    green: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
    amber: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
    rose: "bg-rose-500/15 text-rose-200 ring-rose-400/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 ${
        tones[tone] ?? tones.slate
      }`}
    >
      {children}
    </span>
  );
}

export function CheckboxPill({
  checked,
  onChange,
  label,
  sublabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  sublabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
        checked
          ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-100"
          : "border-white/10 bg-black/20 text-slate-400 hover:border-white/20"
      }`}
    >
      <span className="block truncate font-medium">{label}</span>
      {sublabel ? (
        <span className="block break-all text-xs leading-snug opacity-70">{sublabel}</span>
      ) : null}
    </button>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 p-10 text-center">
      <p className="text-sm text-slate-300">{title}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
