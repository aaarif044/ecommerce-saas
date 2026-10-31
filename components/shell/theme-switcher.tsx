"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useUIStore, type ThemeMode } from "@/lib/store/ui-store";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeSwitcher({ compact }: { compact?: boolean }) {
  const themeMode = useUIStore((state) => state.themeMode);
  const setThemeMode = useUIStore((state) => state.setThemeMode);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5",
      )}
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = themeMode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.label}
            onClick={() => setThemeMode(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? "bg-surface text-ink shadow-xs"
                : "text-ink-muted hover:text-ink",
              compact && "px-1.5",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {compact ? null : <span className="hidden sm:inline">{option.label}</span>}
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
