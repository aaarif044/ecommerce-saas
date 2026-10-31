"use client";

import * as React from "react";
import { Menu, Search } from "lucide-react";
import { useUIStore } from "@/lib/store/ui-store";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "./notification-center";
import { ThemeSwitcher } from "./theme-switcher";
import { HelpMenu, UserMenu } from "./user-menu";
import { Tooltip } from "@/components/ui/tooltip";

export function TopBar({ children }: { children?: React.ReactNode }) {
  const setCommandPaletteOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const setMobileNavOpen = useUIStore((state) => state.setMobileNavOpen);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/85 px-3 backdrop-blur-md sm:px-4">
      <Button
        variant="ghost"
        size="iconSm"
        className="lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </Button>

      {children ? <div className="min-w-0 flex-1">{children}</div> : <div className="flex-1" />}

      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className="group inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface-2 px-2.5 text-sm text-ink-subtle transition-colors hover:border-line-strong hover:text-ink-muted sm:w-56 sm:justify-between"
        aria-label="Open global search"
      >
        <span className="flex items-center gap-2">
          <Search className="size-4" aria-hidden />
          <span className="hidden sm:inline">Search…</span>
        </span>
        <kbd className="hidden rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-2xs text-ink-subtle sm:block">
          ⌘K
        </kbd>
      </button>

      <div className="hidden sm:block">
        <ThemeSwitcher compact />
      </div>
      <NotificationCenter />
      <HelpMenu />
      <UserMenu />
    </header>
  );
}

export function MobileNavTrigger() {
  const setMobileNavOpen = useUIStore((state) => state.setMobileNavOpen);
  return (
    <Tooltip content="Open navigation">
      <Button
        variant="ghost"
        size="iconSm"
        className="lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </Button>
    </Tooltip>
  );
}
