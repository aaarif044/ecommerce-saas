"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantityStepperSize = "sm" | "md" | "lg";

const SIZES: Record<
  QuantityStepperSize,
  { button: string; icon: string; value: string }
> = {
  sm: { button: "size-7", icon: "size-3", value: "w-7 text-xs" },
  md: { button: "size-8", icon: "size-3.5", value: "w-8 text-sm" },
  lg: { button: "size-10", icon: "size-4", value: "w-9 text-sm" },
};

export interface QuantityStepperProps {
  value: number;
  /** Receives the next quantity, already clamped to the allowed range. */
  onChange: (value: number) => void;
  min?: number;
  /** The largest quantity that can be ordered. */
  max?: number;
  size?: QuantityStepperSize;
  className?: string;
  decreaseLabel?: string;
  increaseLabel?: string;
}

/**
 * The quantity stepper. The cart page, the cart drawer and the product page
 * all use it, so the control looks and behaves the same everywhere.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  size = "md",
  className,
  decreaseLabel = "Decrease quantity",
  increaseLabel = "Increase quantity",
}: QuantityStepperProps) {
  const scale = SIZES[size];
  const atMax = max !== undefined && value >= max;

  const decrease = () => onChange(Math.max(min, value - 1));
  const increase = () =>
    onChange(max === undefined ? value + 1 : Math.max(min, Math.min(max, value + 1)));

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-line bg-surface",
        className,
      )}
    >
      <button
        type="button"
        onClick={decrease}
        aria-label={decreaseLabel}
        className={cn(
          "flex items-center justify-center rounded-l-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink",
          scale.button,
        )}
      >
        <Minus className={scale.icon} aria-hidden />
      </button>
      <span
        className={cn(
          "text-center font-medium tabular-nums text-ink",
          scale.value,
        )}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={increase}
        disabled={atMax}
        aria-label={increaseLabel}
        className={cn(
          "flex items-center justify-center rounded-r-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40",
          scale.button,
        )}
      >
        <Plus className={scale.icon} aria-hidden />
      </button>
    </div>
  );
}
