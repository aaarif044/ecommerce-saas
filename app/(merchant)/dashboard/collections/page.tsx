"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { collectionService } from "@/lib/services/catalog";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { FormGrid } from "@/components/ui/form";
import { DataTable, columnHelper, selectionColumn } from "@/components/data-table/data-table";
import { ProductImage } from "@/components/product-image";
import { DropdownMenu, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import type { Collection } from "@/lib/types";

interface CollectionForm {
  title: string;
  description: string;
  type: "manual" | "featured";
  visibility: "visible" | "hidden";
  imageTone: number;
  seoTitle: string;
  seoDescription: string;
  productIds: string[];
}

const EMPTY: CollectionForm = {
  title: "",
  description: "",
  type: "manual",
  visibility: "visible",
  imageTone: 0,
  seoTitle: "",
  seoDescription: "",
  productIds: [],
};

export default function CollectionsPage() {
  const collections = useDataStore((state) => state.collections);
  const products = useDataStore((state) => state.products);
  const toast = useUIStore((state) => state.toast);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Collection | null>(null);
  const [form, setForm] = React.useState<CollectionForm>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<Collection | null>(null);
  const [productSearch, setProductSearch] = React.useState("");

  const productMap = React.useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, imageTone: collections.length % 12 });
    setError(null);
    setOpen(true);
  };

  const openEdit = React.useCallback(
    (collection: Collection) => {
      setEditing(collection);
      setForm({
        title: collection.title,
        description: collection.description,
        type: collection.type,
        visibility: collection.visibility,
        imageTone: collection.imageTone,
        seoTitle: collection.seoTitle,
        seoDescription: collection.seoDescription,
        productIds: [...collection.productIds],
      });
      setError(null);
      setOpen(true);
    },
    [],
  );

  const toggleProduct = (id: string) => {
    setForm((current) => ({
      ...current,
      productIds: current.productIds.includes(id)
        ? current.productIds.filter((productId) => productId !== id)
        : [...current.productIds, id],
    }));
  };

  const move = (id: string, direction: -1 | 1) => {
    setForm((current) => {
      const index = current.productIds.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.productIds.length) return current;
      const next = [...current.productIds];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, productIds: next };
    });
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError("Collection title is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        type: form.type,
        visibility: form.visibility,
        imageTone: form.imageTone,
        seoTitle: form.seoTitle || form.title,
        seoDescription: form.seoDescription || form.description,
        productIds: form.productIds,
        slug: editing?.slug ?? "",
      };
      if (editing) {
        await collectionService.update(editing.id, payload);
        toast({ variant: "success", title: "Collection updated", description: form.title });
      } else {
        await collectionService.create(payload);
        toast({ variant: "success", title: "Collection created", description: form.title });
      }
      setOpen(false);
    } catch (err) {
      setError(isMockApiError(err) ? err.message : "Could not save the collection.");
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = React.useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      `${product.title} ${product.brand} ${product.sku}`.toLowerCase().includes(term),
    );
  }, [products, productSearch]);

  const columns = React.useMemo(
    () => [
      selectionColumn<Collection>({ getRowId: (row) => row.id }),
      columnHelper.accessor("title", {
        header: "Collection",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <ProductImage
              assetId={`asset-${String((row.original.imageTone % 12) + 1).padStart(2, "0")}`}
              alt={row.original.title}
              className="size-9 shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{row.original.title}</p>
              <p className="truncate text-2xs text-ink-subtle">/{row.original.slug}</p>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: ({ getValue }) => (
          <Badge tone={getValue() === "featured" ? "brand" : "neutral"}>{getValue()}</Badge>
        ),
      }),
      columnHelper.accessor("description", {
        header: "Description",
        meta: { hideBelow: "lg" },
        cell: ({ getValue }) => <span className="line-clamp-1 text-ink-muted">{getValue()}</span>,
      }),
      columnHelper.display({
        id: "products",
        header: "Products",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="tabular-nums text-ink">{row.original.productIds.length}</span>
        ),
      }),
      columnHelper.accessor("visibility", {
        header: "Visibility",
        cell: ({ getValue }) => (
          <Badge tone={getValue() === "visible" ? "info" : "neutral"}>{getValue()}</Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <DropdownMenu
            triggerLabel={`Actions for ${row.original.title}`}
            trigger={
              <span className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
                <MoreHorizontal className="size-4" aria-hidden />
              </span>
            }
          >
            <DropdownItem icon={<Pencil className="size-3.5" />} onClick={() => openEdit(row.original)}>
              Edit collection
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              danger
              icon={<Trash2 className="size-3.5" />}
              onClick={() => setPendingDelete(row.original)}
            >
              Delete collection
            </DropdownItem>
          </DropdownMenu>
        ),
      }),
    ],
    [openEdit],
  );

  return (
    <Page>
      <PageHeader
        title="Collections"
        description="Curate products into manual or featured groups shown on the storefront."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            New collection
          </Button>
        }
      />

      <Card>
        <DataTable
          data={collections}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) => `${row.title} ${row.description}`}
          searchPlaceholder="Search collections…"
          enableSelection
          itemLabel="collections"
          onExport={(rows) => {
            downloadCsv(
              "collections.csv",
              rows.map((row) => ({
                Title: row.title,
                Slug: row.slug,
                Type: row.type,
                Visibility: row.visibility,
                Products: row.productIds.length,
                Description: row.description,
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          emptyTitle="No collections yet"
          emptyDescription="Create a collection to group products for the storefront."
          emptyAction={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" aria-hidden />
              New collection
            </Button>
          }
        />
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={editing ? "Edit collection" : "New collection"}
        description="Select products and drag them into the order you want."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void save()} loading={saving}>
              {editing ? "Save changes" : "Create collection"}
            </Button>
          </>
        }
      >
        <FormGrid columns={2}>
          <div className="flex flex-col gap-4">
            {error ? (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            ) : null}
            <Field label="Title" required htmlFor="collection-title">
              <Input
                id="collection-title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </Field>
            <Field label="Description" htmlFor="collection-description">
              <Textarea
                id="collection-description"
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </Field>
            <Field label="Type" htmlFor="collection-type">
              <div className="flex gap-2">
                {(["manual", "featured"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, type })}
                    aria-pressed={form.type === type}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      form.type === type
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-200"
                        : "border-line text-ink-muted hover:bg-surface-2"
                    }`}
                  >
                    {type === "manual" ? "Manual" : "Featured"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Collection image" hint="Pick a generated tile for the collection card.">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 12 }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setForm({ ...form, imageTone: index })}
                    aria-pressed={form.imageTone === index}
                    aria-label={`Collection tile ${index + 1}`}
                    className={`size-10 overflow-hidden rounded-lg border-2 ${
                      form.imageTone === index ? "border-brand-500" : "border-transparent"
                    }`}
                  >
                    <ProductImage assetId={`asset-${String(index + 1).padStart(2, "0")}`} alt="" className="h-full w-full border-0" />
                  </button>
                ))}
              </div>
            </Field>
            <Field label="SEO title" htmlFor="collection-seo-title">
              <Input
                id="collection-seo-title"
                value={form.seoTitle}
                onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
              />
            </Field>
            <Field label="SEO description" htmlFor="collection-seo-description">
              <Textarea
                id="collection-seo-description"
                rows={2}
                value={form.seoDescription}
                onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}
              />
            </Field>
            <Switch
              checked={form.visibility === "visible"}
              onCheckedChange={(checked) =>
                setForm({ ...form, visibility: checked ? "visible" : "hidden" })
              }
              label="Visible in the storefront"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Field label={`Selected products (${form.productIds.length})`}>
              <Input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Search products…"
                aria-label="Search products to add"
              />
            </Field>
            <ul className="scrollbar-thin max-h-56 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
              {filteredProducts.map((product) => {
                const selected = form.productIds.includes(product.id);
                const position = form.productIds.indexOf(product.id);
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                        selected ? "bg-brand-50 dark:bg-brand-950/40" : "hover:bg-surface-2"
                      }`}
                    >
                      <ProductImage assetId={product.images[0]} alt={product.title} className="size-7 shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{product.title}</span>
                      {selected ? (
                        <span className="shrink-0 text-2xs font-medium text-brand-600 dark:text-brand-300">
                          #{position + 1}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            {form.productIds.length ? (
              <div>
                <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                  Display order
                </p>
                <ul className="space-y-1">
                  {form.productIds.map((id, index) => (
                    <li
                      key={id}
                      className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5"
                    >
                      <span className="w-4 text-2xs font-semibold text-ink-subtle">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        {productMap.get(id)?.title ?? "Unknown product"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        onClick={() => move(id, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                      >
                        <ChevronUp className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        onClick={() => move(id, 1)}
                        disabled={index === form.productIds.length - 1}
                        aria-label="Move down"
                      >
                        <ChevronDown className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </FormGrid>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        destructive
        title={`Delete "${pendingDelete?.title}"?`}
        description="The collection is removed from the storefront. Products stay in the catalogue."
        confirmLabel="Delete collection"
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await collectionService.remove(pendingDelete.id);
            toast({ variant: "success", title: "Collection deleted" });
            setPendingDelete(null);
          } catch (error) {
            toast({
              variant: "error",
              title: "Could not delete",
              description: isMockApiError(error) ? error.message : undefined,
            });
          }
        }}
      />
    </Page>
  );
}
