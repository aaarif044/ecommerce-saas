"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/input";

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * A row of filters and actions above a table. It wraps on small screens so
 * the controls never overflow their container.
 */
export function FilterBar({
  children,
  className,
  align = "start",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        align === "end" ? "justify-end" : "justify-start",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A labelled select used for filtering a table. The label is only for
 * assistive technology — the visible control stays compact.
 *
 * Pass `options` for a fixed list, or `children` when the list is generated.
 */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  children,
  className,
  id,
}: {
  /** Describes what is being filtered, e.g. "order status". */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: FilterOption[];
  children?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;
  return (
    <div className={cn("relative", className)}>
      <Select
        id={selectId}
        aria-label={`Filter by ${label}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-36"
      >
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : children}
      </Select>
    </div>
  );
}

/** A read-only pill that shows the active filter, with a clear button. */
export function ActiveFilter({
  label,
  onClear,
  className,
}: {
  label: React.ReactNode;
  onClear: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-muted",
        className,
      )}
    >
      {label}
      <button
        type="button"
        onClick={onClear}
        className="rounded-full px-1 text-ink-subtle transition-colors hover:bg-surface hover:text-ink"
      >
        Clear
      </button>
    </span>
  );
}
