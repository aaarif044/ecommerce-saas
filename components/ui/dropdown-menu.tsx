"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useIsMounted } from "@/lib/hooks";

/** The gap between the trigger and the menu, and the viewport margin. */
const MENU_GAP = 6;
const MENU_MARGIN = 8;
/** A menu is never squeezed below this, even on a very short viewport. */
const MIN_MENU_HEIGHT = 160;

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
  menuClassName?: string;
  triggerClassName?: string;
  triggerLabel?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = "end",
  className,
  menuClassName,
  triggerClassName,
  triggerLabel,
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const mounted = useIsMounted();

  const close = React.useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  /**
   * Places the menu against its trigger.
   *
   * The menu is measured, not guessed: its width comes from its own content
   * (the notification centre is wider than the account menu), so the trigger
   * and the menu line up exactly. The result is then clamped to the viewport
   * and flipped above the trigger when there is not enough room below, which
   * keeps every item reachable without scrolling the page.
   *
   * The position is written straight to the element — it is a measurement of
   * the viewport, not application state.
   */
  const place = React.useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const anchor = trigger.getBoundingClientRect();
    // The offset size is the layout size — the open animation scales the
    // element, and a scaled measurement would misalign the menu.
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = align === "end" ? anchor.right - width : anchor.left;
    left = Math.max(MENU_MARGIN, Math.min(left, viewportWidth - width - MENU_MARGIN));
    if (viewportWidth - width < MENU_MARGIN * 2) left = MENU_MARGIN;

    const maxHeight = Math.max(MIN_MENU_HEIGHT, viewportHeight - MENU_MARGIN * 2);
    const below = anchor.bottom + MENU_GAP;
    const above = anchor.top - MENU_GAP - height;
    let top = below;
    if (below + height > viewportHeight - MENU_MARGIN && above > MENU_MARGIN) {
      top = above;
    }
    top = Math.max(MENU_MARGIN, Math.min(top, viewportHeight - height - MENU_MARGIN));

    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
    menu.style.maxHeight = `${Math.round(maxHeight)}px`;
  }, [align]);

  const focusItem = React.useCallback((offset: number) => {
    const menu = menuRef.current;
    if (!menu) return;
    const items = Array.from(
      menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'),
    );
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = (current + offset + items.length) % items.length;
    items[next]?.focus();
  }, []);

  // Place the menu before the browser paints, so it never appears in the
  // wrong spot first.
  React.useLayoutEffect(() => {
    if (!open) return;
    place();
  }, [open, place]);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      // The menu is portalled to the body, so it is checked separately from
      // the trigger.
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusItem(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusItem(-1);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        focusItem(-Number.MAX_SAFE_INTEGER);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        focusItem(Number.MAX_SAFE_INTEGER);
        return;
      }
      if (event.key === "Tab") {
        setOpen(false);
      }
    };
    /**
     * A scroll inside the menu is the menu scrolling, not the page moving, so
     * the menu stays open. A page scroll moves the trigger, so the menu
     * follows it — and closes once the trigger has left the viewport.
     */
    const onScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (target && menuRef.current?.contains(target)) {
        place();
        return;
      }
      const anchor = triggerRef.current?.getBoundingClientRect();
      if (!anchor || anchor.bottom < 0 || anchor.top > window.innerHeight) {
        setOpen(false);
        return;
      }
      place();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, close, focusItem, place]);

  // Move focus into the menu so the keyboard and the screen reader agree
  // about where the user is.
  React.useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      const menu = menuRef.current;
      if (!menu) return;
      const first = menu.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])');
      (first ?? menu).focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          triggerClassName,
        )}
      >
        {trigger}
      </button>
      {open && mounted
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={triggerLabel}
              tabIndex={-1}
              onClick={(event) => {
                // Choosing something closes the menu. The click itself is left
                // alone so the link or button still does its job.
                const target = event.target as HTMLElement;
                if (target.closest("a, [role='menuitem']")) setOpen(false);
              }}
              style={{ position: "fixed" }}
              className={cn(
                "z-60 min-w-60 animate-scale-in overflow-y-auto overscroll-contain rounded-xl border border-line bg-surface p-1 shadow-pop scrollbar-thin focus-visible:outline-none",
                menuClassName,
              )}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  danger?: boolean;
  active?: boolean;
  shortcut?: string;
}

export function DropdownItem({
  icon,
  danger,
  active,
  shortcut,
  className,
  children,
  ...props
}: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
        "focus-visible:outline-none focus-visible:bg-surface-2",
        danger ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10" : "text-ink hover:bg-surface-2",
        active && "bg-surface-2",
        className,
      )}
      {...props}
    >
      {icon ? <span className="shrink-0 text-ink-subtle">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut ? (
        <span className="shrink-0 text-2xs text-ink-subtle">{shortcut}</span>
      ) : null}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-line" role="separator" />;
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
      {children}
    </div>
  );
}
