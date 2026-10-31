import { SEED } from "@/lib/data";
import { ANCHOR } from "@/lib/data/catalog";

const problems: string[] = [];
const p = (msg: string) => problems.push(msg);

const {
  products, orders, customers, categories, collections, payments, shipments, returns,
  abandonedCarts, discounts, staff, notifications, themes, pages, blogPosts, navMenus,
  campaigns, integrations, plans, invoices, merchants, auditLog, shippingZones,
  emailTemplates, customDomains, analytics, inventoryMovements,
} = SEED;

const productIds = new Set(products.map((x) => x.id));
const customerIds = new Set(customers.map((x) => x.id));
const categoryIds = new Set(categories.map((x) => x.id));
const orderIds = new Set(orders.map((x) => x.id));
const orderById = new Map(orders.map((o) => [o.id, o]));

// ---- order totals: total = subtotal - discount + tax + shipping
for (const o of orders) {
  const expected = o.subtotal - o.discountTotal + o.taxTotal + o.shippingTotal;
  if (expected !== o.total) p(`ORDER TOTAL MISMATCH ${o.id}: expected ${expected} got ${o.total}`);
  const liSub = o.lineItems.reduce((s, li) => s + li.unitPrice * li.quantity, 0);
  if (liSub !== o.subtotal) p(`ORDER SUBTOTAL MISMATCH ${o.id}: ${liSub} vs ${o.subtotal}`);
  const liTax = o.lineItems.reduce((s, li) => s + li.tax, 0);
  if (liTax !== o.taxTotal) p(`ORDER TAX MISMATCH ${o.id}: ${liTax} vs ${o.taxTotal}`);
  const liDisc = o.lineItems.reduce((s, li) => s + li.discount, 0);
  if (liDisc !== o.discountTotal) p(`ORDER DISCOUNT MISMATCH ${o.id}: ${liDisc} vs ${o.discountTotal}`);
  for (const li of o.lineItems) {
    if (!productIds.has(li.productId)) p(`ORDER ${o.id} line item references missing product ${li.productId}`);
    if (li.total !== li.unitPrice * li.quantity - li.discount + li.tax) p(`ORDER ${o.id} line ${li.id} total mismatch`);
  }
  if (o.customerId && !customerIds.has(o.customerId)) p(`ORDER ${o.id} references missing customer ${o.customerId}`);
  if (o.status === "cancelled" && o.paymentStatus === "paid") p(`ORDER ${o.id} cancelled but paid`);
  if (o.discountCode) {
    const d = discounts.find((x) => x.code === o.discountCode);
    if (!d) p(`ORDER ${o.id} references missing coupon ${o.discountCode}`);
  }
  if (o.refundedTotal > o.total) p(`ORDER ${o.id} refunded > total`);
}

// ---- product references
for (const prod of products) {
  if (!categoryIds.has(prod.categoryId)) p(`PRODUCT ${prod.id} missing category ${prod.categoryId}`);
  for (const v of prod.variants) {
    if (v.inventory < 0) p(`PRODUCT ${prod.id} variant ${v.id} negative inventory`);
    if (!Number.isFinite(v.price)) p(`PRODUCT ${prod.id} variant ${v.id} non-finite price`);
  }
  if (prod.inventory !== prod.variants.reduce((s, v) => s + v.inventory, 0)) {
    p(`PRODUCT ${prod.id} inventory != sum(variants)`);
  }
  const skus = new Set(prod.variants.map((v) => v.sku));
  if (skus.size !== prod.variants.length) p(`PRODUCT ${prod.id} duplicate variant SKUs`);
  for (const cid of prod.collectionIds) {
    const col = collections.find((c) => c.id === cid);
    if (!col) p(`PRODUCT ${prod.id} references missing collection ${cid}`);
    else if (!col.productIds.includes(prod.id)) p(`PRODUCT ${prod.id} in collection ${cid} but collection doesn't list it`);
  }
}
for (const c of collections) {
  for (const pid of c.productIds) if (!productIds.has(pid)) p(`COLLECTION ${c.id} missing product ${pid}`);
  // collection membership must be symmetric with product.collectionIds
  for (const pid of c.productIds) {
    const prod = products.find((x) => x.id === pid);
    if (prod && !prod.collectionIds.includes(c.id)) p(`COLLECTION ${c.id} lists ${pid} but product does not list the collection`);
  }
}

