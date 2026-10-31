"use client";

import type { Theme } from "@/lib/types";

export function ThemeMiniature({ theme }: { theme: Theme }) {
  const settings = theme.settings;
  const primary = settings.primaryColor;
  const accent = settings.accentColor;

  return (
    <div
      className="h-28 w-full"
      style={{ backgroundColor: settings.backgroundColor }}
      aria-hidden
    >
      {settings.announcement.enabled ? (
        <div className="h-3 w-full" style={{ backgroundColor: primary }} />
      ) : null}
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <span
          className="size-3 rounded-xs"
          style={{ backgroundColor: primary }}
        />
        <span className="h-1.5 w-8 rounded-full bg-black/25" />
        <div className="ml-3 flex gap-1.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={index} className="h-1 w-5 rounded-full bg-black/15" />
          ))}
        </div>
      </div>
      <div className="flex gap-2 px-2.5 pb-2.5">
        <div
          className="h-12 flex-1 rounded-md p-1.5"
          style={{ background: `linear-gradient(135deg, ${primary}33, ${accent}22)` }}
        >
          <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: primary }} />
          <div className="mt-1 h-1 w-14 rounded-full bg-black/15" />
          <div
            className="mt-1.5 inline-block h-2.5 w-8 rounded-xs"
            style={{ backgroundColor: primary }}
          />
        </div>
        <div className="grid w-16 grid-cols-2 gap-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square rounded-xs"
              style={{ backgroundColor: `${accent}33` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
