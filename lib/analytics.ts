import type { Order, Product, SalesChannel } from "@/lib/types";
import { createRng } from "@/lib/utils";
import { resolveRange, previousRange, type DateRangeValue } from "@/lib/store/date-range-store";

export interface DailyPoint {
  key: string;
  date: string;
  label: string;
  revenue: number;
  orders: number;
  sessions: number;
  refunds: number;
  aov: number;
  conversionRate: number;
}

export interface Metrics {
  revenue: number;
  orders: number;
  aov: number;
  conversionRate: number;
  sessions: number;
  refunded: number;
  customers: number;
  revenueDelta: number;
  ordersDelta: number;
  aovDelta: number;
  conversionDelta: number;
}

const CHANNEL_LABELS: Record<SalesChannel, string> = {
  online_store: "Online store",
  mobile_app: "Mobile app",
  marketplace: "Marketplace",
  wholesale: "Wholesale",
  social: "Social",
};

export function channelLabel(channel: SalesChannel) {
  return CHANNEL_LABELS[channel];
}

function isCancelled(order: Order) {
  return order.status === "cancelled";
}

export function filterOrders(orders: Order[], start: Date, end: Date) {
  const from = start.getTime();
  const to = end.getTime();
  return orders.filter((order) => {
    const time = new Date(order.createdAt).getTime();
    return time >= from && time <= to;
  });
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

/** Deterministic per-day traffic estimate so conversion rates stay stable. */
function sessionsForDay(date: Date, orders: number) {
  const seed = Math.floor(date.getTime() / 86400000);
  const rng = createRng(seed * 7919 + 13);
  const base = 120 + Math.floor(rng() * 130);
  return base + orders * 18;
}

export function buildDailySeries(orders: Order[], start: Date, end: Date): DailyPoint[] {
  const points: DailyPoint[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= end.getTime()) {
    const key = dayKey(cursor);
    const dayOrders = orders.filter((order) => dayKey(new Date(order.createdAt)) === key);
    // Cancelled orders are excluded everywhere, so the daily AOV and
    // conversion rate agree with the KPI cards above them.
    const validOrders = dayOrders.filter((order) => !isCancelled(order));
    const revenue = validOrders.reduce((sum, order) => sum + order.total, 0);
    const refunds = dayOrders.reduce((sum, order) => sum + order.refundedTotal, 0);
    const sessions = sessionsForDay(cursor, validOrders.length);
    points.push({
      key,
      date: cursor.toISOString(),
      label: dayLabel(cursor),
      revenue,
      orders: validOrders.length,
      sessions,
      refunds,
      aov: validOrders.length ? Math.round(revenue / validOrders.length) : 0,
      conversionRate: sessions
        ? Number(((validOrders.length / sessions) * 100).toFixed(2))
        : 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return points;
}

export function computeMetrics(
  orders: Order[],
  range: DateRangeValue,
): { metrics: Metrics; series: DailyPoint[]; previousSeries: DailyPoint[] } {
  const { start, end } = resolveRange(range);
  const previous = previousRange(range);

  const scoped = filterOrders(orders, start, end);
  const scopedPrevious = filterOrders(orders, previous.start, previous.end);
  const series = buildDailySeries(orders, start, end);
  const previousSeries = buildDailySeries(orders, previous.start, previous.end);

  const valid = scoped.filter((order) => !isCancelled(order));
  const validPrevious = scopedPrevious.filter((order) => !isCancelled(order));

  const revenue = valid.reduce((sum, order) => sum + order.total, 0);
  const revenuePrevious = validPrevious.reduce((sum, order) => sum + order.total, 0);
  const orderCount = valid.length;
  const orderCountPrevious = validPrevious.length;
  const refunded = scoped.reduce((sum, order) => sum + order.refundedTotal, 0);
  const sessions = series.reduce((sum, point) => sum + point.sessions, 0);
  const sessionsPrevious = previousSeries.reduce((sum, point) => sum + point.sessions, 0);
  const customers = new Set(valid.map((order) => order.customerId || order.customerEmail)).size;

  const aov = orderCount ? revenue / orderCount : 0;
  const aovPrevious = orderCountPrevious ? revenuePrevious / orderCountPrevious : 0;
  const conversionRate = sessions ? (orderCount / sessions) * 100 : 0;
  const conversionPrevious = sessionsPrevious
    ? (orderCountPrevious / sessionsPrevious) * 100
    : 0;

  const delta = (current: number, previousValue: number) =>
    previousValue ? ((current - previousValue) / previousValue) * 100 : 0;

  return {
    metrics: {
      revenue,
      orders: orderCount,
      aov,
      conversionRate,
      sessions,
      refunded,
      customers,
      revenueDelta: delta(revenue, revenuePrevious),
      ordersDelta: delta(orderCount, orderCountPrevious),
      aovDelta: delta(aov, aovPrevious),
      conversionDelta: delta(conversionRate, conversionPrevious),
    },
    series,
    previousSeries,
  };
}

export function channelBreakdown(orders: Order[]) {
  const totals = new Map<SalesChannel, number>();
  orders
    .filter((order) => !isCancelled(order))
    .forEach((order) => {
      totals.set(order.channel, (totals.get(order.channel) ?? 0) + order.total);
    });
  return Array.from(totals.entries())
    .map(([channel, value]) => ({ name: channelLabel(channel), channel, value }))
    .sort((a, b) => b.value - a.value);
}

export function topProducts(orders: Order[], products: Product[], limit = 5) {
  const map = new Map<string, { productId: string; units: number; revenue: number }>();
  orders
    .filter((order) => !isCancelled(order))
    .forEach((order) => {
      order.lineItems.forEach((item) => {
        const existing = map.get(item.productId) ?? {
          productId: item.productId,
          units: 0,
          revenue: 0,
        };
        existing.units += item.quantity;
        existing.revenue += item.unitPrice * item.quantity;
        map.set(item.productId, existing);
      });
    });
  return Array.from(map.values())
    .map((entry) => {
      const product = products.find((item) => item.id === entry.productId);
      return {
        ...entry,
        title: product?.title ?? "Unknown product",
        brand: product?.brand ?? "—",
        assetId: product?.images[0],
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function lowStockProducts(products: Product[], threshold = 20, limit = 6) {
  return products
    .filter((product) => product.status === "active" && product.inventory <= threshold)
    .sort((a, b) => a.inventory - b.inventory)
    .slice(0, limit);
}

export function topCustomers(orders: Order[], limit = 5) {
  const map = new Map<string, { name: string; email: string; spend: number; orders: number }>();
  orders
    .filter((order) => !isCancelled(order))
    .forEach((order) => {
      const key = order.customerId || order.customerEmail;
      const existing = map.get(key) ?? {
        name: order.customerName,
        email: order.customerEmail,
        spend: 0,
        orders: 0,
      };
      existing.spend += order.total;
      existing.orders += 1;
      map.set(key, existing);
    });
  return Array.from(map.values()).sort((a, b) => b.spend - a.spend).slice(0, limit);
}

export function refundSummary(orders: Order[]) {
  const total = orders.reduce((sum, order) => sum + order.refundedTotal, 0);
  const count = orders.filter((order) => order.refundedTotal > 0).length;
  return { total, count };
}