// ---- payments / shipments / returns
for (const pay of payments) if (!orderIds.has(pay.orderId)) p(`PAYMENT ${pay.id} missing order ${pay.orderId}`);
for (const s of shipments) if (!orderIds.has(s.orderId)) p(`SHIPMENT ${s.id} missing order ${s.orderId}`);
for (const r of returns) if (!orderIds.has(r.orderId)) p(`RETURN ${r.id} missing order ${r.orderId}`);
for (const a of abandonedCarts) {
  for (const it of a.items) if (!productIds.has(it.productId)) p(`ABANDONED CART ${a.id} missing product ${it.productId}`);
}
for (const im of inventoryMovements) if (!productIds.has(im.productId)) p(`INVENTORY MOVEMENT ${im.id} missing product ${im.productId}`);

// ---- uniqueness of ids
function dupes(label: string, arr: { id: string }[]) {
  const seen = new Set<string>();
  for (const x of arr) {
    if (seen.has(x.id)) p(`${label} duplicate id ${x.id}`);
    seen.add(x.id);
  }
}
dupes("PRODUCT", products); dupes("ORDER", orders); dupes("CUSTOMER", customers);
dupes("CATEGORY", categories); dupes("COLLECTION", collections); dupes("PAYMENT", payments);
dupes("SHIPMENT", shipments); dupes("RETURN", returns); dupes("DISCOUNT", discounts);
dupes("STAFF", staff); dupes("NOTIFICATION", notifications); dupes("THEME", themes);
dupes("PAGE", pages); dupes("BLOGPOST", blogPosts); dupes("CAMPAIGN", campaigns);
dupes("INTEGRATION", integrations); dupes("PLAN", plans); dupes("INVOICE", invoices);
dupes("MERCHANT", merchants); dupes("AUDIT", auditLog); dupes("ZONE", shippingZones);
dupes("EMAILTPL", emailTemplates); dupes("DOMAIN", customDomains); dupes("NAVMENU", navMenus);
dupes("ABANDONED", abandonedCarts); dupes("INV", inventoryMovements);

function dupSlugs(label: string, arr: { id: string; slug: string }[]) {
  const seen = new Map<string, string>();
  for (const x of arr) {
    if (seen.has(x.slug)) p(`${label} duplicate slug ${x.slug} (${seen.get(x.slug)} / ${x.id})`);
    else seen.set(x.slug, x.id);
  }
}
dupSlugs("PRODUCT", products); dupSlugs("CATEGORY", categories); dupSlugs("COLLECTION", collections);
dupSlugs("PAGE", pages); dupSlugs("BLOGPOST", blogPosts);

// ---- dates: nothing beyond the demo's "today"
const now = Date.now();
// The fixtures are clamped to the end of the anchor day, so that is the
// boundary a record must not cross.
const endOfToday = (() => {
  const date = new Date(ANCHOR);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
})();
/** Records that describe something that already happened. */
function pastCheck(label: string, iso: string | undefined | null) {
  if (!iso) return;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) p(`${label} has invalid date ${iso}`);
  else if (t > endOfToday) p(`${label} is dated beyond today (${iso})`);
}
for (const o of orders) {
  pastCheck(`ORDER ${o.id} createdAt`, o.createdAt);
  pastCheck(`ORDER ${o.id} updatedAt`, o.updatedAt);
  for (const ev of o.timeline) pastCheck(`ORDER ${o.id} timeline ${ev.id}`, ev.createdAt);
}
for (const c of campaigns) {
  // A campaign is scheduled, so its window may well be in the future.
  if (c.status === "running" && new Date(c.endsAt).getTime() < now) p(`CAMPAIGN ${c.id} is "running" but ended ${c.endsAt}`);
  if (c.status === "scheduled" && new Date(c.startsAt).getTime() < now) p(`CAMPAIGN ${c.id} is "scheduled" but already started ${c.startsAt}`);
}
for (const a of abandonedCarts) pastCheck(`ABANDONED ${a.id} lastActivityAt`, a.lastActivityAt);
for (const d of discounts) {
  // Coupons expire in the future — that is the point of them.
  if (new Date(d.startsAt).getTime() > new Date(d.expiresAt).getTime()) p(`DISCOUNT ${d.id} expires before it starts`);
}

