"use client";

import * as React from "react";
import { Check, ImagePlus, X } from "lucide-react";
import { MEDIA_ASSETS } from "@/lib/data/media";
import { cn } from "@/lib/utils";

export function MediaPicker({
  value,
  onChange,
  max = 6,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const [open, setOpen] = React.useState(false);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
      return;
    }
    if (value.length >= max) return;
    onChange([...value, id]);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {value.map((id, index) => {
          const asset = MEDIA_ASSETS.find((item) => item.id === id) ?? MEDIA_ASSETS[0];
          return (
            <div
              key={id}
              className="group relative size-16 overflow-hidden rounded-lg border border-line"
              style={{ backgroundImage: `linear-gradient(140deg, ${asset.from}, ${asset.to})` }}
            >
              <span className="absolute bottom-1 left-1 rounded bg-black/40 px-1 text-3xs font-semibold text-white">
                {index + 1}
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== id))}
                aria-label={`Remove image ${index + 1}`}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          );
        })}
        {value.length < max ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex size-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line-strong text-ink-subtle transition-colors hover:border-brand-400 hover:text-brand-600"
          >
            <ImagePlus className="size-4" aria-hidden />
            <span className="text-2xs font-medium">Add</span>
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="rounded-lg border border-line bg-surface-2 p-3">
          <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
            Demo media library · generated tiles, no external photos
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {MEDIA_ASSETS.map((asset) => {
              const selected = value.includes(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggle(asset.id)}
                  aria-pressed={selected}
                  aria-label={asset.label}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-md border transition-transform hover:scale-[1.04]",
                    selected ? "border-brand-500 ring-2 ring-brand-500/30" : "border-line",
                  )}
                  style={{ backgroundImage: `linear-gradient(140deg, ${asset.from}, ${asset.to})` }}
                >
                  {selected ? (
                    <span className="absolute right-1 top-1 rounded-full bg-brand-600 p-0.5 text-white">
                      <Check className="size-2.5" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
