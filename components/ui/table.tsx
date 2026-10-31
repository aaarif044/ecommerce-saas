import * as React from "react";
import { cn } from "@/lib/utils";

export type TableAlign = "left" | "center" | "right";

const ALIGN: Record<TableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/**
 * The table primitives. Every table in the app uses these so the padding,
 * borders, header treatment and hover states are identical — and so the
 * horizontal scroll container is always set up the same way.
 */
export function Table({
  className,
  compact,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & { compact?: boolean }) {
  return (
    <div className="min-w-0 overflow-x-auto scrollbar-thin">
      <table
        className={cn(
          "w-full table-min border-collapse text-left text-sm",
          compact && "table-min-compact",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-surface-2/70", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-line", className)} {...props} />;
}

export function TableRow({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        "transition-colors",
        interactive && "cursor-pointer hover:bg-surface-2/60",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  align = "left",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: TableAlign }) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap border-b border-line px-4 py-2.5 text-2xs font-semibold uppercase tracking-wide text-ink-muted",
        ALIGN[align],
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  align = "left",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: TableAlign }) {
  return (
    <td
      className={cn("px-4 py-2.5 align-middle text-ink", ALIGN[align], className)}
      {...props}
    />
  );
}

/** A label/value pair, used by the order, payment and settings detail views. */
export function DescriptionRow({
  label,
  value,
  tone,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: "default" | "danger" | "muted";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd
        className={cn(
          "text-right text-sm font-medium tabular-nums text-ink",
          tone === "danger" && "text-red-600 dark:text-red-400",
          tone === "muted" && "text-ink-muted",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
