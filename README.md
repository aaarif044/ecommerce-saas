# Trellis Commerce — Multi-tenant e-commerce SaaS demo

A complete, production-quality **UI-only** multi-tenant e-commerce SaaS frontend inspired by
the functionality of `web.mydukaan.io`.

Everything runs in the browser: there is no backend, no database, no real payment processing,
no real email delivery and no real DNS/SSL verification. All data comes from deterministic
fixtures and every edit is persisted to `localStorage`.

---

## Quick start

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Other commands:

```bash
pnpm build      # production build
pnpm start      # serve the production build
pnpm lint       # eslint
pnpm typecheck  # tsc --noEmit
pnpm check:data      # assert the fixture invariants
pnpm check:services  # assert the mock service behaviour
pnpm test:e2e        # Playwright browser suite (needs a running dev server)
```

Requires Node 20+ and pnpm 12.

---

## Entry points

| Route | What it is |
| --- | --- |
| `/dashboard` | Merchant dashboard (KPIs, charts, low stock, activity, checklist) |
| `/dashboard/products` | Product catalogue with search, filters, bulk actions and CSV export |
| `/dashboard/orders` | Order management with status transitions, tracking, notes and refunds |
| `/dashboard/themes` | Interactive theme editor (colours, type, header, footer, sections) |
| `/dashboard/settings/*` | Full store configuration centre (12 sections, including WhatsApp) |
| `/store` | Customer-facing demo storefront driven by the active theme |
| `/store/checkout` | Demo checkout — places a simulated order |
| `/admin` | Platform administration interface |

Press **⌘K / Ctrl+K** anywhere for the command palette.

---

## Architecture

```
app/
  (merchant)/dashboard/…      Merchant application
  (storefront)/store/…        Customer-facing demo store
  (admin)/admin/…             Platform administration
components/
  ui/                         Design-system primitives (button, dialog, table, …)
  data-table/                 TanStack Table v9 data table
  charts/                     Recharts wrappers
  shell/                      Sidebar, topbar, command palette, notifications
  storefront/                 Store header, footer, theme sections, cart drawer
  products/ themes/ settings/ Feature components
lib/
  types.ts                    Every domain model, fully typed
  data/                       Deterministic fixtures (seeded PRNG, no Math.random at render)
  services/                   Mock API layer (async, latency, typed errors)
  store/                      Zustand stores (dataset, settings, cart, UI, date range)
  format.ts                   Intl.NumberFormat / Intl.DateTimeFormat helpers
  analytics.ts                Metrics, series, channel and product breakdowns
  navigation.ts               Navigation model for merchant, admin and storefront
```

### Design system

Design tokens live in `app/globals.css` using Tailwind CSS v4 `@theme`. Semantic surfaces
(`bg-surface`, `text-ink-muted`, `border-line`, …) are CSS variables that flip automatically
between light and dark mode, so a single class tree serves both themes.

**Type scale.** One size per role, so every piece of copy comes from the same ramp. The
utilities are the Tailwind names, so `text-sm` means the same thing everywhere:

| Token | Size | Used for |
| --- | --- | --- |
| `text-3xs` | 9px | count badges |
| `text-2xs` | 11px | micro labels, eyebrows, metadata |
| `text-xs` | 12px | supporting text |
| `text-sm` | 13px | body text and control labels (the default) |
| `text-base` | 14px | emphasis |
| `text-md` | 15px | card and section titles |
| `text-lg` | 17px | page titles |
| `text-xl` – `text-5xl` | 20 – 40px | headings and display values |

Arbitrary font sizes (`text-[13px]`) are not used anywhere.

**Shared components.**

| Component | Purpose |
| --- | --- |
| `components/ui/button` | Buttons: `primary`, `secondary`, `outline`, `ghost`, `subtle`, `danger`, `dangerGhost`, `success`, `link` × `sm`/`md`/`lg`/`icon*` |
| `components/ui/input` | `Input`, `Textarea`, `Select`, `Checkbox`, `Radio` — all `h-9`, same focus ring |
| `components/ui/field` | `Field` (label + hint + error), `Switch`, `SegmentedControl` |
| `components/ui/form` | `FormActions`, `FormGrid`, `FormFull` |
| `components/ui/card` | `Card`, `CardHeader`, `CardBody`, `CardFooter` |
| `components/ui/table` | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `DescriptionRow` |
| `components/data-table` | `DataTable` — TanStack Table v9 with sorting, pagination, selection, search and CSV export |
| `components/ui/filter-bar` | `FilterBar`, `FilterSelect`, `ActiveFilter` |
| `components/ui/dialog` | `Dialog` (focus trap, escape, scroll lock) and `ConfirmDialog` |
| `components/ui/sheet` | `Sheet` — the mobile drawer |
| `components/ui/dropdown-menu` | `DropdownMenu` (arrow-key navigation) and its items |
| `components/ui/badge` | `Badge` with the eight status tones |
| `components/shell/page-header` | `PageHeader`, `SectionTitle` |
| `components/shell/page` | `Page`, `CardGrid`, `StatGrid` — the page body and its grids |
| `components/ui/states` | `EmptyState`, `ErrorState` |

