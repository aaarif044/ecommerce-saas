"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { returnService } from "@/lib/services/sales";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useDateTimeFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page, StatGrid } from "@/components/shell/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import { DataTable, columnHelper } from "@/components/data-table/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import type { ReturnRequest, ReturnStatus } from "@/lib/types";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";

const TONE: Record<ReturnStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
  requested: "warning",
  approved: "info",
  rejected: "danger",
  in_transit: "info",
  received: "info",
  refunded: "success",
  restocked: "success",
};

const NEXT_ACTIONS: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ["approved", "rejected"],
  approved: ["in_transit"],
  in_transit: ["received"],
  received: ["refunded", "restocked"],
  refunded: [],
  restocked: [],
  rejected: [],
};

export default function ReturnsPage() {
  const returns = useDataStore((state) => state.returns);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const dateTime = useDateTimeFormatter();

  const [status, setStatus] = React.useState("all");
  const [resolving, setResolving] = React.useState<ReturnRequest | null>(null);
  const [nextStatus, setNextStatus] = React.useState<ReturnStatus>("approved");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(
    () => returns.filter((item) => status === "all" || item.status === status),
    [returns, status],
  );

  const totals = React.useMemo(
    () => ({
      count: returns.length,
      open: returns.filter((item) => item.status === "requested" || item.status === "approved").length,
      refund: returns.reduce((sum, item) => sum + item.refundAmount, 0),
    }),
    [returns],
  );

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "Request",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-mono text-sm font-medium text-ink">{row.original.id}</p>
            <Link
              href={`/dashboard/orders/${row.original.orderId}`}
              className="truncate text-2xs text-ink-subtle hover:underline"
            >
              {row.original.orderNumber}
            </Link>
          </div>
        ),
      }),
      columnHelper.accessor("customerName", {
        header: "Customer",
        cell: ({ row }) => <span className="text-ink">{row.original.customerName}</span>,
      }),
      columnHelper.display({
        id: "items",
        header: "Items",
        cell: ({ row }) => (
          <span className="line-clamp-1 text-ink-muted">
            {row.original.items.map((item: { title: string; quantity: number }) => `${item.title} ×${item.quantity}`).join(", ")}
          </span>
        ),
      }),
      columnHelper.accessor("reason", {
        header: "Reason",
        meta: { hideBelow: "lg" },
        cell: ({ getValue }) => <span className="text-ink-muted">{getValue() as string}</span>,
      }),
      columnHelper.accessor("refundAmount", {
        header: "Refund",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-ink">
            {money(row.original.refundAmount)}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Requested",
        meta: { hideBelow: "md" },
        cell: ({ row }) => (
          <span className="text-ink-muted">{dateTime(row.original.createdAt)}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const value = getValue() as ReturnStatus;
          return <Badge tone={TONE[value]}>{value.replace(/_/g, " ")}</Badge>;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            disabled={NEXT_ACTIONS[row.original.status as ReturnStatus].length === 0}
            onClick={() => {
              setResolving(row.original);
              setNextStatus(NEXT_ACTIONS[row.original.status as ReturnStatus][0]);
              setNote(row.original.resolutionNote ?? "");
            }}
          >
            Resolve
          </Button>
        ),
      }),
    ],
    [dateTime, money],
  );

  return (
    <Page>
      <PageHeader
        title="Returns & refunds"
        description="Return requests linked to their original orders. Refunds are simulated."
      />

      <StatGrid columns={3}>
        <StatCard label="Total requests" value={totals.count.toString()} icon={RotateCcw} tone="brand" />
        <StatCard label="Awaiting action" value={totals.open.toString()} icon={RotateCcw} tone="amber" />
        <StatCard label="Refund value" value={money(totals.refund)} icon={RotateCcw} tone="emerald" />
      </StatGrid>

      <Card>
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) =>
            `${row.id} ${row.orderNumber} ${row.customerName} ${row.reason}`
          }
          searchPlaceholder="Search request, order or customer…"
          itemLabel="requests"
          toolbar={
            <FilterBar>
              <FilterSelect
                label="return status"
                value={status}
                onChange={setStatus}
              >
                <option value="all">All statuses</option>
                {Object.entries(TONE).map(([value]) => (
                  <option key={value} value={value}>
                    {value.replace(/_/g, " ")}
                  </option>
                ))}
              </FilterSelect>
            </FilterBar>
          }
          onExport={(rows) => {
            downloadCsv(
              "returns.csv",
              rows.map((row) => ({
                Request: row.id,
                Order: row.orderNumber,
                Customer: row.customerName,
                Items: row.items.map((item) => `${item.title} x${item.quantity}`).join("; "),
                Reason: row.reason,
                Status: row.status,
                Refund_amount: row.refundAmount,
                Created: row.createdAt,
                Updated: row.updatedAt,
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          emptyTitle="No return requests match this filter"
        />
      </Card>

      <Dialog
        open={Boolean(resolving)}
        onClose={() => setResolving(null)}
        title="Resolve return request"
        description="Move the request to the next stage and record what was decided."
        footer={
          <>
            <Button variant="ghost" onClick={() => setResolving(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={async () => {
                if (!resolving) return;
                setBusy(true);
                try {
                  await returnService.updateStatus(resolving.id, nextStatus, note || undefined);
                  toast({
                    variant: "success",
                    title: "Return updated",
                    description: `Moved to ${nextStatus.replace(/_/g, " ")}.`,
                  });
                  setResolving(null);
                } catch (error) {
                  toast({
                    variant: "error",
                    title: "Could not update return",
                    description: isMockApiError(error) ? error.message : undefined,
                  });
                } finally {
                  setBusy(false);
                }
              }}
            >
              Apply resolution
            </Button>
          </>
        }
      >
        {resolving ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink-muted">
              <p className="font-medium text-ink">
                {resolving.id} · {resolving.orderNumber}
              </p>
              <p className="mt-0.5">
                {resolving.items.map((item) => `${item.title} ×${item.quantity}`).join(", ")} —{" "}
                {money(resolving.refundAmount)}
              </p>
              <p className="mt-0.5">Reason: {resolving.reason}</p>
            </div>
            <Field label="Next status" htmlFor="return-status">
              <Select
                id="return-status"
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value as ReturnStatus)}
              >
                {NEXT_ACTIONS[resolving.status].map((value) => (
                  <option key={value} value={value}>
                    {value.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Resolution note" htmlFor="return-note">
              <Textarea
                id="return-note"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Explain the decision for the team record."
              />
            </Field>
          </div>
        ) : null}
      </Dialog>
    </Page>
  );
}
