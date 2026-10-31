/**
 * Central domain model for the demo commerce platform.
 * Every record below is fictional and generated from deterministic fixtures.
 */

export type ID = string;
export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED" | "SGD";

export interface Address {
  id?: ID;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
}

export type ProductStatus = "active" | "draft" | "archived";
export type Visibility = "visible" | "hidden";
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface ProductVariant {
  id: ID;
  title: string;
  options: string[];
  sku: string;
  barcode?: string;
  price: number;
  compareAtPrice?: number;
  costPrice: number;
  inventory: number;
  weight: number;
  assetId?: string;
}

export interface Product {
  id: ID;
  title: string;
  slug: string;
  description: string;
  images: string[];
  categoryId: ID;
  collectionIds: ID[];
  brand: string;
  sku: string;
  barcode: string;
  price: number;
  compareAtPrice?: number;
  costPrice: number;
  inventory: number;
  variants: ProductVariant[];
  weight: number;
  weightUnit: "g" | "kg" | "lb" | "oz";
  shippingProfileId: ID;
  seoTitle: string;
  seoDescription: string;
  visibility: Visibility;
  status: ProductStatus;
  featured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: ID;
  name: string;
  slug: string;
  parentId: ID | null;
  description: string;
  imageTone: number;
  productCount: number;
  visibility: Visibility;
  seoTitle: string;
  seoDescription: string;
  position: number;
  createdAt: string;
}

