"use client";

import * as React from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/store/data-store";
import { ProductImage } from "@/components/product-image";
import { StoreContainer, StorePageTitle } from "@/components/storefront/store-container";
import { Card, CardBody } from "@/components/ui/card";

export default function AboutPage() {
  const page = useDataStore((state) => state.pages.find((item) => item.slug === "about"));
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);

  return (
    <StoreContainer width="5xl" padding="lg">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-xs text-ink-muted">
          <li>
            <Link href="/store" className="hover:text-ink">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-ink">About</li>
        </ol>
      </nav>

      <StorePageTitle title={page?.title ?? "About us"} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <ProductImage assetId="asset-03" alt="Workshop" ratio="wide" className="w-full" />
        <ProductImage assetId="asset-06" alt="Storefront" ratio="wide" className="w-full" />
      </div>

      <div className="mt-6 max-w-2xl space-y-4 text-md leading-7 text-ink-muted">
        {(page?.content ?? "").split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Products in the demo catalogue", value: "50" },
          { label: "Small workshops we work with", value: "18" },
          { label: "Average product lifespan", value: "8 yrs" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <p className="text-2xl font-semibold tracking-tight text-ink">{stat.value}</p>
              <p className="mt-1 text-sm leading-5 text-ink-muted">{stat.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-xs text-ink-subtle">
        {settings.general.legalName} · {settings.general.storeName} is a demonstration storefront.
      </p>
    </StoreContainer>
  );
}
