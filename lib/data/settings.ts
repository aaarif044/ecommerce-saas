import type { StoreSettingsBundle, NotificationEvent, WhatsappSettings } from "@/lib/types";
import { buildInvoices, buildShippingSettings, buildTaxSettings } from "./content";
import { buildStaff } from "./people";
import { daysAgo, monthsAgo } from "./catalog";
const NOTIFICATION_EVENTS: NotificationEvent[] = [
  "new_order",
  "order_cancelled",
  "fulfillment",
  "returns",
  "refunds",
  "low_stock",
  "out_of_stock",
  "customer_registration",
  "store_changes",
  "subscription_reminders",
];

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEvent, string> = {
  new_order: "New order placed",
  order_cancelled: "Order cancelled",
  fulfillment: "Fulfillment update",
  returns: "Return requested",
  refunds: "Refund issued",
  low_stock: "Low stock reached",
  out_of_stock: "Out of stock",
  customer_registration: "New customer registered",
  store_changes: "Store settings changed",
  subscription_reminders: "Subscription reminders",
};

export const DEFAULT_WHATSAPP_SETTINGS: WhatsappSettings = {
  enabled: true,
  phone: "+91 90000 00000",
  messageTemplate:
    "Hi {{customer_name}}, I found {{title}} on {{store_name}} and wanted to share it with you: {{url}}",
  productTemplate:
    "Hi! I want to know more about {{product_title}} ({{product_variant}}) — {{product_price}} on {{store_name}}: {{url}}",
  collectionTemplate:
    "Hi! Here is the {{collection_title}} collection on {{store_name}}: {{url}}",
  categoryTemplate: "Hi! Here are some {{category_title}} picks from {{store_name}}: {{url}}",
  blogTemplate: "Hi! I thought you would like this article — {{blog_title}}: {{url}}",
  cartTemplate:
    "Hi! I have {{cart_count}} item(s) worth {{cart_total}} in my cart on {{store_name}}: {{url}}",
  buttonStyle: "label",
  position: "bottom-right",
  showOnProducts: true,
  showOnCollections: true,
  showOnCategories: true,
  showOnBlog: true,
  showOnCart: true,
  includeTracking: true,
  utmSource: "whatsapp",
  copyLinkOnShare: false,
};

export function buildSettings(): StoreSettingsBundle {
  const emailDefaults = Object.fromEntries(
    NOTIFICATION_EVENTS.map((event) => [event, event !== "store_changes"]),
  ) as Record<NotificationEvent, boolean>;

  return {
    general: {
      storeName: "Northwind Goods",
      storeSlug: "northwind-goods",
      description: "Considered everyday goods for home, work and travel — designed to last and priced honestly.",
      logoText: "Northwind",
      faviconEmoji: "N",
      images: ["asset-01"],
      email: "hello@northwind.example",
      phone: "+91 80000 12345",
      legalName: "Northwind Goods Private Limited",
      addressLine1: "221 Harbour Road",
      addressLine2: "Unit 4, Textile House",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      country: "India",
      countryCode: "IN",
      taxId: "29AAFCN1234M1Z5",
      status: "active",
    },
    regional: {
      country: "India",
      countryCode: "IN",
      state: "Karnataka",
      currency: "INR",
      currencySymbol: "₹",
      currencyFormat: "symbol_first",
      currencyDecimals: 0,
      language: "en-IN",
      timezone: "Asia/Kolkata",
      dateFormat: "dd/MM/yyyy",
      timeFormat: "12h",
      weekStart: "monday",
      numberLocale: "en-IN",
    },
    notifications: {
      email: emailDefaults,
      inApp: emailDefaults,
      digestFrequency: "realtime",
      merchantDigest: true,
    },
    email: {
      senderName: "Northwind Goods",
      senderEmail: "orders@northwind.example",
      replyToEmail: "support@northwind.example",
      supportEmail: "support@northwind.example",
      orderEmails: true,
      shippingEmails: true,
      refundEmails: true,
      merchantAlerts: true,
      footerText: "You are receiving this email because you placed an order with Northwind Goods.",
    },
    storefront: {
      visibility: "public",
      password: "northwind",
      published: true,
      seoTitle: "Northwind Goods — Considered everyday goods",
      seoDescription:
        "Buy home, work and travel essentials from Northwind Goods. Free delivery over ₹1,999 and 30-day returns.",
      socialImageTone: 0,
      showOutOfStock: true,
      allowCustomerAccounts: true,
      requireAccount: false,
      cartMode: "drawer",
      showCartQuantity: true,
      showVendor: true,
      showReviews: true,
    },
    checkout: {
      guestCheckout: true,
      requireAccount: false,
      requireShippingAddress: true,
      requireBillingAddress: false,
      billingSameAsShipping: true,
      allowOrderNotes: true,
      showOrderSummary: true,
      showTaxBreakdown: true,
      showShippingOptions: true,
      termsCheckbox: true,
      giftMessage: true,
      whatsapp: {
        enabled: false,
        // Empty means "use the WhatsApp business number from the WhatsApp
        // integration", so the two never have to be kept in sync by hand.
        phone: "",
        message:
          "Hi {{store_name}}, I would like to place this order:\n\n{{cart_items}}\n\nTotal: {{cart_total}}\n\n{{url}}",
      },
    },
    payments: {
      enabledMethods: ["cod", "manual", "online_simulated"],
      defaultMethod: "online_simulated",
      codFee: 29,
      manualInstructions: "Transfer the exact order amount to the account listed in your confirmation email, then upload the UTR reference.",
      captureMode: "automatic",
      statementDescriptor: "NORTHWIND",
    },
    shipping: buildShippingSettings(),
    taxes: buildTaxSettings(),
    whatsapp: { ...DEFAULT_WHATSAPP_SETTINGS },
    subscription: {
      planId: "plan-3",
      billingCycle: "monthly",
      status: "active",
      renewsAt: daysAgo(-6, 9, 0),
      startedAt: monthsAgo(9, 6),
      paymentMethodLast4: "4242",
    },
    invoices: buildInvoices(),
    staff: buildStaff(),
    customRoles: [
      {
        id: "role-1",
        name: "Merchandiser",
        description: "Owns catalogue, collections and storefront merchandising.",
        permissions: ["products.read", "products.write", "collections.read", "collections.write", "themes.read", "themes.write"],
      },
      {
        id: "role-2",
        name: "Returns Agent",
        description: "Handles return requests and demo refunds.",
        permissions: ["orders.read", "returns.read", "returns.write", "payments.read", "payments.refund"],
      },
    ],
  };
}

