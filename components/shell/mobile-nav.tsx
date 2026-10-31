"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useUIStore } from "@/lib/store/ui-store";
import { MERCHANT_NAV, ADMIN_NAV } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StoreSwitcher } from "./store-switcher";

export function MobileNav() {
  const open = useUIStore((state) => state.mobileNavOpen);
  const setOpen = useUIStore((state) => state.setMobileNavOpen);
  const pathname = usePathname() ?? "";
  const isAdmin = pathname.startsWith("/admin");
  const nav = isAdmin ? ADMIN_NAV : MERCHANT_NAV;

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-75 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface shadow-pop animate-slide-left"
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <span className="text-sm font-semibold text-ink">Navigation</span>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="border-b border-line p-3">
          <StoreSwitcher />
        </div>
        <nav aria-label="Mobile" className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3">
          {nav.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1 px-2 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-200"
                            : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">{item.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