**Conventions.** One radius scale (`rounded-xs` … `rounded-2xl`), one control height per size
(`h-8` / `h-9` / `h-11`), one layering scale (`z-40` … `z-90`), one table min-width
(`table-min`, `table-min-compact`), `hover:bg-surface-2` for every interactive surface, a visible
2px focus ring on everything, and `prefers-reduced-motion` support for every animation.

### State & persistence

* `useDataStore` — the whole dataset (products, orders, customers, themes, settings…).
  Persisted to `localStorage` under the `trellis-demo:` prefix.
* `useStoreSettings` — per-demo-store settings, so the store switcher has real effect.
* `useCartStore` — the storefront cart, persisted across reloads.
* `useUIStore` — theme mode, sidebar state, command palette and toasts.
* `useDateRangeStore` — the shared dashboard/analytics date range.

Hydration happens in an effect after first paint, so the server render always uses the fixtures
and there is never a hydration mismatch. A **Reset demo data** action in the user menu clears all
local edits and restores the fixtures.

Persisted snapshots are **migrated on load**: `normaliseSettings()` merges whatever is in
`localStorage` over the current defaults, so a browser holding a snapshot written before a
settings section existed (or before a field was added) still loads with a complete, valid
configuration instead of an undefined value. The same guarantee is applied at read time by
`useWhatsappSettings()`, which always returns a complete object.

### Mock service layer

`lib/services/*` exposes async methods (`productService`, `orderService`, `settingsService`,
`themeService`, `checkoutService`, `merchantService`, …) with simulated latency and typed
`MockApiError` failures. UI components depend on these services, not on the fixture module, so a
real API can be swapped in later without touching the pages.

### TanStack Table v9

`components/data-table/data-table.tsx` wraps TanStack Table v9 (`tableFeatures`, `createColumnHelper`,
`useTable`) with sorting, pagination, row selection, a global search and CSV export.

### WhatsApp sharing

`/dashboard/settings/whatsapp` configures the whole share experience:

* **Connection** — master enable switch, the business WhatsApp number (validated to 8–15 digits
  with country code) and a default message template.
* **Surfaces** — product, collection, category, article and cart pages can each be turned on or off.
* **Button style** — labelled button, icon-only, or a floating action button (bottom-left /
  bottom-right).
* **Message templates** — one template per surface, with 13 insertable variables
  (`{{product_title}}`, `{{cart_total}}`, `{{url}}`, …).
* **Link tracking** — optional `utm_source` / `utm_medium=whatsapp` parameters, and an option to
  copy the product URL when the button is used.
* **Live preview** — the rendered WhatsApp bubble and the exact `wa.me` link that would be opened.

The storefront consumes that configuration through `lib/services/whatsapp.ts`, which renders the
template, appends tracking parameters and produces a properly URL-encoded
`https://wa.me/<number>?text=…` click-to-chat link. The brand glyph
(`components/ui/whatsapp-icon.tsx`, WhatsApp green `#25d366`) marks every control that opens a
WhatsApp chat — the share button, the floating button, the settings preview bubble, the recovery
links and the WhatsApp Business card in the integrations marketplace. Share controls appear on product detail,
collection, category, article and cart pages, plus an optional floating button in the storefront
layout. Marketing and abandoned-cart screens reuse the same configuration.

**Nothing is ever sent.** Trellis does not connect to the WhatsApp Business API, does not read a
customer's phone number and does not dispatch messages — the demo only builds a link the shopper
opens themselves.

### Checkout mode (standard or WhatsApp)

`/dashboard/settings/checkout` has an **Enable WhatsApp Checkout** switch that chooses how a
storefront order is placed:

