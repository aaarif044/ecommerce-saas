"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { useIsMounted } from "@/lib/hooks";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: "right" | "left" | "bottom";
  className?: string;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  className,
}: SheetProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const mounted = useIsMounted();

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }, 20);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const positionClass =
    side === "right"
      ? "right-0 top-0 h-full w-full max-w-md border-l animate-slide-left"
      : side === "left"
        ? "left-0 top-0 h-full w-full max-w-md border-r animate-fade-in"
        : "bottom-0 left-0 w-full max-h-panel rounded-t-2xl border-t animate-slide-up";

  return createPortal(
    <div className="fixed inset-0 z-70">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-overlay animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        className={cn(
          "absolute flex flex-col border-line bg-surface shadow-pop",
          positionClass,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-md font-semibold text-ink">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-5 text-ink-muted">{description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="iconSm" onClick={onClose} aria-label="Close panel">
            <X className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-2 px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
