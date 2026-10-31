"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useDataStore } from "@/lib/store/data-store";
import { StorefrontCatalog } from "@/components/storefront/storefront-catalog";
import { StoreContainer } from "@/components/storefront/store-container";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const products = useDataStore((state) => state.products);

  return (
    <StorefrontCatalog
      products={products}
      title={query ? `Results for “${query}”` : "Search"}
      description={
        query
          ? "Matching products from the demo catalogue."
          : "Type a search term to find products in the demo catalogue."
      }
      initialQuery={query}
      emptyTitle={`No products match “${query}”`}
    />
  );
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={<StoreContainer className="py-10">Loading…</StoreContainer>}>
      <SearchResults />
    </React.Suspense>
  );
}
