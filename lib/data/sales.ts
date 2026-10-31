import { createRng, pickOne, pickMany, allocateProportionally } from "@/lib/utils";
import type {
  AbandonedCart,
  Campaign,
  Discount,
  FulfillmentStatus,
  InventoryMovement,
  Order,
  OrderLineItem,
  OrderStatus,
  OrderTimelineEvent,
  Payment,
  PaymentStatus,
  Product,
  ReturnRequest,
  SalesChannel,
  Shipment,
  Customer,
} from "@/lib/types";
import { daysAgo, clampToDay } from "./catalog";
import { buildShippingZones } from "./content";

const CHANNELS: SalesChannel[] = [
  "online_store",
  "online_store",
  "online_store",
  "mobile_app",
  "marketplace",
  "wholesale",
  "social",
];

const CARRIERS = ["BlueDart Express", "Delhivery Surface", "Ecom Express", "Ekart Logistics"];

const DISCOUNT_SEED: {
  code: string;
  title: string;
  type: Discount["type"];
  value: number;
  minimumPurchase: number;
  eligibility: Discount["eligibility"];
}[] = [
  { code: "WELCOME10", title: "First order 10% off", type: "percentage", value: 10, minimumPurchase: 999, eligibility: "new" },
  { code: "MONSOON15", title: "Monsoon sale 15% off", type: "percentage", value: 15, minimumPurchase: 2999, eligibility: "all" },
  { code: "FLAT500", title: "Flat ₹500 off", type: "fixed_amount", value: 500, minimumPurchase: 4999, eligibility: "all" },
  { code: "FREESHIP", title: "Free shipping", type: "free_shipping", value: 0, minimumPurchase: 0, eligibility: "all" },
  { code: "VIP20", title: "VIP members 20% off", type: "percentage", value: 20, minimumPurchase: 4999, eligibility: "vip" },
  { code: "RETURN15", title: "Returning customer 15%", type: "percentage", value: 15, minimumPurchase: 1999, eligibility: "returning" },
  { code: "AUDIO100", title: "₹100 off audio", type: "fixed_amount", value: 100, minimumPurchase: 9999, eligibility: "all" },
  { code: "BUNDLE25", title: "Bundle 25% off", type: "percentage", value: 25, minimumPurchase: 9999, eligibility: "all" },
  { code: "FREEDELIV", title: "Free delivery weekend", type: "free_shipping", value: 0, minimumPurchase: 1499, eligibility: "all" },
  { code: "GIFT750", title: "Gift hamper ₹750 off", type: "fixed_amount", value: 750, minimumPurchase: 7999, eligibility: "all" },
  { code: "EXPIRED5", title: "Spring clearance 5%", type: "percentage", value: 5, minimumPurchase: 0, eligibility: "all" },
  { code: "LOYAL30", title: "Loyalty bonus 30%", type: "percentage", value: 30, minimumPurchase: 19999, eligibility: "vip" },
  { code: "SHIPFREE2", title: "Free shipping over 2k", type: "free_shipping", value: 0, minimumPurchase: 1999, eligibility: "all" },
  { code: "CLEARSALE", title: "Clearance 40% off", type: "percentage", value: 40, minimumPurchase: 999, eligibility: "all" },
  { code: "UPI50", title: "₹50 off UPI orders", type: "fixed_amount", value: 50, minimumPurchase: 499, eligibility: "all" },
];

export function buildDiscounts(): Discount[] {
  return DISCOUNT_SEED.map((seed, index) => {
    const active = index !== 10;
    const startsAt = daysAgo(40 - index * 2, 0, 0);
    const expiresAt = daysAgo(-(15 + index * 3), 23, 59);
    return {
      id: `dsc-${String(index + 1).padStart(2, "0")}`,
      code: seed.code,
      title: seed.title,
      type: seed.type,
      value: seed.value,
      minimumPurchase: seed.minimumPurchase,
      usageLimit: index % 4 === 0 ? 200 : null,
      usedCount: 12 + index * 7,
      perCustomerLimit: index % 3 === 0 ? 1 : 5,
      eligibility: seed.eligibility,
      productScope: index % 5 === 0 ? "specific" : "all",
      productIds: [],
      startsAt,
      expiresAt,
      active,
      appliesToShipping: seed.type === "free_shipping",
      createdAt: daysAgo(45 - index * 2),
    } satisfies Discount;
  });
}

