"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { ProductForm } from "@/components/products/product-form";

export default function NewProductPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Catalogue"
        title="Add a product"
        description="Create a draft, then publish it to the storefront when you are ready."
        actions={
          <Link
            href="/dashboard/products"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-surface-2"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Back to products
          </Link>
        }
      />
      <ProductForm />
    </Page>
  );
}
