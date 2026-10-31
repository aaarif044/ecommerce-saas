"use client";

import * as React from "react";
import { useDataStore } from "@/lib/store/data-store";
import { StorefrontCatalog } from "@/components/storefront/storefront-catalog";

export default function StoreProductsPage() {
  const products = useDataStore((state) => state.products);

  return (
    <StorefrontCatalog
      products={products}
      title="All products"
      description="Everything in the catalogue, from kitchenware to audio. Filter by category, price or availability."
    />
  );
}