export interface Collection {
  id: ID;
  title: string;
  slug: string;
  description: string;
  imageTone: number;
  productIds: ID[];
  type: "manual" | "featured";
  visibility: Visibility;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "failed";
export type FulfillmentStatus =
  | "unfulfilled"
  | "partially_fulfilled"
  | "fulfilled"
  | "returned";
export type SalesChannel =
  | "online_store"
  | "mobile_app"
  | "marketplace"
  | "wholesale"
  | "social";

export interface OrderLineItem {
  id: ID;
  productId: ID;
  variantId: ID;
  title: string;
  variantTitle: string;
  sku: string;
  assetId?: string;
  quantity: number;
  unitPrice: number;
  compareAtPrice?: number;
  discount: number;
  tax: number;
  total: number;
}

export interface OrderTimelineEvent {
  id: ID;
  type: "created" | "status" | "payment" | "fulfillment" | "note" | "refund";
  title: string;
  description?: string;
  actor: string;
  createdAt: string;
}

export interface OrderNote {
  id: ID;
  body: string;
  author: string;
  createdAt: string;
}

export interface Order {
  id: ID;
  orderNumber: string;
  customerId: ID;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  currency: CurrencyCode;
  channel: SalesChannel;
  lineItems: OrderLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  /** A handling fee such as the cash-on-delivery surcharge. */
  handlingFee: number;
  total: number;
  refundedTotal: number;
  discountCode?: string;
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethodId: ID;
  shippingMethodName: string;
  customerNote?: string;
  internalNotes: OrderNote[];
  timeline: OrderTimelineEvent[];
  trackingNumber?: string;
  carrier?: string;
  paymentId?: ID;
  shipmentId?: ID;
}

export type CustomerSegment =
  | "vip"
  | "loyal"
  | "new"
  | "at_risk"
  | "dormant"
  | "wholesale";

export interface Customer {
  id: ID;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  lastOrderAt: string | null;
  orderCount: number;
  totalSpent: number;
  averageOrderValue: number;
  segment: CustomerSegment;
  tags: string[];
  addresses: Address[];
  marketingConsent: boolean;
  notes: string;
  status: "active" | "blocked";
}

export type MovementType =
  | "received"
  | "sold"
  | "adjusted"
  | "returned"
  | "damaged"
  | "reserved";

export interface InventoryMovement {
  id: ID;
  productId: ID;
  variantId: ID | null;
  productTitle: string;
  sku: string;
  type: MovementType;
  quantity: number;
  reason: string;
  note?: string;
  resultingStock: number;
  createdAt: string;
  actor: string;
}

export type DiscountType = "percentage" | "fixed_amount" | "free_shipping";

export interface Discount {
  id: ID;
  code: string;
  title: string;
  type: DiscountType;
  value: number;
  minimumPurchase: number;
  usageLimit: number | null;
  usedCount: number;
  perCustomerLimit: number;
  eligibility: "all" | "returning" | "vip" | "new";
  productScope: "all" | "specific";
  productIds: ID[];
  startsAt: string;
  expiresAt: string;
  active: boolean;
  appliesToShipping: boolean;
  createdAt: string;
}

export type PaymentMethod = "cod" | "manual" | "online_simulated";

export interface PaymentRefund {
  id: ID;
  amount: number;
  reason: string;
  reference: string;
  createdAt: string;
}

export interface Payment {
  id: ID;
  orderId: ID;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: CurrencyCode;
  status: PaymentStatus;
  method: PaymentMethod;
  gateway: string;
  reference: string;
  cardLast4?: string;
  createdAt: string;
  refunds: PaymentRefund[];
}

export interface Shipment {
  id: ID;
  orderId: ID;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  methodName: string;
  zoneId: ID;
  status: "label_created" | "in_transit" | "out_for_delivery" | "delivered" | "exception";
  estimatedDelivery: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  cost: number;
  itemCount: number;
}

export type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "in_transit"
  | "received"
  | "refunded"
  | "restocked";

export interface ReturnRequest {
  id: ID;
  orderId: ID;
  orderNumber: string;
  customerId: ID;
  customerName: string;
  items: { productId: ID; title: string; variantTitle: string; quantity: number }[];
  reason: string;
  status: ReturnStatus;
  refundAmount: number;
  createdAt: string;
  updatedAt: string;
  resolutionNote?: string;
}

export interface AbandonedCart {
  id: ID;
  customerId: ID | null;
  customerName: string;
  email: string;
  items: { productId: ID; title: string; variantTitle: string; quantity: number; price: number }[];
  cartValue: number;
  currency: CurrencyCode;
  createdAt: string;
  lastActivityAt: string;
  recoveryStatus: "not_contacted" | "recovery_sent" | "recovered" | "expired";
  recoveryToken: string;
  recoveredAt?: string;
}

export type StaffRole = "owner" | "admin" | "manager" | "support" | "fulfillment" | "analyst";

export interface StaffMember {
  id: ID;
  name: string;
  email: string;
  role: StaffRole;
  status: "active" | "invited" | "suspended";
  lastActiveAt: string | null;
  createdAt: string;
  permissions: string[];
}

export interface NotificationRecord {
  id: ID;
  type:
    | "order"
    | "fulfillment"
    | "return"
    | "refund"
    | "inventory"
    | "customer"
    | "store"
    | "subscription"
    | "system";
  severity: "info" | "success" | "warning" | "critical";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string;
}

export interface ThemeSection {
  id: ID;
  type:
    | "hero"
    | "banner"
    | "featured_products"
    | "featured_collections"
    | "image_text"
    | "testimonials"
    | "faq"
    | "newsletter"
    | "rich_text"
    | "product_grid"
    | "spacer";
  name: string;
  visible: boolean;
  props: Record<string, unknown>;
}

export interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headingFont: string;
  bodyFont: string;
  logoText: string;
  faviconEmoji: string;
  announcement: { enabled: boolean; text: string; linkLabel: string; linkHref: string };
  header: {
    layout: "standard" | "centered" | "minimal";
    sticky: boolean;
    showSearch: boolean;
    showCart: boolean;
    showAccount: boolean;
    showNavigation: boolean;
  };
  footer: {
    tagline: string;
    copyright: string;
    showPaymentIcons: boolean;
    showSocial: boolean;
    columns: { id: ID; title: string; links: { id: ID; label: string; href: string }[] }[];
  };
  sections: ThemeSection[];
}

export interface Theme {
  id: ID;
  name: string;
  description: string;
  tone: number;
  isActive: boolean;
  settings: ThemeSettings;
  updatedAt: string;
}

export interface StorePage {
  id: ID;
  title: string;
  slug: string;
  content: string;
  status: "published" | "draft";
  template: "standard" | "contact" | "faq";
  seoTitle: string;
  seoDescription: string;
  showInFooter: boolean;
  updatedAt: string;
}

export interface BlogPost {
  id: ID;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string[];
  status: "published" | "draft";
  publishedAt: string;
  readMinutes: number;
  views: number;
}

export interface NavMenuItem {
  id: ID;
  label: string;
  href: string;
  children: NavMenuItem[];
  visible: boolean;
}

export interface NavMenu {
  id: ID;
  name: string;
  location: "header" | "footer" | "footer_secondary";
  items: NavMenuItem[];
}

export type CampaignStatus = "draft" | "scheduled" | "running" | "completed" | "paused";

export interface Campaign {
  id: ID;
  name: string;
  channel: "email" | "sms" | "whatsapp" | "ads" | "social";
  status: CampaignStatus;
  audience: string;
  sent: number;
  clicks: number;
  conversions: number;
  revenue: number;
  spend: number;
  startsAt: string;
  endsAt: string;
}

