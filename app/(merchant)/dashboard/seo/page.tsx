"use client";

import * as React from "react";
import { Check, Link2, Search, Share2 } from "lucide-react";
import { useDataStore, useStoreSettings } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { pageService } from "@/lib/services/storefront";
import { collectionService, categoryService } from "@/lib/services/catalog";
import { productService } from "@/lib/services/catalog";
import { settingsService } from "@/lib/services/settings";
import { isMockApiError } from "@/lib/services/errors";
import { useStoreOrigin } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { CardGrid, Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";
import { ProductImage } from "@/components/product-image";

type SeoTab = "store" | "products" | "collections" | "categories" | "pages";

export default function SeoPage() {
  const settings = useStoreSettings();
  const products = useDataStore((state) => state.products);
  const collections = useDataStore((state) => state.collections);
  const categories = useDataStore((state) => state.categories);
  const pages = useDataStore((state) => state.pages);
  const toast = useUIStore((state) => state.toast);

  const [tab, setTab] = React.useState<SeoTab>("store");
  const [storeForm, setStoreForm] = React.useState({
    seoTitle: settings.storefront.seoTitle,
    seoDescription: settings.storefront.seoDescription,
  });
  const [saving, setSaving] = React.useState(false);
  const [selectedProductId, setSelectedProductId] = React.useState(products[0]?.id ?? "");
  const [selectedCollectionId, setSelectedCollectionId] = React.useState(collections[0]?.id ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(categories[0]?.id ?? "");
  const [selectedPageId, setSelectedPageId] = React.useState(pages[0]?.id ?? "");

  const product = products.find((item) => item.id === selectedProductId);
  const collection = collections.find((item) => item.id === selectedCollectionId);
  const category = categories.find((item) => item.id === selectedCategoryId);
  const page = pages.find((item) => item.id === selectedPageId);

  // Reading `window.location` during render would hydrate differently on the
  // server and the client. The hook keeps the first paint deterministic.
  const base = useStoreOrigin();

  const saveStore = async () => {
    setSaving(true);
    try {
      await settingsService.updateStorefront({
        seoTitle: storeForm.seoTitle,
        seoDescription: storeForm.seoDescription,
      });
      toast({ variant: "success", title: "SEO defaults saved" });
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not save",
        description: isMockApiError(error) ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const titleLength = (value: string) => {
    if (value.length === 0) return { tone: "neutral" as const, label: "Empty" };
    if (value.length <= 60) return { tone: "success" as const, label: `${value.length} characters` };
    return { tone: "warning" as const, label: `${value.length} characters — trim it` };
  };

  return (
    <Page>
      <PageHeader
        title="SEO"
        description="Search and social previews for the store, products, collections, categories and pages."
      />

      <Tabs
        value={tab}
        onChange={setTab}
        ariaLabel="SEO sections"
        items={[
          { value: "store", label: "Store defaults" },
          { value: "products", label: "Products" },
          { value: "collections", label: "Collections" },
          { value: "categories", label: "Categories" },
          { value: "pages", label: "Pages" },
        ]}
      />

      {tab === "store" ? (
        <CardGrid columns={2}>
          <Card>
            <CardHeader title="Store metadata" description="Applied to the homepage and as a fallback." />
            <CardBody className="flex flex-col gap-4">
              <Field
                label="SEO title"
                htmlFor="seo-store-title"
                hint={titleLength(storeForm.seoTitle).label}
              >
                <Input
                  id="seo-store-title"
                  value={storeForm.seoTitle}
                  onChange={(event) =>
                    setStoreForm({ ...storeForm, seoTitle: event.target.value })
                  }
                />
              </Field>
              <Field
                label="SEO description"
                htmlFor="seo-store-description"
                hint={titleLength(storeForm.seoDescription).label}
              >
                <Textarea
                  id="seo-store-description"
                  rows={3}
                  value={storeForm.seoDescription}
                  onChange={(event) =>
                    setStoreForm({ ...storeForm, seoDescription: event.target.value })
                  }
                />
              </Field>
              <FormActions sticky={false}>
                <Button
                  variant="primary"
                  loading={saving}
                  onClick={() => void saveStore()}
                >
                  Save defaults
                </Button>
              </FormActions>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Search preview" description="How the store appears in results." />
            <CardBody>
              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs text-ink-muted">
                  {base.replace(/^https?:\/\//, "")} › {settings.general.storeName}
                </p>
                <p className="mt-1 text-lg leading-6 text-search-blue dark:text-search-blue-dark">
                  {storeForm.seoTitle || settings.general.storeName}
                </p>
                <p className="mt-1 text-sm leading-5 text-ink-muted">
                  {storeForm.seoDescription || settings.general.description}
                </p>
              </div>

              <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                Social sharing preview
              </h3>
              <div className="mt-2 overflow-hidden rounded-xl border border-line">
                <ProductImage
                  assetId={`asset-${String((settings.storefront.socialImageTone % 12) + 1).padStart(2, "0")}`}
                  alt="Social sharing image"
                  ratio="wide"
                  rounded="rounded-none"
                  className="w-full"
                />
                <div className="bg-surface-2 px-4 py-3">
                  <p className="text-2xs uppercase tracking-wide text-ink-subtle">
                    {settings.general.storeName.toUpperCase()}
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-ink">
                    {storeForm.seoTitle || settings.general.storeName}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                    {storeForm.seoDescription || settings.general.description}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-2xs text-ink-subtle">
                The social image is a generated demo tile — no external image is uploaded.
              </p>
            </CardBody>
          </Card>
        </CardGrid>
      ) : null}

      {tab === "products" && product ? (
        <CardGrid columns={2}>
          <Card>
            <CardHeader
              title="Product metadata"
              description={`Editing ${product.title}`}
              actions={
                <Select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  aria-label="Select product"
                  className="w-56"
                >
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              }
            />
            <CardBody className="flex flex-col gap-4">
              <Field label="SEO title" htmlFor="seo-product-title">
                <Input
                  id="seo-product-title"
                  key={product.id}
                  defaultValue={product.seoTitle}
                  onBlur={async (event) => {
                    await productService.update(product.id, { seoTitle: event.target.value });
                    toast({ variant: "info", title: "Product SEO title updated" });
                  }}
                />
              </Field>
              <Field label="SEO description" htmlFor="seo-product-description">
                <Textarea
                  id="seo-product-description"
                  key={product.id}
                  rows={3}
                  defaultValue={product.seoDescription}
                  onBlur={async (event) => {
                    await productService.update(product.id, {
                      seoDescription: event.target.value,
                    });
                    toast({ variant: "info", title: "Product SEO description updated" });
                  }}
                />
              </Field>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Search preview" />
            <CardBody>
              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs text-ink-muted">
                  {base.replace(/^https?:\/\//, "")} › products › {product.slug}
                </p>
                <p className="mt-1 text-lg leading-6 text-search-blue dark:text-search-blue-dark">
                  {product.seoTitle}
                </p>
                <p className="mt-1 text-sm leading-5 text-ink-muted">{product.seoDescription}</p>
              </div>
            </CardBody>
          </Card>
        </CardGrid>
      ) : null}

      {tab === "collections" && collection ? (
        <Card>
          <CardHeader
            title="Collection metadata"
            actions={
              <Select
                value={selectedCollectionId}
                onChange={(event) => setSelectedCollectionId(event.target.value)}
                aria-label="Select collection"
                className="w-56"
              >
                {collections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
            }
          />
          <CardBody className="flex flex-col gap-4">
            <Field label="SEO title" htmlFor="seo-collection-title">
              <Input
                id="seo-collection-title"
                key={collection.id}
                defaultValue={collection.seoTitle}
                onBlur={async (event) => {
                  await collectionService.update(collection.id, { seoTitle: event.target.value });
                  toast({ variant: "info", title: "Collection SEO title updated" });
                }}
              />
            </Field>
            <Field label="SEO description" htmlFor="seo-collection-description">
              <Textarea
                id="seo-collection-description"
                key={collection.id}
                rows={3}
                defaultValue={collection.seoDescription}
                onBlur={async (event) => {
                  await collectionService.update(collection.id, {
                    seoDescription: event.target.value,
                  });
                  toast({ variant: "info", title: "Collection SEO description updated" });
                }}
              />
            </Field>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-xs text-ink-muted">
                {base.replace(/^https?:\/\//, "")} › collections › {collection.slug}
              </p>
              <p className="mt-1 text-lg leading-6 text-search-blue dark:text-search-blue-dark">
                {collection.seoTitle}
              </p>
              <p className="mt-1 text-sm leading-5 text-ink-muted">{collection.seoDescription}</p>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {tab === "categories" && category ? (
        <Card>
          <CardHeader
            title="Category metadata"
            actions={
              <Select
                value={selectedCategoryId}
                onChange={(event) => setSelectedCategoryId(event.target.value)}
                aria-label="Select category"
                className="w-56"
              >
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            }
          />
          <CardBody className="flex flex-col gap-4">
            <Field label="SEO title" htmlFor="seo-category-title">
              <Input
                id="seo-category-title"
                key={category.id}
                defaultValue={category.seoTitle}
                onBlur={async (event) => {
                  await categoryService.update(category.id, { seoTitle: event.target.value });
                  toast({ variant: "info", title: "Category SEO title updated" });
                }}
              />
            </Field>
            <Field label="SEO description" htmlFor="seo-category-description">
              <Textarea
                id="seo-category-description"
                key={category.id}
                rows={3}
                defaultValue={category.seoDescription}
                onBlur={async (event) => {
                  await categoryService.update(category.id, {
                    seoDescription: event.target.value,
                  });
                  toast({ variant: "info", title: "Category SEO description updated" });
                }}
              />
            </Field>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-xs text-ink-muted">
                {base.replace(/^https?:\/\//, "")} › categories › {category.slug}
              </p>
              <p className="mt-1 text-lg leading-6 text-search-blue dark:text-search-blue-dark">
                {category.seoTitle}
              </p>
              <p className="mt-1 text-sm leading-5 text-ink-muted">{category.seoDescription}</p>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {tab === "pages" && page ? (
        <Card>
          <CardHeader
            title="Page metadata"
            actions={
              <Select
                value={selectedPageId}
                onChange={(event) => setSelectedPageId(event.target.value)}
                aria-label="Select page"
                className="w-56"
              >
                {pages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
            }
          />
          <CardBody className="flex flex-col gap-4">
            <Field label="SEO title" htmlFor="seo-page-title">
              <Input
                id="seo-page-title"
                key={page.id}
                defaultValue={page.seoTitle}
                onBlur={async (event) => {
                  await pageService.update(page.id, { seoTitle: event.target.value });
                  toast({ variant: "info", title: "Page SEO title updated" });
                }}
              />
            </Field>
            <Field label="SEO description" htmlFor="seo-page-description">
              <Textarea
                id="seo-page-description"
                key={page.id}
                rows={3}
                defaultValue={page.seoDescription}
                onBlur={async (event) => {
                  await pageService.update(page.id, { seoDescription: event.target.value });
                  toast({ variant: "info", title: "Page SEO description updated" });
                }}
              />
            </Field>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-xs text-ink-muted">
                {base.replace(/^https?:\/\//, "")} › pages › {page.slug}
              </p>
              <p className="mt-1 text-lg leading-6 text-search-blue dark:text-search-blue-dark">
                {page.seoTitle}
              </p>
              <p className="mt-1 text-sm leading-5 text-ink-muted">{page.seoDescription}</p>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Checklist" description="Demo recommendations for the store." />
        <CardBody>
          <ul className="space-y-2">
            {[
              { label: "Store title is set and under 60 characters", done: storeForm.seoTitle.length > 0 && storeForm.seoTitle.length <= 60 },
              { label: "Store description is set and under 160 characters", done: storeForm.seoDescription.length > 0 && storeForm.seoDescription.length <= 160 },
              { label: "Every published product has an SEO title", done: products.filter((item) => item.status === "active" && item.seoTitle).length === products.filter((item) => item.status === "active").length },
              { label: "Every collection has a description", done: collections.every((item) => item.seoDescription.length > 0) },
              { label: "Every category has a description", done: categories.every((item) => item.seoDescription.length > 0) },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-2.5 text-sm text-ink-muted">
                <span
                  className={
                    item.done
                      ? "flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "flex size-5 items-center justify-center rounded-full bg-surface-2 text-ink-subtle"
                  }
                >
                  {item.done ? <Check className="size-3" aria-hidden /> : null}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="info">
              <Link2 className="size-3" aria-hidden />
              {base.replace(/^https?:\/\//, "")}
            </Badge>
            <Badge tone="neutral">
              <Share2 className="size-3" aria-hidden />
              {pages.length + products.length + collections.length} indexed URLs
            </Badge>
            <Badge tone="neutral">
              <Search className="size-3" aria-hidden />
              Sitemap generated locally
            </Badge>
          </div>
        </CardBody>
      </Card>
    </Page>
  );
}
