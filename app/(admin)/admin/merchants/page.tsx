"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, ShieldAlert, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { merchantService } from "@/lib/services/platform";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useDateFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { DataTable, columnHelper, selectionColumn } from "@/components/data-table/data-table";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/dialog";
import { DropdownMenu, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import type { Merchant } from "@/lib/types";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";

const STATUS_TONE = {
  active: "success",
  trial: "info",
  past_due: "warning",
  suspended: "danger",
} as const;

export default function AdminMerchantsPage() {
  const merchants = useDataStore((state) => state.merchants);
  const plans = useDataStore((state) => state.plans);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const date = useDateFormatter();

  const [status, setStatus] = React.useState("all");
  const [plan, setPlan] = React.useState("all");
  const [suspend, setSuspend] = React.useState<Merchant | null>(null);
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();

  const filtered = React.useMemo(
    () =>
      merchants.filter((merchant) => {
        if (status !== "all" && merchant.status !== status) return false;
        if (plan !== "all" && merchant.planId !== plan) return false;
        return true;
      }),
    [merchants, status, plan],
  );

  const columns = React.useMemo(
    () => [
      selectionColumn<Merchant>({ getRowId: (row) => row.id }),
      columnHelper.accessor("businessName", {
        header: "Merchant",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.original.businessName} size="sm" />
            <div className="min-w-0">
              <Link
                href={`/admin/merchants/${row.original.id}`}
                className="block truncate font-medium text-ink hover:underline"
              >
                {row.original.businessName}
              </Link>
              <p className="truncate text-2xs text-ink-subtle">{row.original.ownerName}</p>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("storeSlug", {
        header: "Store",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-ink-muted">
            {row.original.storeSlug}.example
          </span>
        ),
      }),
      columnHelper.accessor("country", {
        header: "Country",
        cell: ({ getValue }) => <span className="text-ink-muted">{getValue() as string}</span>,
      }),
      columnHelper.accessor("planName", {
        header: "Plan",
        cell: ({ getValue }) => <Badge tone="neutral">{getValue() as string}</Badge>,
      }),
      columnHelper.accessor("gmv", {
        header: "GMV",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-ink">{money(row.original.gmv)}</span>
        ),
      }),
      columnHelper.accessor("orderCount", {
        header: "Orders",
        meta: { align: "right" },
        cell: ({ getValue }) => (
          <span className="tabular-nums text-ink">{(getValue() as number).toLocaleString("en-IN")}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => {
          const value = row.original.status as Merchant["status"];
          return <Badge tone={STATUS_TONE[value]}>{value.replace(/_/g, " ")}</Badge>;
        },
      }),
      columnHelper.accessor("lastActiveAt", {
        header: "Last active",
        meta: { hideBelow: "lg" },
        cell: ({ row }) => <span className="text-ink-muted">{date(row.original.lastActiveAt)}</span>,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <DropdownMenu
            triggerLabel={`Actions for ${row.original.businessName}`}
            trigger={
              <span className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
                <MoreHorizontal className="size-4" aria-hidden />
              </span>
            }
          >
            <DropdownItem
              icon={<Store className="size-3.5" />}
              onClick={() => router.push(`/admin/merchants/${row.original.id}`)}
            >
              View merchant
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              icon={<ShieldAlert className="size-3.5" />}
              onClick={() => setSuspend(row.original)}
            >
              {row.original.status === "suspended" ? "Restore merchant" : "Suspend merchant"}
            </DropdownItem>
          </DropdownMenu>
        ),
      }),
    ],
    [date, money, router],
  );

  return (
    <Page>
      <PageHeader
        eyebrow="Platform administration"
        title="Merchants"
        description={`${merchants.length} stores on the platform. Suspension is a local preview only.`}
      />

      <Card>
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) =>
            `${row.businessName} ${row.ownerName} ${row.email} ${row.storeName} ${row.storeSlug}`
          }
          searchPlaceholder="Search merchant, owner or store…"
          enableSelection
          itemLabel="merchants"
          toolbar={
            <FilterBar>
              <FilterSelect
                label="status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "active", label: "Active" },
                  { value: "trial", label: "Trial" },
                  { value: "past_due", label: "Past due" },
                  { value: "suspended", label: "Suspended" }
                ]}
              />
              <FilterSelect
                label="plan"
                value={plan}
                onChange={setPlan}
              >
                <option value="all">All plans</option>
                {plans.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </FilterSelect>
            </FilterBar>
          }
          onExport={(rows) => {
            downloadCsv(
              "merchants.csv",
              rows.map((row) => ({
                Business: row.businessName,
                Owner: row.ownerName,
                Email: row.email,
                Store: row.storeName,
                Slug: row.storeSlug,
                Country: row.country,
                Plan: row.planName,
                Status: row.status,
                GMV: row.gmv,
                Orders: row.orderCount,
                Products: row.productCount,
                Created: row.createdAt,
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          emptyTitle="No merchants match these filters"
        />
      </Card>

      <ConfirmDialog
        open={Boolean(suspend)}
        onClose={() => setSuspend(null)}
        destructive={suspend?.status !== "suspended"}
        title={
          suspend?.status === "suspended"
            ? `Restore ${suspend.businessName}?`
            : `Suspend ${suspend?.businessName ?? "merchant"}?`
        }
        description="This is a preview of the platform action. The merchant store is not actually affected."
        confirmLabel={suspend?.status === "suspended" ? "Restore merchant" : "Suspend merchant"}
        loading={busy}
        onConfirm={async () => {
          if (!suspend) return;
          setBusy(true);
          try {
            await merchantService.updateStatus(
              suspend.id,
              suspend.status === "suspended" ? "active" : "suspended",
            );
            toast({
              variant: suspend.status === "suspended" ? "success" : "warning",
              title:
                suspend.status === "suspended" ? "Merchant restored" : "Merchant suspended (preview)",
            });
            setSuspend(null);
          } catch (error) {
            toast({
              variant: "error",
              title: "Could not update the merchant",
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
