"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-400 dark:text-brand-950",
        secondary:
          "bg-surface text-ink border border-line shadow-xs hover:bg-surface-2 hover:border-line-strong",
        outline:
          "border border-line-strong bg-transparent text-ink hover:bg-surface-2",
        ghost: "text-ink-muted hover:bg-surface-2 hover:text-ink",
        subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-200 dark:hover:bg-brand-900/60",
        danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
        dangerGhost: "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10",
        success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
        link: "text-brand-600 underline-offset-4 hover:underline dark:text-brand-300",
      },
      size: {
        sm: "h-8 px-2.5 text-xs",
        md: "h-9 px-3.5",
        lg: "h-11 px-5 text-base",
        icon: "size-9",
        iconSm: "size-8",
        iconLg: "size-11",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, loading, loadingText, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
      {loading && loadingText ? loadingText : children}
    </button>
  ),
);
Button.displayName = "Button";

export { buttonVariants };
