import { createRng } from "@/lib/utils";
import type {
  AnalyticsMonth,
  BillingInvoice,
  CustomDomain,
  Customer,
  EmailTemplate,
  Integration,
  NavMenu,
  NotificationRecord,
  Order,
  Payment,
  PlatformAuditEntry,
  Product,
  ReturnRequest,
  PlatformSettings,
  SalesChannel,
  StorePage,
  StoreShippingSettings,
  SubscriptionPlan,
  TaxCategory,
  TaxRule,
  TaxSettings,
  Theme,
  ThemeSettings,
  BlogPost,
  ShippingZone,
  DemoStore,
} from "@/lib/types";
import { daysAgo, monthsAgo, clampToDay } from "./catalog";
/* ------------------------------- Themes ------------------------------ */

function baseSections(): ThemeSettings["sections"] {
  return [
    {
      id: "sec-hero",
      type: "hero",
      name: "Hero banner",
      visible: true,
      props: {
        headline: "Everyday goods, thoughtfully made",
        subhead: "Free delivery over ₹1,999 · 30-day easy returns",
        primaryLabel: "Shop new arrivals",
        primaryHref: "/store/products?sort=newest",
        secondaryLabel: "View collections",
        secondaryHref: "/store/products",
        tone: 0,
        align: "left",
      },
    },
    {
      id: "sec-featured-products",
      type: "featured_products",
      name: "Featured products",
      visible: true,
      props: {
        heading: "Trending this week",
        subheading: "Picked by our merchandising team",
        collectionId: "col-01",
        limit: 8,
        columns: 4,
      },
    },
    {
      id: "sec-image-text",
      type: "image_text",
      name: "Story block",
      visible: true,
      props: {
        heading: "Built to last longer",
        body: "We work with small workshops and mills that have been refining the same craft for decades. Fewer, better pieces — designed to be repaired, not replaced.",
        primaryLabel: "Our story",
        primaryHref: "/store/pages/about",
        tone: 3,
        imagePosition: "right",
      },
    },
    {
      id: "sec-featured-collections",
      type: "featured_collections",
      name: "Featured collections",
      visible: true,
      props: {
        heading: "Shop by collection",
        collectionIds: ["col-03", "col-05", "col-09", "col-11"],
      },
    },
    {
      id: "sec-banner",
      type: "banner",
      name: "Promo banner",
      visible: true,
      props: {
        heading: "Monsoon Edit — up to 25% off",
        body: "Waterproof layers, dry bags and quick-dry tees for the season ahead.",
        ctaLabel: "Shop the edit",
        ctaHref: "/store/collections/monsoon-ready",
        tone: 5,
      },
    },
    {
      id: "sec-testimonials",
      type: "testimonials",
      name: "Testimonials",
      visible: true,
      props: {
        heading: "Loved by 12,000+ homes",
        testimonials: [
          { quote: "The oxford shirt is the best-fitting one I own. Bought three more.", author: "Rohan P.", role: "Bengaluru" },
          { quote: "Delivery was next day and the packaging was plastic-free. Lovely.", author: "Meera S.", role: "Pune" },
          { quote: "Their support replaced a damaged jar in a day. That is rare.", author: "Kabir A.", role: "Delhi" },
        ],
      },
    },
    {
      id: "sec-faq",
      type: "faq",
      name: "FAQ",
      visible: true,
      props: {
        heading: "Questions, answered",
        items: [
          { q: "How long does delivery take?", a: "Metro cities receive orders in 2-4 working days. Rest of India takes 4-7 working days." },
          { q: "Can I return an item?", a: "Yes — you have 30 days from delivery to start a return for a full refund." },
          { q: "Do you ship internationally?", a: "We currently ship across India and to selected GCC destinations." },
        ],
      },
    },
    {
      id: "sec-newsletter",
      type: "newsletter",
      name: "Newsletter signup",
      visible: true,
      props: {
        heading: "Get early access to drops",
        body: "One email a week. New arrivals, restocks and the occasional extra 10%.",
        buttonLabel: "Subscribe",
      },
    },
  ];
}

