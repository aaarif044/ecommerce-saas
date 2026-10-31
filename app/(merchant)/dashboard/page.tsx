"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BadgePercent, CircleCheck, CircleDashed, IndianRupee, Package, ShoppingBag, Sparkles, TrendingUp, Users } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useDateRangeStore } from "@/lib/store/date-range-store";
import { channelBreakdown, computeMetrics, filterOrders, lowStockProducts, topProducts } from "@/lib/analytics";
import { resolveRange } from "@/lib/store/date-range-store";
import { useMoney, useDateTimeFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { CardGrid, Page, StatGrid } from "@/components/shell/page";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {  } from "@/components/ui/button";
import { ProductImage } from "@/components/product-image";
import { AreaTrendChart, BarTrendChart, DonutChart, CHART_COLORS } from "@/components/charts";
import { EmptyState } from "@/components/ui/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/services/sales";

const SETUP_STEPS = [
  { id: "products", label: "Add your first 10 products", href: "/dashboard/products" },
  { id: "theme", label: "Publish a storefront theme", href: "/dashboard/themes" },
  { id: "payments", label: "Configure payment methods", href: "/dashboard/settings/payments" },
  { id: "shipping", label: "Set up shipping zones", href: "/dashboard/shipping" },
  { id: "domain", label: "Connect a custom domain", href: "/dashboard/domains" },
  { id: "staff", label: "Invite your team", href: "/dashboard/settings/staff" },
];

export default function DashboardPage() {
  const orders = useDataStore((state) => state.orders);
  const products = useDataStore((state) => state.products);
  const notifications = useDataStore((state) => state.notifications);
  const customDomains = useDataStore((state) => state.customDomains);
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);
  const range = useDateRangeStore((state) => state.range);
  const money = useMoney();
  const dateTime = useDateTimeFormatter();

  const { metrics, series } = React.useMemo(
    () => computeMetrics(orders, range),
    [orders, range],
  );

  // The breakdown cards sit next to the KPI cards, which all honour the
  // selected date range, so they have to use the same window.
  const scopedOrders = React.useMemo(() => {
    const { start, end } = resolveRange(range);
    return filterOrders(orders, start, end);
  }, [orders, range]);

  const channels = React.useMemo(() => channelBreakdown(scopedOrders), [scopedOrders]);
  const top = React.useMemo(() => topProducts(scopedOrders, products, 5), [scopedOrders, products]);
  const lowStock = React.useMemo(() => lowStockProducts(products, 20, 5), [products]);
  const recentOrders = React.useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    [orders],
  );
  const recentActivity = React.useMemo(
    () => [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [notifications],
  );

  const completedSteps = React.useMemo(() => {
    const done = new Set<string>();
    if (products.filter((p) => p.status === "active").length >= 10) done.add("products");
    if (settings?.storefront.published) done.add("theme");
    if ((settings?.payments.enabledMethods.length ?? 0) > 0) done.add("payments");
    if (settings?.shipping.defaultZoneId) done.add("shipping");
    if (customDomains.some((domain) => domain.status === "verified")) done.add("domain");
    if (settings?.staff.length) done.add("staff");
    return done;
  }, [products, settings, customDomains]);

  const setupProgress = Math.round((completedSteps.size / SETUP_STEPS.length) * 100);

  return (
    <Page gap="lg">
      <PageHeader
        title="Dashboard"
        description="A live view of how the store is performing. All figures come from the local demo dataset."
        actions={
          <>
            <DateRangePicker />
            <Link
              href="/dashboard/products/new"
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400"
            >
              <Sparkles className="size-3.5" aria-hidden />
              Add product
            </Link>
          </>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          label="Revenue"
          value={money(metrics.revenue)}
          icon={IndianRupee}
          delta={metrics.revenueDelta}
          tone="brand"
        />
        <StatCard
          label="Total orders"
          value={metrics.orders.toLocaleString("en-IN")}
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
          icon={Users}
          delta={metrics.conversionDelta}
          footnote={`${metrics.sessions.toLocaleString("en-IN")} sessions`}
          tone="violet"
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Revenue over time"
            description="Daily gross revenue for the selected range."
            actions={
              <Badge tone="brand" dot>
                {series.length} days
              </Badge>
            }
          />
          <CardBody>
            {series.length ? (
              <AreaTrendChart
                data={series as unknown as Record<string, unknown>[]}
                dataKey="revenue"
                name="Revenue"
                height={280}
                formatter={(value) => money(Number(value))}
              />
            ) : (
              <EmptyState compact title="No revenue in this range" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Sales by channel" description="Where the revenue came from." />
          <CardBody>
            {channels.length ? (
              <DonutChart
                data={channels as unknown as Record<string, unknown>[]}
                height={220}
                formatter={(value) => money(Number(value))}
              />
            ) : (
              <EmptyState compact title="No channel data" />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Orders over time" description="Daily order volume for the selected range." />
          <CardBody>
            {series.length ? (
              <BarTrendChart
                data={series as unknown as Record<string, unknown>[]}
                dataKey="orders"
                name="Orders"
                color={CHART_COLORS[1]}
                height={240}
              />
            ) : (
              <EmptyState compact title="No orders in this range" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Store setup"
            description={`${setupProgress}% complete`}
          />
          <CardBody className="space-y-3">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-valuenow={setupProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Store setup progress"
            >
              <div
                className="h-full rounded-full bg-brand-600 transition-width duration-300 dark:bg-brand-500"
                style={{ width: `${setupProgress}%` }}
              />
            </div>
            <ul className="space-y-1">
              {SETUP_STEPS.map((step) => {
                const done = completedSteps.has(step.id);
                return (
                  <li key={step.id}>
                    <Link
                      href={step.href}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                    >
                      {done ? (
                        <CircleCheck className="size-4 shrink-0 text-emerald-600" aria-hidden />
                      ) : (
                        <CircleDashed className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                      )}
                      <span className="min-w-0 flex-1 truncate">{step.label}</span>
                      <ArrowRight className="size-3.5 shrink-0 text-ink-subtle" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </div>

      <CardGrid columns={2}>
        <Card>
          <CardHeader
            title="Top-selling products"
            description="By revenue in the selected range."
            actions={
              <Link
                href="/dashboard/products"
                className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
              >
                View catalogue
              </Link>
            }
          />
          <CardBody className="p-0">
            {top.length ? (
              <ul className="divide-y divide-line">
                {top.map((product, index) => (
                  <li key={product.productId} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-ink-subtle">
                      {index + 1}
                    </span>
                    <ProductImage
                      assetId={product.assetId}
                      alt={product.title}
                      className="size-10 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {product.title}
                      </span>
                      <span className="block text-2xs text-ink-subtle">
                        {product.units} units sold · {product.brand}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-ink">
                      {money(product.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact title="No sales in this range" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Low stock alerts"
            description="Products at or below 20 units."
            actions={
              <Link
                href="/dashboard/inventory"
                className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
              >
                Manage inventory
              </Link>
            }
          />
          <CardBody className="p-0">
            {lowStock.length ? (
              <ul className="divide-y divide-line">
                {lowStock.map((product) => (
                  <li key={product.id} className="flex items-center gap-3 px-4 py-3">
                    <ProductImage assetId={product.images[0]} alt={product.title} className="size-9 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {product.title}
                      </span>
                      <span className="block text-2xs text-ink-subtle">{product.sku}</span>
                    </span>
                    <Badge tone={product.inventory === 0 ? "danger" : "warning"}>
                      {product.inventory === 0 ? "Out of stock" : `${product.inventory} left`}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact title="Everything is well stocked" />
            )}
          </CardBody>
        </Card>
      </CardGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Recent orders"
            description="The most recent orders placed on the storefront."
            actions={
              <Link
                href="/dashboard/orders"
                className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
              >
                View all orders
              </Link>
            }
          />
          <CardBody className="p-0">
            {recentOrders.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead align="right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="font-medium text-ink hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-ink-muted">{order.customerName}</TableCell>
                      <TableCell className="text-ink-muted">{dateTime(order.createdAt)}</TableCell>
                      <TableCell>
                        <Badge
                          tone={
                            order.status === "delivered"
                              ? "success"
                              : order.status === "cancelled"
                                ? "danger"
                                : order.status === "shipped"
                                  ? "info"
                                  : "warning"
                          }
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell align="right" className="font-medium tabular-nums text-ink">
                        {money(order.total, order.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState compact title="No orders yet" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent activity" description="Latest events across the store." />
          <CardBody className="p-0">
            <ul className="divide-y divide-line">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="px-4 py-3">
                  <Link href={activity.href} className="group block">
                    <p className="text-sm font-medium text-ink group-hover:underline">
                      {activity.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-ink-muted">{activity.body}</p>
                    <p className="mt-1 text-2xs text-ink-subtle">{dateTime(activity.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Quick actions" description="Common tasks, one click away." />
        <CardBody>
          <CardGrid columns={4}>
            <QuickAction
              href="/dashboard/products/new"
              icon={Package}
              title="Add a product"
              description="Publish a new item to the catalogue."
            />
            <QuickAction
              href="/dashboard/discounts"
              icon={BadgePercent}
              title="Create a discount"
              description="Issue a coupon for a campaign."
            />
            <QuickAction
              href="/dashboard/themes"
              icon={Sparkles}
              title="Customise the theme"
              description="Edit colours, sections and navigation."
            />
            <QuickAction
              href="/dashboard/orders"
              icon={ShoppingBag}
              title="Fulfil orders"
              description="Review and update order statuses."
            />
          </CardGrid>
        </CardBody>
      </Card>
    </Page>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Package;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-line bg-surface-2/50 p-3.5 transition-colors hover:border-brand-300 hover:bg-brand-50/50 dark:hover:border-brand-800 dark:hover:bg-brand-950/30",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-brand-600 shadow-xs dark:text-brand-300">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-ink-muted">{description}</span>
      </span>
    </Link>
  );
}
