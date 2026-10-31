"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { discountService } from "@/lib/services/sales";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { ANCHOR } from "@/lib/data/catalog";
import { useMoney, useDateFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { FormFull, FormGrid } from "@/components/ui/form";
import { DataTable, columnHelper, selectionColumn } from "@/components/data-table/data-table";
import { DropdownMenu, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import type { Discount } from "@/lib/types";

interface DiscountForm {
  code: string;
  title: string;
  type: Discount["type"];
  value: number;
  minimumPurchase: number;
  usageLimit: number | null;
  perCustomerLimit: number;
  eligibility: Discount["eligibility"];
  productScope: "all" | "specific";
  productIds: string[];
  startsAt: string;
  expiresAt: string;
  active: boolean;
  appliesToShipping: boolean;
}

const EMPTY: DiscountForm = {
  code: "",
  title: "",
  type: "percentage",
  value: 10,
  minimumPurchase: 0,
  usageLimit: null,
  perCustomerLimit: 1,
  eligibility: "all",
  productScope: "all",
  productIds: [],
  startsAt: ANCHOR.toISOString(),
  expiresAt: new Date(ANCHOR.getTime() + 30 * 86400000).toISOString(),
  active: true,
  appliesToShipping: false,
};

export default function DiscountsPage() {
  const discounts = useDataStore((state) => state.discounts);
  const products = useDataStore((state) => state.products);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const date = useDateFormatter();

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Discount | null>(null);
  const [form, setForm] = React.useState<DiscountForm>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<Discount | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setError(null);
    setOpen(true);
  };

  const openEdit = React.useCallback(
    (discount: Discount) => {
      setEditing(discount);
      setForm({
        code: discount.code,
        title: discount.title,
        type: discount.type,
        value: discount.value,
        minimumPurchase: discount.minimumPurchase,
        usageLimit: discount.usageLimit,
        perCustomerLimit: discount.perCustomerLimit,
        eligibility: discount.eligibility,
        productScope: discount.productScope,
        productIds: discount.productIds,
        startsAt: discount.startsAt.slice(0, 10),
        expiresAt: discount.expiresAt.slice(0, 10),
        active: discount.active,
        appliesToShipping: discount.appliesToShipping,
      });
      setError(null);
      setOpen(true);
    },
    [],
  );

  const save = async () => {
    if (!form.code.trim()) {
      setError("Coupon code is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        title: form.title.trim() || form.code.trim().toUpperCase(),
        type: form.type,
        value: form.value,
        minimumPurchase: form.minimumPurchase,
        usageLimit: form.usageLimit,
        perCustomerLimit: form.perCustomerLimit,
        eligibility: form.eligibility,
        productScope: form.productScope,
        productIds: form.productIds,
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: new Date(`${form.expiresAt}T23:59:59`).toISOString(),
        active: form.active,
        appliesToShipping: form.appliesToShipping,
      };
      if (editing) {
        await discountService.update(editing.id, payload);
        toast({ variant: "success", title: "Discount updated" });
      } else {
        await discountService.create(payload);
        toast({ variant: "success", title: "Discount created", description: payload.code });
      }
      setOpen(false);
    } catch (err) {
      setError(isMockApiError(err) ? err.message : "Could not save the discount.");
    } finally {
      setSaving(false);
    }
  };

  const columns = React.useMemo(
    () => [
      selectionColumn<Discount>({ getRowId: (row) => row.id }),
      columnHelper.accessor("code", {
        header: "Code",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-ink">{row.original.code}</p>
            <p className="truncate text-2xs text-ink-subtle">{row.original.title}</p>
          </div>
        ),
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: ({ row }) => (
          <Badge tone="brand">
            {row.original.type === "percentage"
              ? `${row.original.value}% off`
              : row.original.type === "fixed_amount"
                ? `${money(row.original.value)} off`
                : "Free shipping"}
          </Badge>
        ),
      }),
      columnHelper.accessor("eligibility", {
        header: "Eligibility",
        meta: { hideBelow: "lg" },
        cell: ({ getValue }) => (
          <span className="text-ink-muted">{(getValue() as string).replace(/_/g, " ")}</span>
        ),
      }),
      columnHelper.accessor("minimumPurchase", {
        header: "Min. spend",
        meta: { align: "right", hideBelow: "md" },
        cell: ({ row }) => (
          <span className="tabular-nums text-ink-muted">
            {row.original.minimumPurchase ? money(row.original.minimumPurchase) : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("usedCount", {
        header: "Used",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="tabular-nums text-ink">
            {row.original.usedCount}
            {row.original.usageLimit ? ` / ${row.original.usageLimit}` : ""}
          </span>
        ),
      }),
      columnHelper.accessor("expiresAt", {
        header: "Expires",
        meta: { hideBelow: "md" },
        cell: ({ row }) => (
          <span className="text-ink-muted">{date(row.original.expiresAt)}</span>
        ),
      }),
      columnHelper.accessor("active", {
        header: "Status",
        cell: ({ getValue }) => (
          <Badge tone={getValue() ? "success" : "neutral"}>
            {(getValue() as boolean) ? "Active" : "Inactive"}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <DropdownMenu
            triggerLabel={`Actions for ${row.original.code}`}
            trigger={
              <span className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
                <MoreHorizontal className="size-4" aria-hidden />
              </span>
            }
          >
            <DropdownItem icon={<Pencil className="size-3.5" />} onClick={() => openEdit(row.original)}>
              Edit discount
            </DropdownItem>
            <DropdownItem
              icon={<Plus className="size-3.5" />}
              onClick={async () => {
                await discountService.update(row.original.id, { active: !row.original.active });
                toast({
                  variant: "info",
                  title: row.original.active ? "Discount paused" : "Discount activated",
                });
              }}
            >
              {row.original.active ? "Deactivate" : "Activate"}
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              danger
              icon={<Trash2 className="size-3.5" />}
              onClick={() => setPendingDelete(row.original)}
            >
              Delete discount
            </DropdownItem>
          </DropdownMenu>
        ),
      }),
    ],
    [date, money, openEdit, toast],
  );

  return (
    <Page>
      <PageHeader
        title="Discounts"
        description="Coupon codes with eligibility, limits and product restrictions."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            New discount
          </Button>
        }
      />

      <Card>
        <DataTable
          data={discounts}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) => `${row.code} ${row.title}`}
          searchPlaceholder="Search coupon codes…"
          enableSelection
          itemLabel="discounts"
          onExport={(rows) => {
            downloadCsv(
              "discounts.csv",
              rows.map((row) => ({
                Code: row.code,
                Title: row.title,
                Type: row.type,
                Value: row.value,
                Minimum_purchase: row.minimumPurchase,
                Usage_limit: row.usageLimit ?? "",
                Used: row.usedCount,
                Eligibility: row.eligibility,
                Product_scope: row.productScope,
                Starts: row.startsAt,
                Expires: row.expiresAt,
                Active: row.active ? "yes" : "no",
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          emptyTitle="No discounts yet"
          emptyDescription="Create a coupon to run a promotion."
          emptyAction={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" aria-hidden />
              New discount
            </Button>
          }
        />
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={editing ? "Edit discount" : "New discount"}
        description="Codes can be applied in the storefront checkout."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void save()} loading={saving}>
              {editing ? "Save changes" : "Create discount"}
            </Button>
          </>
        }
      >
        <FormGrid>
          {error ? (
            <FormFull>
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            </FormFull>
          ) : null}
          <Field label="Coupon code" required htmlFor="discount-code">
            <Input
              id="discount-code"
              value={form.code}
              onChange={(event) =>
                setForm({ ...form, code: event.target.value.toUpperCase() })
              }
              className="font-mono uppercase"
              placeholder="SUMMER20"
            />
          </Field>
          <Field label="Internal title" htmlFor="discount-title">
            <Input
              id="discount-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Summer sale 20%"
            />
          </Field>
          <Field label="Discount type" htmlFor="discount-type">
            <Select
              id="discount-type"
              value={form.type}
              onChange={(event) =>
                setForm({ ...form, type: event.target.value as Discount["type"] })
              }
            >
              <option value="percentage">Percentage off</option>
              <option value="fixed_amount">Fixed amount off</option>
              <option value="free_shipping">Free shipping</option>
            </Select>
          </Field>
          <Field
            label="Value"
            hint={form.type === "percentage" ? "Percentage between 1 and 100." : "Amount in store currency."}
            htmlFor="discount-value"
          >
            <Input
              id="discount-value"
              type="number"
              min={0}
              value={form.value}
              onChange={(event) => setForm({ ...form, value: Number(event.target.value) })}
              disabled={form.type === "free_shipping"}
            />
          </Field>
          <Field label="Minimum purchase" htmlFor="discount-min">
            <Input
              id="discount-min"
              type="number"
              min={0}
              value={form.minimumPurchase}
              onChange={(event) =>
                setForm({ ...form, minimumPurchase: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Total usage limit" hint="Leave empty for unlimited." htmlFor="discount-limit">
            <Input
              id="discount-limit"
              type="number"
              min={0}
              value={form.usageLimit ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  usageLimit: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
          </Field>
          <Field label="Per-customer limit" htmlFor="discount-per-customer">
            <Input
              id="discount-per-customer"
              type="number"
              min={1}
              value={form.perCustomerLimit}
              onChange={(event) =>
                setForm({ ...form, perCustomerLimit: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Customer eligibility" htmlFor="discount-eligibility">
            <Select
              id="discount-eligibility"
              value={form.eligibility}
              onChange={(event) =>
                setForm({ ...form, eligibility: event.target.value as Discount["eligibility"] })
              }
            >
              <option value="all">All customers</option>
              <option value="new">New customers</option>
              <option value="returning">Returning customers</option>
              <option value="vip">VIP customers</option>
            </Select>
          </Field>
          <Field label="Starts" htmlFor="discount-starts">
            <Input
              id="discount-starts"
              type="date"
              value={form.startsAt.slice(0, 10)}
              onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
            />
          </Field>
          <Field label="Expires" htmlFor="discount-expires">
            <Input
              id="discount-expires"
              type="date"
              value={form.expiresAt.slice(0, 10)}
              onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
            />
          </Field>
          <FormFull>
            <Field label="Product scope" htmlFor="discount-scope">
              <Select
                id="discount-scope"
                value={form.productScope}
                onChange={(event) =>
                  setForm({ ...form, productScope: event.target.value as Discount["productScope"] })
                }
              >
                <option value="all">Applies to all products</option>
                <option value="specific">Specific products only</option>
              </Select>
            </Field>
          </FormFull>
          {form.productScope === "specific" ? (
            <FormFull>
              <Field label="Restricted products">
                <select
                  multiple
                  value={form.productIds}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      productIds: Array.from(event.target.selectedOptions).map((option) => option.value),
                    })
                  }
                  className="scrollbar-thin h-32 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </Field>
            </FormFull>
          ) : null}
          <FormFull>
            <div className="flex flex-col gap-3">
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
                label="Active"
                description="Inactive codes are not accepted at checkout."
              />
              <Switch
                checked={form.appliesToShipping}
                onCheckedChange={(checked) => setForm({ ...form, appliesToShipping: checked })}
                label="Also applies to shipping"
                description="Discounts the shipping charge as well."
              />
            </div>
          </FormFull>
        </FormGrid>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        destructive
        title={`Delete "${pendingDelete?.code}"?`}
        description="The coupon is removed and can no longer be applied at checkout."
        confirmLabel="Delete discount"
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await discountService.remove(pendingDelete.id);
            toast({ variant: "success", title: "Discount deleted" });
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
