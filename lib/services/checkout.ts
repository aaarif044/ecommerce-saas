"use client";

import type {
  CartItem,
  CheckoutDetails,
  Discount,
  Order,
  OrderLineItem,
  Payment,
  PaymentMethod,
  Shipment,
  ShippingMethod,
  ShippingZone,
  StoreShippingSettings,
  TaxSettings,
} from "@/lib/types";
import { useCartStore } from "@/lib/store/cart-store";
import { useDataStore } from "@/lib/store/data-store";
import { allocateProportionally } from "@/lib/utils";
import { MockApiError, simulateLatency } from "./errors";

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  itemCount: number;
  taxRate: number;
  /** The blended tax rate actually applied, as a percentage. */
  effectiveTaxRate: number;
  /** A handling fee such as the cash-on-delivery surcharge. */
  handlingFee: number;
  freeShippingApplied: boolean;
  freeShippingRemaining: number;
  /** Per-line discount allocation. Sums exactly to `discountTotal`. */
  lineDiscounts: number[];
  /** Per-line tax. Sums exactly to `taxTotal`. */
  lineTaxes: number[];
  /** The discount that actually qualified, or null when it did not. */
  appliedDiscount: Discount | null;
}

/**
 * The shipping price for a chosen method. The method owns its own free
 * threshold: a method that declares one becomes free at that value, and a
 * method that declares none is never free. The store-wide threshold is only
 * used when no method has been quoted at all.
 */
export interface ShippingQuote {
  /** Price charged for the method. */
  price: number;
  /** Cart value at which the method becomes free; `null` means never. */
  freeThreshold: number | null;
  /** True when the method is free regardless of the cart value. */
  free: boolean;
}

export const DEMO_TAX_RATE = 0.18;

/**
 * The next order number. Deriving it from the highest existing number (rather
 * than the number of orders) keeps numbers unique after an order is removed.
 */
