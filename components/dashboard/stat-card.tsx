import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiDelta } from "@/components/ui/progress";

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel = "vs previous period",
  footnote,
  tone = "brand",
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  delta?: number;
  deltaLabel?: string;
  footnote?: React.ReactNode;
  tone?: "brand" | "emerald" | "amber" | "sky" | "violet" | "rose";
  className?: string;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface p-4 shadow-xs transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            tones[tone],
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-ink">
        {value}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        {delta !== undefined ? <KpiDelta value={delta} /> : null}
        {delta !== undefined ? (
          <span className="text-2xs text-ink-subtle">{deltaLabel}</span>
        ) : null}
        {footnote ? <span className="text-2xs text-ink-subtle">{footnote}</span> : null}
      </div>
    </div>
  );
}
