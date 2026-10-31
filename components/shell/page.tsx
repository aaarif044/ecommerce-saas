import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The standard page body: a vertical stack with one consistent rhythm. Every
 * merchant and admin page uses it, so the gap between the header, the
 * filters, the cards and the tables is always the same.
 */
export function Page<T extends React.ElementType = "div">({
  children,
  className,
  gap = "md",
  as,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  gap?: "sm" | "md" | "lg";
  /** Render as another element, e.g. `form` for a settings page. */
  as?: T;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children" | "gap">) {
  const Tag = (as ?? "div") as React.ElementType;
  return (
    <Tag
      className={cn(
        "flex flex-col",
        gap === "sm" ? "gap-4" : gap === "lg" ? "gap-6" : "gap-5",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/**
 * A responsive grid of cards. `columns` is the number of columns at the
 * widest breakpoint; the grid always collapses to a single column on mobile.
 */
export function CardGrid({
  children,
  columns = 3,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const wide =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 xl:grid-cols-4"
        : "sm:grid-cols-2 xl:grid-cols-3";
  return (
    <div className={cn("grid grid-cols-1 gap-4", wide, className)}>{children}</div>
  );
}

/**
 * A responsive grid of KPI cards.
 */
export function StatGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const wide =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 xl:grid-cols-3"
        : "sm:grid-cols-2 xl:grid-cols-4";
  return (
    <div className={cn("grid grid-cols-1 gap-3", wide, className)}>{children}</div>
  );
}
