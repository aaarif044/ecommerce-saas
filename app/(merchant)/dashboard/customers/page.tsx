"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Tag, UserRound } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { customerService } from "@/lib/services/sales";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useDateFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page, StatGrid } from "@/components/shell/page";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { DataTable, columnHelper } from "@/components/data-table/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { DropdownMenu, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import { IndianRupee, Receipt, Users } from "lucide-react";
import type { Customer } from "@/lib/types";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";

const SEGMENT_TONE = {
  vip: "brand",
  loyal: "success",
  new: "info",
  at_risk: "warning",
  dormant: "neutral",
  wholesale: "outline",
} as const;

export default function CustomersPage() {
  const customers = useDataStore((state) => state.customers);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const date = useDateFormatter();

  const [segment, setSegment] = React.useState("all");
  const [tag, setTag] = React.useState("all");

  const allTags = React.useMemo(
    () => Array.from(new Set(customers.flatMap((customer) => customer.tags))).sort(),
    [customers],
  );

  const filtered = React.useMemo(
    () =>
      customers.filter((customer) => {
        if (segment !== "all" && customer.segment !== segment) return false;
        if (tag !== "all" && !customer.tags.includes(tag)) return false;
        return true;
      }),
    [customers, segment, tag],
  );

  const totals = React.useMemo(() => {
    const spend = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const orders = customers.reduce((sum, customer) => sum + customer.orderCount, 0);
    return {
      spend,
      orders,
      average: customers.length ? spend / customers.length : 0,
    };
  }, [customers]);

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Customer",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.original.name} size="sm" />
            <div className="min-w-0">
              <Link
                href={`/dashboard/customers/${row.original.id}`}
                className="block truncate font-medium text-ink hover:underline"
              >
                {row.original.name}
              </Link>
              <p className="truncate text-2xs text-ink-subtle">{row.original.email}</p>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("segment", {
        header: "Segment",
        cell: ({ getValue }) => {
          const value = getValue() as Customer["segment"];
          return <Badge tone={SEGMENT_TONE[value]}>{value.replace(/_/g, " ")}</Badge>;
        },
      }),
      columnHelper.accessor("tags", {
        header: "Tags",
        meta: { hideBelow: "lg" },
        cell: ({ row }) => (
          <span className="flex flex-wrap gap-1">
            {row.original.tags.slice(0, 2).map((item: string) => (
              <Badge key={item} tone="outline" size="sm">
                {item}
              </Badge>
            ))}
            {row.original.tags.length > 2 ? (
              <span className="text-2xs text-ink-subtle">+{row.original.tags.length - 2}</span>
            ) : null}
          </span>
        ),
      }),
      columnHelper.accessor("orderCount", {
        header: "Orders",
        meta: { align: "right" },
        cell: ({ getValue }) => <span className="tabular-nums text-ink">{getValue() as number}</span>,
      }),
      columnHelper.accessor("totalSpent", {
        header: "Total spent",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-ink">
            {money(row.original.totalSpent)}
          </span>
        ),
      }),
      columnHelper.accessor("averageOrderValue", {
        header: "AOV",
        meta: { align: "right", hideBelow: "lg" },
        cell: ({ row }) => (
          <span className="tabular-nums text-ink-muted">{money(row.original.averageOrderValue)}</span>
        ),
      }),
      columnHelper.accessor("lastOrderAt", {
        header: "Last order",
        meta: { hideBelow: "md" },
        cell: ({ row }) => (
          <span className="text-ink-muted">
            {row.original.lastOrderAt ? date(row.original.lastOrderAt) : "Never"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <DropdownMenu
            triggerLabel={`Actions for ${row.original.name}`}
            trigger={
              <span className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
                <MoreHorizontal className="size-4" aria-hidden />
              </span>
            }
          >
            <DropdownItem
              icon={<Tag className="size-3.5" />}
              onClick={async () => {
                const next = row.original.tags.includes("vip")
                  ? row.original.tags.filter((item: string) => item !== "vip")
                  : [...row.original.tags, "vip"];
                await customerService.update(row.original.id, { tags: next });
                toast({ variant: "success", title: "Customer updated" });
              }}
            >
              {row.original.tags.includes("vip") ? "Remove VIP tag" : "Tag as VIP"}
            </DropdownItem>
            <DropdownItem
              icon={<UserRound className="size-3.5" />}
              onClick={async () => {
                await customerService.update(row.original.id, {
                  marketingConsent: !row.original.marketingConsent,
                });
                toast({
                  variant: "info",
                  title: row.original.marketingConsent
                    ? "Marketing consent revoked"
                    : "Marketing consent granted",
                });
              }}
            >
              {row.original.marketingConsent ? "Revoke marketing consent" : "Grant marketing consent"}
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              danger
              icon={<UserRound className="size-3.5" />}
              onClick={async () => {
                try {
                  await customerService.update(row.original.id, {
                    status: row.original.status === "blocked" ? "active" : "blocked",
                  });
                  toast({ variant: "success", title: "Customer status updated" });
                } catch (error) {
                  toast({
                    variant: "error",
                    title: "Could not update",
                    description: isMockApiError(error) ? error.message : undefined,
                  });
                }
              }}
            >
              {row.original.status === "blocked" ? "Unblock customer" : "Block customer"}
            </DropdownItem>
          </DropdownMenu>
        ),
      }),
    ],
    [date, money, toast],
  );

  return (
    <Page>
      <PageHeader
        title="Customers"
        description={`${customers.length} customer records. All names and addresses are fictional.`}
      />

      <StatGrid columns={3}>
        <StatCard
          label="Total customers"
          value={customers.length.toLocaleString("en-IN")}
          icon={Users}
          tone="brand"
        />
        <StatCard
          label="Lifetime spend"
          value={money(totals.spend)}
          icon={IndianRupee}
          tone="emerald"
        />
        <StatCard
          label="Average lifetime value"
          value={money(totals.average)}
          icon={Receipt}
          tone="sky"
          footnote={`${totals.orders.toLocaleString("en-IN")} orders recorded`}
        />
      </StatGrid>

      <Card>
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) => `${row.name} ${row.email} ${row.phone} ${row.tags.join(" ")}`}
          searchPlaceholder="Search name, email or tag…"
          itemLabel="customers"
          onExport={(rows) => {
            downloadCsv(
              "customers.csv",
              rows.map((row) => ({
                Name: row.name,
                Email: row.email,
                Phone: row.phone,
                Segment: row.segment,
                Tags: row.tags.join("; "),
                Orders: row.orderCount,
                Total_spent: row.totalSpent,
                AOV: row.averageOrderValue,
                Last_order: row.lastOrderAt ?? "",
                Created: row.createdAt,
                Marketing_consent: row.marketingConsent ? "yes" : "no",
                Status: row.status,
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          toolbar={
            <FilterBar>
              <FilterSelect
                label="segment"
                value={segment}
                onChange={setSegment}
                options={[
                  { value: "all", label: "All segments" },
                  { value: "vip", label: "VIP" },
                  { value: "loyal", label: "Loyal" },
                  { value: "new", label: "New" },
                  { value: "at_risk", label: "At risk" },
                  { value: "dormant", label: "Dormant" },
                  { value: "wholesale", label: "Wholesale" }
                ]}
              />
              <FilterSelect
                label="tag"
                value={tag}
                onChange={setTag}
              >
                <option value="all">All tags</option>
                {allTags.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </FilterSelect>
            </FilterBar>
          }
          emptyTitle="No customers match these filters"
        />
      </Card>
    </Page>
  );
}
