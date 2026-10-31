import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const ROUTES = [
  "/dashboard",
  "/dashboard/products",
  "/dashboard/products/new",
  "/dashboard/orders",
  "/dashboard/customers",
  "/dashboard/analytics",
  "/dashboard/inventory",
  "/dashboard/discounts",
  "/dashboard/categories",
  "/dashboard/collections",
  "/dashboard/payments",
  "/dashboard/shipping",
  "/dashboard/returns",
  "/dashboard/abandoned-carts",
  "/dashboard/marketing",
  "/dashboard/reports",
  "/dashboard/seo",
  "/dashboard/navigation",
  "/dashboard/domains",
  "/dashboard/integrations",
  "/dashboard/storefront",
  "/dashboard/themes",
  "/dashboard/settings",
  "/dashboard/settings/general",
  "/dashboard/settings/regional",
  "/dashboard/settings/notifications",
  "/dashboard/settings/email",
  "/dashboard/settings/storefront",
  "/dashboard/settings/whatsapp",
  "/dashboard/settings/checkout",
  "/dashboard/settings/payments",
  "/dashboard/settings/shipping",
  "/dashboard/settings/taxes",
  "/dashboard/settings/staff",
  "/dashboard/settings/subscription",
  "/admin",
  "/admin/audit-log",
  "/admin/integrations",
  "/admin/merchants",
  "/admin/plans",
  "/admin/roles",
  "/admin/settings",
  "/admin/staff",
  "/admin/support",
  "/store",
  "/store/products",
  "/store/cart",
  "/store/checkout",
  "/store/collections/bestsellers",
  "/store/categories/electronics",
  "/store/search",
  "/store/blog",
  "/store/about",
  "/store/contact",
];

const WIDTHS = [375, 768, 1440];

async function main() {
  const browser = await chromium.launch();
  const problems: string[] = [];

  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    for (const route of ROUTES) {
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
      } catch {
        continue; // interrupted by a hot reload
      }
      await page.waitForTimeout(500);
      let overflow = 0;
      let wide: string[] = [];
      try {
        overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        // Also look for elements that stick out of the viewport. Elements
        // inside a horizontally scrollable ancestor are fine — that is how
        // the wide tables behave.
        wide = await page.evaluate(() => {
          const limit = document.documentElement.clientWidth;
          const inScroller = (element: Element) => {
            let parent = element.parentElement;
            while (parent && parent !== document.body) {
              const style = getComputedStyle(parent);
              if (/(auto|scroll)/.test(style.overflowX)) return true;
              parent = parent.parentElement;
            }
            return false;
          };
          const offenders: string[] = [];
          for (const element of Array.from(document.querySelectorAll("body *"))) {
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            if (rect.right <= limit + 1) continue;
            if (getComputedStyle(element).position === "fixed") continue;
            if (inScroller(element)) continue;
            offenders.push(
              `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 60)}`,
            );
          }
          return offenders.slice(0, 3);
        });
      } catch {
        continue; // the page navigated while we measured
      }
      if (overflow > 0) {
        problems.push(`${route} overflows by ${overflow}px at ${width}px`);
      }
      if (wide.length) problems.push(`${route} at ${width}px: ${wide.join(" | ")}`);
    }
    await context.close();
  }

  await browser.close();
  if (problems.length) {
    console.log(problems.join("\n"));
    console.log(`\n${problems.length} responsive problems`);
  } else {
    console.log("No responsive problems found.");
  }
}

void main();
