import {
  BadgePercent,
  BarChart3,
  BookOpen,
  Boxes,
  CreditCard,
  FileText,
  Globe,
  Image,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  Mail,
  MapPin,
  Megaphone,
  Package,
  Plug,
  RefreshCcw,
  Ruler,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wallet,
  MessageCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  keywords?: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const MERCHANT_NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Store performance at a glance',
        keywords: ['home', 'overview', 'kpi'],
      },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products', href: '/dashboard/products', icon: Package, description: 'Manage your catalogue' },
      { label: 'Categories', href: '/dashboard/categories', icon: Boxes, description: 'Category tree' },
      { label: 'Collections', href: '/dashboard/collections', icon: Layers, description: 'Curated product groups' },
      { label: 'Inventory', href: '/dashboard/inventory', icon: Ruler, description: 'Stock levels and adjustments' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag, description: 'Orders and fulfilment' },
      { label: 'Customers', href: '/dashboard/customers', icon: Users, description: 'Customer directory' },
      { label: 'Discounts', href: '/dashboard/discounts', icon: BadgePercent, description: 'Coupons and promotions' },
      { label: 'Abandoned Carts', href: '/dashboard/abandoned-carts', icon: ShoppingCart, description: 'Recover lost checkouts' },
      { label: 'Payments', href: '/dashboard/payments', icon: CreditCard, description: 'Transactions and refunds' },
      { label: 'Shipping', href: '/dashboard/shipping', icon: Truck, description: 'Zones, rates and tracking' },
      { label: 'Returns & Refunds', href: '/dashboard/returns', icon: RefreshCcw, description: 'Return requests' },
    ],
  },
  {
    label: 'Online Store',
    items: [
      { label: 'Storefront', href: '/dashboard/storefront', icon: Store, description: 'Preview the live shop' },
      { label: 'Themes', href: '/dashboard/themes', icon: Image, description: 'Theme gallery and editor' },
      { label: 'Navigation', href: '/dashboard/navigation', icon: LayoutDashboard, description: 'Menu structure' },
      { label: 'Pages', href: '/dashboard/pages', icon: FileText, description: 'Static content pages' },
      { label: 'Blog', href: '/dashboard/blog', icon: BookOpen, description: 'Editorial content' },
      { label: 'Domains', href: '/dashboard/domains', icon: Globe, description: 'Custom domains' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, description: 'Traffic and conversion' },
      { label: 'Reports', href: '/dashboard/reports', icon: FileText, description: 'Scheduled exports' },
      { label: 'Marketing', href: '/dashboard/marketing', icon: Megaphone, description: 'Campaigns and banners' },
      { label: 'SEO', href: '/dashboard/seo', icon: Search, description: 'Search and social previews' },
      { label: 'Integrations', href: '/dashboard/integrations', icon: Plug, description: 'Connected apps' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'General', href: '/dashboard/settings/general', icon: Settings, description: 'Store identity' },
      { label: 'Regional Preferences', href: '/dashboard/settings/regional', icon: Globe, description: 'Currency, locale, timezone' },
      { label: 'Notifications', href: '/dashboard/settings/notifications', icon: Mail, description: 'Alert preferences' },
      { label: 'Email', href: '/dashboard/settings/email', icon: Mail, description: 'Sender and templates' },
      { label: 'Storefront Preferences', href: '/dashboard/settings/storefront', icon: Store, description: 'Visibility and SEO' },
      { label: 'WhatsApp', href: '/dashboard/settings/whatsapp', icon: MessageCircle, description: 'WhatsApp integration' },
      { label: 'Checkout', href: '/dashboard/settings/checkout', icon: ShoppingCart, description: 'Checkout behaviour' },
      { label: 'Payments', href: '/dashboard/settings/payments', icon: CreditCard, description: 'Payment methods' },
      { label: 'Shipping', href: '/dashboard/settings/shipping', icon: Truck, description: 'Shipping defaults' },
      { label: 'Taxes', href: '/dashboard/settings/taxes', icon: Wallet, description: 'Tax configuration' },
      { label: 'Staff & Permissions', href: '/dashboard/settings/staff', icon: Users, description: 'Team access' },
      { label: 'Subscription & Billing', href: '/dashboard/settings/subscription', icon: CreditCard, description: 'Plan and invoices' },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    label: 'Platform',
    items: [
      { label: 'Platform Dashboard', href: '/admin', icon: LayoutDashboard, description: 'Marketplace overview' },
      { label: 'Merchants', href: '/admin/merchants', icon: Store, description: 'Merchant directory' },
      { label: 'Subscription Plans', href: '/admin/plans', icon: BadgePercent, description: 'Plan catalogue' },
      { label: 'Platform Staff', href: '/admin/staff', icon: Users, description: 'Internal team' },
      { label: 'Roles & Permissions', href: '/admin/roles', icon: Ruler, description: 'Access matrix' },
      { label: 'Audit Log', href: '/admin/audit-log', icon: FileText, description: 'Platform activity' },
      { label: 'Support Overview', href: '/admin/support', icon: LifeBuoy, description: 'Ticket health' },
      { label: 'Integration Status', href: '/admin/integrations', icon: Plug, description: 'Provider health' },
      { label: 'Platform Settings', href: '/admin/settings', icon: Settings, description: 'Global configuration' },
    ],
  },
];

export const STOREFRONT_NAV: NavGroup[] = [
  {
    label: 'Store',
    items: [
      { label: 'Home', href: '/store', icon: Store },
      { label: 'All products', href: '/store/products', icon: Package },
      { label: 'Search', href: '/store/search', icon: Search },
      { label: 'Cart', href: '/store/cart', icon: ShoppingCart },
      { label: 'Blog', href: '/store/blog', icon: BookOpen },
      { label: 'Contact', href: '/store/contact', icon: Mail },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'About', href: '/store/pages/about', icon: FileText },
      { label: 'Shipping policy', href: '/store/pages/shipping', icon: Truck },
      { label: 'Returns policy', href: '/store/pages/returns', icon: RefreshCcw },
      { label: 'FAQ', href: '/store/pages/faq', icon: LifeBuoy },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = [...MERCHANT_NAV.flatMap((group) => group.items), ...ADMIN_NAV.flatMap((group) => group.items)];

export function findNavItem(href: string) {
  return ALL_NAV_ITEMS.find((item) => item.href === href);
}

export const MAP_PIN_ICON = MapPin;
