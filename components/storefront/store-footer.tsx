"use client";

import * as React from "react";
import Link from "next/link";
import { useDataStore, useStoreSettings } from "@/lib/store/data-store";
import { ProductImage } from "@/components/product-image";
import { StoreContainer } from "./store-container";
import { cn } from "@/lib/utils";
import { ANCHOR } from "@/lib/data/catalog";
import { useMoney } from "@/lib/hooks";

export function StoreFooter() {
  const settings = useStoreSettings();
  const theme = useDataStore((state) => state.themes.find((item) => item.isActive) ?? state.themes[0]);
  const pages = useDataStore((state) => state.pages);

  const footer = theme?.settings.footer;
  const primary = theme?.settings.primaryColor ?? "#5a5de3";

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <StoreContainer padding="none" className="py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2">
              <span
                className="flex size-8 items-center justify-center rounded-lg text-base font-bold text-white"
                style={{ backgroundColor: primary }}
              >
                {(theme?.settings.logoText ?? "N").slice(0, 1)}
              </span>
              <span className="text-md font-semibold text-ink">
                {settings.general.storeName}
              </span>
            </div>
            {footer?.tagline ? (
              <p className="mt-3 max-w-sm text-sm leading-6 text-ink-muted">{footer.tagline}</p>
            ) : null}
            {footer?.showSocial ? (
              <div className="mt-4 flex gap-2">
                {["Instagram", "Twitter", "Pinterest"].map((label) => (
                  <span
                    key={label}
                    className="rounded-lg border border-line px-2.5 py-1 text-2xs font-medium text-ink-muted"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {(footer?.columns ?? []).map((column) => (
            <div key={column.id}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">
                {column.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">
              Information
            </h3>
            <ul className="mt-3 space-y-2">
              {pages
                .filter((page) => page.showInFooter && page.status === "published")
                .slice(0, 5)
                .map((page) => (
                  <li key={page.id}>
                    <Link
                      href={`/store/pages/${page.slug}`}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {page.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-subtle">
            {footer?.copyright ?? `© ${ANCHOR.getFullYear()} ${settings.general.storeName}.`}
          </p>
          <p className="text-xs text-ink-subtle">
            Demo storefront · prices shown in {settings.regional.currency} · no real orders are placed
          </p>
        </div>
      </StoreContainer>
    </footer>
  );
}

export function ProductCard({
  product,
  className,
  compact,
}: {
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images: string[];
    brand: string;
    inventory: number;
    status: string;
    category?: string;
  };
  className?: string;
  compact?: boolean;
}) {
  const soldOut = product.inventory <= 0;
  const money = useMoney();
  const settings = useStoreSettings();
  const showVendor = settings.storefront.showVendor;

  return (
    <Link
      href={`/store/products/${product.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative">
        <ProductImage
          assetId={product.images[0]}
          alt={product.title}
          category={product.category}
          ratio={compact ? "square" : "portrait"}
          rounded="rounded-none"
          className="w-full"
        />
        {product.compareAtPrice && product.compareAtPrice > product.price ? (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-2xs font-semibold text-white">
            Save {money(product.compareAtPrice - product.price)}
          </span>
        ) : null}
        {soldOut ? (
          <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/70 px-2 py-1 text-center text-2xs font-medium text-white">
            Sold out
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3">
        {showVendor ? (
          <p className="text-2xs uppercase tracking-wide text-ink-subtle">{product.brand}</p>
        ) : null}
        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-ink group-hover:underline">
          {product.title}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold tabular-nums text-ink">
            {money(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <span className="text-xs tabular-nums text-ink-subtle line-through">
              {money(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
