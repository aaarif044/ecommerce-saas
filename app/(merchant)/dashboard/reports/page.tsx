"use client";

import * as React from "react";
import { Download, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { downloadCsv } from "@/lib/services/csv";
import { useMoney } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { CardGrid, Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDateRangeStore, resolveRange } from "@/lib/store/date-range-store";
import { ANCHOR } from "@/lib/data/catalog";

interface ScheduledReport {
  id: string;
  name: string;
  dataset: string;
  frequency: "daily" | "weekly" | "monthly";
  lastRun: string;
  nextRun: string;
  recipients: string;
  active: boolean;
}

const INITIAL_REPORTS: ScheduledReport[] = [
  {
    id: "rep-1",
    name: "Daily sales summary",
    dataset: "orders",
    frequency: "daily",
    lastRun: "2026-10-19T09:00:00.000Z",
    nextRun: "2026-10-20T09:00:00.000Z",
    recipients: "owner@northwind.example",
    active: true,
  },
  {
    id: "rep-2",
    name: "Weekly inventory health",
    dataset: "inventory",
    frequency: "weekly",
    lastRun: "2026-10-12T09:00:00.000Z",
    nextRun: "2026-10-19T09:00:00.000Z",
    recipients: "ops@northwind.example",
    active: true,
  },
  {
    id: "rep-3",
    name: "Monthly tax summary",
    dataset: "tax",
    frequency: "monthly",
    lastRun: "2026-09-30T09:00:00.000Z",
    nextRun: "2026-10-31T09:00:00.000Z",
    recipients: "accounts@northwind.example",
    active: false,
  },
];

export default function ReportsPage() {
  const orders = useDataStore((state) => state.orders);
  const products = useDataStore((state) => state.products);
  const customers = useDataStore((state) => state.customers);
  const payments = useDataStore((state) => state.payments);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const range = useDateRangeStore((state) => state.range);

  const [reports, setReports] = React.useState<ScheduledReport[]>(INITIAL_REPORTS);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    dataset: "orders",
    frequency: "weekly" as ScheduledReport["frequency"],
    recipients: "",
  });

  const { start, end } = resolveRange(range);
  const scopedOrders = orders.filter((order) => {
    const time = new Date(order.createdAt).getTime();
    return time >= start.getTime() && time <= end.getTime();
  });

  // The monthly breakdown covers the whole order history, not the selected
  // range: a 30-day range only contains one of these months.
  const monthlyRevenue = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const offset = 11 - index;
        const date = new Date(ANCHOR.getFullYear(), ANCHOR.getMonth() - offset, 1);
        const next = new Date(ANCHOR.getFullYear(), ANCHOR.getMonth() - offset + 1, 1);
        const revenue = orders
          .filter((order) => {
            if (order.status === "cancelled") return false;
            const time = new Date(order.createdAt).getTime();
            return time >= date.getTime() && time < next.getTime();
          })
          .reduce((sum, order) => sum + order.total, 0);
        return { date, revenue };
      }),
    [orders],
  );
  const peakRevenue = Math.max(1, ...monthlyRevenue.map((month) => month.revenue));

  const datasets: { key: string; label: string; description: string }[] = [
    { key: "orders", label: "Orders", description: "Order lines, totals, statuses and channels." },
    { key: "products", label: "Catalogue", description: "Product, SKU, pricing and stock levels." },
    { key: "customers", label: "Customers", description: "Segments, tags and lifetime value." },
    { key: "payments", label: "Payments", description: "Transactions, methods and refunds." },
    { key: "tax", label: "Tax summary", description: "Tax collected per order and rate band." },
  ];

  const runExport = (key: string) => {
    switch (key) {
      case "orders":
        downloadCsv(
          "report-orders.csv",
          scopedOrders.map((order) => ({
            Order: order.orderNumber,
            Date: order.createdAt,
            Customer: order.customerName,
            Status: order.status,
            Payment: order.paymentStatus,
            Subtotal: order.subtotal,
            Tax: order.taxTotal,
            Total: order.total,
          })),
        );
        break;
      case "products":
        downloadCsv(
          "report-catalogue.csv",
          products.map((product) => ({
            Title: product.title,
            SKU: product.sku,
            Price: product.price,
            Cost: product.costPrice,
            Stock: product.inventory,
            Status: product.status,
          })),
        );
        break;
      case "customers":
        downloadCsv(
          "report-customers.csv",
          customers.map((customer) => ({
            Name: customer.name,
            Email: customer.email,
            Segment: customer.segment,
            Orders: customer.orderCount,
            Lifetime_value: customer.totalSpent,
          })),
        );
        break;
      case "payments":
        downloadCsv(
          "report-payments.csv",
          payments.map((payment) => ({
            Reference: payment.reference,
            Order: payment.orderNumber,
            Amount: payment.amount,
            Method: payment.method,
            Status: payment.status,
          })),
        );
        break;
      case "tax":
        downloadCsv(
          "report-tax.csv",
          scopedOrders.map((order) => ({
            Order: order.orderNumber,
            Taxable: order.subtotal - order.discountTotal,
            Tax: order.taxTotal,
            Rate:
              order.subtotal - order.discountTotal > 0
                ? (
                    (order.taxTotal / (order.subtotal - order.discountTotal)) *
                    100
                  ).toFixed(2)
                : "0",
          })),
        );
        break;
      default:
        break;
    }
    toast({ variant: "success", title: "Export ready", description: "The CSV has been downloaded." });
  };

  return (
    <Page>
      <PageHeader
        title="Reports"
        description="Export any dataset as CSV, or schedule a recurring report for your team."
        actions={
          <Button variant="primary" size="sm" onClick={() => setScheduleOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Schedule report
          </Button>
        }
      />

      <Card>
        <CardHeader title="Available exports" description="Every export respects the current date range." />
        <CardBody>
          <CardGrid columns={3}>
            {datasets.map((dataset) => (
              <div key={dataset.key} className="flex flex-col rounded-xl border border-line bg-surface-2/50 p-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-surface text-brand-600 shadow-xs dark:text-brand-300">
                  <FileSpreadsheet className="size-4" aria-hidden />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink">{dataset.label}</p>
                <p className="mt-1 flex-1 text-xs leading-5 text-ink-muted">
                  {dataset.description}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3 self-start"
                  onClick={() => runExport(dataset.key)}
                >
                  <Download className="size-3.5" aria-hidden />
                  Export CSV
                </Button>
              </div>
            ))}
          </CardGrid>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Scheduled reports"
          description="Scheduling is simulated — no email is sent."
          actions={
            <Badge tone="info">
              {reports.filter((report) => report.active).length} active
            </Badge>
          }
        />
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Dataset</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium text-ink">{report.name}</TableCell>
                  <TableCell className="text-ink-muted">
                    {datasets.find((dataset) => dataset.key === report.dataset)?.label ??
                      report.dataset}
                  </TableCell>
                  <TableCell className="text-ink-muted capitalize">{report.frequency}</TableCell>
                  <TableCell className="text-ink-muted">{report.recipients}</TableCell>
                  <TableCell>
                    <Badge tone={report.active ? "success" : "neutral"}>
                      {report.active ? "Active" : "Paused"}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReports((current) =>
                            current.map((item) =>
                              item.id === report.id ? { ...item, active: !item.active } : item,
                            ),
                          );
                          toast({ variant: "info", title: "Report schedule updated" });
                        }}
                      >
                        {report.active ? "Pause" : "Resume"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        aria-label={`Delete ${report.name}`}
                        onClick={() => setReports((current) => current.filter((item) => item.id !== report.id))}
                        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Revenue by month" description="A quick view of the last 12 months." />
        <CardBody>
          <ul className="space-y-2">
            {monthlyRevenue.map((month) => (
                <li key={month.date.toISOString()} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-ink-muted">
                    {new Intl.DateTimeFormat("en-US", { month: "short" }).format(month.date)}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.min(100, (month.revenue / peakRevenue) * 100)}%` }}
                    />
                  </span>
                  <span className="w-24 shrink-0 text-right text-xs font-medium tabular-nums text-ink">
                    {money(month.revenue)}
                  </span>
                </li>
              ))}
          </ul>
        </CardBody>
      </Card>

      <Dialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule a report"
        description="The schedule is stored locally. No email is delivered in this demo."
        footer={
          <>
            <Button variant="ghost" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!form.name.trim() || !form.recipients.includes("@")) return;
                setReports((current) => [
                  ...current,
                  {
                    id: `rep-${Date.now().toString(36)}`,
                    name: form.name.trim(),
                    dataset: form.dataset,
                    frequency: form.frequency,
                    lastRun: new Date().toISOString(),
                    nextRun: new Date(Date.now() + 86400000).toISOString(),
                    recipients: form.recipients.trim(),
                    active: true,
                  },
                ]);
                setForm({ name: "", dataset: "orders", frequency: "weekly", recipients: "" });
                setScheduleOpen(false);
                toast({ variant: "success", title: "Report scheduled" });
              }}
            >
              Schedule report
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Report name" required htmlFor="report-name">
            <Input
              id="report-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Weekly customer summary"
            />
          </Field>
          <Field label="Dataset" htmlFor="report-dataset">
            <Select
              id="report-dataset"
              value={form.dataset}
              onChange={(event) => setForm({ ...form, dataset: event.target.value })}
            >
              {datasets.map((dataset) => (
                <option key={dataset.key} value={dataset.key}>
                  {dataset.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Frequency" htmlFor="report-frequency">
            <Select
              id="report-frequency"
              value={form.frequency}
              onChange={(event) =>
                setForm({ ...form, frequency: event.target.value as ScheduledReport["frequency"] })
              }
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
          </Field>
          <Field label="Recipients" required htmlFor="report-recipients">
            <Input
              id="report-recipients"
              type="email"
              value={form.recipients}
              onChange={(event) => setForm({ ...form, recipients: event.target.value })}
              placeholder="team@example.com"
            />
          </Field>
        </div>
      </Dialog>
    </Page>
  );
}