export function buildThemes(): Theme[] {
  const settingsVariants: { name: string; description: string; tone: number; primary: string; accent: string; bg: string; heading: string; body: string; layout: ThemeSettings["header"]["layout"] }[] = [
    { name: "Aurora", description: "Soft gradients, generous spacing and editorial typography.", tone: 0, primary: "#5a5de3", accent: "#0ea5e9", bg: "#ffffff", heading: "Geist", body: "Geist", layout: "standard" },
    { name: "Lumen", description: "High-contrast monochrome with a single warm accent.", tone: 4, primary: "#111827", accent: "#f59e0b", bg: "#ffffff", heading: "Geist", body: "Geist", layout: "centered" },
    { name: "Terracotta", description: "Warm, earthy palette built for lifestyle brands.", tone: 2, primary: "#b45309", accent: "#0f766e", bg: "#fffdf8", heading: "Geist", body: "Geist", layout: "standard" },
    { name: "Slate", description: "Compact, product-dense layout for large catalogues.", tone: 9, primary: "#334155", accent: "#6366f1", bg: "#f8fafc", heading: "Geist", body: "Geist", layout: "minimal" },
  ];

  return settingsVariants.map((variant, index) => {
    const sections = baseSections();
    const settings: ThemeSettings = {
      primaryColor: variant.primary,
      accentColor: variant.accent,
      backgroundColor: variant.bg,
      headingFont: variant.heading,
      bodyFont: variant.body,
      logoText: "Northwind",
      faviconEmoji: "N",
      announcement: {
        enabled: index !== 3,
        text: index === 1 ? "Free express delivery on orders over ₹1,999" : "New season, same standard — free delivery over ₹1,999",
        linkLabel: "Shop now",
        linkHref: "/store/products",
      },
      header: {
        layout: variant.layout,
        sticky: index !== 3,
        showSearch: true,
        showCart: true,
        showAccount: true,
        showNavigation: true,
      },
      footer: {
        tagline: "Considered everyday goods, made to be kept.",
        copyright: `© ${new Date().getFullYear()} Northwind Goods. Demo storefront.`,
        showPaymentIcons: true,
        showSocial: true,
        columns: [
          {
            id: "col-shop",
            title: "Shop",
            links: [
              { id: "l1", label: "All products", href: "/store/products" },
              { id: "l2", label: "New arrivals", href: "/store/collections/new-arrivals" },
              { id: "l3", label: "Bestsellers", href: "/store/collections/bestsellers" },
              { id: "l4", label: "Gift cards", href: "/store/pages/gift-cards" },
            ],
          },
          {
            id: "col-help",
            title: "Help",
            links: [
              { id: "l5", label: "Shipping & delivery", href: "/store/pages/shipping" },
              { id: "l6", label: "Returns & refunds", href: "/store/pages/returns" },
              { id: "l7", label: "Contact us", href: "/store/contact" },
              { id: "l8", label: "FAQ", href: "/store/pages/faq" },
            ],
          },
          {
            id: "col-company",
            title: "Company",
            links: [
              { id: "l9", label: "Our story", href: "/store/pages/about" },
              { id: "l10", label: "Careers", href: "/store/pages/careers" },
              { id: "l11", label: "Privacy policy", href: "/store/pages/privacy" },
              { id: "l12", label: "Terms of service", href: "/store/pages/terms" },
            ],
          },
        ],
      },
      sections,
    };
    return {
      id: `thm-${String(index + 1).padStart(2, "0")}`,
      name: variant.name,
      description: variant.description,
      tone: variant.tone,
      isActive: index === 0,
      settings,
      updatedAt: daysAgo(index * 4, 12, 0),
    } satisfies Theme;
  });
}

/* ------------------------------- Pages ------------------------------- */

const PAGE_SEED: { title: string; slug: string; template: StorePage["template"]; body: string; footer: boolean }[] = [
  {
    title: "About Northwind",
    slug: "about",
    template: "standard",
    footer: true,
    body: "Northwind Goods began in a two-room workshop with a simple idea: everyday objects should be made well enough to keep for a decade. We work with a small network of family-run workshops across India, choosing partners who share that patience.\n\nToday we design around 140 products across home, work and travel — and we publish the material, mill and maker behind every one of them.",
  },
  {
    title: "Shipping & Delivery",
    slug: "shipping",
    template: "standard",
    footer: true,
    body: "Orders placed before 2 PM ship the same working day.\n\nMetro cities typically receive deliveries in 2-4 working days, and the rest of India in 4-7 working days. You will receive a tracking link by email as soon as the parcel leaves our warehouse.\n\nWe offer free standard delivery on every order above ₹1,999.",
  },
  {
    title: "Returns & Refunds",
    slug: "returns",
    template: "standard",
    footer: true,
    body: "Changed your mind? You have 30 days from the delivery date to start a return for a full refund.\n\nItems should be unused, in their original packaging, with tags attached. We arrange a free pickup for most PIN codes. Refunds are issued to the original payment method within 5-7 working days of the parcel reaching us.",
  },
  {
    title: "Frequently Asked Questions",
    slug: "faq",
    template: "faq",
    footer: true,
    body: "How long does delivery take?\nMetro cities receive orders in 2-4 working days, rest of India in 4-7 working days.\n\nCan I return an item?\nYes, within 30 days of delivery.\n\nDo you ship internationally?\nWe ship across India and to selected GCC destinations.",
  },
  {
    title: "Privacy Policy",
    slug: "privacy",
    template: "standard",
    footer: true,
    body: "This demo storefront does not collect or transmit personal data to any server. Everything you enter — addresses, contact details and checkout information — stays in your browser's local storage and is cleared when you reset the demo data.",
  },
  {
    title: "Terms of Service",
    slug: "terms",
    template: "standard",
    footer: true,
    body: "Northwind Goods is a demonstration storefront built for evaluation purposes. Products, prices, stock levels and order history are fictional. No real payment is processed at any point, and no goods will be shipped.",
  },
  {
    title: "Contact Us",
    slug: "contact",
    template: "contact",
    footer: true,
    body: "Reach our support desk at hello@northwind.example or call +91 80000 00000, Monday to Saturday, 9 AM to 7 PM IST. We reply to every message within one working day.",
  },
  {
    title: "Gift Cards",
    slug: "gift-cards",
    template: "standard",
    footer: true,
    body: "Send a digital gift card with any denomination from ₹500 to ₹10,000. Gift cards never expire and can be combined with other offers. In this demo, gift cards are shown for illustration only and cannot be purchased.",
  },
  {
    title: "Careers",
    slug: "careers",
    template: "standard",
    footer: false,
    body: "We are a small team of designers, makers and operators. We hire slowly and pay transparently. This is a demonstration page — no roles are currently open.",
  },
];

