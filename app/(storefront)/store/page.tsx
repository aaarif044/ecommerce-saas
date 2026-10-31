"use client";

import * as React from "react";
import { useDataStore, useStoreSettings } from "@/lib/store/data-store";
import { ThemeSections } from "@/components/storefront/sections";
import {
  StoreContainer,
  StoreLinkButton,
  StorePageTitle,
} from "@/components/storefront/store-container";
import { Badge } from "@/components/ui/badge";
import { isSellable } from "@/lib/utils";

export default function StoreHomePage() {
  const theme = useDataStore((state) => state.themes.find((item) => item.isActive) ?? state.themes[0]);
  const settings = useStoreSettings();
  const products = useDataStore((state) => state.products);

  const hero = theme?.settings.sections.find((section) => section.type === "hero");
  const heroProps = hero?.props as { headline?: string } | undefined;
  const visibleProducts = products.filter(isSellable).length;

  return (
    <>
      {!settings.storefront.published ? (
        <StoreContainer width="3xl" padding="xl" className="text-center">
          <Badge tone="warning" dot>
            Storefront unpublished
          </Badge>
          <StorePageTitle
            className="mt-4 items-center text-center"
            title="This store is not published"
            description="Unpublishing the storefront takes the shop offline without changing any data. Publish it again in Storefront Preferences."
          />
          <StoreLinkButton href="/dashboard/settings/storefront" className="mt-6">
            Storefront preferences
          </StoreLinkButton>
        </StoreContainer>
      ) : null}
      {settings.storefront.visibility === "password" ? (
        <StoreContainer width="3xl" padding="xl" className="text-center">
          <Badge tone="warning" dot>
            Password protected
          </Badge>
          <StorePageTitle
            className="mt-4 items-center text-center"
            title="This storefront is password protected"
            description={
              <>
                The demo password is <span className="font-mono">{settings.storefront.password}</span>.
                Change it any time in Storefront Preferences.
              </>
            }
          />
          <StoreLinkButton href="/store/products" className="mt-6">
            Continue to the shop
          </StoreLinkButton>
        </StoreContainer>
      ) : null}

      <div style={{ ["--store-accent" as string]: theme?.settings.primaryColor }}>
        {theme ? <ThemeSections theme={theme.settings} /> : null}
      </div>

      <section className="border-t border-line bg-surface-2">
        <StoreContainer className="flex flex-col gap-3 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              {heroProps?.headline ?? settings.general.storeName}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {visibleProducts} products available · free delivery over{" "}
              {settings.regional.currencySymbol}
              {settings.shipping.freeShippingThreshold.toLocaleString(settings.regional.numberLocale)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StoreLinkButton href="/store/products">Shop all products</StoreLinkButton>
            <StoreLinkButton href="/store/collections/bestsellers" variant="secondary">
              Bestsellers
            </StoreLinkButton>
          </div>
        </StoreContainer>
      </section>
    </>
  );
}
