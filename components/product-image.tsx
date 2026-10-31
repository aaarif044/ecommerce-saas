import * as React from "react";
import {
  AudioLines,
  Box,
  Dumbbell,
  Footprints,
  Gamepad2,
  Home,
  LampDesk,
  Laptop,
  Package,
  Palette,
  Shirt,
  ShoppingBasket,
  Sofa,
  Sparkles,
  Speaker,
  Watch,
} from "lucide-react";
import { getMedia } from "@/lib/data/media";
import { cn, slugify } from "@/lib/utils";

export interface ProductImageProps {
  assetId?: string;
  tone?: number;
  alt: string;
  category?: string;
  className?: string;
  ratio?: "square" | "portrait" | "wide";
  rounded?: string;
}

const CATEGORY_ICONS: Record<string, typeof Package> = {
  electronics: Laptop,
  audio: Speaker,
  "smart-home": LampDesk,
  computers: Laptop,
  "mobile-accessories": AudioLines,
  apparel: Shirt,
  "mens-clothing": Shirt,
  "womens-clothing": Shirt,
  "kids-clothing": Shirt,
  footwear: Footprints,
  "bags-luggage": ShoppingBasket,
  "beauty-personal-care": Sparkles,
  skincare: Sparkles,
  fragrance: Palette,
  "home-living": Home,
  kitchen: Sofa,
  furniture: Sofa,
  "sports-outdoors": Dumbbell,
  "toys-games": Gamepad2,
  stationery: Watch,
};

/**
 * Renders a deterministic, offline "product photo": a soft gradient tile with a
 * category glyph over it. No external image assets are used anywhere in the
 * demo, so the UI works fully offline.
 */
export function ProductImage({
  assetId,
  tone = 0,
  alt,
  category,
  className,
  ratio = "square",
  rounded = "rounded-lg",
}: ProductImageProps) {
  const asset = assetId ? getMedia(assetId) : undefined;
  const from = asset?.from ?? `hsl(${210 + ((tone * 37) % 120)}, 70%, 94%)`;
  const to = asset?.to ?? `hsl(${210 + ((tone * 37) % 120)}, 62%, 86%)`;
  const accent = asset?.accent ?? `hsl(${210 + ((tone * 37) % 120)}, 55%, 52%)`;
  const Icon = (category && CATEGORY_ICONS[slugify(category)]) || Box;

  const ratioClass =
    ratio === "square" ? "aspect-square" : ratio === "portrait" ? "aspect-[3/4]" : "aspect-[16/9]";

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "relative overflow-hidden border border-line/70",
        rounded,
        ratioClass,
        className,
      )}
      style={{ backgroundImage: `linear-gradient(140deg, ${from} 0%, ${to} 100%)` }}
    >
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-[0.18]"
      >
        <defs>
          <pattern id={`p-${asset?.id ?? tone}`} width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill={accent} />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#p-${asset?.id ?? tone})`} />
      </svg>
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: accent, opacity: 0.55 }}
      >
        <Icon className="h-1/3 w-1/3 max-h-16 max-w-16" strokeWidth={1.1} />
      </span>
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: `linear-gradient(to top, ${accent}1f, transparent)` }}
      />
    </div>
  );
}