export function buildPages(): StorePage[] {
  return PAGE_SEED.map((seed, index) => ({
    id: `pag-${String(index + 1).padStart(2, "0")}`,
    title: seed.title,
    slug: seed.slug,
    content: seed.body,
    status: index === 8 ? "draft" : "published",
    template: seed.template,
    seoTitle: `${seed.title} — Northwind Goods`,
    seoDescription: seed.body.slice(0, 150),
    showInFooter: seed.footer,
    updatedAt: daysAgo(index * 3, 10, 0),
  }));
}

export function buildBlogPosts(): BlogPost[] {
  const seed = [
    { title: "How we choose our workshops", excerpt: "A look at the six criteria we use before we put a single product in the catalogue.", tags: ["craft", "sourcing"], read: 6, views: 4820 },
    { title: "The monsoon edit: what actually works", excerpt: "We tested 40 rain-ready pieces over one wet season. These nine earned their place.", tags: ["guide", "monsoon"], read: 8, views: 6110 },
    { title: "Caring for linen, properly", excerpt: "Linen gets better with age — but only if you wash it right. Here is the short version.", tags: ["care", "home"], read: 4, views: 2740 },
    { title: "Inside our packaging redesign", excerpt: "How we removed the last piece of plastic from the box our orders ship in.", tags: ["sustainability"], read: 5, views: 3990 },
    { title: "Building a capsule wardrobe that lasts", excerpt: "Twelve pieces, thirty outfits, and the maths behind buying less but better.", tags: ["style", "guide"], read: 7, views: 5240 },
    { title: "A note on honest pricing", excerpt: "Why we publish the cost of the good bits instead of hiding them behind a sale.", tags: ["company"], read: 3, views: 3180 },
  ];
  return seed.map((item, index) => ({
    id: `blg-${String(index + 1).padStart(2, "0")}`,
    title: item.title,
    slug: item.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-"),
    excerpt: item.excerpt,
    content: `${item.excerpt}\n\nWe spent the season gathering notes, testing samples and talking to the people who make the pieces we sell. What follows is the condensed version — the decisions we made, the ones we reversed, and the practical takeaways you can use the same day.\n\nEverything in this post is part of the demonstration catalogue and does not reflect a real product launch.`,
    author: ["Naveen Raghavan", "Priya Deshmukh", "Leena Kapoor"][index % 3],
    tags: item.tags,
    status: index === 5 ? "draft" : "published",
    publishedAt: daysAgo(8 + index * 9, 10, 0),
    readMinutes: item.read,
    views: item.views,
  }));
}

/* --------------------------- Nav menus ------------------------------ */

export function buildNavMenus(): NavMenu[] {
  return [
    {
      id: "nav-header",
      name: "Main navigation",
      location: "header",
      items: [
        { id: "mi-1", label: "New arrivals", href: "/store/collections/new-arrivals", visible: true, children: [] },
        { id: "mi-2", label: "Shop all", href: "/store/products", visible: true, children: [] },
        {
          id: "mi-3",
          label: "Categories",
          href: "/store/products",
          visible: true,
          children: [
            { id: "mi-3-1", label: "Electronics", href: "/store/categories/electronics", visible: true, children: [] },
            { id: "mi-3-2", label: "Apparel", href: "/store/categories/apparel", visible: true, children: [] },
            { id: "mi-3-3", label: "Home & Living", href: "/store/categories/home-living", visible: true, children: [] },
            { id: "mi-3-4", label: "Beauty", href: "/store/categories/beauty-personal-care", visible: true, children: [] },
          ],
        },
        { id: "mi-4", label: "Collections", href: "/store/collections/bestsellers", visible: true, children: [] },
        { id: "mi-5", label: "Stories", href: "/store/blog", visible: true, children: [] },
      ],
    },
    {
      id: "nav-footer",
      name: "Footer navigation",
      location: "footer",
      items: [
        { id: "fi-1", label: "All products", href: "/store/products", visible: true, children: [] },
        { id: "fi-2", label: "Bestsellers", href: "/store/collections/bestsellers", visible: true, children: [] },
        { id: "fi-3", label: "Contact", href: "/store/contact", visible: true, children: [] },
        { id: "fi-4", label: "Privacy", href: "/store/pages/privacy", visible: true, children: [] },
      ],
    },
    {
      id: "nav-footer-2",
      name: "Footer secondary",
      location: "footer_secondary",
      items: [
        { id: "fs-1", label: "Returns", href: "/store/pages/returns", visible: true, children: [] },
        { id: "fs-2", label: "Shipping", href: "/store/pages/shipping", visible: true, children: [] },
        { id: "fs-3", label: "Terms", href: "/store/pages/terms", visible: true, children: [] },
      ],
    },
  ];
}

/* ------------------------- Integrations ----------------------------- */

