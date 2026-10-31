"use client";

import type {
  WhatsappCheckoutSettings,
  WhatsappSettings,
  WhatsappSurface,
} from "@/lib/types";
import { useDataStore } from "@/lib/store/data-store";
import { DEFAULT_WHATSAPP_SETTINGS } from "@/lib/data/settings";
import { MockApiError, simulateLatency } from "./errors";

/**
 * Every placeholder a merchant can use in a share message. The settings UI
 * renders these as insertable chips and the renderer below replaces them.
 */
export const WHATSAPP_VARIABLES = [
  { key: "store_name", label: "Store name", surfaces: "all" },
  { key: "customer_name", label: "Customer name", surfaces: "all" },
  { key: "url", label: "Share link", surfaces: "all" },
  { key: "title", label: "Shared item title", surfaces: "all" },
  { key: "product_title", label: "Product title", surfaces: "product" },
  { key: "product_variant", label: "Product variant", surfaces: "product" },
  { key: "product_price", label: "Product price", surfaces: "product" },
  { key: "collection_title", label: "Collection title", surfaces: "collection" },
  { key: "category_title", label: "Category title", surfaces: "category" },
  { key: "blog_title", label: "Article title", surfaces: "blog" },
  { key: "cart_count", label: "Items in cart", surfaces: "cart" },
  { key: "cart_total", label: "Cart total", surfaces: "cart" },
  { key: "discount_code", label: "Discount code", surfaces: "cart" },
] as const;

export type WhatsappVariableKey = (typeof WHATSAPP_VARIABLES)[number]["key"];

export const WHATSAPP_SURFACES: {
  value: WhatsappSurface;
  label: string;
  description: string;
}[] = [
  { value: "product", label: "Product pages", description: "Share a single product." },
  { value: "collection", label: "Collection pages", description: "Share a curated collection." },
  { value: "category", label: "Category pages", description: "Share a category listing." },
  { value: "blog", label: "Blog posts", description: "Share an article." },
  { value: "cart", label: "Cart", description: "Share the current cart with a friend." },
];

const TEMPLATE_BY_SURFACE: Record<
  WhatsappSurface,
  keyof Pick<
    WhatsappSettings,
    "productTemplate" | "collectionTemplate" | "categoryTemplate" | "blogTemplate" | "cartTemplate"
  >
> = {
  product: "productTemplate",
  collection: "collectionTemplate",
  category: "categoryTemplate",
  blog: "blogTemplate",
  cart: "cartTemplate",
};

export const SURFACE_SETTING_KEY: Record<WhatsappSurface, keyof WhatsappSettings> = {
  product: "showOnProducts",
  collection: "showOnCollections",
  category: "showOnCategories",
  blog: "showOnBlog",
  cart: "showOnCart",
};

/** Replaces `{{variable}}` placeholders, leaving unknown tokens untouched. */
export function renderWhatsappTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key: string) =>
    vars[key] !== undefined && vars[key] !== "" ? vars[key] : match,
  );
}

export function normaliseWhatsappPhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function isValidWhatsappPhone(phone: string) {
  const digits = normaliseWhatsappPhone(phone);
  return digits.length >= 8 && digits.length <= 15;
}

