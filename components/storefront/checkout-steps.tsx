"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckoutStep {
  id: string;
  label: string;
  /** True once the shopper has filled in what the step needs. */
  complete: boolean;
}

/**
 * The checkout flow at a glance: customer information, shipping address,
 * delivery method, payment method and the final order review.
 */
export function CheckoutSteps({ steps, className }: { steps: CheckoutStep[]; className?: string }) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-x-2 gap-y-2", className)}>
      {steps.map((step, index) => (
        <li key={step.id} className="flex items-center gap-2">
          {index > 0 ? <span aria-hidden className="h-px w-4 bg-line-strong" /> : null}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              step.complete
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "border-line bg-surface text-ink-muted",
            )}
          >
            {step.complete ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <span
                aria-hidden
                className="inline-flex size-3.5 items-center justify-center rounded-full border border-current text-3xs leading-none"
              >
                {index + 1}
              </span>
            )}
            {step.label}
            <span className="sr-only">
              {step.complete ? " — complete" : " — still to do"}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
