"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useDataStore, useStoreSettings } from "@/lib/store/data-store";
import { useCartStore } from "@/lib/store/cart-store";
import {  } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { CartDrawer } from "./cart-drawer";
import { StoreContainer } from "./store-container";
import { ProductImage } from "@/components/product-image";

/** The brand tile: the uploaded image when there is one, the logo text otherwise. */
function BrandTile({
  imageId,
  fallbackText,
  backgroundColor,
}: {
  imageId?: string;
  fallbackText: string;
  backgroundColor: string;
}) {
  if (!imageId) {
    return (
      <span
        className="flex size-8 items-center justify-center rounded-lg text-base font-bold text-white"
        style={{ backgroundColor }}
      >
        {fallbackText}
      </span>
    );
  }
  return (
    <span className="block size-8 overflow-hidden rounded-lg">
      <ProductImage assetId={imageId} alt="" ratio="square" rounded="rounded-none" className="size-8" />
    </span>
  );
}

export function StoreHeader() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const settings = useStoreSettings();
  const navMenus = useDataStore((state) => state.navMenus);
  const theme = useDataStore((state) => state.themes.find((item) => item.isActive) ?? state.themes[0]);
  const items = useCartStore((state) => state.items);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const headerMenu = navMenus.find((menu) => menu.location === "header");
  const menuItems = (headerMenu?.items ?? []).filter((item) => item.visible);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const [lastPath, setLastPath] = React.useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      {theme?.settings.announcement.enabled ? (
        <div
          className="px-4 py-2 text-center text-xs font-medium"
          style={{ backgroundColor: theme.settings.primaryColor, color: "#fff" }}
        >
          {theme.settings.announcement.text}
          {theme.settings.announcement.linkLabel ? (
            <Link
              href={theme.settings.announcement.linkHref}
              className="ml-2 underline underline-offset-2"
            >
              {theme.settings.announcement.linkLabel}
            </Link>
          ) : null}
        </div>
      ) : null}

      <StoreContainer padding="none" className="flex h-16 items-center gap-3">
        <Button
          variant="ghost"
          size="iconSm"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>

        <Link
          href="/store"
          className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <BrandTile
            imageId={settings.general.images?.[0]}
            fallbackText={(theme?.settings.logoText ?? settings.general.logoText ?? "N").slice(0, 1)}
            backgroundColor={theme?.settings.primaryColor ?? "#5a5de3"}
          />
          <span className="text-md font-semibold tracking-tight text-ink">
            {theme?.settings.logoText ?? settings.general.logoText}
          </span>
        </Link>

        {theme?.settings.header.showNavigation ? (
          <nav aria-label="Store" className="ml-6 hidden items-center gap-1 lg:flex">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-1.5">
          {theme?.settings.header.showSearch ? (
            <div className="relative hidden md:block">
              {searchOpen ? (
                <form
                  action="/store/search"
                  className="flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!query.trim()) return;
                    router.push(`/store/search?q=${encodeURIComponent(query.trim())}`);
                  }}
                >
                  <SearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder="Search products…"
                    autoFocus
                    className="w-56"
                  />
                </form>
              ) : (
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search products"
                >
                  <Search className="size-5" />
                </Button>
              )}
            </div>
          ) : null}

          {theme?.settings.header.showAccount && settings.storefront.allowCustomerAccounts ? (
            <Link
              href="/store"
              aria-label="Account"
              className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <UserRound className="size-5" />
            </Link>
          ) : null}

          {theme?.settings.header.showCart ? (
            settings.storefront.cartMode === "page" ? (
              // "Dedicated cart page": the icon links to the cart instead of
              // opening the drawer.
              <Link
                href="/store/cart"
                aria-label="Cart"
                className="relative inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <ShoppingBag className="size-5" />
                {settings.storefront.showCartQuantity && cartCount > 0 ? (
                  <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-brand-600 text-2xs font-bold text-white dark:bg-brand-500 dark:bg-brand-950">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            ) : (
              <CartDrawer
                trigger={
                  <span className="relative inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
                    <ShoppingBag className="size-5" />
                    {settings.storefront.showCartQuantity && cartCount > 0 ? (
                      <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-brand-600 text-2xs font-bold text-white dark:bg-brand-500 dark:bg-brand-950">
                        {cartCount}
                      </span>
                    ) : null}
                  </span>
                }
              />
            )
          ) : null}
        </div>
      </StoreContainer>

      {searchOpen ? (
        <div className="border-t border-line px-4 py-3 md:hidden">
          <form
            action="/store/search"
            onSubmit={(event) => {
              event.preventDefault();
              if (!query.trim()) return;
              router.push(`/store/search?q=${encodeURIComponent(query.trim())}`);
            }}
          >
            <SearchInput value={query} onChange={setQuery} placeholder="Search products…" autoFocus />
          </form>
        </div>
      ) : null}

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface shadow-pop animate-slide-left">
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <span className="text-sm font-semibold text-ink">Menu</span>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-4" />
              </Button>
            </div>
            <nav aria-label="Mobile store" className="flex-1 overflow-y-auto px-3 py-3">
              <ul className="space-y-0.5">
                {menuItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="block rounded-lg px-2.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                    >
                      {item.label}
                    </Link>
                    {item.children.length ? (
                      <ul className="ml-3 border-l border-line pl-3">
                        {item.children
                          .filter((child) => child.visible)
                          .map((child) => (
                            <li key={child.id}>
                              <Link
                                href={child.href}
                                className="block rounded-lg px-2.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
