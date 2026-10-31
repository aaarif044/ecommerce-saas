"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, IndianRupee, ShoppingBag, Store, TrendingUp } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useMoney } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page, StatGrid } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarTrendChart, DonutChart, CHART_COLORS } from "@/components/charts";
import { DataTable, columnHelper } from "@/components/data-table/data-table";
import { Avatar } from "@/components/ui/avatar";
import type { Merchant } from "@/lib/types";

const STATUS_TONE = {
  active: "success",
  trial: "info",
  past_due: "warning",
  suspended: "danger",
} as const;

export default function AdminDashboardPage() {
  const merchants = useDataStore((state) => state.merchants);
  const orders = useDataStore((state) => state.orders);
  const analytics = useDataStore((state) => state.analytics);
  const plans = useDataStore((state) => state.plans);
  const money = useMoney();

  const totals = React.useMemo(() => {
    const gmv = merchants.reduce((sum, merchant) => sum + merchant.gmv, 0);
    const active = merchants.filter((merchant) => merchant.status === "active").length;
    const merchantOrders = merchants.reduce((sum, merchant) => sum + merchant.orderCount, 0);
    const revenue = plans.reduce(
      (sum, plan) => sum + plan.monthlyPrice * plan.subscribers,
      0,
    );
    return { gmv, active, merchantOrders, revenue };
  }, [merchants, plans]);

  const growth = React.useMemo(
    () =>
      analytics.map((month) => ({
        label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(month.month)),
        merchants: Math.round(merchants.length * (0.7 + (month.revenue / 3000000) * 0.4)),
        gmv: Math.round((month.revenue / 40) * 1000),
      })),
    [analytics, merchants.length],
  );

  const distribution = React.useMemo(
    () =>
      plans.map((plan) => ({
        name: plan.name,
        value: plan.subscribers,
      })),
    [plans],
  );

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("businessName", {
        header: "Merchant",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.original.businessName} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{row.original.businessName}</p>
              <p className="truncate text-2xs text-ink-subtle">{row.original.email}</p>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("planName", {
        header: "Plan",
        cell: ({ getValue }) => <Badge tone="neutral">{getValue() as string}</Badge>,
      }),
      columnHelper.accessor("country", {
        header: "Country",
        cell: ({ getValue }) => <span className="text-ink-muted">{getValue() as string}</span>,
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
    ],
    [money],
  );

  return (
    <Page>
      <PageHeader
        eyebrow="Platform administration"
        title="Platform dashboard"
        description="Marketplace health across the demo merchant base. All figures are fictional."
        actions={
          <Link
            href="/admin/merchants"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3.5 text-sm font-medium text-white dark:bg-brand-500 dark:text-brand-950"
          >
            <Store className="size-4" aria-hidden />
            View merchants
          </Link>
        }
      />

      <StatGrid columns={4} className="xl:grid-cols-5">
        <StatCard
          label="Total merchants"
          value={merchants.length.toLocaleString("en-IN")}
          icon={Store}
          tone="brand"
        />
        <StatCard
          label="Active stores"
          value={totals.active.toLocaleString("en-IN")}
          icon={Activity}
          tone="emerald"
          footnote={`${merchants.length - totals.active} not active`}
        />
        <StatCard
          label="Total orders"
          value={totals.merchantOrders.toLocaleString("en-IN")}
          icon={ShoppingBag}
          tone="sky"
          footnote={`${orders.length} on this demo store`}
        />
        <StatCard
          label="Demo GMV"
          value={money(totals.gmv)}
          icon={IndianRupee}
          tone="violet"
        />
        <StatCard
          label="Subscription revenue"
          value={money(totals.revenue)}
          icon={TrendingUp}
          tone="amber"
          footnote="Monthly recurring estimate"
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Merchant growth" description="Merchants and GMV over the last 12 months." />
          <CardBody>
            <BarTrendChart
              data={growth as unknown as Record<string, unknown>[]}
              dataKey="merchants"
              name="Merchants"
              color={CHART_COLORS[0]}
              height={280}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Subscription distribution" description="Merchants per plan." />
          <CardBody>
            <DonutChart
              data={distribution as unknown as Record<string, unknown>[]}
              height={280}
              formatter={(value) => Number(value).toLocaleString("en-IN")}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent merchants"
          description="The newest stores on the platform."
          actions={
            <Link
              href="/admin/merchants"
              className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
            >
              View all
            </Link>
          }
        />
        <CardBody className="p-0">
          <DataTable
            data={merchants.slice(0, 6)}
            columns={columns}
            getRowId={(row) => row.id}
            searchAccessor={(row) => `${row.businessName} ${row.email} ${row.storeName}`}
            searchPlaceholder="Search merchants…"
            itemLabel="merchants"
            initialPageSize={6}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Platform notes" />
        <CardBody>
          <ul className="grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "No live integrations",
                body: "Payment, shipping and marketing connectors in this build are visual only.",
              },
              {
                title: "Local persistence",
                body: "Every merchant action is stored in the browser with localStorage.",
              },
              {
                title: "Fictional data",
                body: "Merchants, orders and revenue are generated from deterministic fixtures.",
              },
            ].map((item) => (
              <li key={item.title} className="rounded-lg border border-line bg-surface-2/50 p-4">
                <p className="text-sm font-medium text-ink">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-ink-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </Page>
  );
}
