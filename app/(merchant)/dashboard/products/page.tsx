"use client";

import * as React from "react";
import Link from "next/link";
import { Archive, Copy, Download, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { productService } from "@/lib/services/catalog";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useDateFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { Card } from "@/components/ui/card";
import {  } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { DropdownMenu, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/dialog";
import { DataTable, columnHelper, selectionColumn } from "@/components/data-table/data-table";
import { ProductImage } from "@/components/product-image";
import type { Product } from "@/lib/types";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";

const STATUS_TONE = {
  active: "success",
  draft: "warning",
  archived: "neutral",
} as const;

export default function ProductsPage() {
  const products = useDataStore((state) => state.products);
  const categories = useDataStore((state) => state.categories);
  const toast = useUIStore((state) => state.toast);
  const router = useRouter();
  const money = useMoney();
  const date = useDateFormatter();

  const [status, setStatus] = React.useState("all");
  const [category, setCategory] = React.useState("all");
  const [pendingDelete, setPendingDelete] = React.useState<Product[] | null>(null);
  const [busy, setBusy] = React.useState(false);

  const categoryMap = React.useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );

  const filtered = React.useMemo(
    () =>
      products.filter((product) => {
        if (status !== "all" && product.status !== status) return false;
        if (category !== "all" && product.categoryId !== category) return false;
        return true;
      }),
    [products, status, category],
  );

  const columns = React.useMemo(
    () => [
      selectionColumn<Product>({ getRowId: (row) => row.id }),
      columnHelper.accessor("title", {
        header: "Product",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <ProductImage
              assetId={row.original.images[0]}
              alt={row.original.title}
              category={categoryMap.get(row.original.categoryId)}
              className="size-9 shrink-0"
            />
            <div className="min-w-0">
              <Link
                href={`/dashboard/products/${row.original.id}`}
                className="block truncate font-medium text-ink hover:underline"
              >
                {row.original.title}
              </Link>
              <span className="block truncate text-2xs text-ink-subtle">{row.original.brand}</span>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("sku", {
        header: "SKU",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-ink-muted">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("categoryId", {
        header: "Category",
        cell: ({ row }) => (
          <span className="text-ink-muted">{categoryMap.get(row.original.categoryId) ?? "—"}</span>
        ),
      }),
      columnHelper.accessor("price", {
        header: "Price",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-ink">
            {money(row.original.price)}
            {row.original.compareAtPrice ? (
              <span className="ml-1.5 text-2xs font-normal text-ink-subtle line-through">
                {money(row.original.compareAtPrice)}
              </span>
            ) : null}
          </span>
        ),
      }),
      columnHelper.accessor("inventory", {
        header: "Inventory",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span
            className={
              row.original.inventory === 0
                ? "font-medium tabular-nums text-red-600 dark:text-red-400"
                : row.original.inventory <= 20
                  ? "font-medium tabular-nums text-amber-600 dark:text-amber-400"
                  : "tabular-nums text-ink"
            }
          >
            {row.original.inventory}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const value = getValue() as Product["status"];
          return <Badge tone={STATUS_TONE[value]}>{value}</Badge>;
        },
      }),
      columnHelper.accessor("updatedAt", {
        header: "Last updated",
        meta: { hideBelow: "lg" },
        cell: ({ getValue }) => (
          <span className="text-ink-muted">{date(getValue())}</span>
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
            <DropdownItem
              icon={<Eye className="size-3.5" />}
              onClick={() => window.open(`/store/products/${row.original.slug}`, "_blank")}
            >
              View on storefront
            </DropdownItem>
            <DropdownItem
              icon={<Pencil className="size-3.5" />}
              onClick={() => router.push(`/dashboard/products/${row.original.id}`)}
            >
              Edit product
            </DropdownItem>
            <DropdownItem
              icon={<Copy className="size-3.5" />}
              onClick={async () => {
                try {
                  const copy = await productService.duplicate(row.original.id);
                  toast({ variant: "success", title: "Product duplicated", description: copy.title });
                } catch (error) {
                  toast({
                    variant: "error",
                    title: "Could not duplicate",
                    description: isMockApiError(error) ? error.message : undefined,
                  });
                }
              }}
            >
              Duplicate
            </DropdownItem>
            <DropdownItem
              icon={<Archive className="size-3.5" />}
              onClick={async () => {
                await productService.setStatus(row.original.id, "archived");
                toast({ variant: "info", title: "Product archived" });
              }}
            >
              Archive
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              danger
              icon={<Trash2 className="size-3.5" />}
              onClick={() => setPendingDelete([row.original])}
            >
              Delete
            </DropdownItem>
          </DropdownMenu>
        ),
      }),
    ],
    [categoryMap, date, money, router, toast],
  );

  const exportCsv = (rows: Product[]) => {
    downloadCsv(
      "products.csv",
      rows.map((product) => ({
        Title: product.title,
        SKU: product.sku,
        Brand: product.brand,
        Category: categoryMap.get(product.categoryId) ?? "",
        Price: product.price,
        Compare_at_price: product.compareAtPrice ?? "",
        Cost_price: product.costPrice,
        Inventory: product.inventory,
        Status: product.status,
        Visibility: product.visibility,
        Updated_at: product.updatedAt,
      })),
    );
    toast({ variant: "success", title: "Export ready", description: `${rows.length} products exported.` });
  };

  const runBulk = async (action: string, ids: string[]) => {
    try {
      if (action === "activate") {
        await Promise.all(ids.map((id) => productService.setStatus(id, "active")));
        toast({ variant: "success", title: `${ids.length} products published` });
      } else if (action === "draft") {
        await Promise.all(ids.map((id) => productService.setStatus(id, "draft")));
        toast({ variant: "success", title: `${ids.length} products moved to draft` });
      } else if (action === "archive") {
        await Promise.all(ids.map((id) => productService.setStatus(id, "archived")));
        toast({ variant: "success", title: `${ids.length} products archived` });
      } else if (action === "delete") {
        await Promise.all(ids.map((id) => productService.remove(id)));
        toast({ variant: "success", title: `${ids.length} products deleted` });
      }
    } catch (error) {
      toast({
        variant: "error",
        title: "Bulk action failed",
        description: isMockApiError(error) ? error.message : undefined,
      });
    }
  };

  return (
    <Page>
      <PageHeader
        title="Products"
        description={`${products.length} products in the catalogue. Editing is local to this browser.`}
        actions={
          <Link
            href="/dashboard/products/new"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400"
          >
            <Plus className="size-4" aria-hidden />
            Add product
          </Link>
        }
      />

      <Card>
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) => `${row.title} ${row.sku} ${row.brand} ${row.tags.join(" ")}`}
          searchPlaceholder="Search by title, SKU or brand…"
          enableSelection
          onBulkAction={runBulk}
          onExport={exportCsv}
          exportLabel="Export CSV"
          itemLabel="products"
          initialPageSize={10}
          toolbar={
            <FilterBar>
              <FilterSelect
                label="status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "active", label: "Active" },
                  { value: "draft", label: "Draft" },
                  { value: "archived", label: "Archived" }
                ]}
              />
              <FilterSelect
                label="category"
                value={category}
                onChange={setCategory}
              >
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </FilterSelect>
            </FilterBar>
          }
          bulkActions={[
            { label: "Publish", value: "activate" },
            { label: "Move to draft", value: "draft" },
            { label: "Archive", value: "archive" },
            { label: "Delete", value: "delete", destructive: true },
          ]}
          emptyTitle="No products match these filters"
          emptyDescription="Try clearing the filters, or add a new product to the catalogue."
          emptyAction={
            <Link
              href="/dashboard/products/new"
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white dark:bg-brand-500 dark:text-brand-950"
            >
              <Plus className="size-3.5" aria-hidden />
              Add product
            </Link>
          }
        />
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        destructive
        loading={busy}
        title={`Delete ${pendingDelete?.length ?? 0} product(s)?`}
        description="The products are removed from the catalogue and any collections. This cannot be undone in the demo."
        confirmLabel="Delete products"
        onConfirm={async () => {
          setBusy(true);
          try {
            await Promise.all((pendingDelete ?? []).map((product) => productService.remove(product.id)));
            setPendingDelete(null);
            toast({ variant: "success", title: "Products deleted" });
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

      <p className="flex items-center gap-1.5 text-2xs text-ink-subtle">
        <Download className="size-3.5" aria-hidden />
        CSV exports use the currently filtered rows.
      </p>
    </Page>
  );
}
