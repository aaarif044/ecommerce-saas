import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  max = 100,
  className,
  tone = "brand",
  label,
}: {
  value: number;
  max?: number;
  className?: string;
  tone?: "brand" | "success" | "warning" | "danger";
  label?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const tones = {
    brand: "bg-brand-600 dark:bg-brand-500",
    success: "bg-emerald-600 dark:bg-emerald-500",
    warning: "bg-amber-500 dark:bg-amber-400",
    danger: "bg-red-600 dark:bg-red-500",
  };
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}
    >
      <div className={cn("h-full rounded-full transition-width duration-300", tones[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Separator({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "bg-line",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
    />
  );
}

export function KpiDelta({
  value,
  className,
  suffix = "%",
}: {
  value: number;
  className?: string;
  suffix?: string;
}) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-sm font-medium",
        positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
        className,
      )}
    >
      <span aria-hidden>{positive ? "▲" : "▼"}</span>
      {Math.abs(value).toFixed(1)}
      {suffix}
      <span className="sr-only">{positive ? "increase" : "decrease"}</span>
    </span>
  );
}
