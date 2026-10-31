"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download, MoreHorizontal, PackageCheck, Truck, XCircle } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { orderService, ORDER_STATUS_LABELS, ORDER_TRANSITIONS, PAYMENT_STATUS_LABELS, FULFILLMENT_STATUS_LABELS } from "@/lib/services/sales";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useDateTimeFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { DataTable, columnHelper, selectionColumn } from "@/components/data-table/data-table";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { useDateRangeStore, resolveRange } from "@/lib/store/date-range-store";
import { DropdownMenu, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";

const ORDER_TONE: Record<OrderStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

const PAYMENT_TONE: Record<PaymentStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
  pending: "warning",
  authorized: "info",
  paid: "success",
  partially_refunded: "warning",
  refunded: "neutral",
  failed: "danger",
};

export default function OrdersPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <OrdersPageContent />
    </React.Suspense>
  );
}

function OrdersPageContent() {
  const orders = useDataStore((state) => state.orders);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const dateTime = useDateTimeFormatter();
  const range = useDateRangeStore((state) => state.range);
  const searchParams = useSearchParams();

  const [paymentStatus, setPaymentStatus] = React.useState("all");
  const [fulfillment, setFulfillment] = React.useState("all");
  // The activity feed links to a pre-filtered list, so the status comes from
  // the URL as well as from the dropdown.
  const [status, setStatus] = React.useState(() => {
    const requested = searchParams.get("status");
    return requested && requested in ORDER_STATUS_LABELS ? requested : "all";
  });
  const [channel, setChannel] = React.useState("all");

  const filtered = React.useMemo(() => {
    const { start, end } = resolveRange(range);
    return orders.filter((order) => {
      const time = new Date(order.createdAt).getTime();
      if (time < start.getTime() || time > end.getTime()) return false;
      if (status !== "all" && order.status !== status) return false;
      if (paymentStatus !== "all" && order.paymentStatus !== paymentStatus) return false;
      if (fulfillment !== "all" && order.fulfillmentStatus !== fulfillment) return false;
      if (channel !== "all" && order.channel !== channel) return false;
      return true;
    });
  }, [orders, range, status, paymentStatus, fulfillment, channel]);

  const columns = React.useMemo(
    () => [
      selectionColumn<Order>({ getRowId: (row) => row.id }),
      columnHelper.accessor("orderNumber", {
        header: "Order",
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              href={`/dashboard/orders/${row.original.id}`}
              className="font-medium text-ink hover:underline"
            >
              {row.original.orderNumber}
            </Link>
            <p className="truncate text-2xs text-ink-subtle">
              {row.original.lineItems.length} item{row.original.lineItems.length === 1 ? "" : "s"}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("customerName", {
        header: "Customer",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-ink">{row.original.customerName}</p>
            <p className="truncate text-2xs text-ink-subtle">{row.original.customerEmail}</p>
          </div>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Date",
        meta: { hideBelow: "md" },
        cell: ({ row }) => (
          <span className="text-ink-muted">{dateTime(row.original.createdAt)}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const value = getValue() as OrderStatus;
          return <Badge tone={ORDER_TONE[value]}>{ORDER_STATUS_LABELS[value]}</Badge>;
        },
      }),
      columnHelper.accessor("paymentStatus", {
        header: "Payment",
        cell: ({ getValue }) => {
          const value = getValue() as PaymentStatus;
          return <Badge tone={PAYMENT_TONE[value]}>{PAYMENT_STATUS_LABELS[value]}</Badge>;
        },
      }),
      columnHelper.accessor("fulfillmentStatus", {
        header: "Fulfilment",
        meta: { hideBelow: "lg" },
        cell: ({ getValue }) => (
          <span className="text-ink-muted">
            {FULFILLMENT_STATUS_LABELS[getValue() as keyof typeof FULFILLMENT_STATUS_LABELS]}
          </span>
        ),
      }),
      columnHelper.accessor("total", {
        header: "Total",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-ink">
            {money(row.original.total, row.original.currency)}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <DropdownMenu
            triggerLabel={`Actions for ${row.original.orderNumber}`}
            trigger={
              <span className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
                <MoreHorizontal className="size-4" aria-hidden />
              </span>
            }
          >
            {ORDER_TRANSITIONS[row.original.status as OrderStatus].includes("confirmed") ? (
              <DropdownItem
                icon={<PackageCheck className="size-3.5" />}
                onClick={async () => {
                  try {
                    await orderService.updateStatus(row.original.id, "confirmed");
                    toast({ variant: "success", title: `${row.original.orderNumber} confirmed` });
                  } catch (error) {
                    toast({
                      variant: "error",
                      title: "Could not update order",
                      description: isMockApiError(error) ? error.message : undefined,
                    });
                  }
                }}
              >
                Confirm order
              </DropdownItem>
            ) : null}
            {ORDER_TRANSITIONS[row.original.status as OrderStatus].includes("shipped") ? (
              <DropdownItem
                icon={<Truck className="size-3.5" />}
                onClick={async () => {
                  try {
                    await orderService.updateStatus(row.original.id, "shipped");
                    toast({ variant: "success", title: `${row.original.orderNumber} marked as shipped` });
                  } catch (error) {
                    toast({
                      variant: "error",
                      title: "Could not update order",
                      description: isMockApiError(error) ? error.message : undefined,
                    });
                  }
                }}
              >
                Mark as shipped
              </DropdownItem>
            ) : null}
            {ORDER_TRANSITIONS[row.original.status as OrderStatus].includes("cancelled") ? (
              <>
                <DropdownSeparator />
                <DropdownItem
                  danger
                  icon={<XCircle className="size-3.5" />}
                  onClick={async () => {
                    try {
                      await orderService.updateStatus(row.original.id, "cancelled");
                      toast({ variant: "info", title: `${row.original.orderNumber} cancelled` });
                    } catch (error) {
                      toast({
                        variant: "error",
                        title: "Could not cancel",
                        description: isMockApiError(error) ? error.message : undefined,
                      });
                }
              }}
            >
              Cancel order
            </DropdownItem>
              </>
            ) : null}
          </DropdownMenu>
        ),
      }),
    ],
    [dateTime, money, toast],
  );

  const runBulk = async (action: string, ids: string[]) => {
    try {
      if (action === "confirm") {
        for (const id of ids) await orderService.updateStatus(id, "confirmed");
        toast({ variant: "success", title: `${ids.length} orders confirmed` });
      } else if (action === "ship") {
        for (const id of ids) await orderService.updateStatus(id, "shipped");
        toast({ variant: "success", title: `${ids.length} orders marked as shipped` });
      } else if (action === "export") {
        downloadCsv(
          "orders.csv",
          filtered
            .filter((order) => ids.includes(order.id))
            .map((order) => ({
              Order: order.orderNumber,
              Date: order.createdAt,
              Customer: order.customerName,
              Email: order.customerEmail,
              Status: order.status,
              Payment: order.paymentStatus,
              Fulfilment: order.fulfillmentStatus,
              Subtotal: order.subtotal,
              Discount: order.discountTotal,
              Tax: order.taxTotal,
              Shipping: order.shippingTotal,
              Total: order.total,
              Refunded: order.refundedTotal,
            })),
        );
        toast({ variant: "success", title: "Export ready" });
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
        title="Orders"
        description={`${filtered.length} of ${orders.length} orders in the selected range.`}
        actions={<DateRangePicker />}
      />

      <Card>
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) =>
            `${row.orderNumber} ${row.customerName} ${row.customerEmail} ${row.trackingNumber ?? ""}`
          }
          searchPlaceholder="Search order number, customer or tracking…"
          enableSelection
          onBulkAction={runBulk}
          onExport={(rows) => {
            downloadCsv(
              "orders.csv",
              rows.map((order) => ({
                Order: order.orderNumber,
                Date: order.createdAt,
                Customer: order.customerName,
                Email: order.customerEmail,
                Status: order.status,
                Payment: order.paymentStatus,
                Fulfilment: order.fulfillmentStatus,
                Subtotal: order.subtotal,
                Discount: order.discountTotal,
                Tax: order.taxTotal,
                Shipping: order.shippingTotal,
                Total: order.total,
                Refunded: order.refundedTotal,
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          exportLabel="Export CSV"
          itemLabel="orders"
          toolbar={
            <FilterBar>
              <FilterSelect
                label="order status"
                value={status}
                onChange={setStatus}
              >
                <option value="all">All statuses</option>
                {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="payment status"
                value={paymentStatus}
                onChange={setPaymentStatus}
              >
                <option value="all">All payments</option>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="fulfilment status"
                value={fulfillment}
                onChange={setFulfillment}
              >
                <option value="all">All fulfilment</option>
                {Object.entries(FULFILLMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="channel"
                value={channel}
                onChange={setChannel}
                options={[
                  { value: "all", label: "All channels" },
                  { value: "online_store", label: "Online store" },
                  { value: "mobile_app", label: "Mobile app" },
                  { value: "marketplace", label: "Marketplace" },
                  { value: "wholesale", label: "Wholesale" },
                  { value: "social", label: "Social" }
                ]}
              />
            </FilterBar>
          }
          bulkActions={[
            { label: "Confirm", value: "confirm", icon: <PackageCheck className="size-3.5" /> },
            { label: "Mark shipped", value: "ship", icon: <Truck className="size-3.5" /> },
            { label: "Export selection", value: "export", icon: <Download className="size-3.5" /> },
          ]}
          emptyTitle="No orders match these filters"
          emptyDescription="Widen the date range or clear the filters to see more orders."
        />
      </Card>
    </Page>
  );
}