// ---- customer metrics must match the orders they actually have
for (const cust of customers) {
  const own = orders.filter((o) => o.customerId === cust.id && o.status !== "cancelled");
  const spend = own.reduce((s, o) => s + o.total, 0);
  if (cust.orderCount !== own.length) p(`CUSTOMER ${cust.id} orderCount ${cust.orderCount} != computed ${own.length}`);
  if (cust.totalSpent !== spend) p(`CUSTOMER ${cust.id} totalSpent ${cust.totalSpent} != computed ${spend}`);
  if (cust.lastOrderAt && own.length) {
    const latest = own.map((o) => o.createdAt).sort().at(-1)!;
    if (new Date(cust.lastOrderAt).getTime() < new Date(latest).getTime()) p(`CUSTOMER ${cust.id} lastOrderAt is older than their latest order`);
  }
  if (!own.length && cust.lastOrderAt) p(`CUSTOMER ${cust.id} has no orders but has lastOrderAt`);  // orders must not predate the customer
  for (const o of orders) {
    if (o.customerId !== cust.id) continue;
    if (new Date(o.createdAt).getTime() < new Date(cust.createdAt).getTime()) {
      p(`ORDER ${o.id} predates customer ${cust.id} registration`);
    }
  }
}

// ---- category product counts
for (const c of categories) {
  const direct = products.filter((pr) => pr.categoryId === c.id).length;
  const children = categories.filter((x) => x.parentId === c.id);
  const rolled = direct + children.reduce((s, ch) => s + (products.filter((pr) => pr.categoryId === ch.id).length), 0);
  if (c.productCount !== rolled) p(`CATEGORY ${c.id} productCount ${c.productCount} != rolled-up ${rolled} (direct ${direct})`);
}

// ---- analytics months must reconcile with the orders dataset
const analyticsRevenue = analytics.reduce((s, m) => s + m.revenue, 0);
const ordersRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
if (Math.abs(analyticsRevenue - ordersRevenue) / ordersRevenue > 0.25) {
  p(`ANALYTICS revenue ${analyticsRevenue} disagrees with orders ${ordersRevenue}`);
}
for (const m of analytics) {
  const channelSum = Object.values(m.channels).reduce((s, c) => s + c, 0);
  if (Math.abs(channelSum - m.revenue) / m.revenue > 0.05) {
    p(`ANALYTICS month ${m.month} channels sum ${channelSum} != revenue ${m.revenue}`);
  }
}

// ---- notifications must reference real records
for (const n of notifications) {
  const ref = /#(NW-\d+)/.exec(n.body) ?? /#(NW-\d+)/.exec(n.title);
  if (ref) {
    const order = orders.find((o) => o.orderNumber === `#${ref[1]}`);
    if (!order) p(`NOTIFICATION ${n.id} references unknown order ${ref[1]}`);
  }
  const payRef = /\b(pay-\d+)\b/.exec(n.body);
  if (payRef) {
    const pay = payments.find((x) => x.id === payRef[1]);
    if (!pay) p(`NOTIFICATION ${n.id} references unknown payment ${payRef[1]}`);
    else if (/refund/i.test(n.body) && pay.refunds.length === 0) p(`NOTIFICATION ${n.id} claims a refund on ${pay.id} which has none`);
  }
  const retRef = /\b(ret-\d+)\b/.exec(n.body);
  if (retRef) {
    const ret = returns.find((x) => x.id === retRef[1]);
    if (!ret) p(`NOTIFICATION ${n.id} references unknown return ${retRef[1]}`);
  }
}

// ---- primary domain
if (customDomains.length && !customDomains.some((d) => d.isPrimary)) p("CUSTOM DOMAINS: no primary domain");

// ---- shipments carry a cost
for (const s of shipments) if (s.cost === 0) p(`SHIPMENT ${s.id} has zero cost`);

// ---- returns cover more than one unit
for (const r of returns) {
  for (const item of r.items ?? []) {
    const order = orderById.get(r.orderId);
    const line = order?.lineItems.find((l) => l.productId === item.productId);
    if (line && item.quantity > line.quantity) p(`RETURN ${r.id} requests ${item.quantity} of ${item.productId} but the order line has ${line.quantity}`);
  }
}

// ---- discounts with a "specific" scope must list products
for (const d of discounts) {
  if (d.productScope === "specific" && d.productIds.length === 0) p(`DISCOUNT ${d.id} scope=specific but lists no products`);
  for (const pid of d.productIds) if (!productIds.has(pid)) p(`DISCOUNT ${d.id} references missing product ${pid}`);
}

console.log(problems.length ? problems.join("\n") : "NO PROBLEMS FOUND");
console.log(`\nTOTAL PROBLEMS: ${problems.length}`);
console.log(`counts: products=${products.length} orders=${orders.length} customers=${customers.length} integrations=${integrations.length} campaigns=${campaigns.length}`);
