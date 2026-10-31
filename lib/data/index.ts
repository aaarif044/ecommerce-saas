import type {
  AbandonedCart,
  AnalyticsMonth,
  BillingInvoice,
  BlogPost,
  Campaign,
  Category,
  Collection,
  CustomDomain,
  Customer,
  CustomDomain as Domain,
  Discount,
  EmailTemplate,
  Integration,
  InventoryMovement,
  Merchant,
  NavMenu,
  NotificationRecord,
  Order,
  Payment,
  PlatformAuditEntry,
  PlatformSettings,
  Product,
  ReturnRequest,
  Shipment,
  ShippingZone,
  StaffMember,
  StorePage,
  StoreSettingsBundle,
  SubscriptionPlan,
  TaxSettings,
  Theme,
} from "@/lib/types";
import { rolledUpCategoryCounts } from "@/lib/utils";
import { buildCategories, buildCollections, buildProducts } from "./catalog";import { buildCustomers, buildMerchants, buildStaff } from "./people";
import { buildAbandonedCarts, buildCampaigns, buildDiscounts, buildInventoryMovements, buildOrders, buildPayments, buildReturns, buildShipments } from "./sales";
import { buildAnalytics, buildAuditLog, buildBlogPosts, buildCustomDomains, buildEmailTemplates, buildInvoices, buildIntegrations, buildNavMenus, buildNotifications, buildPages, buildPlans, buildPlatformSettings, buildShippingZones, buildThemes, DEMO_STORES } from "./content";
import { buildSettings } from "./settings";