| Mode | What the shopper sees |
| --- | --- |
| **Standard** (default) | "Proceed to checkout" leads to the full checkout: customer information → shipping address → delivery method → payment method → order review → place order → order confirmation. |
| **WhatsApp** | The cart replaces "Proceed to checkout" with a **Checkout on WhatsApp** button that opens WhatsApp with the order pre-filled. |

The WhatsApp mode is configured in the same card:

* **Business number** — the number that receives the order. Leave it empty to reuse the number from
  `/dashboard/settings/whatsapp`; when neither is set the storefront says so and disables the
  button instead of offering a broken link.
* **Order message** — the template the shopper sends, with six insertable variables:
  `{{store_name}}`, `{{customer_name}}`, `{{cart_items}}`, `{{cart_count}}`, `{{cart_total}}` and
  `{{url}}`. `{{cart_items}}` expands to one line per item with the product, the variant, the
  quantity and the line price.
* **Live preview** — the rendered message and the exact `wa.me` link, with the missing-number and
  invalid-number cases called out.

The settings are part of the store settings bundle, so they are persisted to `localStorage` with the
rest of the dataset, migrated on load like every other section, and the storefront re-renders as
soon as they are saved. `lib/services/whatsapp.ts` builds the link (`buildWhatsappCheckout`),
`components/storefront/whatsapp-checkout-button.tsx` renders the call to action, and the cart page
and the cart drawer both use it.

### Charts

`components/charts/index.tsx` wraps Recharts (area, bar, line, donut, sparkline) with a shared
tooltip and axis treatment.

### Storefront configuration

Everything the merchant sets in the dashboard is read back by the storefront:

| Setting | Effect on the storefront |
| --- | --- |
| `storefront.published` | Unpublished stores show an offline notice instead of the shop |
| `storefront.visibility` | A password-protected store shows the password screen |
| `storefront.showOutOfStock` | Sold-out products are hidden from the catalogue when off |
| `storefront.showVendor` | The brand line is hidden from the product cards when off |
| `storefront.showCartQuantity` | The cart badge is hidden when off |
| `storefront.cartMode` | `page` sends the cart icon to `/store/cart` instead of opening the drawer |
| `storefront.allowCustomerAccounts` | The account link is hidden when off |
| `storefront.requireAccount` | Guests cannot check out when on |
| `taxes.taxCategories` / `taxes.rules` | The rate of each product's tax category is what the cart charges |
| `payments.codFee` | The cash-on-delivery surcharge is added to the total and shown in the summary |
| `shipping.freeShippingThreshold` | The cart's "add X more for free delivery" hint |

The shipping method a shopper picks owns its own free-delivery threshold, so a paid method is
never made free by the store-wide threshold.

---

## Dummy dataset

Deterministic fixtures seeded once at module load:

| Dataset | Size |
| --- | --- |
| Products | 50 (with variants, SKUs, pricing, stock) |
| Categories | 20 (hierarchical) |
| Collections | 12 (manual + featured) |
| Orders | 240 (12 months of history, consistent totals, timelines, transitions) |
| Customers | 60 (segments, tags, address book) |
| Inventory movements | 30 |
| Discounts | 15 |
| Payments | 40 (reference valid orders) |
| Shipments | 20 (reference valid orders) |
| Return requests | 15 (reference valid orders) |
| Analytics | 12 months (aggregated from the orders) |
| Staff | 10 |
| Notifications | 14 (derived from the dataset) |
| Themes | 4 |
| Subscription plans | 4 |
| Merchants | 15 |
| Integrations | 23 |
| Abandoned carts | 14 |
| Campaigns | 8 |
| Pages / Blog posts | 9 / 6 |
| Shipping zones | 3 |
| Tax categories & rules | 4 / 4 |
| Email templates | 6 |

All cross-references resolve to real records and order totals are internally consistent
(`total = subtotal − discount + tax + shipping`, and the line items add up to that total).

The derived numbers are derived, not invented: customer lifetime value, order count and
segment come from the customer's own orders, category product counts are rolled up from the
catalogue, the monthly analytics series is aggregated from the order history, and the activity
feed is generated from the records it links to.

---

## Simulated operations

These actions are **explicitly simulated** and are labelled as such in the UI:

* Checkout, online payment, cash on delivery and manual transfers — no money moves, no card
  details are collected.
* Order confirmation, fulfilment, tracking numbers, cancellations and refunds — recorded in the
  local dataset only.
* Transactional and marketing email — previews and template editing only; nothing is delivered.
* Custom domain verification and SSL provisioning — local state flips, no DNS query is made and
  no certificate is issued.
