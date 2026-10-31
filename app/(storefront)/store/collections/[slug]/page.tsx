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

export default function CollectionPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <CollectionPageContent />
    </React.Suspense>
  );
}

function CollectionPageContent() {

  const params = useParams<{ slug: string }>();
  const collections = useDataStore((state) => state.collections);
  const products = useDataStore((state) => state.products);

  const collection = collections.find((item) => item.slug === params.slug);
  const scoped = collection
    ? products.filter((product) => collection.productIds.includes(product.id))
    : [];

  if (!collection) {
    return (
      <StoreContainer width="3xl" padding="xl">
        <EmptyState
          title="Collection not found"
          description="This collection may have been removed from the demo catalogue."
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
          surface="collection"
          payload={{
            path: `/store/collections/${collection.slug}`,
            title: collection.title,
            collectionTitle: collection.title,
          }}
        />
      </StoreContainer>
      <StorefrontCatalog
        products={scoped}
        title={collection.title}
        description={collection.description}
        breadcrumbs={[{ label: "Collections" }, { label: collection.title }]}
        showCategoryFilter={false}
        emptyTitle="This collection is empty"
      />
    </div>
  );
}
