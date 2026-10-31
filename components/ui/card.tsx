import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }
>(({ className, interactive, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-line bg-surface shadow-xs",
      interactive && "transition-shadow hover:shadow-md",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export function CardHeader({
  className,
  title,
  description,
  actions,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5", className)}
      {...props}
    >
      {(title || description) && (
        <div className="min-w-0">
          {title ? <h2 className="text-md font-semibold text-ink">{title}</h2> : null}
          {description ? (
            <p className="mt-0.5 text-sm leading-5 text-ink-muted">{description}</p>
          ) : null}
        </div>
      )}
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2 border-t border-line px-4 py-3 sm:px-5", className)}
      {...props}
    />
  );
}
