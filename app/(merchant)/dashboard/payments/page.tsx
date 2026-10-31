"use client";

import * as React from "react";
import Link from "next/link";
import { CreditCard, Eye, Info, RotateCcw } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { paymentService } from "@/lib/services/sales";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useDateTimeFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page, StatGrid } from "@/components/shell/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { Dialog } from "@/components/ui/dialog";
import { DataTable, columnHelper } from "@/components/data-table/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { IndianRupee, Wallet } from "lucide-react";
import type { Payment, PaymentStatus } from "@/lib/types";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";

const TONE: Record<PaymentStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
  pending: "warning",
  authorized: "info",
  paid: "success",
  failed: "danger",
  refunded: "neutral",
  partially_refunded: "warning",
};

const METHOD_LABEL: Record<Payment["method"], string> = {
  cod: "Cash on delivery",
  manual: "Manual payment",
  online_simulated: "Simulated online",
};

export default function PaymentsPage() {
  const payments = useDataStore((state) => state.payments);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const dateTime = useDateTimeFormatter();

  const [status, setStatus] = React.useState("all");
  const [method, setMethod] = React.useState("all");
  const [refunding, setRefunding] = React.useState<Payment | null>(null);
  const [preview, setPreview] = React.useState<Payment | null>(null);
  const [refund, setRefund] = React.useState({ amount: 0, reason: "Customer request" });
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(
    () =>
      payments.filter((payment) => {
        if (status !== "all" && payment.status !== status) return false;
        if (method !== "all" && payment.method !== method) return false;
        return true;
      }),
    [payments, status, method],
  );

  const totals = React.useMemo(
    () => ({
      captured: payments
        .filter((payment) => payment.status === "paid" || payment.status === "partially_refunded")
        .reduce((sum, payment) => sum + payment.amount, 0),
      refunded: payments.reduce(
        (sum: number, payment: Payment) =>
          sum +
          payment.refunds.reduce(
            (sum2: number, refund: { amount: number }) => sum2 + refund.amount,
            0,
          ),
        0,
      ),
      pending: payments
        .filter((payment) => payment.status === "pending")
        .reduce((sum, payment) => sum + payment.amount, 0),
    }),
    [payments],
  );

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("reference", {
        header: "Transaction",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-mono text-sm font-medium text-ink">{row.original.reference}</p>
            <p className="truncate text-2xs text-ink-subtle">{row.original.gateway}</p>
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
      columnHelper.accessor("customerName", {
        header: "Customer",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-ink">{row.original.customerName}</p>
            <p className="truncate text-2xs text-ink-subtle">{row.original.customerEmail}</p>
          </div>
        ),
      }),
      columnHelper.accessor("method", {
        header: "Method",
        cell: ({ row }) => (
          <Badge tone="neutral">
            {METHOD_LABEL[row.original.method as Payment["method"]]}
            {row.original.cardLast4 ? ` ••${row.original.cardLast4}` : ""}
          </Badge>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const value = getValue() as PaymentStatus;
          return <Badge tone={TONE[value]}>{value.replace(/_/g, " ")}</Badge>;
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "Date",
        meta: { hideBelow: "md" },
        cell: ({ row }) => (
          <span className="text-ink-muted">{dateTime(row.original.createdAt)}</span>
        ),
      }),
      columnHelper.accessor("amount", {
        header: "Amount",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-ink">
            {money(row.original.amount, row.original.currency)}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreview(row.original)}
            >
              <Eye className="size-3.5" aria-hidden />
              Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const refunded = row.original.refunds.reduce(
                  (sum: number, item: { amount: number }) => sum + item.amount,
                  0,
                );
                setRefunding(row.original);
                setRefund({
                  amount: Math.max(0, row.original.amount - refunded),
                  reason: "Customer request",
                });
              }}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Refund
            </Button>
          </div>
        ),
      }),
    ],
    [dateTime, money],
  );

  return (
    <Page>
      <PageHeader
        title="Payments"
        description="Every transaction in the demo ledger. All payments are simulated — no card details are ever collected."
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="flex items-center gap-2 font-medium">
          <Info className="size-4 shrink-0" aria-hidden />
          Simulated payment environment
        </p>
        <p className="mt-1 leading-5">
          Cash on delivery, manual transfers and the simulated online gateway are for demonstration
          only. The demo never asks for real card numbers.
        </p>
      </div>

      <StatGrid columns={3}>
        <StatCard
          label="Captured"
          value={money(totals.captured)}
          icon={IndianRupee}
          tone="emerald"
        />
        <StatCard label="Refunded" value={money(totals.refunded)} icon={RotateCcw} tone="amber" />
        <StatCard label="Pending" value={money(totals.pending)} icon={Wallet} tone="sky" />
      </StatGrid>

      <Card>
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) =>
            `${row.reference} ${row.orderNumber} ${row.customerName} ${row.customerEmail} ${row.gateway}`
          }
          searchPlaceholder="Search reference, order or customer…"
          itemLabel="transactions"
          toolbar={
            <FilterBar>
              <FilterSelect
                label="payment status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "paid", label: "Paid" },
                  { value: "pending", label: "Pending" },
                  { value: "partially_refunded", label: "Partially refunded" },
                  { value: "refunded", label: "Refunded" },
                  { value: "failed", label: "Failed" }
                ]}
              />
              <FilterSelect
                label="payment method"
                value={method}
                onChange={setMethod}
                options={[
                  { value: "all", label: "All methods" },
                  { value: "cod", label: "Cash on delivery" },
                  { value: "manual", label: "Manual payment" },
                  { value: "online_simulated", label: "Simulated online" }
                ]}
              />
            </FilterBar>
          }
          onExport={(rows) => {
            downloadCsv(
              "payments.csv",
              rows.map((row) => ({
                Reference: row.reference,
                Order: row.orderNumber,
                Customer: row.customerName,
                Email: row.customerEmail,
                Amount: row.amount,
                Currency: row.currency,
                Status: row.status,
                Method: row.method,
                Gateway: row.gateway,
                Created: row.createdAt,
                Refunded: row.refunds.reduce((sum, item) => sum + item.amount, 0),
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          emptyTitle="No payments match these filters"
        />
      </Card>

      <Sheet
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Payment details"
        description="Simulated transaction record."
        footer={
          <Button variant="primary" onClick={() => setPreview(null)}>
            Close
          </Button>
        }
      >
        {preview ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-line bg-surface-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                Amount
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
                {money(preview.amount, preview.currency)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={TONE[preview.status]}>{preview.status.replace(/_/g, " ")}</Badge>
                <Badge tone="neutral">{METHOD_LABEL[preview.method]}</Badge>
                <Badge tone="outline">{preview.currency}</Badge>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Transaction reference", preview.reference],
                ["Gateway", preview.gateway],
                ["Order", preview.orderNumber],
                ["Customer", preview.customerName],
                ["Email", preview.customerEmail],
                ["Method", METHOD_LABEL[preview.method]],
                ["Simulated card", preview.cardLast4 ? `•••• ${preview.cardLast4}` : "Not applicable"],
                ["Created", dateTime(preview.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line px-3 py-2">
                  <dt className="text-2xs uppercase tracking-wide text-ink-subtle">{label}</dt>
                  <dd className="mt-0.5 truncate font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                Refund history
              </h3>
              {preview.refunds.length ? (
                <ul className="mt-2 space-y-2">
                  {preview.refunds.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          {money(item.amount, preview.currency)}
                        </p>
                        <p className="text-xs text-ink-muted">{item.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-2xs text-ink-muted">{item.reference}</p>
                        <p className="text-2xs text-ink-subtle">{dateTime(item.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-ink-muted">No refunds recorded.</p>
              )}
            </div>

            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
              This is a simulated transaction. No card details were collected and no funds moved.
            </p>
          </div>
        ) : null}
      </Sheet>

      <Dialog
        open={Boolean(refunding)}
        onClose={() => setRefunding(null)}
        title="Process a demo refund"
        description="Refunds are recorded against the transaction. No money moves."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRefunding(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={async () => {
                if (!refunding) return;
                setBusy(true);
                try {
                  await paymentService.refund(refunding.id, refund.amount, refund.reason);
                  toast({ variant: "success", title: "Demo refund recorded" });
                  setRefunding(null);
                } catch (error) {
                  toast({
                    variant: "error",
                    title: "Could not refund",
                    description: isMockApiError(error) ? error.message : undefined,
                  });
                } finally {
                  setBusy(false);
                }
              }}
            >
              Record refund
            </Button>
          </>
        }
      >
        {refunding ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink-muted">
              <p className="flex items-center gap-2">
                <CreditCard className="size-4" aria-hidden />
                {refunding.reference} · {refunding.gateway} · {money(refunding.amount, refunding.currency)}
              </p>
            </div>
            <Field label="Refund amount" required htmlFor="payment-refund-amount">
              <Input
                id="payment-refund-amount"
                type="number"
                min={0}
                max={refunding.amount}
                value={refund.amount}
                onChange={(event) => setRefund({ ...refund, amount: Number(event.target.value) })}
              />
            </Field>
            <Field label="Reason" htmlFor="payment-refund-reason">
              <Textarea
                id="payment-refund-reason"
                rows={3}
                value={refund.reason}
                onChange={(event) => setRefund({ ...refund, reason: event.target.value })}
              />
            </Field>
          </div>
        ) : null}
      </Dialog>
    </Page>
  );
}