function orderStatusFor(days: number, rng: () => number): OrderStatus {
  if (days <= 7) return rng() > 0.45 ? "pending" : "confirmed";
  if (days <= 21) return rng() > 0.4 ? "processing" : "confirmed";
  if (days <= 60) return rng() > 0.35 ? "shipped" : "processing";
  if (days <= 150) return rng() > 0.12 ? "delivered" : "shipped";
  return rng() > 0.12 ? "delivered" : "cancelled";
}

function paymentStatusFor(status: OrderStatus, rng: () => number): PaymentStatus {
  if (status === "cancelled") return rng() > 0.6 ? "refunded" : "failed";
  if (status === "pending") return "pending";
  if (status === "delivered") return "paid";
  return rng() > 0.12 ? "paid" : "authorized";
}

function fulfillmentStatusFor(status: OrderStatus): FulfillmentStatus {
  switch (status) {
    case "pending":
    case "confirmed":
      return "unfulfilled";
    case "processing":
      return "partially_fulfilled";
    case "shipped":
    case "delivered":
      return "fulfilled";
    case "cancelled":
      return "unfulfilled";
    default:
      return "unfulfilled";
  }
}

export function buildOrders(
  products: Product[],
  customers: Customer[],
  discounts: Discount[],
  count = 240,
): Order[] {
  const rng = createRng(20260920);
  const sellable = products.filter((p) => p.status === "active");

  // Not every customer shops the same amount: a small group places most of
  // the orders, which is what gives the customer segments something to say.
  const customerWeights = customers.map((_, index) => {
    const tier = index % 10;
    if (tier < 2) return 12;
    if (tier < 4) return 6;
    if (tier < 6) return 3;
    return 1;
  });

  const pickCustomer = (notBefore: number) => {
    const eligible = customers.filter(
      (customer) => new Date(customer.createdAt).getTime() <= notBefore,
    );
    const pool = eligible.length ? eligible : customers;
    const weights = pool.map((customer) => customerWeights[customers.indexOf(customer)]);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let ticket = rng() * total;
    for (let i = 0; i < pool.length; i += 1) {
      ticket -= weights[i];
      if (ticket <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  };

  // The order history covers a full year so the 12-month analytics series has
  // something real to aggregate.
  const drafts = Array.from({ length: count }, (_, index) => {
    const days = Math.floor(Math.pow(rng(), 1.6) * 330);
    const createdAt = clampToDay(daysAgo(days, 8 + Math.floor(rng() * 12), Math.floor(rng() * 60)));
    const status = orderStatusFor(days, rng);
    const paymentStatus = paymentStatusFor(status, rng);
    const fulfillmentStatus = fulfillmentStatusFor(status);
    const channel = pickOne(rng, CHANNELS);
    const customer = pickCustomer(new Date(createdAt).getTime());

    const lineCount = 1 + Math.floor(rng() * 3);
    const baseLines: {
      product: Product;
      variant: Product["variants"][number];
      quantity: number;
      unitPrice: number;
      gross: number;
      baseDiscount: number;
    }[] = Array.from({ length: lineCount }, () => {
      const product = pickOne(rng, sellable);
      const variant = pickOne(rng, product.variants);
      const quantity = 1 + Math.floor(rng() * 2);
      const unitPrice = variant.price;
      const gross = unitPrice * quantity;
      const baseDiscount = Math.round(gross * 0.05 * Math.floor(rng() * 3));
      return { product, variant, quantity, unitPrice, gross, baseDiscount };
    });

    const subtotal = baseLines.reduce((sum, line) => sum + line.gross, 0);
    const discount = rng() > 0.68 ? pickOne(rng, discounts.filter((d) => d.active)) : undefined;

    // The coupon has to show up in the money. A code attached to an order that
    // was never applied is worse than no code at all.
    const eligibleLines = discount?.productScope === "specific"
      ? baseLines.filter((line) => discount.productIds.includes(line.product.id))
      : baseLines;
    const eligibleSubtotal = eligibleLines.reduce((sum, line) => sum + line.gross, 0);

    let couponDiscount = 0;
    const couponQualifies = Boolean(
      discount && eligibleSubtotal >= discount.minimumPurchase,
    );
    if (discount && couponQualifies) {
      if (discount.type === "percentage") {
        couponDiscount = Math.round((eligibleSubtotal * discount.value) / 100);
      } else if (discount.type === "fixed_amount") {
        couponDiscount = Math.min(discount.value, eligibleSubtotal);
      }
    }
    const couponShares = allocateProportionally(
      eligibleLines.map((line) => line.gross),
      couponDiscount,
    );
    const couponShareByLine = new Map<number, number>();
    baseLines.forEach((line, lineIndex) => {
      const eligibleIndex = eligibleLines.indexOf(line);
      if (eligibleIndex >= 0) couponShareByLine.set(lineIndex, couponShares[eligibleIndex] ?? 0);
    });

    const lineItems: OrderLineItem[] = baseLines.map((line, lineIndex) => {
      const discountAmount = line.baseDiscount + (couponShareByLine.get(lineIndex) ?? 0);
      const taxable = Math.max(0, line.gross - discountAmount);
      const tax = Math.round(taxable * 0.18);
      return {
        id: `oli-draft-${lineIndex + 1}`,
        productId: line.product.id,
        variantId: line.variant.id,
        title: line.product.title,
        variantTitle: line.variant.title,
        sku: line.variant.sku,
        assetId: line.product.images[0],
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        compareAtPrice: line.variant.compareAtPrice,
        discount: discountAmount,
        tax,
        total: taxable + tax,
      } as OrderLineItem;
    });

    const discountTotal = lineItems.reduce((sum, item) => sum + item.discount, 0);
    const taxTotal = lineItems.reduce((sum, item) => sum + item.tax, 0);
    const couponGivesFreeShipping = Boolean(
      discount && couponQualifies && discount.type === "free_shipping",
    );
    const shippingTotal =
      couponGivesFreeShipping || subtotal > 1999 ? 0 : 79;
    const total = subtotal - discountTotal + taxTotal + shippingTotal;

    const timeline: OrderTimelineEvent[] = [
      {
        id: `evt-${index + 1}-1`,
        type: "created",
        title: "Order placed",
        description: `Order received via ${channel.replace(/_/g, " ")}.`,
        actor: customer.name,
        createdAt,
      },
    ];
    if (paymentStatus === "paid" || paymentStatus === "authorized") {
      timeline.push({
        id: `evt-${index + 1}-2`,
        type: "payment",
        title: "Payment received",
        description: "Simulated online payment authorised.",
        actor: "System",
        createdAt: clampToDay(
          new Date(new Date(createdAt).getTime() + 1000 * 60 * 4).toISOString(),
        ),
      });
    }
    if (fulfillmentStatus !== "unfulfilled") {
      timeline.push({
        id: `evt-${index + 1}-3`,
        type: "fulfillment",
        title: "Shipped",
        description: `Handed to ${pickOne(rng, CARRIERS)}.`,
        actor: "Fulfillment team",
        createdAt: clampToDay(
          new Date(new Date(createdAt).getTime() + 1000 * 60 * 60 * 22).toISOString(),
        ),
      });
    }

    return {
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      createdAt,
      updatedAt: clampToDay(
        new Date(new Date(createdAt).getTime() + 1000 * 60 * 60 * 30).toISOString(),
      ),
      status,
      paymentStatus,
      fulfillmentStatus,
      currency: "INR",
      channel,
      lineItems,
      subtotal,
      discountTotal,
      taxTotal,
      shippingTotal,
      handlingFee: 0,
      total,
      refundedTotal: 0,
      discountCode: couponQualifies ? discount?.code : undefined,
      shippingAddress: customer.addresses[0],
      billingAddress: customer.addresses[0],
      shippingMethodId: "ship-standard",
      shippingMethodName: shippingTotal === 0 ? "Standard Free Shipping" : "Standard Shipping",
      customerNote: index % 17 === 3 ? "Please call before delivery." : undefined,
      internalNotes: [],
      timeline,
      trackingNumber:
        fulfillmentStatus === "fulfilled"
          ? `BD${String(100000000 + index * 7919).slice(0, 9)}${index % 10}`
          : undefined,
      carrier: fulfillmentStatus === "fulfilled" ? pickOne(rng, CARRIERS) : undefined,
    } as Omit<Order, "id" | "orderNumber">;
  });

  // Newest first, and the identifiers follow the chronology: the most recent
  // order is #NW-4820 and the oldest one carries the highest number.
  drafts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return drafts.map((draft, index) => ({
    ...draft,
    id: `ord-${String(index + 1).padStart(4, "0")}`,
    orderNumber: `#NW-${String(4820 + index)}`,
    lineItems: draft.lineItems.map((line, lineIndex) => ({
      ...line,
      id: `oli-${index + 1}-${lineIndex + 1}`,
    })),
    timeline: draft.timeline.map((event, eventIndex) => ({
      ...event,
      id: `evt-${index + 1}-${eventIndex + 1}`,
    })),
  })) as Order[];
}

export function buildPayments(orders: Order[]): Payment[] {
  const rng = createRng(31337);
  const paidOrders = orders.filter((order) => order.paymentStatus !== "pending").slice(0, 40);
  return paidOrders.map((order, index) => {
    const method: Payment["method"] =
      order.channel === "wholesale" ? "manual" : rng() > 0.28 ? "online_simulated" : "cod";
    const refunded = order.paymentStatus === "refunded";
    const refundAmount = refunded ? order.total : 0;
    return {
      id: `pay-${String(index + 1).padStart(3, "0")}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      amount: order.total,
      currency: order.currency,
      status: refunded ? "refunded" : order.paymentStatus === "paid" ? "paid" : "pending",
      method,
      gateway:
        method === "online_simulated"
          ? "SimulatedPay"
          : method === "cod"
            ? "Cash on Delivery"
            : "Manual Transfer",
      reference: `TXN${String(880000 + index * 37).slice(0, 6)}${index % 97}`,
      cardLast4: method === "online_simulated" ? String(1000 + ((index * 137) % 8999)).slice(-4) : undefined,
      createdAt: order.createdAt,
      refunds: refunded
        ? [
            {
              id: `rfd-${index + 1}`,
              amount: refundAmount,
              reason: "Customer request — size exchange not available",
              reference: `RFD${String(440000 + index * 53).slice(0, 6)}`,
              createdAt: clampToDay(
                new Date(new Date(order.createdAt).getTime() + 1000 * 60 * 60 * 96).toISOString(),
              ),
            },
          ]
        : [],
    } satisfies Payment;
  });
}

export function buildShipments(orders: Order[]): Shipment[] {
  const rng = createRng(5150);
  const shipped = orders.filter((order) => order.fulfillmentStatus === "fulfilled").slice(0, 20);
  const methodCost = new Map(
    buildShippingZones()
      .flatMap((zone) => zone.methods)
      .map((method) => [method.id, method.type === "free" ? 0 : method.price]),
  );
  return shipped.map((order, index) => {
    const delivered = order.status === "delivered";
    const shippedAt = new Date(
      new Date(order.createdAt).getTime() + 1000 * 60 * 60 * 22,
    );
    return {
      id: `shp-${String(index + 1).padStart(3, "0")}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      carrier: order.carrier ?? pickOne(rng, CARRIERS),
      trackingNumber: order.trackingNumber ?? `BD${100000000 + index * 31}`,
      methodName: order.shippingMethodName,
      zoneId: "zone-domestic",
      status: delivered ? "delivered" : pickOne(rng, ["in_transit", "out_for_delivery", "label_created"] as const),
      estimatedDelivery: clampToDay(
        new Date(shippedAt.getTime() + 1000 * 60 * 60 * 24 * 4).toISOString(),
      ),
      shippedAt: clampToDay(shippedAt.toISOString()),
      deliveredAt: delivered
        ? clampToDay(new Date(shippedAt.getTime() + 1000 * 60 * 60 * 24 * 3).toISOString())
        : null,
      cost: methodCost.get(order.shippingMethodId) ?? 0,
      itemCount: order.lineItems.reduce((sum, item) => sum + item.quantity, 0),
    } satisfies Shipment;
  });
}

export function buildReturns(orders: Order[]): ReturnRequest[] {
  const rng = createRng(8899);
  const reasons = [
    "Size did not fit",
    "Arrived damaged",
    "Not as described",
    "Changed my mind",
    "Wrong item delivered",
    "Quality not as expected",
  ];
  const eligible = orders.filter((order) => order.status === "delivered").slice(0, 15);
  return eligible.map((order, index) => {
    const item = pickOne(rng, order.lineItems);
    // A return can cover every unit the customer received, not just one.
    const quantity = item.quantity;
    const refundAmount = Math.round(item.unitPrice * quantity * 0.9);
    const status: ReturnRequest["status"] =
      index % 7 === 0
        ? "requested"
        : index % 7 === 1
          ? "approved"
          : index % 7 === 2
            ? "rejected"
            : index % 7 === 3
              ? "in_transit"
              : index % 7 === 4
                ? "received"
                : index % 7 === 5
                  ? "refunded"
                  : "restocked";
    const createdAt = clampToDay(
      new Date(new Date(order.createdAt).getTime() + 1000 * 60 * 60 * 24 * 6).toISOString(),
    );
    // A return can never be updated before it was raised.
    const updatedAt = clampToDay(
      new Date(
        Math.max(
          new Date(createdAt).getTime(),
          new Date(daysAgo(Math.floor(rng() * 20), 15, 0)).getTime(),
        ),
      ).toISOString(),
    );
    return {
      id: `ret-${String(index + 1).padStart(3, "0")}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      items: [
        {
          productId: item.productId,
          title: item.title,
          variantTitle: item.variantTitle,
          quantity,
        },
      ],
      reason: pickOne(rng, reasons),
      status,
      refundAmount,
      createdAt,
      updatedAt,
      resolutionNote:
        status === "rejected"
          ? "Return window of 7 days had elapsed at the time of request."
          : status === "refunded"
            ? "Refund processed to the original payment method (simulated)."
            : undefined,
    } satisfies ReturnRequest;
  });
}

export function buildAbandonedCarts(
  products: Product[],
  customers: Customer[],
  count = 14,
): AbandonedCart[] {
  const rng = createRng(6060);
  const sellable = products.filter((p) => p.status === "active");
  return Array.from({ length: count }, (_, index) => {
    const customer = customers[(index * 5) % customers.length];
    const itemCount = 1 + Math.floor(rng() * 3);
    const items = Array.from({ length: itemCount }, () => {
      const product = pickOne(rng, sellable);
      const variant = pickOne(rng, product.variants);
      return {
        productId: product.id,
        title: product.title,
        variantTitle: variant.title,
        quantity: 1 + Math.floor(rng() * 2),
        price: variant.price,
      };
    });
    const cartValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const days = 1 + Math.floor(rng() * 24);
    const createdAt = clampToDay(daysAgo(days, 19, 12));
    const lastActivityAt = clampToDay(
      new Date(
        Math.max(
          new Date(createdAt).getTime(),
          new Date(daysAgo(Math.max(0, days - 1), 21, 40)).getTime(),
        ),
      ).toISOString(),
    );
    const recoveryStatus: AbandonedCart["recoveryStatus"] =
      index % 5 === 0
        ? "recovered"
        : index % 5 === 1
          ? "recovery_sent"
          : index % 5 === 2
            ? "expired"
            : "not_contacted";
    return {
      id: `abc-${String(index + 1).padStart(3, "0")}`,
      customerId: customer.id,
      customerName: customer.name,
      email: customer.email,
      items,
      cartValue,
      currency: "INR",
      createdAt,
      lastActivityAt,
      recoveryStatus,
      recoveryToken: `rcv_${(index + 1).toString(36)}${"abcdefgh"[index % 8]}${Math.floor(rng() * 9000 + 1000)}`,
      recoveredAt:
        recoveryStatus === "recovered"
          ? clampToDay(
              new Date(
                Math.min(
                  new Date(lastActivityAt).getTime(),
                  new Date(daysAgo(Math.max(0, days - 3), 10, 15)).getTime(),
                ),
              ).toISOString(),
            )
          : undefined,
    } satisfies AbandonedCart;
  });
}

export function buildInventoryMovements(products: Product[], count = 30): InventoryMovement[] {
  const rng = createRng(1212);
  const types: InventoryMovement["type"][] = [
    "received",
    "sold",
    "adjusted",
    "returned",
    "damaged",
    "reserved",
  ];
  const reasons: Record<InventoryMovement["type"], string> = {
    received: "Purchase order received",
    sold: "Stock deducted on order",
    adjusted: "Manual stock correction",
    returned: "Customer return restocked",
    damaged: "Damaged in warehouse",
    reserved: "Reserved for pending order",
  };
  const movements = Array.from({ length: count }, (_, index) => {
    const product = pickOne(rng, products);
    const variant = pickOne(rng, product.variants);
    const type = pickOne(rng, types);
    const quantity = type === "sold" || type === "damaged" ? -(1 + Math.floor(rng() * 3)) : 1 + Math.floor(rng() * 25);
    return {
      id: `mov-${String(index + 1).padStart(3, "0")}`,
      productId: product.id,
      variantId: variant.id,
      productTitle: product.title,
      sku: variant.sku,
      type,
      quantity,
      reason: reasons[type],
      note: index % 6 === 0 ? "Batch B-2026 audit" : undefined,
      resultingStock: 0,
      createdAt: clampToDay(daysAgo(index % 30, 10, (index * 7) % 60)),
      actor: pickOne(rng, ["Warehouse", "Naveen Raghavan", "Priya Deshmukh", "Karthik Iyer"]),
    } satisfies InventoryMovement;
  });

  // "Resulting stock" is the stock on hand *after* the movement, so it has to
  // be a running balance walked back from the current inventory — not the
  // current inventory plus the delta.
  const currentStock = new Map(
    products.flatMap((product) =>
      product.variants.map((variant) => [variant.id, variant.inventory] as const),
    ),
  );
  const byVariant = new Map<string, InventoryMovement[]>();
  movements.forEach((movement) => {
    const key = movement.variantId ?? movement.productId;
    const list = byVariant.get(key) ?? [];
    list.push(movement);
    byVariant.set(key, list);
  });
  byVariant.forEach((list, key) => {
    const sorted = [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    let running = currentStock.get(key) ?? 0;
    for (let i = sorted.length - 1; i >= 0; i -= 1) {
      sorted[i].resultingStock = Math.max(0, running);
      running -= sorted[i].quantity;
    }
  });

  return movements;
}

export function buildCampaigns() {
  // The status, the window and the numbers all describe the same campaign, so
  // a campaign that has not run yet never reports sends or revenue.
  const seed: {
    name: string;
    channel: Campaign["channel"];
    audience: string;
    status: Campaign["status"];
    startOffset: number;
    endOffset: number;
    sent: number;
    clicks: number;
    conversions: number;
    revenue: number;
    spend: number;
  }[] = [
    { name: "Monsoon Essentials Sale", channel: "email", audience: "All subscribers", status: "completed", startOffset: 40, endOffset: 34, sent: 12480, clicks: 3120, conversions: 214, revenue: 486000, spend: 0 },
    { name: "Back in Stock — Aria Headphones", channel: "whatsapp", audience: "Waitlist subscribers", status: "completed", startOffset: 36, endOffset: 30, sent: 2140, clicks: 1180, conversions: 96, revenue: 224000, spend: 0 },
    { name: "Weekend Flash — Skin Routine", channel: "sms", audience: "Engaged 30 days", status: "completed", startOffset: 32, endOffset: 26, sent: 6800, clicks: 940, conversions: 62, revenue: 128000, spend: 4200 },
    { name: "Retargeting — Cart Abandoners", channel: "ads", audience: "Abandoned cart visitors", status: "running", startOffset: 12, endOffset: -6, sent: 0, clicks: 2410, conversions: 138, revenue: 196000, spend: 18600 },
    { name: "Diwali Gifting Guide", channel: "email", audience: "VIP + loyal customers", status: "running", startOffset: 4, endOffset: -10, sent: 9340, clicks: 4120, conversions: 388, revenue: 942000, spend: 0 },
    { name: "New Arrivals — Trail Season", channel: "email", audience: "Sports category buyers", status: "scheduled", startOffset: -8, endOffset: -18, sent: 0, clicks: 0, conversions: 0, revenue: 0, spend: 0 },
    { name: "Loyalty Double Points Week", channel: "email", audience: "Loyalty segment", status: "paused", startOffset: 18, endOffset: -12, sent: 3980, clicks: 1520, conversions: 142, revenue: 262000, spend: 0 },
    { name: "Win a Weekend Trip", channel: "social", audience: "Instagram followers", status: "draft", startOffset: -20, endOffset: -30, sent: 0, clicks: 0, conversions: 0, revenue: 0, spend: 9800 },
  ];
  return seed.map((item, index) => ({
    id: `cmp-${String(index + 1).padStart(2, "0")}`,
    name: item.name,
    channel: item.channel,
    status: item.status,
    audience: item.audience,
    sent: item.sent,
    clicks: item.clicks,
    conversions: item.conversions,
    revenue: item.revenue,
    spend: item.spend,
    startsAt: daysAgo(item.startOffset, 9, 0),
    endsAt: daysAgo(item.endOffset, 23, 0),
  }));
}

export function pickRandomProducts(products: Product[], count: number) {
  return pickMany(createRng(99), products, count);
}
