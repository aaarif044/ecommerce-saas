"use client";

import * as React from "react";
import Link from "next/link";
import { Package, Truck } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { shipmentService } from "@/lib/services/sales";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useDateTimeFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { CardGrid, Page, StatGrid } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { DataTable, columnHelper } from "@/components/data-table/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import type { Shipment } from "@/lib/types";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";

const STATUS_TONE = {
  label_created: "neutral",
  in_transit: "info",
  out_for_delivery: "warning",
  delivered: "success",
  exception: "danger",
} as const;

export default function ShippingPage() {
  const shipments = useDataStore((state) => state.shipments);
  const zones = useDataStore((state) => state.shippingZones);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const dateTime = useDateTimeFormatter();

  const [status, setStatus] = React.useState("all");

  const filtered = React.useMemo(
    () => shipments.filter((shipment) => status === "all" || shipment.status === status),
    [shipments, status],
  );

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("trackingNumber", {
        header: "Tracking",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-mono text-sm font-medium text-ink">
              {row.original.trackingNumber}
            </p>
            <p className="truncate text-2xs text-ink-subtle">{row.original.carrier}</p>
          </div>
        ),
      }),
      columnHelper.accessor("orderNumber", {
        header: "Order",
        cell: ({ row }) => (
          <Link
            href={`/dashboard/orders/${row.original.orderId}`}
            className="font-medium text-ink hover:underline"
          >
            {row.original.orderNumber}
          </Link>
        ),
      }),
      columnHelper.accessor("methodName", {
        header: "Method",
        cell: ({ getValue }) => <span className="text-ink-muted">{getValue() as string}</span>,
      }),
      columnHelper.accessor("itemCount", {
        header: "Items",
        meta: { align: "right", hideBelow: "md" },
        cell: ({ getValue }) => (
          <span className="tabular-nums text-ink">{getValue() as number}</span>
        ),
      }),
      columnHelper.accessor("shippedAt", {
        header: "Shipped",
        meta: { hideBelow: "lg" },
        cell: ({ row }) => (
          <span className="text-ink-muted">
            {row.original.shippedAt ? dateTime(row.original.shippedAt) : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("estimatedDelivery", {
        header: "Est. delivery",
        cell: ({ row }) => (
          <span className="text-ink-muted">{dateTime(row.original.estimatedDelivery)}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => {
          const value = row.original.status as keyof typeof STATUS_TONE;
          return <Badge tone={STATUS_TONE[value]}>{value.replace(/_/g, " ")}</Badge>;
        },
      }),
      columnHelper.display({
        id: "action",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              // A delivered or exception shipment is terminal: "Advance" must
              // never move it back to "in transit".
              const next: Shipment["status"] | null =
                row.original.status === "label_created"
                  ? "in_transit"
                  : row.original.status === "in_transit"
                    ? "out_for_delivery"
                    : row.original.status === "out_for_delivery"
                      ? "delivered"
                      : null;
              if (!next) return;
              try {
                await shipmentService.updateStatus(row.original.id, next);
                toast({ variant: "success", title: "Shipment updated", description: next.replace(/_/g, " ") });
              } catch (error) {
                toast({
                  variant: "error",
                  title: "Could not update shipment",
                  description: isMockApiError(error) ? error.message : undefined,
                });
              }
            }}
          >
            Advance
          </Button>
        ),
      }),
    ],
    [dateTime, toast],
  );

  const inTransit = shipments.filter((s) => s.status === "in_transit" || s.status === "out_for_delivery").length;
  const delivered = shipments.filter((s) => s.status === "delivered").length;

  return (
    <Page>
      <PageHeader
        title="Shipping"
        description="Zones, rates, carriers and live shipment status."
      />

      <StatGrid columns={3}>
        <StatCard
          label="Shipments"
          value={shipments.length.toString()}
          icon={Truck}
          tone="brand"
        />
        <StatCard label="In transit" value={inTransit.toString()} icon={Package} tone="amber" />
        <StatCard label="Delivered" value={delivered.toString()} icon={Truck} tone="emerald" />
      </StatGrid>

      <Card>
        <CardHeader
          title="Shipping zones & methods"
          description="Rates apply to the storefront checkout."
        />
        <CardBody>
          <CardGrid columns={3}>
            {zones.map((zone) => (
              <div key={zone.id} className="rounded-xl border border-line p-4">
                <h3 className="text-sm font-semibold text-ink">{zone.name}</h3>
                <p className="mt-0.5 text-2xs text-ink-subtle">
                  {zone.countries.join(", ")}
                </p>
                <ul className="mt-3 space-y-2">
                  {zone.methods.map((method) => (
                    <li
                      key={method.id}
                      className="rounded-lg border border-line bg-surface-2 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-ink">{method.name}</p>
                        <p className="text-sm font-semibold tabular-nums text-ink">
                          {method.type === "free" ? "Free" : money(method.price)}
                        </p>
                      </div>
                      <p className="mt-0.5 text-2xs text-ink-subtle">
                        {method.carrier} · {method.estimateMinDays}–{method.estimateMaxDays} days
                        {method.freeThreshold ? ` · free over ${money(method.freeThreshold)}` : ""}
                        {method.minWeight !== null ? ` · ${method.minWeight}–${method.maxWeight} kg` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardGrid>
        </CardBody>
      </Card>

      <Card>
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) =>
            `${row.trackingNumber} ${row.orderNumber} ${row.carrier} ${row.methodName}`
          }
          searchPlaceholder="Search tracking, order or carrier…"
          itemLabel="shipments"
          toolbar={
            <FilterBar>
              <FilterSelect
                label="shipment status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "label_created", label: "Label created" },
                  { value: "in_transit", label: "In transit" },
                  { value: "out_for_delivery", label: "Out for delivery" },
                  { value: "delivered", label: "Delivered" },
                  { value: "exception", label: "Exception" }
                ]}
              />
            </FilterBar>
          }
          onExport={(rows) => {
            downloadCsv(
              "shipments.csv",
              rows.map((row) => ({
                Tracking: row.trackingNumber,
                Order: row.orderNumber,
                Carrier: row.carrier,
                Method: row.methodName,
                Items: row.itemCount,
                Status: row.status,
                Shipped_at: row.shippedAt ?? "",
                Estimated_delivery: row.estimatedDelivery,
                Delivered_at: row.deliveredAt ?? "",
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          emptyTitle="No shipments match this filter"
        />
      </Card>
    </Page>
  );
}