export const ALL_PERMISSIONS = [
  { group: "Catalogue", items: ["products.read", "products.write", "categories.read", "categories.write", "collections.read", "collections.write", "inventory.read", "inventory.write"] },
  { group: "Sales", items: ["orders.read", "orders.write", "customers.read", "customers.write", "discounts.read", "discounts.write", "returns.read", "returns.write", "payments.read", "payments.refund"] },
  { group: "Storefront", items: ["themes.read", "themes.write", "pages.read", "pages.write", "navigation.write", "domains.write", "seo.write"] },
  { group: "Growth", items: ["analytics.read", "reports.read", "marketing.write", "integrations.write"] },
  { group: "Administration", items: ["settings.read", "settings.write", "staff.read", "staff.write", "billing.read", "billing.write"] },
] as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ALL_PERMISSIONS.flatMap((g) => [...g.items]),
  admin: ALL_PERMISSIONS.flatMap((g) => [...g.items]),
  manager: ["products.read", "products.write", "categories.read", "collections.read", "inventory.read", "inventory.write", "orders.read", "orders.write", "customers.read", "discounts.read", "returns.read", "returns.write", "analytics.read"],
  support: ["orders.read", "orders.write", "customers.read", "customers.write", "returns.read", "returns.write", "payments.read"],
  fulfillment: ["orders.read", "orders.write", "inventory.read", "inventory.write", "shipments.read", "shipments.write"],
  analyst: ["analytics.read", "reports.read", "orders.read", "products.read", "customers.read"],
};

/**
 * Merges a persisted settings bundle over the current defaults.
 *
 * The demo persists settings in `localStorage`, so a browser can hold a
 * snapshot written before a section existed (for example before the WhatsApp
 * settings were added). Normalising on load fills any missing key with its
 * default instead of leaving a hole that would crash the page.
 */
export function normaliseSettings(
  base: StoreSettingsBundle,
  override?: Partial<StoreSettingsBundle> | null,
): StoreSettingsBundle {
  if (!override) return base;

  return {
    general: { ...base.general, ...override.general },
    regional: { ...base.regional, ...override.regional },
    notifications: {
      ...base.notifications,
      ...override.notifications,
      email: { ...base.notifications.email, ...override.notifications?.email },
      inApp: { ...base.notifications.inApp, ...override.notifications?.inApp },
    },
    email: { ...base.email, ...override.email },
    storefront: { ...base.storefront, ...override.storefront },
    checkout: {
      ...base.checkout,
      ...override.checkout,
      // The WhatsApp checkout block is nested, so it needs its own merge —
      // a snapshot written before it existed has no `whatsapp` key at all.
      whatsapp: { ...base.checkout.whatsapp, ...override.checkout?.whatsapp },
    },
    payments: { ...base.payments, ...override.payments },
    shipping: { ...base.shipping, ...override.shipping },
    taxes: {
      ...base.taxes,
      ...override.taxes,
      taxCategories: override.taxes?.taxCategories ?? base.taxes.taxCategories,
      rules: override.taxes?.rules ?? base.taxes.rules,
    },
    whatsapp: { ...base.whatsapp, ...override.whatsapp },
    subscription: { ...base.subscription, ...override.subscription },
    invoices: override.invoices ?? base.invoices,
    staff: override.staff ?? base.staff,
    customRoles: override.customRoles ?? base.customRoles,
  };
}
