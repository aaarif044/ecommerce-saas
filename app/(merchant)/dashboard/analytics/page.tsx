"use client";

import * as React from "react";
import { Download, TrendingUp, Users, ShoppingBag, IndianRupee, Percent } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { downloadCsv } from "@/lib/services/csv";
import { useMoney, useNumberFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { CardGrid, Page, StatGrid } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {  } from "@/components/ui/input";
import { StatCard } from "@/components/dashboard/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaTrendChart, BarTrendChart, CHART_COLORS, DonutChart, LineTrendChart } from "@/components/charts";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { useDateRangeStore, resolveRange } from "@/lib/store/date-range-store";
import { channelBreakdown, computeMetrics, filterOrders, refundSummary, topCustomers, topProducts } from "@/lib/analytics";

export default function AnalyticsPage() {
  const orders = useDataStore((state) => state.orders);
  const products = useDataStore((state) => state.products);
  const analytics = useDataStore((state) => state.analytics);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const number = useNumberFormatter();
  const range = useDateRangeStore((state) => state.range);

  const { metrics, series } = React.useMemo(
    () => computeMetrics(orders, range),
    [orders, range],
  );

  const monthly = React.useMemo(
    () =>
      analytics.map((month) => ({
        label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(month.month)),
        revenue: month.revenue,
        orders: month.orders,
        conversion: month.conversionRate,
        refunds: month.refunds,
        aov: month.aov,
      })),
    [analytics],
  );

  // The breakdowns sit next to KPI cards that honour the date range, so they
  // have to use the same window.
  const scopedOrders = React.useMemo(() => {
    const { start, end } = resolveRange(range);
    return filterOrders(orders, start, end);
  }, [orders, range]);

  const channels = React.useMemo(() => channelBreakdown(scopedOrders), [scopedOrders]);
  const top = React.useMemo(() => topProducts(scopedOrders, products, 8), [scopedOrders, products]);
  const customers = React.useMemo(() => topCustomers(scopedOrders, 8), [scopedOrders]);
  const refunds = React.useMemo(() => refundSummary(scopedOrders), [scopedOrders]);

  const exportCsv = () => {
    downloadCsv(
      "analytics.csv",
      series.map((point) => ({
        Date: point.date,
        Revenue: point.revenue,
        Orders: point.orders,
        Sessions: point.sessions,
        Conversion_rate: point.conversionRate,
        AOV: point.aov,
        Refunds: point.refunds,
      })),
    );
    toast({ variant: "success", title: "Export ready", description: "Daily metrics exported." });
  };

  return (
    <Page>
      <PageHeader
        title="Analytics"
        description="Traffic, conversion and revenue across the demo dataset."
        actions={
          <>
            <DateRangePicker />
            <Button variant="secondary" size="sm" onClick={exportCsv}>
              <Download className="size-3.5" aria-hidden />
              Export CSV
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Revenue"
          value={money(metrics.revenue)}
          icon={IndianRupee}
          delta={metrics.revenueDelta}
          tone="brand"
        />
        <StatCard
          label="Orders"
          value={number(metrics.orders)}
          icon={ShoppingBag}
          delta={metrics.ordersDelta}
          tone="sky"
        />
        <StatCard
          label="Average order value"
          value={money(metrics.aov)}
          icon={TrendingUp}
          delta={metrics.aovDelta}
          tone="emerald"
        />
        <StatCard
          label="Conversion rate"
          value={`${metrics.conversionRate.toFixed(2)}%`}
          icon={Percent}
          delta={metrics.conversionDelta}
          tone="violet"
        />
        <StatCard
          label="Sessions"
          value={number(metrics.sessions)}
          icon={Users}
          tone="amber"
          footnote={`${number(metrics.customers)} customers`}
        />
      </div>

      <Card>
        <CardHeader
          title="Revenue and orders"
          description="Daily performance for the selected range."
        />
        <CardBody>
          {series.length ? (
            <AreaTrendChart
              data={series as unknown as Record<string, unknown>[]}
              dataKey="revenue"
              name="Revenue"
              height={300}
              formatter={(value) => money(Number(value))}
            />
          ) : null}
        </CardBody>
      </Card>

      <CardGrid columns={2}>
        <Card>
          <CardHeader title="Orders per day" description="Volume across the selected range." />
          <CardBody>
            <BarTrendChart
              data={series as unknown as Record<string, unknown>[]}
              dataKey="orders"
              name="Orders"
              color={CHART_COLORS[1]}
              height={260}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Revenue by channel" description="Where the money came from." />
          <CardBody>
            <DonutChart
              data={channels as unknown as Record<string, unknown>[]}
              height={260}
              formatter={(value) => money(Number(value))}
            />
          </CardBody>
        </Card>
      </CardGrid>

      <Card>
        <CardHeader title="12-month trend" description="Revenue, orders and conversion rate." />
        <CardBody>
          <LineTrendChart
            data={monthly as unknown as Record<string, unknown>[]}
            series={[
              { dataKey: "revenue", name: "Revenue", color: CHART_COLORS[0] },
              { dataKey: "orders", name: "Orders", color: CHART_COLORS[1] },
              { dataKey: "conversion", name: "Conversion %", color: CHART_COLORS[2] },
            ]}
            height={300}
          />
        </CardBody>
      </Card>

      <CardGrid columns={2}>
        <Card>
          <CardHeader title="Product performance" description="Top products by revenue." />
          <CardBody className="p-0">
            <Table compact>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead align="right">Units</TableHead>
                  <TableHead align="right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top.map((product) => (
                  <TableRow key={product.productId}>
                    <TableCell>
                      <p className="truncate font-medium text-ink">{product.title}</p>
                      <p className="truncate text-2xs text-ink-subtle">{product.brand}</p>
                    </TableCell>
                    <TableCell align="right" className="tabular-nums text-ink">
                      {product.units}
                    </TableCell>
                    <TableCell align="right" className="font-medium tabular-nums text-ink">
                      {money(product.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Customer analytics" description="Highest value customers." />
          <CardBody className="p-0">
            <Table compact>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead align="right">Orders</TableHead>
                  <TableHead align="right">Spend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.email}>
                    <TableCell>
                      <p className="truncate font-medium text-ink">{customer.name}</p>
                      <p className="truncate text-2xs text-ink-subtle">{customer.email}</p>
                    </TableCell>
                    <TableCell align="right" className="tabular-nums text-ink">
                      {customer.orders}
                    </TableCell>
                    <TableCell align="right" className="font-medium tabular-nums text-ink">
                      {money(customer.spend)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </CardGrid>

      <Card>
        <CardHeader title="Inventory analytics" description="Stock health across the catalogue." />
        <CardBody>
          <StatGrid columns={4}>
            {[
              { label: "Units on hand", value: number(products.reduce((s, p) => s + p.inventory, 0)) },
              { label: "Out of stock SKUs", value: number(products.filter((p) => p.inventory === 0).length) },
              { label: "Low stock SKUs", value: number(products.filter((p) => p.inventory > 0 && p.inventory <= 20).length) },
              {
                label: "Refunded value",
                value: money(refunds.total),
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-line bg-surface-2/50 p-4">
                <p className="text-xs text-ink-muted">{item.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{item.value}</p>
              </div>
            ))}
          </StatGrid>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="info">{refunds.count} refunded orders</Badge>
            <Badge tone="neutral">Refund rate {((refunds.count / Math.max(1, orders.length)) * 100).toFixed(1)}%</Badge>
          </div>
        </CardBody>
      </Card>
    </Page>
  );
}
