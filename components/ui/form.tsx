import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The action row at the bottom of a form. It is sticky on wide screens so the
 * save button stays reachable while a long form scrolls.
 */
export function FormActions({
  children,
  className,
  sticky = true,
}: {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2",
        sticky && "sticky bottom-0 z-10 -mx-4 border-t border-line bg-surface px-4 py-3 sm:-mx-5 sm:px-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A two-column grid of form fields that collapses to one column on mobile.
 * `wide` makes the first column wider, for fields that need the room.
 */
export function FormGrid({
  children,
  className,
  columns = 2,
}: {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A field that spans the whole row of a `FormGrid`. */
export function FormFull({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("sm:col-span-2", className)}>{children}</div>;
}