export function buildIntegrations(): Integration[] {
  const seed: {
    name: string;
    description: string;
    category: Integration["category"];
    logo: string;
    tone: number;
    status: Integration["status"];
  }[] = [
    { name: "SimulatedPay", description: "Demo online payments with simulated authorisation and capture flows.", category: "payments", logo: "SP", tone: 0, status: "connected" },
    { name: "Razorpay (Sandbox)", description: "Sandbox-only payment rails. No live keys, no real charges.", category: "payments", logo: "RZ", tone: 1, status: "available" },
    { name: "Cash on Delivery", description: "Collect payment at the door with an adjustable handling fee.", category: "payments", logo: "COD", tone: 2, status: "connected" },
    { name: "Manual Bank Transfer", description: "Show bank details and reconcile transfers manually.", category: "payments", logo: "BT", tone: 3, status: "disabled" },
    { name: "Stripe (Test Mode)", description: "Test-mode card processing with webhook simulator.", category: "payments", logo: "ST", tone: 4, status: "available" },
    { name: "BlueDart Express", description: "Shipping labels, pickup scheduling and tracking webhooks.", category: "shipping", logo: "BD", tone: 5, status: "connected" },
    { name: "Delhivery", description: "Surface and air express fulfilment with COD remittance.", category: "shipping", logo: "DL", tone: 6, status: "available" },
    { name: "Shiprocket", description: "Multi-courier rate shopping and label generation.", category: "shipping", logo: "SR", tone: 7, status: "available" },
    { name: "ShipStation", description: "Print labels in bulk and sync order status both ways.", category: "shipping", logo: "SS", tone: 8, status: "disabled" },
    { name: "Mailchimp", description: "Sync audiences and build segmented email campaigns.", category: "marketing", logo: "MC", tone: 9, status: "connected" },
    { name: "Klaviyo", description: "Behavioural flows, segments and revenue attribution.", category: "marketing", logo: "KV", tone: 10, status: "available" },
    { name: "Meta Ads", description: "Publish catalogue items and measure campaign performance.", category: "marketing", logo: "FB", tone: 11, status: "available" },
    { name: "Google Ads", description: "Shopping feed export and conversion tracking.", category: "marketing", logo: "GA", tone: 0, status: "disabled" },
    { name: "Google Analytics 4", description: "Stream storefront events into your GA4 property.", category: "analytics", logo: "G4", tone: 1, status: "connected" },
    { name: "Plausible Analytics", description: "Privacy-friendly, cookie-light storefront analytics.", category: "analytics", logo: "PL", tone: 2, status: "available" },
    { name: "Mixpanel", description: "Funnels, cohorts and retention for product analytics.", category: "analytics", logo: "MX", tone: 3, status: "available" },
    { name: "WhatsApp Business", description: "Product catalogue sharing and click-to-chat campaigns.", category: "communication", logo: "WA", tone: 4, status: "connected" },
    { name: "Twilio SMS", description: "Send order updates and delivery alerts by SMS.", category: "communication", logo: "TW", tone: 5, status: "available" },
    { name: "SendGrid Email", description: "Deliver transactional email for orders and shipping.", category: "communication", logo: "SG", tone: 6, status: "connected" },
    { name: "Intercom", description: "Live chat, help centre and customer timelines.", category: "support", logo: "IN", tone: 7, status: "available" },
    { name: "Gorgias", description: "Order-aware support inbox with quick replies.", category: "support", logo: "GO", tone: 8, status: "disabled" },
    { name: "Zendesk", description: "Ticketing, macros and satisfaction surveys.", category: "support", logo: "ZD", tone: 9, status: "available" },
    { name: "Freshdesk", description: "Omnichannel ticketing with a shared team inbox.", category: "support", logo: "FD", tone: 10, status: "available" },
  ];
  return seed.map((item, index) => ({
    id: `int-${String(index + 1).padStart(3, "0")}`,
    name: item.name,
    description: item.description,
    category: item.category,
    logoText: item.logo,
    tone: item.tone,
    status: item.status,
    config: [
      { key: "apiKey", label: "API key", value: "demo_••••••••••••", type: "text" },
      { key: "mode", label: "Mode", value: "Demo / simulated", type: "select" },
      { key: "autoSync", label: "Auto sync orders", value: "true", type: "toggle" },
    ],
  }));
}

/* ----------------------------- Plans --------------------------------- */

export function buildPlans(): SubscriptionPlan[] {
  return [
    {
      id: "plan-1",
      name: "Starter",
      tagline: "For a first store and a small catalogue.",
      monthlyPrice: 0,
      annualPrice: 0,
      features: ["Up to 50 products", "1 staff account", "Manual payment methods", "Community support", "7-day order history"],
      limits: [
        { label: "Products", value: "50" },
        { label: "Orders / month", value: "100" },
        { label: "Staff seats", value: "1" },
      ],
      subscribers: 8420,
      accentTone: 0,
      recommended: false,
    },
    {
      id: "plan-2",
      name: "Growth",
      tagline: "For growing brands that need automation.",
      monthlyPrice: 1499,
      annualPrice: 14990,
      features: ["Up to 2,000 products", "5 staff accounts", "Simulated payment gateway", "Discounts & abandoned carts", "30-day order history", "Email marketing"],
      limits: [
        { label: "Products", value: "2,000" },
        { label: "Orders / month", value: "5,000" },
        { label: "Staff seats", value: "5" },
      ],
      subscribers: 3180,
      accentTone: 1,
      recommended: true,
    },
    {
      id: "plan-3",
      name: "Scale",
      tagline: "For multi-channel operations.",
      monthlyPrice: 4499,
      annualPrice: 44990,
      features: ["Unlimited products", "25 staff accounts", "Advanced roles & permissions", "Custom domain + SSL", "Returns & refunds workflow", "Priority support"],
      limits: [
        { label: "Products", value: "Unlimited" },
        { label: "Orders / month", value: "50,000" },
        {label: "Staff seats", value: "25" },
      ],
      subscribers: 940,
      accentTone: 2,
      recommended: false,
    },
    {
      id: "plan-4",
      name: "Enterprise",
      tagline: "For large catalogues and custom requirements.",
      monthlyPrice: 11999,
      annualPrice: 119990,
      features: ["Unlimited everything", "Unlimited staff", "SSO & audit log", "Dedicated success manager", "Custom integrations", "SLA-backed support"],
      limits: [
        { label: "Products", value: "Unlimited" },
        { label: "Orders / month", value: "Unlimited" },
        { label: "Staff seats", value: "Unlimited" },
      ],
      subscribers: 120,
      accentTone: 3,
      recommended: false,
    },
  ];
}