/** Builds a `wa.me` click-to-chat URL. Nothing is ever sent automatically. */
export function buildWhatsappUrl(phone: string, message: string) {
  const digits = normaliseWhatsappPhone(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export interface WhatsappSharePayload {
  /** Store-relative path that is shared, e.g. `/store/products/aria-headphones`. */
  path: string;
  title: string;
  productTitle?: string;
  productVariant?: string;
  productPrice?: string;
  collectionTitle?: string;
  categoryTitle?: string;
  blogTitle?: string;
  cartCount?: number;
  cartTotal?: string;
  discountCode?: string;
  customerName?: string;
  storeName?: string;
}

export interface WhatsappShare {
  url: string | null;
  message: string;
  phone: string;
  truncated: boolean;
}

/**
 * Resolves the final message and click-to-chat link for a surface using the
 * merchant's configuration.
 */
export function buildWhatsappShare(
  settings: WhatsappSettings,
  surface: WhatsappSurface,
  payload: WhatsappSharePayload,
  origin: string,
): WhatsappShare {
  const template = settings[TEMPLATE_BY_SURFACE[surface]] || settings.messageTemplate;

  let path = payload.path;
  if (settings.includeTracking && settings.utmSource.trim()) {
    const separator = path.includes("?") ? "&" : "?";
    path = `${path}${separator}utm_source=${encodeURIComponent(settings.utmSource.trim())}&utm_medium=whatsapp`;
  }

  const url = `${origin.replace(/\/$/, "")}${path}`;

  const vars: Record<string, string> = {
    store_name: payload.storeName ?? "",
    customer_name: payload.customerName ?? "there",
    url,
    title: payload.title,
    product_title: payload.productTitle ?? payload.title,
    product_variant: payload.productVariant ?? "",
    product_price: payload.productPrice ?? "",
    collection_title: payload.collectionTitle ?? payload.title,
    category_title: payload.categoryTitle ?? payload.title,
    blog_title: payload.blogTitle ?? payload.title,
    cart_count: payload.cartCount !== undefined ? String(payload.cartCount) : "",
    cart_total: payload.cartTotal ?? "",
    discount_code: payload.discountCode ?? "",
  };

  const message = renderWhatsappTemplate(template, vars);
  const phone = normaliseWhatsappPhone(settings.phone);

  return {
    url: buildWhatsappUrl(settings.phone, message),
    message,
    phone,
    truncated: message.length > 1200,
  };
}

export function surfaceEnabled(settings: WhatsappSettings, surface: WhatsappSurface) {
  return settings.enabled && Boolean(settings[SURFACE_SETTING_KEY[surface]]);
}

/* ------------------------- WhatsApp checkout ------------------------- */

/** The placeholders the checkout message template understands. */
export const WHATSAPP_CHECKOUT_VARIABLES = [
  { key: "store_name", label: "Store name" },
  { key: "customer_name", label: "Customer name" },
  { key: "cart_items", label: "Cart items" },
  { key: "cart_count", label: "Item count" },
  { key: "cart_total", label: "Order total" },
  { key: "url", label: "Cart link" },
] as const;

export interface WhatsappCheckoutItem {
  title: string;
  variantTitle: string;
  quantity: number;
  /** The formatted price for the whole line. */
  lineTotal: string;
}

export interface WhatsappCheckoutPayload {
  items: WhatsappCheckoutItem[];
  itemCount: number;
  /** The formatted order total. */
  total: string;
  storeName: string;
  customerName?: string;
  /** Store-relative path of the cart, e.g. `/store/cart`. */
  path: string;
}

export interface WhatsappCheckout {
  /** The click-to-chat link, or null when it could not be built. */
  url: string | null;
  message: string;
  phone: string;
  /** Why the link could not be built, if it could not. */
  error: "missing_number" | "invalid_number" | null;
}

/** Renders the cart as the `{{cart_items}}` placeholder. */
export function formatCartItems(items: WhatsappCheckoutItem[]) {
  if (!items.length) return "";
  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item.title} (${item.variantTitle}) × ${item.quantity} — ${item.lineTotal}`,
    )
    .join("\n");
}

/**
 * Builds the WhatsApp order message and its click-to-chat link.
 *
 * The business number comes from the checkout settings; when that is empty
 * the number configured in the WhatsApp integration is used. When neither is
 * set the link cannot be built and the caller has to tell the shopper so.
 */
export function buildWhatsappCheckout(
  settings: WhatsappCheckoutSettings,
  fallbackPhone: string,
  payload: WhatsappCheckoutPayload,
  origin: string,
): WhatsappCheckout {
  const url = `${origin.replace(/\/$/, "")}${payload.path}`;
  const vars: Record<string, string> = {
    store_name: payload.storeName,
    customer_name: payload.customerName ?? "",
    cart_items: formatCartItems(payload.items),
    cart_count: String(payload.itemCount),
    cart_total: payload.total,
    url,
  };
  const message = renderWhatsappTemplate(settings.message, vars);

  const phone = normaliseWhatsappPhone(settings.phone || fallbackPhone);
  if (!phone) {
    return { url: null, message, phone: "", error: "missing_number" };
  }
  if (!isValidWhatsappPhone(phone)) {
    return { url: null, message, phone, error: "invalid_number" };
  }
  return { url: buildWhatsappUrl(phone, message), message, phone, error: null };
}

export const whatsappService = {
  async get(): Promise<WhatsappSettings> {
    await simulateLatency(90, 90);
    const state = useDataStore.getState();
    const settings =
      state.settingsByStore[state.activeStoreId] ??
      state.settingsByStore[Object.keys(state.settingsByStore)[0]];
    return settings?.whatsapp ?? DEFAULT_WHATSAPP_SETTINGS;
  },

  async update(patch: Partial<WhatsappSettings>): Promise<WhatsappSettings> {
    await simulateLatency();
    const state = useDataStore.getState();
    const current =
      state.settingsByStore[state.activeStoreId] ??
      state.settingsByStore[Object.keys(state.settingsByStore)[0]];
    if (!current) throw new MockApiError("Store settings not found.", "not_found", 404);
    if (patch.phone !== undefined && patch.phone.trim() && !isValidWhatsappPhone(patch.phone)) {
      throw new MockApiError(
        "Enter a valid WhatsApp number with country code, for example +91 90000 00000.",
        "validation",
      );
    }
    const next: WhatsappSettings = { ...current.whatsapp, ...patch };
    state.patch({
      settingsByStore: {
        ...state.settingsByStore,
        [state.activeStoreId]: { ...current, whatsapp: next },
      },
    });
    return next;
  },
};