export interface Integration {
  id: ID;
  name: string;
  description: string;
  category:
    | "payments"
    | "shipping"
    | "marketing"
    | "analytics"
    | "communication"
    | "support";
  logoText: string;
  tone: number;
  status: "available" | "connected" | "disabled";
  config: { key: string; label: string; value: string; type: "text" | "toggle" | "select" }[];
}

export interface ShippingMethod {
  id: ID;
  name: string;
  type: "flat" | "weight" | "free";
  price: number;
  freeThreshold: number | null;
  minWeight: number | null;
  maxWeight: number | null;
  estimateMinDays: number;
  estimateMaxDays: number;
  carrier: string;
}

export interface ShippingZone {
  id: ID;
  name: string;
  countries: string[];
  countriesCode: string[];
  methods: ShippingMethod[];
}

export interface TaxCategory {
  id: ID;
  name: string;
  rate: number;
  compound: boolean;
  includedInPrice: boolean;
  effectiveFrom: string;
  productIds: ID[];
}

export interface TaxRule {
  id: ID;
  name: string;
  country: string;
  countryCode: string;
  state: string;
  categoryId: ID;
  priority: number;
  active: boolean;
}

export interface EmailTemplate {
  id: ID;
  name: string;
  category: "order" | "shipping" | "refund" | "marketing" | "alert";
  subject: string;
  previewText: string;
  body: string;
  variables: string[];
  enabled: boolean;
}

export interface SubscriptionPlan {
  id: ID;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limits: { label: string; value: string }[];
  subscribers: number;
  accentTone: number;
  recommended: boolean;
}

export interface Merchant {
  id: ID;
  businessName: string;
  ownerName: string;
  email: string;
  storeName: string;
  storeSlug: string;
  country: string;
  countryCode: string;
  planId: ID;
  planName: string;
  status: "active" | "trial" | "past_due" | "suspended";
  gmv: number;
  orderCount: number;
  productCount: number;
  createdAt: string;
  lastActiveAt: string;
}

export interface AnalyticsMonth {
  month: string;
  revenue: number;
  orders: number;
  sessions: number;
  visitors: number;
  refunds: number;
  aov: number;
  conversionRate: number;
  channels: Record<SalesChannel, number>;
}

export interface PlatformAuditEntry {
  id: ID;
  actor: string;
  action: string;
  target: string;
  targetType: string;
  createdAt: string;
  ip: string;
  severity: "info" | "warning" | "critical";
}

/* ----------------------------- Settings ----------------------------- */

export interface GeneralSettings {
  storeName: string;
  storeSlug: string;
  description: string;
  logoText: string;
  faviconEmoji: string;
  /** Brand tiles from the demo media library. */
  images: string[];
  email: string;
  phone: string;
  legalName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
  taxId: string;
  status: "active" | "in_setup" | "paused";
}

export interface RegionalSettings {
  country: string;
  countryCode: string;
  state: string;
  currency: CurrencyCode;
  currencySymbol: string;
  currencyFormat: "symbol_first" | "symbol_last";
  currencyDecimals: number;
  language: string;
  timezone: string;
  dateFormat: "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd" | "dd MMM yyyy";
  timeFormat: "12h" | "24h";
  weekStart: "monday" | "sunday";
  numberLocale: string;
}

export interface NotificationPreferences {
  email: Record<NotificationEvent, boolean>;
  inApp: Record<NotificationEvent, boolean>;
  digestFrequency: "realtime" | "daily" | "weekly";
  merchantDigest: boolean;
}

export type NotificationEvent =
  | "new_order"
  | "order_cancelled"
  | "fulfillment"
  | "returns"
  | "refunds"
  | "low_stock"
  | "out_of_stock"
  | "customer_registration"
  | "store_changes"
  | "subscription_reminders";

export interface EmailSettings {
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  supportEmail: string;
  orderEmails: boolean;
  shippingEmails: boolean;
  refundEmails: boolean;
  merchantAlerts: boolean;
  footerText: string;
}

export interface StorefrontSettings {
  visibility: "public" | "password" | "private";
  password: string;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  socialImageTone: number;
  showOutOfStock: boolean;
  allowCustomerAccounts: boolean;
  requireAccount: boolean;
  cartMode: "drawer" | "page";
  showCartQuantity: boolean;
  showVendor: boolean;
  showReviews: boolean;
}

export interface WhatsappCheckoutSettings {
  /** Turn the storefront checkout into a WhatsApp order. */
  enabled: boolean;
  /**
   * The WhatsApp business number that receives the order. When empty the
   * number from the WhatsApp integration is used instead.
   */
  phone: string;
  /** The message template sent with the order. */
  message: string;
}