* Abandoned-cart recovery links and WhatsApp click-to-chat links — generated URLs only.
* Integrations — "connected" means a local flag, not a linked third-party account.

---

## Accessibility & responsiveness

* Semantic landmarks, labelled form controls, `aria-*` state on custom widgets.
* Visible focus rings, keyboard-operable menus, dialogs, tabs and the command palette.
* Responsive layouts verified at 375, 390, 768, 1280 and 1440 px; tables scroll horizontally
  instead of overflowing the page (measured `scrollWidth - clientWidth === 0` at every width).
* Light and dark themes, with the preference applied before first paint.

---

## Verification performed

| Check | Result |
| --- | --- |
| `pnpm typecheck` (`tsc --noEmit`, strict) | 0 errors |
| `pnpm lint` (`eslint`, Next core-web-vitals + TS) | 0 errors, 0 warnings |
| `pnpm build` (Next 16.4.2, Cache Components + Partial Prefetching) | 69 routes, 0 warnings |
| `pnpm check:data` (fixture integrity) | 0 problems |
| `pnpm check:services` (mock service layer) | 0 failures |
| `pnpm test:e2e` (Playwright, headless Chromium) | 11/11 passed, 0 console errors |
| `pnpm exec tsx scripts/responsive-audit.ts` (57 routes × 375 / 768 / 1440 px) | 0 overflows |

### Fixture integrity (`pnpm check:data`)

`scripts/check-integrity.ts` loads the fixtures and asserts the invariants the UI depends on:
every order satisfies `total = subtotal − discount + tax + shipping` *and* its line items add up
to that total, every cross-reference resolves to a real record, no identifier or slug is
duplicated, no record is dated in the future, customer lifetime value and order counts match the
orders the customer actually placed, category product counts are rolled up from the catalogue,
the monthly analytics series reconciles with the order history, and the activity feed only
mentions records that exist in the state it claims.

### Service layer (`pnpm check:services`)

`scripts/check-services.ts` drives the mock services against the live store and asserts the
behaviour of the write paths: a payment refund updates the linked order, refunds reject zero and
negative amounts, a status change keeps the payment state in sync, creating a product only adds it
to the collections it was assigned to, the cart maths reconciles to the rupee (line discounts and
taxes sum to the order totals), a free-shipping coupon needs its minimum purchase, the selected
shipping method keeps its own free-delivery threshold, a product-scoped coupon only discounts
those products, a placed order links back to its payment and shipment, order numbers stay unique,
and every plan change issues a unique invoice number.

### Browser suite (`pnpm test:e2e`)

`e2e/smoke.spec.ts` drives a real browser and asserts:

1. Dashboard KPIs render and the date-range filter changes the visible data.
2. Command palette opens with <kbd>Ctrl</kbd>+<kbd>K</kbd>; dark mode applies to the document.
3. Product search filters the catalogue.
4. A product can be created and is then found in the catalogue.
5. The order detail page renders.
6. Adding to cart persists across a navigation, and the demo checkout places an order that renders
   a confirmation page.
7. The checkout reveals the billing address once "same as shipping" is switched off, and the
   cash-on-delivery surcharge shows up in the summary.
8. The WhatsApp checkout mode replaces "Proceed to checkout" on the cart with a "Checkout on
   WhatsApp" link whose message carries the items, the quantities, the prices and the total.
9. A missing WhatsApp number disables the button and explains why instead of opening a broken link.
10. Turning the mode off again restores "Proceed to checkout" and the standard checkout flow.
11. No horizontal overflow at 375 / 390 / 768 px.

A separate sweep (`scripts/responsive-audit.ts`) loads all 57 routes at 375, 768 and 1440 px and
asserts that no page scrolls sideways and that no element sticks out of the viewport.

Run it with the dev server up:

```bash
pnpm dev
BASE_URL=http://localhost:3000 pnpm test:e2e
```

---

## Known limitations

* There is no backend — all persistence is per-browser `localStorage`.
* Payments, email, DNS/SSL and third-party integrations are simulated by design.
* The dataset is fictional; tax rates are illustrative and are not legally current.
* Multi-store mode shares the catalogue and order fixtures between the demo stores; only
  settings, theme and cart are per store.
* "Product photography" is generated from a 12-tile media library and category glyphs — the demo
  ships no bitmap assets, so imagery is illustrative rather than photographic.
* The browser suite covers the main flows; the WhatsApp surface matrix, the persistence-migration
  path and the theme editor are not covered by an automated suite.
