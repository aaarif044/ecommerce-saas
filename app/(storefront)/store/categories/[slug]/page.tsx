"use client";

import { PageSkeleton } from "@/components/ui/page-skeleton";
import * as React from "react";
import { useParams } from "next/navigation";
import { useDataStore } from "@/lib/store/data-store";
import { StorefrontCatalog } from "@/components/storefront/storefront-catalog";
import {
  StoreContainer,
  StoreLinkButton,
} from "@/components/storefront/store-container";
import { EmptyState } from "@/components/ui/states";
import { WhatsappShareButton } from "@/components/storefront/whatsapp-share";

export default function CategoryPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <CategoryPageContent />
    </React.Suspense>
  );
}

function CategoryPageContent() {

  const params = useParams<{ slug: string }>();
  const categories = useDataStore((state) => state.categories);
  const products = useDataStore((state) => state.products);

  const category = categories.find((item) => item.slug === params.slug);
  const children = categories.filter((item) => item.parentId === category?.id);
  const scoped = category
    ? products.filter(
        (product) =>
          product.categoryId === category.id ||
          children.some((child) => child.id === product.categoryId),
      )
    : [];

  if (!category) {
    return (
      <StoreContainer width="3xl" padding="xl">
        <EmptyState
          title="Category not found"
          description="This category may have been removed from the demo catalogue."
          action={
            <StoreLinkButton href="/store/products">Browse all products</StoreLinkButton>
          }
        />
      </StoreContainer>
    );
  }

  return (
    <div className="flex flex-col">
      <StoreContainer padding="none" className="flex justify-end pt-6">
        <WhatsappShareButton
          surface="category"
          payload={{
            path: `/store/categories/${category.slug}`,
            title: category.name,
            categoryTitle: category.name,
          }}
        />
      </StoreContainer>
      <StorefrontCatalog
        products={scoped}
        title={category.name}
        description={category.description}
        breadcrumbs={[{ label: category.name }]}
        showCategoryFilter={false}
      />
    </div>
  );
}
