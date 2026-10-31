"use client";

import * as React from "react";
import { ArrowUpRight, Boxes, History, Minus, PackageX, TriangleAlert } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { productService } from "@/lib/services/catalog";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page, StatGrid } from "@/components/shell/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { DataTable, columnHelper } from "@/components/data-table/data-table";
import { ProductImage } from "@/components/product-image";
import { StatCard } from "@/components/dashboard/stat-card";
import {  } from "@/components/ui/states";
import type { InventoryMovement, Product } from "@/lib/types";

type Tab = "stock" | "low" | "out" | "movements";
type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
type StockRow = Omit<Product, "status"> & { status: StockStatus };

const STOCK_STATUS = {
  in_stock: { label: "In stock", tone: "success" as const },
  low_stock: { label: "Low stock", tone: "warning" as const },
  out_of_stock: { label: "Out of stock", tone: "danger" as const },
};

function statusFor(inventory: number, threshold = 20): StockStatus {
  if (inventory === 0) return "out_of_stock";
  if (inventory <= threshold) return "low_stock";
  return "in_stock";
}

export default function InventoryPage() {
  const products = useDataStore((state) => state.products);
  const movements = useDataStore((state) => state.inventoryMovements);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();

  const [tab, setTab] = React.useState<Tab>("stock");
  const [threshold, setThreshold] = React.useState("20");
  const [adjusting, setAdjusting] = React.useState<Product | null>(null);
  const [adjustment, setAdjustment] = React.useState({ variantId: "", quantity: 0, reason: "Stock received", note: "" });
  const [adjustError, setAdjustError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const lowStockValue = Number(threshold) || 20;

  const lowStock = React.useMemo(
    () =>
      products
        .filter((p) => p.inventory > 0 && p.inventory <= lowStockValue)
        .map((p) => ({ ...p, status: statusFor(p.inventory, lowStockValue) })),
    [products, lowStockValue],
  );
  const outOfStock = React.useMemo(
    () =>
      products
        .filter((p) => p.inventory === 0)
        .map((p) => ({ ...p, status: "out_of_stock" as StockStatus })),
    [products],
  );
  const stockRows = React.useMemo<StockRow[]>(
    () => products.map((product) => ({ ...product, status: statusFor(product.inventory, lowStockValue) })),
    [products, lowStockValue],
  );

  const totals = React.useMemo(() => {
    const units = products.reduce((sum, product) => sum + product.inventory, 0);
    const value = products.reduce(
      (sum, product) => sum + product.inventory * product.costPrice,
      0,
    );
    return { units, value };
  }, [products]);

  const stockColumns = React.useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Product",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <ProductImage assetId={row.original.images[0]} alt={row.original.title} className="size-9 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{row.original.title}</p>
              <p className="truncate font-mono text-2xs text-ink-subtle">{row.original.sku}</p>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("inventory", {
        header: "On hand",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-ink">{row.original.inventory}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const status = STOCK_STATUS[getValue() as StockStatus];
          return <Badge tone={status.tone}>{status.label}</Badge>;
        },
      }),
      columnHelper.accessor("costPrice", {
        header: "Cost price",
        meta: { align: "right", hideBelow: "lg" },
        cell: ({ row }) => (
          <span className="tabular-nums text-ink-muted">{money(row.original.costPrice)}</span>
        ),
      }),
      columnHelper.display({
        id: "value",
        header: "Stock value",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="tabular-nums text-ink">
            {money(row.original.inventory * row.original.costPrice)}
          </span>
        ),
      }),
      columnHelper.display({
        id: "action",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setAdjusting(row.original);
              setAdjustment({
                variantId: row.original.variants[0]?.id ?? "",
                quantity: 0,
                reason: "Stock received",
                note: "",
              });
              setAdjustError(null);
            }}
          >
            Adjust
          </Button>
        ),
      }),
    ],
    [money],
  );

  const movementColumns = React.useMemo(
    () => [
      columnHelper.accessor("createdAt", {
        header: "Date",
        cell: ({ row }) => (
          <span className="text-ink-muted">
            {new Date(row.original.createdAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      }),
      columnHelper.accessor("productTitle", {
        header: "Product",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.original.productTitle}</p>
            <p className="truncate font-mono text-2xs text-ink-subtle">{row.original.sku}</p>
          </div>
        ),
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: ({ getValue }) => (
          <Badge
            tone={
              getValue() === "received"
                ? "success"
                : getValue() === "damaged"
                  ? "danger"
                  : getValue() === "returned"
                    ? "info"
                    : "neutral"
            }
          >
            {getValue().replace(/_/g, " ")}
          </Badge>
        ),
      }),
      columnHelper.accessor("quantity", {
        header: "Change",
        meta: { align: "right" },
        cell: ({ getValue }) => (
          <span
            className={`font-medium tabular-nums ${
              getValue() > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {getValue() > 0 ? "+" : ""}
            {getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("resultingStock", {
        header: "On hand after",
        meta: { align: "right" },
        cell: ({ getValue }) => <span className="tabular-nums text-ink">{getValue()}</span>,
      }),
      columnHelper.accessor("reason", {
        header: "Reason",
        meta: { hideBelow: "lg" },
        cell: ({ getValue }) => <span className="text-ink-muted">{getValue()}</span>,
      }),
      columnHelper.accessor("actor", {
        header: "By",
        meta: { hideBelow: "md" },
        cell: ({ getValue }) => <span className="text-ink-muted">{getValue()}</span>,
      }),
    ],
    [],
  );

  const submitAdjustment = async () => {
    if (!adjusting) return;
    if (!adjustment.quantity) {
      setAdjustError("Enter a non-zero quantity.");
      return;
    }
    setSaving(true);
    try {
      await productService.adjustInventory(
        adjusting.id,
        adjustment.variantId || null,
        adjustment.quantity,
        adjustment.reason,
        adjustment.note || undefined,
      );
      toast({
        variant: "success",
        title: "Inventory adjusted",
        description: `${adjustment.quantity > 0 ? "+" : ""}${adjustment.quantity} units for ${adjusting.title}.`,
      });
      setAdjusting(null);
    } catch (error) {
      setAdjustError(isMockApiError(error) ? error.message : "Could not adjust inventory.");
    } finally {
      setSaving(false);
    }
  };

  const rows: StockRow[] = tab === "low" ? lowStock : tab === "out" ? outOfStock : stockRows;

  return (
    <Page>
      <PageHeader
        title="Inventory"
        description="Live stock levels, adjustments and a full movement history. Adjustments update product stock immediately."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const first = products[0];
              if (!first) return;
              setAdjusting(first);
              setAdjustment({
                variantId: first.variants[0]?.id ?? "",
                quantity: 0,
                reason: "Stock received",
                note: "",
              });
              setAdjustError(null);
            }}
          >
            <Boxes className="size-4" aria-hidden />
            Adjust stock
          </Button>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          label="Units on hand"
          value={totals.units.toLocaleString("en-IN")}
          icon={Boxes}
          tone="brand"
          footnote={`${products.length} SKUs`}
        />
        <StatCard
          label="Stock value at cost"
          value={money(totals.value)}
          icon={ArrowUpRight}
          tone="emerald"
        />
        <StatCard
          label="Low stock"
          value={lowStock.length.toString()}
          icon={TriangleAlert}
          tone="amber"
          footnote={`Below ${lowStockValue} units`}
        />
        <StatCard
          label="Out of stock"
          value={outOfStock.length.toString()}
          icon={PackageX}
          tone="rose"
        />
      </StatGrid>

      <Card>
        <div className="border-b border-line px-4 pt-3">
          <Tabs
            value={tab}
            onChange={setTab}
            ariaLabel="Inventory views"
            items={[
              { value: "stock", label: "All stock" },
              { value: "low", label: "Low stock", badge: lowStock.length },
              { value: "out", label: "Out of stock", badge: outOfStock.length },
              { value: "movements", label: "Movement history", badge: movements.length },
            ]}
          />
        </div>

        {tab === "movements" ? (
          <DataTable
            data={movements}
            columns={movementColumns}
            getRowId={(row) => row.id}
            searchAccessor={(row) => `${row.productTitle} ${row.sku} ${row.reason} ${row.actor}`}
            searchPlaceholder="Search SKU, product or reason…"
            itemLabel="movements"
            onExport={(rowsToExport: InventoryMovement[]) => {
              downloadCsv(
                "inventory-movements.csv",
                rowsToExport.map((row) => ({
                  Date: row.createdAt,
                  Product: row.productTitle,
                  SKU: row.sku,
                  Type: row.type,
                  Quantity: row.quantity,
                  Reason: row.reason,
                  Note: row.note ?? "",
                  On_hand_after: row.resultingStock,
                  By: row.actor,
                })),
              );
              toast({ variant: "success", title: "Export ready" });
            }}
          />
        ) : (
          <DataTable
            data={rows}
            columns={stockColumns}
            getRowId={(row) => row.id}
            searchAccessor={(row) => `${row.title} ${row.sku} ${row.brand}`}
            searchPlaceholder="Search by SKU, title or brand…"
            itemLabel="products"
            toolbar={
              <FilterBar>
                <FilterSelect
                  label="low stock threshold"
                  value={threshold}
                  onChange={setThreshold}
                >
                  <option value="10">Threshold: 10</option>
                  <option value="20">Threshold: 20</option>
                  <option value="30">Threshold: 30</option>
                  <option value="50">Threshold: 50</option>
                </FilterSelect>
              </FilterBar>
            }
            onExport={(rowsToExport) => {
              downloadCsv(
                "inventory.csv",
                rowsToExport.map((row) => ({
                  Product: row.title,
                  SKU: row.sku,
                  On_hand: row.inventory,
                  Status: STOCK_STATUS[statusFor(row.inventory, lowStockValue)].label,
                  Cost_price: row.costPrice,
                  Stock_value: row.inventory * row.costPrice,
                })),
              );
              toast({ variant: "success", title: "Export ready" });
            }}
            emptyTitle={
              tab === "low" ? "Nothing is running low" : tab === "out" ? "Nothing is out of stock" : "No products found"
            }
            emptyDescription="Try a different search or adjust the threshold."
          />
        )}
      </Card>

      <Dialog
        open={Boolean(adjusting)}
        onClose={() => setAdjusting(null)}
        title="Adjust stock"
        description={adjusting ? `Update the on-hand quantity for ${adjusting.title}.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdjusting(null)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void submitAdjustment()} loading={saving}>
              Apply adjustment
            </Button>
          </>
        }
      >
        {adjusting ? (
          <div className="flex flex-col gap-4">
            {adjustError ? (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {adjustError}
              </p>
            ) : null}
            {adjusting.variants.length > 1 ? (
              <Field label="Variant" htmlFor="adjust-variant">
                <Select
                  id="adjust-variant"
                  value={adjustment.variantId}
                  onChange={(event) =>
                    setAdjustment({ ...adjustment, variantId: event.target.value })
                  }
                >
                  {adjusting.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.title} — {variant.inventory} on hand
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field
              label="Quantity change"
              required
              hint="Use a negative number to reduce stock."
              htmlFor="adjust-quantity"
            >
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setAdjustment({ ...adjustment, quantity: adjustment.quantity - 1 })
                  }
                  aria-label="Decrease by one"
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  id="adjust-quantity"
                  type="number"
                  value={adjustment.quantity}
                  onChange={(event) =>
                    setAdjustment({ ...adjustment, quantity: Number(event.target.value) })
                  }
                  className="w-28 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setAdjustment({ ...adjustment, quantity: adjustment.quantity + 1 })
                  }
                  aria-label="Increase by one"
                >
                  <ArrowUpRight className="size-4" />
                </Button>
              </div>
            </Field>
            <Field label="Reason" htmlFor="adjust-reason">
              <Select
                id="adjust-reason"
                value={adjustment.reason}
                onChange={(event) => setAdjustment({ ...adjustment, reason: event.target.value })}
              >
                <option>Stock received</option>
                <option>Manual stock correction</option>
                <option>Damaged in warehouse</option>
                <option>Customer return restocked</option>
                <option>Reserved for pending order</option>
              </Select>
            </Field>
            <Field label="Note" htmlFor="adjust-note">
              <Textarea
                id="adjust-note"
                rows={2}
                value={adjustment.note}
                onChange={(event) => setAdjustment({ ...adjustment, note: event.target.value })}
              />
            </Field>
            <div className="rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink-muted">
              <p className="flex items-center gap-1.5">
                <History className="size-3.5" aria-hidden />
                New on-hand quantity:{" "}
                <span className="font-semibold text-ink">
                  {Math.max(
                    0,
                    (adjusting.variants.find((v) => v.id === adjustment.variantId)?.inventory ??
                      adjusting.inventory) + adjustment.quantity,
                  )}
                </span>
              </p>
            </div>
          </div>
        ) : null}
      </Dialog>
    </Page>
  );
}
