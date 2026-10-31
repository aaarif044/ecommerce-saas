/**
 * Exercises the mock service layer against the live store and asserts the
 * behaviours that used to be broken.
 */
import { useDataStore } from "@/lib/store/data-store";
import { orderService, paymentService } from "@/lib/services/sales";
import { productService } from "@/lib/services/catalog";
import { calculateTotals, checkoutService, shippingQuoteFor, taxRateResolver } from "@/lib/services/checkout";
import { settingsService } from "@/lib/services/settings";
import { buildWhatsappCheckout } from "@/lib/services/whatsapp";
import type { CartItem } from "@/lib/types";

const failures: string[] = [];
function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  const state = useDataStore.getState();

  /* ---------------- payment refund updates the linked order ---------------- */
  console.log("\npaymentService.refund");
  const paidPayment = state.payments.find(
    (payment) => payment.status === "paid" && payment.amount > 100,
  );
  if (paidPayment) {
    const orderBefore = state.orders.find((order) => order.id === paidPayment.orderId)!;
    const amount = Math.min(50, Math.floor(paidPayment.amount / 4));
    await paymentService.refund(paidPayment.id, amount, "test refund");
    const after = useDataStore.getState();
    const paymentAfter = after.payments.find((payment) => payment.id === paidPayment.id)!;
    const orderAfter = after.orders.find((order) => order.id === paidPayment.orderId)!;

    check("payment records the refund", paymentAfter.refunds.length === paidPayment.refunds.length + 1);
    check("payment status is partially refunded", paymentAfter.status === "partially_refunded", paymentAfter.status);
    check(
      "linked order refundedTotal grows",
      orderAfter.refundedTotal === orderBefore.refundedTotal + amount,
      `${orderBefore.refundedTotal} -> ${orderAfter.refundedTotal}`,
    );
    check(
      "linked order payment status follows the payment",
      orderAfter.paymentStatus === "partially_refunded",
      orderAfter.paymentStatus,
    );
  } else {
    console.log("  (no paid payment available)");
  }

  /* ---------------- refunds reject zero and negative amounts --------------- */
  console.log("\npaymentService.refund validation");
  const anyPayment = useDataStore.getState().payments[0];
  for (const bad of [0, -100]) {
    let threw = false;
    try {
      await paymentService.refund(anyPayment.id, bad, "bad");
    } catch {
      threw = true;
    }
    check(`amount ${bad} is rejected`, threw);
  }

  /* ---------------- order status keeps the payment in sync ------------------ */
  console.log("\norderService.updateStatus");
  const cancellable = useDataStore
    .getState()
    .orders.find((order) => order.status === "pending" && order.paymentStatus === "pending");
  if (cancellable) {
    await orderService.updateStatus(cancellable.id, "cancelled", "test cancel");
    const after = useDataStore.getState().orders.find((order) => order.id === cancellable.id)!;
    check("cancelling a pending order fails the payment", after.paymentStatus === "failed", after.paymentStatus);
  } else {
    console.log("  (no cancellable pending order available)");
  }

  const confirmable = useDataStore
    .getState()
    .orders.find((order) => order.status === "pending" && order.paymentStatus === "pending");
  if (confirmable) {
    await orderService.updateStatus(confirmable.id, "confirmed", "test confirm");
    const after = useDataStore.getState().orders.find((order) => order.id === confirmable.id)!;
    check("confirming a pending order marks it paid", after.paymentStatus === "paid", after.paymentStatus);
  }

  /* ---------------- product creation syncs the collections ------------------ */
  console.log("\nproductService.create collection membership");
  const collections = useDataStore.getState().collections;
  const target = collections[0];
  const before = useDataStore.getState().collections.map((collection) => collection.productIds.length);
  const created = await productService.create({
    title: "E2E Service Product",
    description: "Created by the service test",
    categoryId: useDataStore.getState().categories[0].id,
    collectionIds: [target.id],
    brand: "Test",
    sku: "E2E-SVC-0001",
    barcode: "",
    price: 999,
    costPrice: 500,
    weight: 100,
    weightUnit: "g",
    images: ["asset-01"],
    variants: [
      {
        title: "Default",
        options: ["Default"],
        sku: "E2E-SVC-0001",
        barcode: "",
        price: 999,
        costPrice: 500,
        inventory: 10,
        weight: 100,
        imageTone: 0,
      },
    ],
    seoTitle: "E2E Service Product",
    seoDescription: "test",
    visibility: "visible",
    status: "active",
    featured: false,
    tags: [],
    shippingProfileId: "ship-standard",
  });
  const afterCollections = useDataStore.getState().collections;
  const lengths = afterCollections.map((collection) => collection.productIds.length);
  check(
    "only the selected collection grew",
    lengths.filter((value, index) => value !== before[index]).length === 1,
    JSON.stringify({ before, lengths }),
  );
  check(
    "the selected collection contains the product",
    afterCollections.find((collection) => collection.id === target.id)!.productIds.includes(created.id),
  );
  check(
    "the product points back at the collection",
    useDataStore.getState().products.find((product) => product.id === created.id)!.collectionIds.includes(target.id),
  );

  /* ---------------- checkout totals reconcile -------------------------------- */
  console.log("\ncalculateTotals");
  const items: CartItem[] = [
    {
      id: "c1",
      productId: "prd-001",
      variantId: "prd-001-v1",
      title: "A",
      variantTitle: "Default",
      slug: "a",
      sku: "A",
      unitPrice: 1234.5,
      quantity: 2,
      maxQuantity: 10,
      weight: 100,
    },
    {
      id: "c2",
      productId: "prd-002",
      variantId: "prd-002-v1",
      title: "B",
      variantTitle: "Default",
      slug: "b",
      sku: "B",
      unitPrice: 777.77,
      quantity: 1,
      maxQuantity: 10,
      weight: 100,
    },
    {
      id: "c3",
      productId: "prd-003",
      variantId: "prd-003-v1",
      title: "C",
      variantTitle: "Default",
      slug: "c",
      sku: "C",
      unitPrice: 4999,
      quantity: 1,
      maxQuantity: 10,
      weight: 100,
    },
  ];
  const discount = {
    id: "dsc-test",
    code: "TEST15",
    title: "Test",
    type: "percentage" as const,
    value: 15,
    minimumPurchase: 1000,
    usageLimit: null,
    usedCount: 0,
    perCustomerLimit: 5,
    eligibility: "all" as const,
    productScope: "all" as const,
    productIds: [],
    startsAt: new Date(Date.now() - 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    active: true,
    appliesToShipping: false,
    createdAt: new Date().toISOString(),
  };
  const totals = calculateTotals(items, {
    discount,
    shipping: shippingQuoteFor(
      { id: "m", name: "Standard", type: "flat", price: 79, freeThreshold: 1999, minWeight: null, maxWeight: null, estimateMinDays: 3, estimateMaxDays: 5, carrier: "X" },
      1999,
    ),
  });
  const lineSum = totals.lineDiscounts.reduce((s, v) => s + v, 0);
  const taxSum = totals.lineTaxes.reduce((s, v) => s + v, 0);
  const lineTotals = items.map(
    (item, index) =>
      item.unitPrice * item.quantity - totals.lineDiscounts[index] + totals.lineTaxes[index],
  );
  check("line discounts sum to the order discount", lineSum === totals.discountTotal, `${lineSum} vs ${totals.discountTotal}`);
  check("line taxes sum to the order tax", taxSum === totals.taxTotal, `${taxSum} vs ${totals.taxTotal}`);
  check(
    "order total equals subtotal - discount + tax + shipping",
    totals.total === totals.subtotal - totals.discountTotal + totals.taxTotal + totals.shippingTotal,
  );
  check(
    "line totals sum to the taxable total",
    lineTotals.reduce((s, v) => s + v, 0) === totals.subtotal - totals.discountTotal + totals.taxTotal,
  );
  check("a paid method is charged below its threshold", totals.shippingTotal === 0, String(totals.shippingTotal));

  /* ---------------- free shipping coupon needs the minimum ------------------ */
  console.log("\nfree-shipping coupon");
  const standardMethod = {
    id: "m",
    name: "Standard",
    type: "flat" as const,
    price: 79,
    freeThreshold: 1999,
    minWeight: null,
    maxWeight: null,
    estimateMinDays: 3,
    estimateMaxDays: 5,
    carrier: "X",
  };
  const expressMethod = { ...standardMethod, id: "e", name: "Express", price: 149, freeThreshold: 4999 };
  const smallCart: CartItem[] = [
    {
      id: "s1",
      productId: "prd-001",
      variantId: "prd-001-v1",
      title: "A",
      variantTitle: "Default",
      slug: "a",
      sku: "A",
      unitPrice: 500,
      quantity: 1,
      maxQuantity: 10,
      weight: 100,
    },
  ];
  const freeShip = { ...discount, type: "free_shipping" as const, value: 0, minimumPurchase: 5000 };
  const small = calculateTotals(smallCart, {
    discount: freeShip,
    shipping: shippingQuoteFor(standardMethod, 1999),
  });
  check(
    "a coupon below its minimum does not grant free shipping",
    small.shippingTotal === 79,
    String(small.shippingTotal),
  );
  const big = calculateTotals(items, {
    discount: freeShip,
    shipping: shippingQuoteFor(standardMethod, 1999),
  });
  check("a coupon above its minimum grants free shipping", big.shippingTotal === 0, String(big.shippingTotal));

  /* ---------------- the selected method keeps its own threshold ------------- */
  console.log("\nshipping method thresholds");
  const midCart: CartItem[] = [
    {
      id: "m1",
      productId: "prd-001",
      variantId: "prd-001-v1",
      title: "A",
      variantTitle: "Default",
      slug: "a",
      sku: "A",
      unitPrice: 3000,
      quantity: 1,
      maxQuantity: 10,
      weight: 100,
    },
  ];
  const standardQuote = calculateTotals(midCart, { shipping: shippingQuoteFor(standardMethod, 1999) });
  const expressQuote = calculateTotals(midCart, { shipping: shippingQuoteFor(expressMethod, 1999) });
  check(
    "the standard method is free above its own threshold",
    standardQuote.shippingTotal === 0,
    String(standardQuote.shippingTotal),
  );
  check(
    "a method with a higher threshold is still charged",
    expressQuote.shippingTotal === 149,
    String(expressQuote.shippingTotal),
  );

  /* ---------------- product scoped coupons ---------------------------------- */
  console.log("\nproduct-scoped coupon");
  const scoped = { ...discount, productScope: "specific" as const, productIds: ["prd-003"] };
  const scopedTotals = calculateTotals(items, { discount: scoped });
  const expected = Math.round((4999 * 15) / 100);
  check("only the restricted product is discounted", scopedTotals.discountTotal === expected, `${scopedTotals.discountTotal} vs ${expected}`);

  /* ---------------- placing an order reconciles ------------------------------ */
  console.log("\ncheckoutService.placeOrder");
  const orderTotals = calculateTotals(items, {
    discount,
    shipping: shippingQuoteFor(
      { id: "ship-standard", name: "Standard Shipping", type: "flat", price: 79, freeThreshold: 1999, minWeight: null, maxWeight: null, estimateMinDays: 3, estimateMaxDays: 5, carrier: "X" },
      1999,
    ),
  });
  const { order } = await checkoutService.placeOrder({
    details: {
      email: "e2e@example.com",
      shippingAddress: {
        name: "E2E Shopper",
        email: "e2e@example.com",
        phone: "+910000000000",
        line1: "1 Test Street",
        line2: "",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        country: "India",
        countryCode: "IN",
      },
      billingAddress: {
        name: "E2E Shopper",
        email: "e2e@example.com",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        countryCode: "",
      },
      billingSameAsShipping: true,
      shippingMethodId: "ship-standard",
      paymentMethod: "online_simulated",
      customerNote: "",
      giftMessage: "",
      marketingOptIn: false,
    },
    items,
    totals: orderTotals,
    discount,
  });
  const lineTotalSum = order.lineItems.reduce((s, line) => s + line.total, 0);
  const discountSum = order.lineItems.reduce((s, line) => s + line.discount, 0);
  const taxSum2 = order.lineItems.reduce((s, line) => s + line.tax, 0);
  check("order total matches the formula", order.total === order.subtotal - order.discountTotal + order.taxTotal + order.shippingTotal + order.handlingFee);
  check("order discount matches the lines", discountSum === order.discountTotal, `${discountSum} vs ${order.discountTotal}`);
  check("order tax matches the lines", taxSum2 === order.taxTotal, `${taxSum2} vs ${order.taxTotal}`);
  check("line totals match the order total minus shipping", lineTotalSum === order.total - order.shippingTotal, `${lineTotalSum} vs ${order.total - order.shippingTotal}`);
  check("the order links to its payment", Boolean(order.paymentId));
  check("the order links to its shipment", Boolean(order.shipmentId));
  const linkedPayment = useDataStore.getState().payments.find((p) => p.id === order.paymentId);
  check("the payment points back at the order", linkedPayment?.orderId === order.id);
  const linkedShipment = useDataStore.getState().shipments.find((s) => s.id === order.shipmentId);
  check("the shipment points back at the order", linkedShipment?.orderId === order.id);
  check("the shipment records the shipping cost", (linkedShipment?.cost ?? 0) > 0, String(linkedShipment?.cost));
  const orderNumbers = useDataStore.getState().orders.map((o) => o.orderNumber);
  check("order numbers are unique", new Set(orderNumbers).size === orderNumbers.length);

  /* ---------------- the tax rate follows the store's configuration ---------- */
  console.log("\ntax rate");
  const taxSettings = useDataStore.getState().taxSettings;
  const resolveTax = taxRateResolver(taxSettings);
  const expectedRate =
    (taxSettings.taxCategories.find((c) => c.id === "tax-1")?.rate ?? 18) / 100;
  check(
    "the default rate comes from the tax configuration",
    Math.abs(resolveTax("prd-001") - expectedRate) < 0.0001,
    `${resolveTax("prd-001")} vs ${expectedRate}`,
  );
  const customTax = {
    ...taxSettings,
    taxCategories: taxSettings.taxCategories.map((c) =>
      c.id === "tax-1" ? { ...c, rate: 5 } : c,
    ),
  };
  const customResolve = taxRateResolver(customTax);
  check(
    "a changed rate is used by the storefront",
    Math.abs(customResolve("prd-001") - 0.05) < 0.0001,
    String(customResolve("prd-001")),
  );
  const scopedTax = {
    ...taxSettings,
    taxCategories: taxSettings.taxCategories.map((c) =>
      c.id === "tax-2" ? { ...c, productIds: ["prd-004"] } : c,
    ),
  };
  const scopedResolve = taxRateResolver(scopedTax);
  check(
    "a product in its own category uses that category's rate",
    Math.abs(scopedResolve("prd-004") - 0.05) < 0.0001,
    String(scopedResolve("prd-004")),
  );

  /* ---------------- the cash-on-delivery fee is charged --------------------- */
  console.log("\ncash on delivery fee");
  const codTotals = calculateTotals(items, {
    shipping: shippingQuoteFor(standardMethod, 1999),
    handlingFee: 29,
  });
  check(
    "the handling fee is part of the total",
    codTotals.total ===
      codTotals.subtotal - codTotals.discountTotal + codTotals.taxTotal + codTotals.shippingTotal + 29,
    String(codTotals.total),
  );
  check("the handling fee is reported", codTotals.handlingFee === 29);

  /* ---------------- the WhatsApp checkout message ------------------------- */
  console.log("\nWhatsApp checkout");
  const checkoutSettings = {
    enabled: true,
    phone: "+91 90000 00000",
    message:
      "Hi {{store_name}}, I would like to place this order:\n\n{{cart_items}}\n\nTotal: {{cart_total}}\n\n{{url}}",
  };
  const checkout = buildWhatsappCheckout(
    checkoutSettings,
    "",
    {
      items: [
        { title: "Aria Wireless Over-Ear Headphones", variantTitle: "Midnight", quantity: 2, lineTotal: "₹25,980" },
        { title: "Harbor 40W USB-C Charger", variantTitle: "Default", quantity: 1, lineTotal: "₹2,499" },
      ],
      itemCount: 3,
      total: "₹32,442",
      storeName: "Northwind Goods",
      path: "/store/cart",
    },
    "https://shop.example",
  );
  check("the link points at wa.me", Boolean(checkout.url?.startsWith("https://wa.me/")), checkout.url ?? "");
  check("the message carries the item title", checkout.message.includes("Aria Wireless Over-Ear Headphones"));
  check("the message carries the variant", checkout.message.includes("Midnight"));
  check("the message carries the quantity", checkout.message.includes("× 2"));
  check("the message carries the line price", checkout.message.includes("₹25,980"));
  check("the message carries the order total", checkout.message.includes("₹32,442"));
  check("the message carries the store name", checkout.message.includes("Northwind Goods"));
  check("the message carries the cart link", checkout.message.includes("https://shop.example/store/cart"));
  check("the message is url encoded", (checkout.url ?? "").includes("text=") && !checkout.url!.includes(" "));

  const noNumber = buildWhatsappCheckout(
    { ...checkoutSettings, phone: "" },
    "",
    { items: [], itemCount: 0, total: "₹0", storeName: "Northwind Goods", path: "/store/cart" },
    "https://shop.example",
  );
  check("a missing number is reported", noNumber.error === "missing_number" && noNumber.url === null);

  const fallback = buildWhatsappCheckout(
    { ...checkoutSettings, phone: "" },
    "+91 90000 00000",
    { items: [], itemCount: 0, total: "₹0", storeName: "Northwind Goods", path: "/store/cart" },
    "https://shop.example",
  );
  check(
    "the integration number is used as a fallback",
    fallback.error === null && Boolean(fallback.url),
    fallback.error ?? "no url",
  );

  const badNumber = buildWhatsappCheckout(
    { ...checkoutSettings, phone: "123" },
    "",
    { items: [], itemCount: 0, total: "₹0", storeName: "Northwind Goods", path: "/store/cart" },
    "https://shop.example",
  );
  check("an invalid number is reported", badNumber.error === "invalid_number" && badNumber.url === null);

  /* ---------------- plan changes issue unique invoices ----------------------- */
  console.log("\nsettingsService.changePlan");
  const plan = useDataStore.getState().plans[0];
  const first = await settingsService.changePlan(plan.id, "monthly");
  const second = await settingsService.changePlan(plan.id, "monthly");
  check("invoice numbers are unique", first.invoice.number !== second.invoice.number, `${first.invoice.number} / ${second.invoice.number}`);

  console.log(
    failures.length ? `\n${failures.length} FAILURES:\n${failures.join("\n")}` : "\nAll service checks passed.",
  );
  if (failures.length) process.exitCode = 1;
}

void main();
