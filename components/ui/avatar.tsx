import * as React from "react";
import { cn, initials } from "@/lib/utils";

const SIZES = {
  xs: "size-6 text-2xs",
  sm: "size-8 text-2xs",
  md: "size-10 text-xs",
  lg: "size-12 text-sm",
};

const TONES = [
  "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200",
  "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
];

export function Avatar({
  name,
  size = "sm",
  tone,
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  tone?: number;
  className?: string;
}) {
  const index =
    tone ??
    Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0) % TONES.length;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase",
        SIZES[size],
        TONES[index % TONES.length],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names, max = 3 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((name, index) => (
        <Avatar key={name} name={name} size="xs" tone={index} className="ring-2 ring-surface" />
      ))}
      {extra > 0 ? (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-surface-2 text-2xs font-semibold text-ink-muted ring-2 ring-surface">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