export interface CheckoutSettings {
  guestCheckout: boolean;
  requireAccount: boolean;
  requireShippingAddress: boolean;
  requireBillingAddress: boolean;
  billingSameAsShipping: boolean;
  allowOrderNotes: boolean;
  showOrderSummary: boolean;
  showTaxBreakdown: boolean;
  showShippingOptions: boolean;
  termsCheckbox: boolean;
  giftMessage: boolean;
  whatsapp: WhatsappCheckoutSettings;
}

export interface PaymentSettings {
  enabledMethods: PaymentMethod[];
  defaultMethod: PaymentMethod;
  codFee: number;
  manualInstructions: string;
  captureMode: "automatic" | "manual";
  statementDescriptor: string;
}

export interface StoreShippingSettings {
  freeShippingThreshold: number;
  handlingDays: number;
  defaultZoneId: ID;
  originCountry: string;
  originPostalCode: string;
  weightUnit: "g" | "kg" | "lb" | "oz";
}

export type WhatsappSurface = "product" | "collection" | "category" | "blog" | "cart";

export interface WhatsappSettings {
  enabled: boolean;
  /** The number that receives the click-to-chat message (E.164 digits). */
  phone: string;
  /** Fallback template used when a surface has no specific template. */
  messageTemplate: string;
  productTemplate: string;
  collectionTemplate: string;
  categoryTemplate: string;
  blogTemplate: string;
  cartTemplate: string;
  buttonStyle: "icon" | "label" | "floating";
  position: "bottom-right" | "bottom-left";
  showOnProducts: boolean;
  showOnCollections: boolean;
  showOnCategories: boolean;
  showOnBlog: boolean;
  showOnCart: boolean;
  includeTracking: boolean;
  utmSource: string;
  copyLinkOnShare: boolean;
}

export interface TaxSettings {
  country: string;
  countryCode: string;
  state: string;
  pricesIncludeTax: boolean;
  taxCategories: TaxCategory[];
  rules: TaxRule[];
}

export interface SubscriptionState {
  planId: ID;
  billingCycle: "monthly" | "annual";
  status: "active" | "trialing" | "past_due" | "cancelled";
  renewsAt: string;
  startedAt: string;
  paymentMethodLast4: string;
}

export interface BillingInvoice {
  id: ID;
  number: string;
  date: string;
  amount: number;
  currency: CurrencyCode;
  status: "paid" | "open" | "void" | "refunded";
  planName: string;
  description: string;
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  defaultTrialDays: number;
  maintenanceMode: boolean;
  marketplaceLive: boolean;
  commissionRate: number;
}

export interface StoreSettingsBundle {
  general: GeneralSettings;
  regional: RegionalSettings;
  notifications: NotificationPreferences;
  email: EmailSettings;
  storefront: StorefrontSettings;
  checkout: CheckoutSettings;
  payments: PaymentSettings;
  shipping: StoreShippingSettings;
  taxes: TaxSettings;
  whatsapp: WhatsappSettings;
  subscription: SubscriptionState;
  invoices: BillingInvoice[];
  staff: StaffMember[];
  customRoles: { id: ID; name: string; description: string; permissions: string[] }[];
}

/* --------------------------- Cart & checkout ------------------------ */

export interface CartItem {
  id: ID;
  productId: ID;
  variantId: ID;
  title: string;
  variantTitle: string;
  slug: string;
  sku: string;
  assetId?: string;
  unitPrice: number;
  quantity: number;
  weight: number;
  maxQuantity: number;
}

export interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountId: ID | null;
  discountAmount: number;
  shippingMethodId: ID | null;
  giftMessage: string;
}

export interface AddressForm {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
}

export interface CheckoutDetails {
  email: string;
  shippingAddress: AddressForm;
  billingAddress: AddressForm;
  billingSameAsShipping: boolean;
  shippingMethodId: ID | null;
  paymentMethod: PaymentMethod;
  customerNote: string;
  giftMessage: string;
  marketingOptIn: boolean;
}

export interface CustomDomain {
  id: ID;
  hostname: string;
  isPrimary: boolean;
  status: "pending" | "verified" | "failed";
  sslStatus: "pending" | "active" | "failed";
  verificationToken: string;
  createdAt: string;
  lastCheckedAt: string | null;
  dnsRecords: { type: string; name: string; value: string; verified: boolean }[];
}

export interface DemoStore {
  id: ID;
  name: string;
  slug: string;
  tagline: string;
  tone: number;
}
