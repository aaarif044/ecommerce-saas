"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: React.ReactNode; badge?: React.ReactNode }[];
  className?: string;
  variant?: "underline" | "pill";
  ariaLabel?: string;
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
  variant = "underline",
  ariaLabel,
}: TabsProps<T>) {
  const listRef = React.useRef<HTMLDivElement>(null);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const index = items.findIndex((item) => item.value === value);
    if (index < 0) return;
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    onChange(items[next].value);
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]");
    buttons?.[next]?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        "flex items-center gap-1 overflow-x-auto scrollbar-thin",
        variant === "underline" && "border-b border-line",
        variant === "pill" && "rounded-lg border border-line bg-surface-2 p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              variant === "underline" &&
                cn(
                  "-mb-px border-b-2 px-3 py-2.5",
                  active
                    ? "border-brand-600 text-ink"
                    : "border-transparent text-ink-muted hover:text-ink",
                ),
              variant === "pill" &&
                cn(
                  "rounded-md px-3 py-1.5",
                  active ? "bg-surface text-ink shadow-xs" : "text-ink-muted hover:text-ink",
                ),
            )}
          >
            {item.label}
            {item.badge ? <span className="text-2xs text-ink-subtle">{item.badge}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