export function buildInvoices(): BillingInvoice[] {
  const rng = createRng(4242);
  return Array.from({ length: 9 }, (_, index) => {
    const monthsBack = index;
    const date = monthsAgo(monthsBack, 6);
    const annual = index % 4 === 0;
    const amount = annual ? 44990 : 4499;
    return {
      id: `inv-${String(index + 1).padStart(3, "0")}`,
      number: `INV-2026-${String(1042 - index)}`,
      date,
      amount: amount + Math.floor(rng() * 3) * 100,
      currency: "INR",
      status: index === 8 ? "open" : index === 6 ? "refunded" : "paid",
      planName: "Scale",
      description: annual ? "Scale plan — annual billing" : "Scale plan — monthly billing",
    } satisfies BillingInvoice;
  });
}

/* -------------------------- Notifications ---------------------------- */

/**
 * The activity feed is generated from the dataset, so every notification
 * refers to a record that exists and describes its real state. Hard-coded
 * copy drifts out of sync with the fixtures and sends people to a page that
 * says the opposite.
 */
export function buildNotifications(input: {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  returns: ReturnRequest[];
  payments: Payment[];
  domains: CustomDomain[];
  themes: Theme[];
}): NotificationRecord[] {
  const { orders, products, customers, returns, payments, domains, themes } = input;
  const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

  const newestOrder = orders[0];
  const outOfStock = products.find(
    (product) => product.status === "active" && product.inventory === 0,
  );
  const lowStock = products.filter(
    (product) => product.status === "active" && product.inventory > 0 && product.inventory <= 20,
  );
  const readyToDispatch = orders.filter((order) => order.status === "confirmed");
  const openReturn = returns.find((request) => request.status === "requested");
  const restockedReturn = returns.find((request) => request.status === "restocked");
  const refundedPayment = payments.find((payment) => payment.refunds.length > 0);
  const cancelledOrder = orders.find((order) => order.status === "cancelled");
  const paidOrder = orders.find((order) => order.paymentStatus === "paid");
  const deliveredOrder = orders.find(
    (order) => order.status === "delivered" && order.shipmentId,
  );
  const newestCustomer = [...customers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
  const pendingDomain = domains.find((domain) => domain.status !== "verified");
  const activeTheme = themes.find((theme) => theme.isActive);
  const weeklyRevenue = orders
    .filter(
      (order) =>
        order.status !== "cancelled" &&
        new Date(order.createdAt).getTime() > Date.now() - 7 * 86400000,
    )
    .reduce((sum, order) => sum + order.total, 0);
  const previousRevenue = orders
    .filter(
      (order) =>
        order.status !== "cancelled" &&
        new Date(order.createdAt).getTime() > Date.now() - 14 * 86400000 &&
        new Date(order.createdAt).getTime() <= Date.now() - 7 * 86400000,
    )
    .reduce((sum, order) => sum + order.total, 0);
  const revenueChange = previousRevenue
    ? ((weeklyRevenue - previousRevenue) / previousRevenue) * 100
    : 0;

  const records: {
    type: NotificationRecord["type"];
    severity: NotificationRecord["severity"];
    title: string;
    body: string;
    href: string;
  }[] = [];

  if (newestOrder) {
    records.push({
      type: "order",
      severity: "success",
      title: `Order ${newestOrder.orderNumber} received`,
      body: `${newestOrder.customerName} placed an order worth ${money(newestOrder.total)}.`,
      href: `/dashboard/orders/${newestOrder.id}`,
    });
  }
  if (outOfStock) {
    records.push({
      type: "inventory",
      severity: "critical",
      title: `${outOfStock.title} is out of stock`,
      body: "Every variant of this product has run out. Restock it to keep it sellable.",
      href: `/dashboard/products/${outOfStock.id}`,
    });
  }
  if (readyToDispatch.length) {
    records.push({
      type: "fulfillment",
      severity: "info",
      title: `${readyToDispatch.length} order${readyToDispatch.length === 1 ? "" : "s"} ready to dispatch`,
      body: "Pick list generated for the morning batch.",
      href: "/dashboard/orders?status=confirmed",
    });
  }
  if (openReturn) {
    records.push({
      type: "return",
      severity: "warning",
      title: `Return request ${openReturn.id}`,
      body: `${openReturn.customerName} requested a return on order ${openReturn.orderNumber}.`,
      href: "/dashboard/returns",
    });
  }
  if (refundedPayment) {
    const refund = refundedPayment.refunds[0];
    records.push({
      type: "refund",
      severity: "info",
      title: `Refund of ${money(refund.amount)} processed`,
      body: `Demo refund recorded against payment ${refundedPayment.id}.`,
      href: "/dashboard/payments",
    });
  }
  if (lowStock.length) {
    records.push({
      type: "inventory",
      severity: "warning",
      title: `${lowStock.length} product${lowStock.length === 1 ? " is" : "s are"} below low stock`,
      body: "Reorder recommended before the next restock window.",
      href: "/dashboard/inventory",
    });
  }
  lowStock.slice(0, 2).forEach((product) => {
    records.push({
      type: "inventory",
      severity: product.inventory <= 5 ? "critical" : "warning",
      title: `${product.title} is running low`,
      body: `Only ${product.inventory} unit${product.inventory === 1 ? "" : "s"} left in stock.`,
      href: `/dashboard/products/${product.id}`,
    });
  });
  if (newestCustomer) {
    records.push({
      type: "customer",
      severity: "info",
      title: "New customer registered",
      body: `${newestCustomer.name} created an account${
        newestCustomer.marketingConsent ? " and opted into email" : ""
      }.`,
      href: `/dashboard/customers/${newestCustomer.id}`,
    });
  }
  if (cancelledOrder) {
    records.push({
      type: "order",
      severity: "warning",
      title: `Order ${cancelledOrder.orderNumber} cancelled`,
      body: "Cancelled before dispatch. The captured amount was refunded.",
      href: `/dashboard/orders/${cancelledOrder.id}`,
    });
  }
  records.push({
    type: "subscription",
    severity: "info",
    title: "Subscription renews in 6 days",
    body: "Scale plan renews on the 26th of this month.",
    href: "/dashboard/settings/subscription",
  });
  if (activeTheme) {
    records.push({
      type: "store",
      severity: "info",
      title: "Theme published",
      body: `${activeTheme.name} is now live on the storefront.`,
      href: "/dashboard/themes",
    });
  }
  if (paidOrder) {
    records.push({
      type: "order",
      severity: "success",
      title: `Order ${paidOrder.orderNumber} paid`,
      body: "Payment authorised via simulated online checkout.",
      href: `/dashboard/orders/${paidOrder.id}`,
    });
  }
  if (deliveredOrder) {
    records.push({
      type: "fulfillment",
      severity: "info",
      title: "Shipment delivered",
      body: `Order ${deliveredOrder.orderNumber} was delivered successfully.`,
      href: "/dashboard/shipping",
    });
  }
  if (restockedReturn) {
    const item = restockedReturn.items[0];
    records.push({
      type: "return",
      severity: "warning",
      title: "Return restocked",
      body: item
        ? `${item.quantity} unit${item.quantity === 1 ? "" : "s"} of ${item.title} returned to inventory.`
        : "A return was restocked into inventory.",
      href: "/dashboard/returns",
    });
  }
  records.push({
    type: "system",
    severity: "info",
    title: "Weekly performance digest ready",
    body: `Revenue is ${revenueChange >= 0 ? "up" : "down"} ${Math.abs(
      revenueChange,
    ).toFixed(1)}% compared with the previous week.`,
    href: "/dashboard/analytics",
  });
  if (pendingDomain) {
    records.push({
      type: "store",
      severity: "warning",
      title: "Domain verification pending",
      body: `${pendingDomain.hostname} is waiting for DNS records.`,
      href: "/dashboard/domains",
    });
  } else {
    records.push({
      type: "store",
      severity: "success",
      title: "Custom domain is live",
      body: `${domains[0].hostname} is verified and serving the storefront over SSL.`,
      href: "/dashboard/domains",
    });
  }

  return records.map((item, index) => ({
    id: `ntf-${String(index + 1).padStart(2, "0")}`,
    type: item.type,
    severity: item.severity,
    title: item.title,
    body: item.body,
    createdAt: clampToDay(daysAgo(index % 5, 9 + (index % 9), (index * 11) % 60)),
    read: index > 7,
    href: item.href,
  }));
}

/* --------------------------- Tax & shipping -------------------------- */

export function buildTaxSettings(): TaxSettings {
  const categories: TaxCategory[] = [
    { id: "tax-1", name: "Standard goods", rate: 18, compound: false, includedInPrice: false, effectiveFrom: "2024-04-01", productIds: [] },
    { id: "tax-2", name: "Essential goods", rate: 5, compound: false, includedInPrice: false, effectiveFrom: "2024-04-01", productIds: [] },
    { id: "tax-3", name: "Electronics accessories", rate: 28, compound: false, includedInPrice: false, effectiveFrom: "2025-01-01", productIds: [] },
    { id: "tax-4", name: "Packaging charge", rate: 12, compound: true, includedInPrice: true, effectiveFrom: "2025-06-01", productIds: [] },
  ];
  const rules: TaxRule[] = [
    { id: "txr-1", name: "Karnataka standard", country: "India", countryCode: "IN", state: "Karnataka", categoryId: "tax-1", priority: 1, active: true },
    { id: "txr-2", name: "Maharashtra standard", country: "India", countryCode: "IN", state: "Maharashtra", categoryId: "tax-1", priority: 1, active: true },
    { id: "txr-3", name: "Deliveware essentials", country: "India", countryCode: "IN", state: "Delhi", categoryId: "tax-2", priority: 1, active: true },
    { id: "txr-4", name: "Electronics surcharge", country: "India", countryCode: "IN", state: "Tamil Nadu", categoryId: "tax-3", priority: 2, active: true },
  ];
  return {
    country: "India",
    countryCode: "IN",
    state: "Karnataka",
    pricesIncludeTax: false,
    taxCategories: categories,
    rules,
  };
}

export function buildShippingZones(): ShippingZone[] {
  return [
    {
      id: "zone-domestic",
      name: "India — Metro",
      countries: ["India"],
      countriesCode: ["IN"],
      methods: [
        { id: "ship-standard", name: "Standard Shipping", type: "flat", price: 79, freeThreshold: 1999, minWeight: null, maxWeight: null, estimateMinDays: 3, estimateMaxDays: 5, carrier: "BlueDart Express" },
        { id: "ship-express", name: "Express Shipping", type: "weight", price: 149, freeThreshold: 4999, minWeight: 0, maxWeight: 5, estimateMinDays: 1, estimateMaxDays: 2, carrier: "Ecom Express" },
        { id: "ship-free", name: "Free Shipping", type: "free", price: 0, freeThreshold: 1999, minWeight: null, maxWeight: null, estimateMinDays: 4, estimateMaxDays: 6, carrier: "Delhivery Surface" },
      ],
    },
    {
      id: "zone-rest",
      name: "India — Rest of country",
      countries: ["India"],
      countriesCode: ["IN"],
      methods: [
        { id: "ship-ro-1", name: "Standard Shipping", type: "flat", price: 129, freeThreshold: 2999, minWeight: null, maxWeight: null, estimateMinDays: 5, estimateMaxDays: 7, carrier: "Ekart Logistics" },
        { id: "ship-ro-2", name: "Heavy Items Freight", type: "weight", price: 249, freeThreshold: null, minWeight: 5, maxWeight: 25, estimateMinDays: 7, estimateMaxDays: 10, carrier: "Delhivery Surface" },
      ],
    },
    {
      id: "zone-gcc",
      name: "GCC",
      countries: ["United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Oman"],
      countriesCode: ["AE", "SA", "QA", "KW", "OM"],
      methods: [
        { id: "ship-gcc-1", name: "International Standard", type: "flat", price: 2499, freeThreshold: null, minWeight: null, maxWeight: null, estimateMinDays: 7, estimateMaxDays: 12, carrier: "BlueDart Express" },
        { id: "ship-gcc-2", name: "International Express", type: "weight", price: 4299, freeThreshold: null, minWeight: 0, maxWeight: 10, estimateMinDays: 4, estimateMaxDays: 6, carrier: "Ecom Express" },
      ],
    },
  ];
}

export function buildShippingSettings(): StoreShippingSettings {
  return {
    freeShippingThreshold: 1999,
    handlingDays: 1,
    defaultZoneId: "zone-domestic",
    originCountry: "India",
    originPostalCode: "560001",
    weightUnit: "g",
  };
}

/* -------------------------- Email templates -------------------------- */

export function buildEmailTemplates(): EmailTemplate[] {
  return [
    {
      id: "eml-1",
      name: "Order confirmation",
      category: "order",
      subject: "We got your order — {{order_number}}",
      previewText: "Thanks {{customer_first_name}}, your order is confirmed.",
      body: "Hi {{customer_first_name}},\n\nThanks for shopping with {{store_name}}. We have received order {{order_number}} and are getting it ready.\n\nOrder summary\n{{line_items}}\n\nSubtotal: {{subtotal}}\nShipping: {{shipping}}\nTotal: {{total}}\n\nYou can track your parcel here: {{tracking_url}}\n\n— The {{store_name}} team",
      variables: ["customer_first_name", "store_name", "order_number", "line_items", "subtotal", "shipping", "total", "tracking_url"],
      enabled: true,
    },
    {
      id: "eml-2",
      name: "Order shipped",
      category: "shipping",
      subject: "Your order {{order_number}} is on the way",
      previewText: "{{carrier_name}} will deliver it by {{estimated_delivery}}.",
      body: "Hi {{customer_first_name}},\n\nGood news — order {{order_number}} has shipped with {{carrier_name}}.\n\nTracking number: {{tracking_number}}\nExpected delivery: {{estimated_delivery}}\n\nTrack your parcel: {{tracking_url}}",
      variables: ["customer_first_name", "order_number", "carrier_name", "tracking_number", "estimated_delivery", "tracking_url"],
      enabled: true,
    },
    {
      id: "eml-3",
      name: "Delivery confirmation",
      category: "shipping",
      subject: "Delivered — how did we do?",
      previewText: "Your order {{order_number}} was delivered.",
      body: "Hi {{customer_first_name}},\n\nOrder {{order_number}} was delivered today. If anything is not right, reply to this email within 30 days and we will sort it out.",
      variables: ["customer_first_name", "order_number"],
      enabled: true,
    },
    {
      id: "eml-4",
      name: "Refund processed",
      category: "refund",
      subject: "Your refund of {{refund_amount}} is on the way",
      previewText: "We refunded {{refund_amount}} to your original payment method.",
      body: "Hi {{customer_first_name}},\n\nWe have processed a refund of {{refund_amount}} for order {{order_number}}. It should reach your account within 5-7 working days.",
      variables: ["customer_first_name", "refund_amount", "order_number"],
      enabled: true,
    },
    {
      id: "eml-5",
      name: "Low stock alert",
      category: "alert",
      subject: "Low stock: {{product_title}}",
      previewText: "Only {{inventory_count}} units left of {{product_title}}.",
      body: "Hi {{store_owner_name}},\n\n{{product_title}} (SKU {{sku}}) has fallen to {{inventory_count}} units. Consider reordering before you sell out.",
      variables: ["store_owner_name", "product_title", "sku", "inventory_count"],
      enabled: true,
    },
    {
      id: "eml-6",
      name: "Abandoned cart nudge",
      category: "marketing",
      subject: "You left something behind",
      previewText: "Your cart is saved for the next 24 hours.",
      body: "Hi {{customer_first_name}},\n\nYou left {{cart_item_count}} item(s) in your cart. Your code {{discount_code}} is waiting for you.",
      variables: ["customer_first_name", "cart_item_count", "discount_code", "recovery_link"],
      enabled: false,
    },
  ];
}

/* ------------------------- Domains & platform ------------------------ */

export function buildCustomDomains(): CustomDomain[] {
  return [
    {
      id: "dom-1",
      hostname: "shop.northwind.example",
      isPrimary: true,
      status: "verified",
      sslStatus: "active",
      verificationToken: "nw-verify-9f2a41c7",
      createdAt: daysAgo(38, 11, 0),
      lastCheckedAt: daysAgo(2, 9, 30),
      dnsRecords: [
        { type: "CNAME", name: "shop", value: "domains.trellis.example", verified: true },
        { type: "TXT", name: "_trellis.shop", value: "nw-verify-9f2a41c7", verified: true },
      ],
    },
  ];
}

export function buildAuditLog(count = 40): PlatformAuditEntry[] {
  const rng = createRng(31415);
  const actions = [
    ["merchant.suspended", "Merchant", "critical"],
    ["plan.updated", "Subscription plan", "info"],
    ["staff.role_changed", "Platform staff", "warning"],
    ["merchant.created", "Merchant", "info"],
    ["integration.toggled", "Integration", "info"],
    ["settings.updated", "Platform settings", "warning"],
    ["merchant.plan_changed", "Merchant", "info"],
    ["support.escalated", "Support ticket", "info"],
  ] as const;
  return Array.from({ length: count }, (_, index) => {
    const [action, targetType, severity] = actions[index % actions.length];
    return {
      id: `aud-${String(index + 1).padStart(4, "0")}`,
      actor: ["Aditi Rao", "System", "Marco Silva", "Naveen Raghavan"][index % 4],
      action,
      target: `Record #${1000 + Math.floor(rng() * 8000)}`,
      targetType,
      createdAt: daysAgo(Math.floor(rng() * 30), 8 + (index % 10), (index * 13) % 60),
      ip: `10.${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}`,
      severity,
    } satisfies PlatformAuditEntry;
  });
}

export function buildPlatformSettings(): PlatformSettings {
  return {
    platformName: "Trellis Commerce",
    supportEmail: "platform@trellis.example",
    defaultTrialDays: 14,
    maintenanceMode: false,
    marketplaceLive: true,
    commissionRate: 2.5,
  };
}

/* ---------------------------- Analytics ------------------------------ */

/**
 * The 12-month analytics series is aggregated from the order history, so the
 * monthly chart and the order KPIs on the same screen describe the same
 * business. The channel split is the order revenue per channel, which means
 * it always adds back up to the month's revenue.
 */
export function buildAnalytics(orders: Order[]): AnalyticsMonth[] {
  const rng = createRng(2718);
  const now = new Date();
  const months: AnalyticsMonth[] = [];

  for (let index = 11; index >= 0; index -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - index, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() - index + 1, 1, 0, 0, 0, 0);
    const monthOrders = orders.filter((order) => {
      const time = new Date(order.createdAt).getTime();
      return time >= start.getTime() && time < end.getTime();
    });
    const valid = monthOrders.filter((order) => order.status !== "cancelled");
    const revenue = valid.reduce((sum, order) => sum + order.total, 0);
    const orderCount = valid.length;
    const refunds = monthOrders.reduce((sum, order) => sum + order.refundedTotal, 0);

    const conversionRate = 2.1 + rng() * 1.6;
    const sessions = orderCount
      ? Math.round(orderCount / (conversionRate / 100))
      : Math.round(320 + rng() * 180);
    const visitors = Math.round(sessions * (0.62 + rng() * 0.16));

    const channels: Record<SalesChannel, number> = {
      online_store: 0,
      mobile_app: 0,
      marketplace: 0,
      wholesale: 0,
      social: 0,
    };
    valid.forEach((order) => {
      channels[order.channel] += order.total;
    });

    months.push({
      month: start.toISOString(),
      revenue,
      orders: orderCount,
      sessions,
      visitors,
      refunds,
      aov: orderCount ? Math.round(revenue / orderCount) : 0,
      conversionRate: sessions
        ? Number(((orderCount / sessions) * 100).toFixed(2))
        : 0,
      channels,
    });
  }

  return months;
}

export const DEMO_STORES: DemoStore[] = [
  { id: "store-1", name: "Northwind Goods", slug: "northwind-goods", tagline: "Everyday goods, thoughtfully made", tone: 0 },
  { id: "store-2", name: "Aurora Beauty Co.", slug: "aurora-beauty", tagline: "Skincare and fragrance studio", tone: 3 },
  { id: "store-3", name: "Trailhead Outfitters", slug: "trailhead-outfitters", tagline: "Gear for weekend trails", tone: 5 },
];
