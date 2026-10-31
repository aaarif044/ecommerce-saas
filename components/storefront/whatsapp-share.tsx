"use client";

import * as React from "react";
import { useUIStore } from "@/lib/store/ui-store";
import { useStoreOrigin, useWhatsappSettings } from "@/lib/hooks";
import {
  buildWhatsappShare,
  surfaceEnabled,
  type WhatsappSharePayload,
} from "@/lib/services/whatsapp";
import type { WhatsappSurface } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WhatsappIcon, WHATSAPP_GREEN } from "@/components/ui/whatsapp-icon";

export interface WhatsappShareProps {
  surface: WhatsappSurface;
  payload: WhatsappSharePayload;
  className?: string;
  /** Overrides the configured button style. */
  variant?: "icon" | "label";
  label?: string;
  onCopied?: () => void;
}

/**
 * A WhatsApp click-to-chat share control. The link hands a pre-filled message
 * to WhatsApp — the demo never sends anything on the merchant's behalf.
 */
export function WhatsappShareButton({
  surface,
  payload,
  className,
  variant,
  label = "Share on WhatsApp",
  onCopied,
}: WhatsappShareProps) {
  const settings = useWhatsappSettings();
  const origin = useStoreOrigin();
  const toast = useUIStore((state) => state.toast);

  const share = buildWhatsappShare(settings, surface, payload, origin);

  if (!surfaceEnabled(settings, surface) || !share.url) return null;

  const style = variant ?? (settings.buttonStyle === "icon" ? "icon" : "label");

  const handleClick = async () => {
    if (settings.copyLinkOnShare && share.url) {
      try {
        await navigator.clipboard?.writeText(share.url);
        toast({ variant: "info", title: "Link copied to clipboard" });
      } catch {
        /* clipboard may be unavailable */
      }
    }
    onCopied?.();
  };

  return (
    <a
      href={share.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      title={share.message}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950/80",
        style === "icon" ? "size-9" : "h-9 px-3",
        className,
      )}
    >
      <WhatsappIcon className="size-4" style={{ color: WHATSAPP_GREEN }} />
      {style === "label" ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </a>
  );
}

/** A floating WhatsApp action button, positioned from the theme settings. */
export function WhatsappFloatingButton() {
  const settings = useWhatsappSettings();
  const origin = useStoreOrigin();

  if (!settings.enabled || settings.buttonStyle !== "floating") return null;

  const surfaces: WhatsappSurface[] = [];
  if (settings.showOnProducts) surfaces.push("product");
  if (settings.showOnCollections) surfaces.push("collection");
  if (settings.showOnCategories) surfaces.push("category");
  if (settings.showOnBlog) surfaces.push("blog");
  if (settings.showOnCart) surfaces.push("cart");

  if (!surfaces.length) return null;

  const surface = surfaces[0];
  const share = buildWhatsappShare(
    settings,
    surface,
    { path: "/store", title: settings.messageTemplate ? "Northwind Goods" : "Northwind Goods" },
    origin,
  );

  if (!share.url) return null;

  return (
    <a
      href={share.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Share on WhatsApp"
      className={cn(
        "fixed bottom-5 z-40 flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-transform hover:scale-105",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        settings.position === "bottom-left" ? "left-5" : "right-5",
      )}
    >
      <WhatsappIcon className="size-6" />
    </a>
  );
}
