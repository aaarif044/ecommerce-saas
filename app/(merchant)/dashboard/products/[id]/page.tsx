"use client";

import { PageSkeleton } from "@/components/ui/page-skeleton";
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Copy, ExternalLink, MoreHorizontal, Trash2 } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { productService } from "@/lib/services/catalog";
import { isMockApiError } from "@/lib/services/errors";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { ProductForm } from "@/components/products/product-form";
import {  } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { DropdownMenu, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/states";

export default function EditProductPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <EditProductPageContent />
    </React.Suspense>
  );
}

function EditProductPageContent() {

  const params = useParams<{ id: string }>();
  const router = useRouter();
  const product = useDataStore((state) => state.products.find((item) => item.id === params.id));
  const toast = useUIStore((state) => state.toast);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  if (!product) {
    return (
      <Page>
        <PageHeader title="Product not found" />
        <EmptyState
          title="This product no longer exists"
          description="It may have been deleted from the demo catalogue."
          action={
            <Link
              href="/dashboard/products"
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white dark:bg-brand-500 dark:text-brand-950"
            >
              Back to products
            </Link>
          }
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Catalogue"
        title={product.title}
        description={`SKU ${product.sku} · updated ${new Date(product.updatedAt).toLocaleDateString()}`}
        actions={
          <>
            <Badge tone={product.status === "active" ? "success" : product.status === "draft" ? "warning" : "neutral"}>
              {product.status}
            </Badge>
            <Link
              href={`/store/products/${product.slug}`}
              target="_blank"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-surface-2"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              View on storefront
            </Link>
            <DropdownMenu
              triggerLabel="More product actions"
              trigger={
                <span className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-muted shadow-xs transition-colors hover:bg-surface-2">
                  <MoreHorizontal className="size-4" aria-hidden />
                </span>
              }
            >
              <DropdownItem
                icon={<Copy className="size-3.5" />}
                onClick={async () => {
                  try {
                    const copy = await productService.duplicate(product.id);
                    toast({ variant: "success", title: "Product duplicated", description: copy.title });
                    router.push(`/dashboard/products/${copy.id}`);
                  } catch (error) {
                    toast({
                      variant: "error",
                      title: "Could not duplicate",
                      description: isMockApiError(error) ? error.message : undefined,
                    });
                  }
                }}
              >
                Duplicate product
              </DropdownItem>
              <DropdownItem
                icon={<ExternalLink className="size-3.5" />}
                onClick={() => {
                  window.open(`/store/products/${product.slug}`, "_blank");
                }}
              >
                Preview on storefront
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                danger
                icon={<Trash2 className="size-3.5" />}
                onClick={() => setConfirmDelete(true)}
              >
                Delete product
              </DropdownItem>
            </DropdownMenu>
            <Link
              href="/dashboard/products"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-surface-2"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Back
            </Link>
          </>
        }
      />

      <ProductForm key={product.id} product={product} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        destructive
        loading={busy}
        title={`Delete "${product.title}"?`}
        description="The product is removed from the catalogue and its collections. This cannot be undone in the demo."
        confirmLabel="Delete product"
        onConfirm={async () => {
          setBusy(true);
          try {
            await productService.remove(product.id);
            toast({ variant: "success", title: "Product deleted" });
            router.push("/dashboard/products");
          } catch (error) {
            toast({
              variant: "error",
              title: "Could not delete",
              description: isMockApiError(error) ? error.message : undefined,
            });
          } finally {
            setBusy(false);
          }
        }}
      />
    </Page>
  );
}