export interface SeedData {
  categories: Category[];
  collections: Collection[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  shipments: Shipment[];
  returns: ReturnRequest[];
  abandonedCarts: AbandonedCart[];
  inventoryMovements: InventoryMovement[];
  discounts: Discount[];
  staff: StaffMember[];
  notifications: NotificationRecord[];
  themes: Theme[];
  pages: StorePage[];
  blogPosts: BlogPost[];
  navMenus: NavMenu[];
  campaigns: Campaign[];
  integrations: Integration[];
  plans: SubscriptionPlan[];
  invoices: BillingInvoice[];
  merchants: Merchant[];
  auditLog: PlatformAuditEntry[];
  platformSettings: PlatformSettings;
  shippingZones: ShippingZone[];
  taxSettings: TaxSettings;
  emailTemplates: EmailTemplate[];
  customDomains: Domain[];
  analytics: AnalyticsMonth[];
  settingsByStore: Record<string, StoreSettingsBundle>;
  demoStores: typeof DEMO_STORES;
}

/**
 * Derives every customer statistic from the orders the customer actually
 * placed. Fabricated counters (lifetime value, order count, segment) drift
 * away from the Orders page as soon as the two disagree, so they are
 * computed from the same source of truth instead of being invented.
 */
function reconcileCustomers(customers: Customer[], orders: Order[]) {
  const byCustomer = new Map<string, Order[]>();
  for (const order of orders) {
    if (!order.customerId) continue;
    const list = byCustomer.get(order.customerId) ?? [];
    list.push(order);
    byCustomer.set(order.customerId, list);
  }

  const now = Date.now();
  customers.forEach((customer) => {
    const own = byCustomer.get(customer.id) ?? [];
    const valid = own.filter((order) => order.status !== "cancelled");
    const spend = valid.reduce((sum, order) => sum + order.total, 0);

    customer.orderCount = valid.length;
    customer.totalSpent = spend;
    customer.averageOrderValue = valid.length ? Math.round(spend / valid.length) : 0;
    customer.lastOrderAt = own.map((order) => order.createdAt).sort().at(-1) ?? null;

    // A customer cannot have placed an order before they registered.
    const firstOrderAt = own.map((order) => order.createdAt).sort().at(0);
    if (firstOrderAt && new Date(customer.createdAt).getTime() > new Date(firstOrderAt).getTime()) {
      customer.createdAt = new Date(
        new Date(firstOrderAt).getTime() - 7 * 86400000,
      ).toISOString();
    }

    const daysSinceLastOrder = customer.lastOrderAt
      ? (now - new Date(customer.lastOrderAt).getTime()) / 86400000
      : Number.POSITIVE_INFINITY;
    const wholesaleOnly =
      own.length > 0 && own.every((order) => order.channel === "wholesale");

    customer.segment = wholesaleOnly
      ? "wholesale"
      : valid.length === 0
        ? daysSinceLastOrder <= 30
          ? "new"
          : "dormant"
        : valid.length >= 6
          ? "vip"
          : valid.length >= 3
            ? "loyal"
            : daysSinceLastOrder <= 45
              ? "new"
              : daysSinceLastOrder <= 120
                ? "at_risk"
                : "dormant";
  });
}

function createSeed(): SeedData {
  const categories = buildCategories();
  const products = buildProducts(categories);
  const collections = buildCollections(products);
  const customers = buildCustomers();
  const discounts = buildDiscounts();

  // Coupons that are restricted to specific products have to point at real
  // products, otherwise the restriction silently matches nothing.
  const sellable = products.filter((product) => product.status === "active");
  discounts.forEach((discount, index) => {
    if (discount.productScope !== "specific" || discount.productIds.length) return;
    discount.productIds = sellable
      .filter((_, position) => (position + index) % 7 === 0)
      .slice(0, 6)
      .map((product) => product.id);
  });

  const orders = buildOrders(products, customers, discounts);

  // The customer statistics are derived from the orders, never invented.
  reconcileCustomers(customers, orders);

  // The stored category counts are rolled up from the real catalogue so the
  // fixture, the Categories table and the command palette agree.
  const categoryCounts = rolledUpCategoryCounts(categories, products);
  categories.forEach((category) => {
    category.productCount = categoryCounts.get(category.id) ?? 0;
  });

  // Collections reference real products.
  collections.forEach((collection) => {
    collection.productIds = collection.productIds.filter((id) =>
      products.some((product) => product.id === id),
    );
  });

  // Featured products surface in the storefront.
  products.forEach((product) => {
    product.collectionIds = collections
      .filter((collection) => collection.productIds.includes(product.id))
      .map((collection) => collection.id);
  });

  const payments = buildPayments(orders);
  orders.forEach((order) => {
    const payment = payments.find((candidate) => candidate.orderId === order.id);
    order.paymentId = payment?.id;
  });

  const shipments = buildShipments(orders);
  orders.forEach((order) => {
    const shipment = shipments.find((candidate) => candidate.orderId === order.id);
    order.shipmentId = shipment?.id;
  });

  const baseSettings = buildSettings();

  const returns = buildReturns(orders);
  const themes = buildThemes();
  const customDomains = buildCustomDomains();

  const settingsByStore: Record<string, StoreSettingsBundle> = {};
  DEMO_STORES.forEach((store, index) => {
    const settings = structuredClone(baseSettings);
    settings.general.storeName = store.name;
    settings.general.storeSlug = store.slug;
    settings.general.description = store.tagline;
    settings.general.email = `hello@${store.slug.replace(/-/g, "")}.example`;
    settings.general.logoText = store.name.split(" ")[0];
    if (index === 1) {
      settings.regional.currency = "EUR";
      settings.regional.currencySymbol = "€";
      settings.regional.currencyFormat = "symbol_last";
      settings.regional.language = "en-IE";
      settings.regional.numberLocale = "en-IE";
      settings.regional.country = "Ireland";
      settings.regional.countryCode = "IE";
      settings.regional.state = "Leinster";
    }
    if (index === 2) {
      settings.regional.currency = "SGD";
      settings.regional.currencySymbol = "S$";
      settings.regional.language = "en-SG";
      settings.regional.numberLocale = "en-SG";
      settings.regional.country = "Singapore";
      settings.regional.countryCode = "SG";
      settings.regional.state = "Central Region";
    }
    settingsByStore[store.id] = settings;
  });

  return {
    categories,
    collections,
    products,
    customers,
    orders,
    payments,
    shipments,
    returns,
    abandonedCarts: buildAbandonedCarts(products, customers),
    inventoryMovements: buildInventoryMovements(products),
    discounts,
    staff: buildStaff(),
    notifications: buildNotifications({
      orders,
      products,
      customers,
      returns,
      payments,
      domains: customDomains,
      themes,
    }),
    themes,
    pages: buildPages(),
    blogPosts: buildBlogPosts(),
    navMenus: buildNavMenus(),
    campaigns: buildCampaigns(),
    integrations: buildIntegrations(),
    plans: buildPlans(),
    invoices: buildInvoices(),
    merchants: buildMerchants(),
    auditLog: buildAuditLog(),
    platformSettings: buildPlatformSettings(),
    shippingZones: buildShippingZones(),
    taxSettings: baseSettings.taxes,
    emailTemplates: buildEmailTemplates(),
    customDomains,
    analytics: buildAnalytics(orders),
    settingsByStore,
    demoStores: DEMO_STORES,
  };
}

export const SEED = createSeed();

export { DEMO_STORES };
export type { CustomDomain };
