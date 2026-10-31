"use client";

import * as React from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DATE_RANGE_PRESETS, resolveRange, useDateRangeStore, type DateRangePreset } from "@/lib/store/date-range-store";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ANCHOR } from "@/lib/data/catalog";

export function DateRangePicker({ className }: { className?: string }) {
  const range = useDateRangeStore((state) => state.range);
  const setPreset = useDateRangeStore((state) => state.setPreset);
  const setCustom = useDateRangeStore((state) => state.setCustom);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { start, end } = resolveRange(range);
  const label =
    range.preset === "custom"
      ? `${formatDate(start.toISOString())} – ${formatDate(end.toISOString())}`
      : (DATE_RANGE_PRESETS.find((preset) => preset.value === range.preset)?.label ?? "Custom");

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="w-full justify-between sm:w-auto"
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="size-3.5" aria-hidden />
          {label}
        </span>
        <ChevronDown className="size-3.5 opacity-60" aria-hidden />
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label="Select date range"
          className="absolute right-0 z-50 mt-1.5 w-76 animate-scale-in rounded-xl border border-line bg-surface p-2 shadow-pop"
        >
          <ul className="space-y-0.5">
            {DATE_RANGE_PRESETS.filter((preset) => preset.value !== "custom").map((preset) => (
              <li key={preset.value}>
                <button
                  type="button"
                  onClick={() => {
                    setPreset(preset.value as DateRangePreset);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-surface-2",
                    range.preset === preset.value ? "font-medium text-ink" : "text-ink-muted",
                  )}
                >
                  {preset.label}
                  {range.preset === preset.value ? (
                    <Check className="size-3.5 text-brand-600" aria-hidden />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-line px-1 pt-2.5">
            <p className="mb-2 px-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
              Custom range
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                aria-label="Start date"
                value={range.preset === "custom" ? range.start.slice(0, 10) : ""}
                max={ANCHOR.toISOString().slice(0, 10)}
                onChange={(event) =>
                  setCustom(
                    event.target.value,
                    range.preset === "custom" && range.end
                      ? range.end
                      : ANCHOR.toISOString(),
                  )
                }
                className="h-8 text-xs"
              />
              <span className="text-ink-subtle" aria-hidden>
                –
              </span>
              <Input
                type="date"
                aria-label="End date"
                value={range.preset === "custom" ? range.end.slice(0, 10) : ""}
                max={ANCHOR.toISOString().slice(0, 10)}
                onChange={(event) =>
                  setCustom(
                    range.preset === "custom" && range.start
                      ? range.start
                      : ANCHOR.toISOString(),
                    event.target.value,
                  )
                }
                className="h-8 text-xs"
              />
            </div>
            <p className="mt-1.5 px-1.5 text-2xs text-ink-subtle">
              Demo data covers the last 90 days.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
