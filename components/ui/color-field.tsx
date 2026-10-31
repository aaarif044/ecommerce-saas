"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

const PRESETS = [
  "#5a5de3",
  "#0ea5e9",
  "#059669",
  "#65a30d",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#7c3aed",
  "#334155",
  "#111827",
  "#f8fafc",
];

export function ColorField({
  value,
  onChange,
  label,
  id,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id?: string;
  className?: string;
}) {  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex items-center gap-2">
        <label className="relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-line shadow-xs">
          <span
            aria-hidden
            className="absolute inset-0"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`${label} colour picker`}
          />
        </label>
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono text-sm uppercase"
          spellCheck={false}
          aria-label={label}
        />
      </div>
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            aria-label={`Use colour ${preset}`}
            aria-pressed={value.toLowerCase() === preset.toLowerCase()}
            className={cn(
              "flex size-6 items-center justify-center rounded-md border border-line transition-transform hover:scale-110",
              value.toLowerCase() === preset.toLowerCase()
                ? "ring-2 ring-brand-500 ring-offset-1 ring-offset-surface"
                : "",
            )}
            style={{ backgroundColor: preset }}
          >
            {value.toLowerCase() === preset.toLowerCase() ? (
              <Check className="size-3 text-white drop-shadow" aria-hidden />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