export function nextOrderSequence(orders: { orderNumber: string }[]): number {
  const highest = orders.reduce((max, order) => {
    const match = /#NW-(\d+)/.exec(order.orderNumber);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 4819);
  return highest + 1;
}

/** Builds a quote for a shipping method. */
export function shippingQuoteFor(
  method: ShippingMethod | null | undefined,
  fallbackThreshold: number,
): ShippingQuote {
  if (!method) return { price: 0, freeThreshold: fallbackThreshold, free: false };
  return {
    price: method.type === "free" ? 0 : method.price,
    freeThreshold: method.freeThreshold,
    free: method.type === "free",
  };
}

/** The method a cart is quoted against before the shopper picks one. */
export function defaultShippingMethod(
  zones: ShippingZone[],
  settings: StoreShippingSettings,
): ShippingMethod | null {
  const zone =
    zones.find((candidate) => candidate.id === settings.defaultZoneId) ?? zones[0];
  return zone?.methods[0] ?? null;
}

/**
 * Splits a total across lines so the parts add up to the whole. The naive
 * `Math.round(line * total)` leaves rounding dust behind, which makes the
 * line items of an order disagree with the order total.
 */
export { allocateProportionally } from "@/lib/utils";

export function calculateTotals(
  items: CartItem[],
  options: {
    discount?: Discount | null;
    shipping?: ShippingQuote | null;
    freeShippingThreshold?: number;
    taxRate?: number;
    /** Per-product tax rate, resolved from the store's tax configuration. */
    taxRateFor?: (productId: string) => number;
    /** A handling fee, e.g. the cash-on-delivery surcharge. */
    handlingFee?: number;
  } = {},
): CartTotals {
  const {
    discount = null,
    shipping = null,
    freeShippingThreshold = 1999,
    taxRate = DEMO_TAX_RATE,
    taxRateFor,
    handlingFee = 0,
  } = options;

  const lineSubtotals = items.map((item) => item.unitPrice * item.quantity);
  const subtotal = lineSubtotals.reduce((sum, value) => sum + value, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // A coupon restricted to specific products only discounts those products.
  const eligibleIndexes = discount?.productScope === "specific"
    ? items
        .map((item, index) => (discount.productIds.includes(item.productId) ? index : -1))
        .filter((index) => index >= 0)
    : items.map((_, index) => index);
  const eligibleSubtotal = eligibleIndexes.reduce(
    (sum, index) => sum + (lineSubtotals[index] ?? 0),
    0,
  );

  // The minimum purchase gates the whole coupon, including the free-shipping
  // benefit — otherwise a shopper could keep a free-shipping coupon after
  // shrinking their cart below the qualifying amount.
  const qualifies =
    discount !== null && eligibleSubtotal >= discount.minimumPurchase;

  let discountTotal = 0;
  if (discount && qualifies) {
    if (discount.type === "percentage") {
      discountTotal = Math.round((eligibleSubtotal * discount.value) / 100);
    } else if (discount.type === "fixed_amount") {
      discountTotal = Math.min(discount.value, eligibleSubtotal);
    }
  }

  const lineDiscounts = allocateProportionally(
    eligibleIndexes.map((index) => lineSubtotals[index] ?? 0),
    discountTotal,
  );
  const discountsByLine = new Array<number>(items.length).fill(0);
  eligibleIndexes.forEach((lineIndex, position) => {
    discountsByLine[lineIndex] = lineDiscounts[position] ?? 0;
  });

  const lineTaxes = lineSubtotals.map((lineSubtotal, index) => {
    const rate = taxRateFor
      ? taxRateFor(items[index]?.productId ?? "")
      : taxRate;
    return Math.round(Math.max(0, lineSubtotal - discountsByLine[index]) * rate);
  });
  const taxTotal = lineTaxes.reduce((sum, value) => sum + value, 0);
  const taxable = Math.max(0, subtotal - discountTotal);

  const freeShippingCoupon = Boolean(discount && qualifies && discount.type === "free_shipping");
  // A method that declares no free threshold is never free. Only fall back to
  // the store-wide threshold when no method was quoted at all.
  const threshold = shipping ? shipping.freeThreshold : freeShippingThreshold;
  const freeShippingApplied =
    !freeShippingCoupon &&
    threshold !== null &&
    threshold > 0 &&
    taxable >= threshold;

  let shippingTotal = shipping?.price ?? 0;
  if (freeShippingCoupon || freeShippingApplied || shipping?.free) shippingTotal = 0;

  const fee = Math.max(0, handlingFee);
  const total = taxable + taxTotal + shippingTotal + fee;

  return {
    subtotal,
    discountTotal,
    shippingTotal,
    taxTotal,
    total,
    itemCount,
    taxRate,
    handlingFee: fee,
    effectiveTaxRate: taxable > 0 ? Number(((taxTotal / taxable) * 100).toFixed(1)) : 0,
    freeShippingApplied,
    freeShippingRemaining:
      threshold === null || threshold <= 0
        ? 0
        : Math.max(0, threshold - taxable),
    lineDiscounts: discountsByLine,
    lineTaxes,
    appliedDiscount: qualifies ? discount : null,
  };
}

export function validateDiscount(
  code: string,
  subtotal: number,
): { discount: Discount | null; error?: string } {
  const state = useDataStore.getState();
  const discount = state.discounts.find(
    (item) => item.code.toLowerCase() === code.trim().toLowerCase(),
  );
  if (!discount) return { discount: null, error: "That coupon code was not found." };
  if (!discount.active) return { discount: null, error: "That coupon is no longer active." };
  const now = Date.now();
  if (new Date(discount.startsAt).getTime() > now) {
    return { discount: null, error: "That coupon is not active yet." };
  }
  if (new Date(discount.expiresAt).getTime() < now) {
    return { discount: null, error: "That coupon has expired." };
  }
  if (subtotal < discount.minimumPurchase) {
    return {
      discount: null,
      error: `This coupon needs a minimum purchase of ₹${discount.minimumPurchase.toLocaleString("en-IN")}.`,
    };
  }
  return { discount };
}

export const cartService = {
  addItem(productId: string, variantId: string, quantity = 1) {
    const state = useDataStore.getState();
    const product = state.products.find((item) => item.id === productId);
    if (!product) throw new MockApiError("Product not found.", "not_found", 404);
    if (product.status !== "active" || product.visibility === "hidden") {
      throw new MockApiError("This product is not available for purchase.", "unavailable");
    }
    const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
    if (!variant) throw new MockApiError("Select a variant before adding to cart.", "validation");
    if (variant.inventory <= 0) {
      throw new MockApiError("This variant is out of stock.", "unavailable");
    }
    useCartStore.getState().addItem({
      id: `cart-${variant.id}-${Date.now().toString(36)}`,
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      variantTitle: variant.title,
      slug: product.slug,
      sku: variant.sku,
      assetId: product.images[0],
      unitPrice: variant.price,
      quantity: Math.min(quantity, variant.inventory),
      weight: variant.weight,
      maxQuantity: variant.inventory,
    });
  },

  clear() {
    useCartStore.getState().clear();
  },
};

export interface PlaceOrderInput {
  details: CheckoutDetails;
  items: CartItem[];
  totals: CartTotals;
  discount: Discount | null;
}

/**
 * The tax rate that applies to a product, resolved from the store's tax
 * configuration. A product that has been filed under a tax category uses that
 * category's rate; anything else falls back to the category the highest
 * priority rule for the store's country points at, and finally to the first
 * configured category.
 */
export function taxRateResolver(tax: TaxSettings | undefined): (productId: string) => number {
  const categories = tax?.taxCategories ?? [];
  const activeRules = (tax?.rules ?? []).filter((rule) => rule.active);
  // A rule for the store's own state wins; otherwise the highest priority
  // rule for the country does.
  const matchingRule =
    activeRules.find(
      (rule) => rule.countryCode === tax?.countryCode && rule.state === tax?.state,
    ) ??
    activeRules
      .filter((rule) => rule.countryCode === tax?.countryCode)
      .sort((a, b) => b.priority - a.priority)[0];
  const fallbackCategory =
    categories.find((category) => category.id === matchingRule?.categoryId) ?? categories[0];

  return (productId: string) => {
    const category =
      categories.find((candidate) => candidate.productIds.includes(productId)) ??
      fallbackCategory;
    return category ? category.rate / 100 : 0;
  };
}

export const checkoutService = {
  async placeOrder(input: PlaceOrderInput): Promise<{ order: Order; payment: Payment }> {
    await simulateLatency(650, 400);
    const state = useDataStore.getState();
    if (!input.items.length) {
      throw new MockApiError("Your cart is empty.", "empty_cart");
    }
    if (!input.details.email.includes("@")) {
      throw new MockApiError("Enter a valid email address.", "validation");
    }
    if (!input.details.shippingAddress.line1 || !input.details.shippingAddress.city) {
      throw new MockApiError("A complete shipping address is required.", "validation");
    }

    const now = new Date().toISOString();
    const orderId = `ord-${Date.now().toString(36)}`;
    const sequence = nextOrderSequence(state.orders);

    // The discount and tax are allocated by `calculateTotals`, so the line
    // items add up to the order totals exactly instead of leaving rounding
    // dust behind.
    const lineItems: OrderLineItem[] = input.items.map((item, index) => {
      const subtotal = item.unitPrice * item.quantity;
      const discountShare = input.totals.lineDiscounts[index] ?? 0;
      const tax = input.totals.lineTaxes[index] ?? 0;
      return {
        id: `oli-${orderId}-${index + 1}`,
        productId: item.productId,
        variantId: item.variantId,
        title: item.title,
        variantTitle: item.variantTitle,
        sku: item.sku,
        assetId: item.assetId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: discountShare,
        tax,
        total: subtotal - discountShare + tax,
      };
    });

    const shippingAddress = {
      name: input.details.shippingAddress.name,
      phone: input.details.shippingAddress.phone,
      line1: input.details.shippingAddress.line1,
      line2: input.details.shippingAddress.line2,
      city: input.details.shippingAddress.city,
      state: input.details.shippingAddress.state,
      postalCode: input.details.shippingAddress.postalCode,
      country: input.details.shippingAddress.country,
      countryCode: input.details.shippingAddress.countryCode,
    };

    const billingAddress = input.details.billingSameAsShipping
      ? shippingAddress
      : {
          name: input.details.billingAddress.name,
          phone: input.details.billingAddress.phone,
          line1: input.details.billingAddress.line1,
          line2: input.details.billingAddress.line2,
          city: input.details.billingAddress.city,
          state: input.details.billingAddress.state,
          postalCode: input.details.billingAddress.postalCode,
          country: input.details.billingAddress.country,
          countryCode: input.details.billingAddress.countryCode,
        };

    const method: PaymentMethod = input.details.paymentMethod;
    const storeSettings =
      state.settingsByStore[state.activeStoreId] ??
      state.settingsByStore[Object.keys(state.settingsByStore)[0]];
    const shippingMethod = state.shippingZones
      .flatMap((zone) => zone.methods)
      .find((candidate) => candidate.id === input.details.shippingMethodId);
    const shippingMethodName = shippingMethod?.name ?? "Standard shipping";
    const shippingCost = shippingMethod
      ? shippingMethod.type === "free"
        ? 0
        : shippingMethod.price
      : 0;
    const appliedDiscount = input.totals.appliedDiscount ?? null;
    const paymentId = `pay-${Date.now().toString(36)}`;
    const shipmentId = `shp-${Date.now().toString(36)}`;

    const order: Order = {
      id: orderId,
      orderNumber: `#NW-${sequence}`,
      customerId: "",
      customerName: input.details.shippingAddress.name || input.details.email.split("@")[0],
      customerEmail: input.details.email,
      createdAt: now,
      updatedAt: now,
      status: "pending",
      paymentStatus: method === "cod" ? "pending" : "paid",
      fulfillmentStatus: "unfulfilled",
      currency: storeSettings.regional.currency,
      channel: "online_store",
      lineItems,
      subtotal: input.totals.subtotal,
      discountTotal: input.totals.discountTotal,
      taxTotal: input.totals.taxTotal,
      shippingTotal: input.totals.shippingTotal,
      handlingFee: input.totals.handlingFee,
      total: input.totals.total,
      refundedTotal: 0,
      discountCode: appliedDiscount?.code,
      shippingAddress,
      billingAddress,
      shippingMethodId: input.details.shippingMethodId ?? "ship-standard",
      shippingMethodName:
        input.totals.shippingTotal === 0 ? `Free ${shippingMethodName}` : shippingMethodName,
      paymentId,
      shipmentId,
      customerNote: input.details.customerNote || undefined,
      internalNotes: [],
      timeline: [
        {
          id: `evt-${orderId}-1`,
          type: "created",
          title: "Order placed",
          description: "Placed from the demo storefront checkout.",
          actor: input.details.shippingAddress.name || input.details.email.split("@")[0],
          createdAt: now,
        },
        {
          id: `evt-${orderId}-2`,
          type: "payment",
          title:
            method === "cod"
              ? "Cash on delivery selected"
              : method === "manual"
                ? "Manual payment selected"
                : "Simulated payment authorised",
          description: "No real payment was processed.",
          actor: "Demo checkout",
          createdAt: now,
        },
      ],
    };

    const payment: Payment = {
      id: paymentId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      amount: order.total,
      currency: order.currency,
      status: method === "cod" ? "pending" : "paid",
      method,
      gateway:
        method === "cod" ? "Cash on Delivery" : method === "manual" ? "Manual Transfer" : "SimulatedPay",
      reference: `TXN${Math.floor(Math.random() * 900000 + 100000)}`,
      cardLast4: method === "online_simulated" ? "4242" : undefined,
      createdAt: now,
      refunds: [],
    };

    const shipment: Shipment = {
      id: shipmentId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      carrier: shippingMethod?.carrier ?? "BlueDart Express",
      trackingNumber: `BD${Math.floor(Math.random() * 900000000 + 100000000)}`,
      methodName: order.shippingMethodName,
      zoneId: state.shippingZones.find((zone) =>
        zone.methods.some((candidate) => candidate.id === input.details.shippingMethodId),
      )?.id ?? storeSettings.shipping.defaultZoneId,
      status: "label_created",
      estimatedDelivery: new Date(Date.now() + 4 * 86400000).toISOString(),
      shippedAt: null,
      deliveredAt: null,
      cost: shippingCost,
      itemCount: order.lineItems.reduce((sum, item) => sum + item.quantity, 0),
    };

    const updatedProducts = state.products.map((product) => {
      const affected = input.items.filter((item) => item.productId === product.id);
      if (!affected.length) return product;
      const variants = product.variants.map((variant) => {
        const match = affected.find((item) => item.variantId === variant.id);
        if (!match) return variant;
        return { ...variant, inventory: Math.max(0, variant.inventory - match.quantity) };
      });
      return {
        ...product,
        variants,
        inventory: variants.reduce((sum, variant) => sum + variant.inventory, 0),
        updatedAt: now,
      };
    });

    state.patch({
      orders: [order, ...state.orders],
      payments: [payment, ...state.payments],
      shipments: [shipment, ...state.shipments],
      products: updatedProducts,
      notifications: [
        {
          id: `ntf-${Date.now().toString(36)}`,
          type: "order" as const,
          severity: "success" as const,
          title: `Order ${order.orderNumber} received`,
          body: `${order.customerName} placed a demo order worth ₹${order.total.toLocaleString("en-IN")}.`,
          createdAt: now,
          read: false,
          href: "/dashboard/orders",
        },
        ...state.notifications,
      ],
    });

    useCartStore.getState().clear();
    return { order, payment };
  },
};
