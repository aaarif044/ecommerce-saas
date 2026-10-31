"use client";

import * as React from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { useDataStore, useStoreSettings } from "@/lib/store/data-store";
import { useMoney } from "@/lib/hooks";
import { ProductCard } from "./store-footer";
import { StoreContainer, StorePageTitle } from "./store-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Select } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/states";
import { isSellable } from "@/lib/utils";
import type { Product } from "@/lib/types";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "title", label: "Alphabetical" },
];

export function StorefrontCatalog({
  products,
  title,
  description,
  breadcrumbs,
  showCategoryFilter = true,
  initialQuery = "",
  emptyTitle = "No products found",
}: {
  products: Product[];
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  showCategoryFilter?: boolean;
  initialQuery?: string;
  emptyTitle?: string;
}) {
  const categories = useDataStore((state) => state.categories);
  const settings = useStoreSettings();
  const money = useMoney();

  const categorySlug = React.useCallback(
    (categoryId: string) => categories.find((item) => item.id === categoryId)?.slug,
    [categories],
  );

  const [query, setQuery] = React.useState(initialQuery);
  const [sort, setSort] = React.useState("featured");
  const [category, setCategory] = React.useState("all");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  // The query can change underneath the component (the header search pushes a
  // new `?q=`), so the input has to follow it rather than keep the value it
  // was mounted with.
  const [lastInitialQuery, setLastInitialQuery] = React.useState(initialQuery);
  if (lastInitialQuery !== initialQuery) {
    setLastInitialQuery(initialQuery);
    setQuery(initialQuery);
  }

  const visible = React.useMemo(() => {
    const sellable = products.filter(isSellable);
    // "Show out-of-stock products" is a storefront setting: when it is off,
    // sold-out items disappear from the catalogue.
    return settings.storefront.showOutOfStock ? sellable : sellable.filter((p) => p.inventory > 0);
  }, [products, settings.storefront.showOutOfStock]);

  const priceCeiling = React.useMemo(
    () => Math.max(1000, ...visible.map((product) => product.price)),
    [visible],
  );

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    const ceiling = maxPrice ? Number(maxPrice) : priceCeiling;
    const result = visible.filter((product) => {
      if (category !== "all" && product.categoryId !== category) return false;
      if (product.price > ceiling) return false;
      if (inStockOnly && product.inventory <= 0) return false;
      if (term) {
        const haystack = `${product.title} ${product.brand} ${product.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    return [...result].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "title":
          return a.title.localeCompare(b.title);
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return Number(b.featured) - Number(a.featured) || b.inventory - a.inventory;
      }
    });
  }, [visible, query, category, maxPrice, inStockOnly, sort, priceCeiling]);

  const activeFilters =
    (category !== "all" ? 1 : 0) + (maxPrice ? 1 : 0) + (inStockOnly ? 1 : 0) + (query ? 1 : 0);

  return (
    <StoreContainer>
      {breadcrumbs?.length ? (
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
            <li>
              <Link href="/store" className="hover:text-ink">
                Home
              </Link>
            </li>
            {breadcrumbs.map((crumb) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                <span aria-hidden>/</span>
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-ink">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-ink">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <StorePageTitle title={title} description={description} />

      <div className="mt-6 flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search products…"
            className="sm:w-72"
          />
          <Button
            variant="secondary"
            size="sm"
            className="sm:hidden"
            onClick={() => setFiltersOpen((value) => !value)}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden />
            Filters
            {activeFilters ? <Badge tone="brand">{activeFilters}</Badge> : null}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-muted">{filtered.length} products</span>
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort products"
            className="w-48"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside
          className={`${filtersOpen ? "block" : "hidden"} lg:block lg:w-60 lg:shrink-0`}
          aria-label="Product filters"
        >
          <div className="flex flex-col gap-5">
            {showCategoryFilter ? (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Category</h2>
                <ul className="mt-2 space-y-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => setCategory("all")}
                      className={`text-left text-sm transition-colors ${
                        category === "all" ? "font-medium text-ink" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      All categories
                    </button>
                  </li>
                  {categories
                    .filter((item) => item.visibility === "visible")
                    .map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setCategory(item.id)}
                          className={`text-left text-sm transition-colors ${
                            category === item.id
                              ? "font-medium text-ink"
                              : "text-ink-muted hover:text-ink"
                          }`}
                        >
                          {item.name}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">
                Max price
              </h2>
              <input
                type="range"
                min={0}
                max={priceCeiling}
                step={100}
                value={maxPrice || priceCeiling}
                onChange={(event) => setMaxPrice(event.target.value)}
                aria-label="Maximum price"
                className="mt-2 w-full accent-brand-600"
              />
              <p className="mt-1 text-xs text-ink-muted">
                Up to {money(Number(maxPrice || priceCeiling))}
              </p>
            </div>

            <div>
              <label
                htmlFor="catalog-in-stock"
                className="flex items-center gap-2 text-sm text-ink"
              >
                <Checkbox
                  id="catalog-in-stock"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                />
                In stock only
              </label>
            </div>

            {activeFilters ? (
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => {
                  setCategory("all");
                  setMaxPrice("");
                  setInStockOnly(false);
                  setQuery("");
                }}
              >
                <X className="size-3.5" aria-hidden />
                Clear filters
              </Button>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {filtered.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{ ...product, category: categorySlug(product.categoryId) }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={emptyTitle}
              description="Try adjusting your filters or search for something else."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCategory("all");
                    setMaxPrice("");
                    setInStockOnly(false);
                    setQuery("");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          )}
        </div>
      </div>
    </StoreContainer>
  );
}
