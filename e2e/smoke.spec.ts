import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";

const consoleErrors: string[] = [];

function watch(page: Page) {
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") {
      const text = message.text();
      if (text.includes("Download the React DevTools")) return;
      if (text.includes("favicon")) return;
      consoleErrors.push(`[${page.url()}] ${text}`);
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(`[${page.url()}] pageerror: ${error.message}`);
  });
}

test.describe("Trellis Commerce", () => {
  test.beforeEach(async ({ page }) => {
    watch(page);
    await page.goto(BASE, { waitUntil: "networkidle" });
  });

  test("dashboard KPIs render and the date range changes the data", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Dashboard" }).first()).toBeVisible();

    const revenueCard = page.locator("div").filter({ hasText: /^Revenue/ }).last();
    const readRevenue = async () => {
      const card = page.locator("div.rounded-xl", { has: page.getByText("Revenue", { exact: true }) }).first();
      return (await card.innerText()).replace(/\s+/g, " ");
    };

    const before = await readRevenue();
    await page.getByRole("button", { name: /last 30 days/i }).click();
    await page.getByRole("button", { name: /last 7 days/i }).click();
    await page.waitForTimeout(900);
    const after = await readRevenue();
    expect(after, `revenue card: ${before}`).not.toBe(before);
    void revenueCard;
  });

  test("command palette opens with the keyboard and dark mode applies", async ({ page }) => {
    // Wait until the shell is interactive, so the shortcut is not pressed
    // before the app has hydrated.
    await expect(page.getByRole("button", { name: "Open global search" })).toBeEnabled();
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Command palette" })).toBeHidden();

    await page.getByRole("radio", { name: "Dark" }).click();
    await page.waitForTimeout(400);
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(isDark).toBe(true);
  });

  test("searching products filters the catalogue", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/products`, { waitUntil: "networkidle" });
    const rows = page.locator("tbody tr");
    const initial = await rows.count();
    expect(initial).toBeGreaterThan(0);

    const search = page.getByPlaceholder(/search/i).first();
    await search.fill("Aria");
    await page.waitForTimeout(700);
    const filtered = await rows.count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(initial);
  });

  test("a new product is created and found in the catalogue", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/products/new`, { waitUntil: "networkidle" });

    await page.locator("#product-title").fill("E2E Test Product");
    await page.locator("#product-description").fill("Created by the end-to-end suite.");
    await page.locator("#product-brand").fill("E2E Brand");
    await page.locator("#product-sku").fill("E2E-TEST-0001");
    const category = page.locator("#product-category");
    const firstCategory = await category.locator("option").nth(1).getAttribute("value");
    await category.selectOption(firstCategory!);

    await page.getByRole("button", { name: /create product/i }).first().click();
    // The product detail page confirms the product was actually saved. The
    // URL alone is not enough: `/dashboard/products/new` matches too.
    await expect(
      page.getByRole("heading", { name: "E2E Test Product" }),
    ).toBeVisible({ timeout: 15000 });

    await page.goto(`${BASE}/dashboard/products`, { waitUntil: "networkidle" });
    await page.getByPlaceholder(/search/i).first().fill("E2E Test Product");
    await expect(page.locator("tbody tr")).toHaveCount(1, { timeout: 15000 });
    await expect(page.getByText("E2E Test Product").first()).toBeVisible();
  });

  test("the order detail page renders", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/orders`, { waitUntil: "networkidle" });
    await page.locator("tbody tr a").first().click();
    await page.waitForTimeout(1200);
    await expect(page.getByText(/#NW-\d+/).first()).toBeVisible();
  });

  test("adding to cart persists and the demo checkout places an order", async ({ page }) => {
    await page.goto(`${BASE}/store/products`, { waitUntil: "networkidle" });
    await page.locator("a[href^='/store/products/']").first().click();
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await page.waitForTimeout(700);

    await page.goto(`${BASE}/store/cart`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible();
    await expect(page.locator("dl").first()).toContainText("₹");

    await page.goto(`${BASE}/store/checkout`, { waitUntil: "networkidle" });
    await page.getByLabel(/email address/i).first().fill("e2e@example.com");
    await page.getByLabel(/full name/i).first().fill("E2E Shopper");
    await page.getByLabel(/address line 1/i).first().fill("1 Test Street");
    await page.getByLabel(/city/i).first().fill("Bengaluru");
    await page.getByLabel(/postal code/i).first().fill("560001");

    // The demo terms checkbox is required, exactly as a real checkout would be.
    const terms = page.getByRole("checkbox").first();
    if (await terms.isVisible().catch(() => false)) await terms.check();

    await page.getByRole("button", { name: /place demo order/i }).click();
    await page.waitForURL(/\/store\/order\//, { timeout: 25000 });

    await expect(page.locator("body")).toContainText("₹");
  });

  test("the checkout reveals the billing address and charges the COD fee", async ({ page }) => {
    await page.goto(`${BASE}/store/products`, { waitUntil: "networkidle" });
    await page.locator("a[href^='/store/products/']").first().click();
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await page.waitForTimeout(600);

    await page.goto(`${BASE}/store/checkout`, { waitUntil: "networkidle" });

    // The billing address is hidden while "same as shipping" is on …
    await expect(page.getByLabel(/^billing name/i)).toBeHidden();

    // … and reachable once it is switched off.
    await page.getByText(/billing address is the same as shipping/i).click();
    await expect(page.getByLabel(/^billing name/i)).toBeVisible();

    // Cash on delivery announces a handling fee, so the summary has to show it.
    await page.getByRole("radio", { name: /cash on delivery/i }).check();
    await page.waitForTimeout(400);
    await expect(page.getByText("Cash on delivery fee").first()).toBeVisible();
  });

  test("the WhatsApp checkout mode replaces the standard checkout on the cart", async ({ page }) => {
    // Turn the mode on in the merchant settings.
    await page.goto(`${BASE}/dashboard/settings/checkout`, { waitUntil: "networkidle" });
    await page.getByRole("switch", { name: "Enable WhatsApp Checkout" }).click();
    await page.getByRole("button", { name: /save checkout settings/i }).click();
    await expect(page.getByText("Checkout settings saved")).toBeVisible();

    // The storefront picks the change up straight away.
    await page.goto(`${BASE}/store/products`, { waitUntil: "networkidle" });
    await page.locator("a[href^='/store/products/']").first().click();
    await page.waitForTimeout(900);
    const productTitle = (await page.getByRole("heading", { level: 1 }).first().innerText()).trim();
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await page.waitForTimeout(600);

    await page.goto(`${BASE}/store/cart`, { waitUntil: "networkidle" });
    const whatsappButton = page.getByRole("link", { name: /checkout on whatsapp/i });
    await expect(whatsappButton).toBeVisible();
    await expect(page.getByRole("link", { name: /proceed to checkout/i })).toHaveCount(0);

    const href = await whatsappButton.getAttribute("href");
    expect(href).toContain("wa.me/");
    const decoded = decodeURIComponent(href ?? "");
    // The message carries the item, the variant, the quantity, the price and the total.
    expect(decoded).toMatch(/text=/);
    expect(decoded).toContain(productTitle);
    expect(decoded).toMatch(/× 1/);
    expect(decoded).toMatch(/₹[\d,]+/);
    expect(decoded).toContain("Northwind Goods");
    expect(decoded).toContain("/store/cart");
  });

  test("a missing WhatsApp number disables the button instead of breaking it", async ({ page }) => {
    // Remove the business number from the WhatsApp integration …
    await page.goto(`${BASE}/dashboard/settings/whatsapp`, { waitUntil: "networkidle" });
    await page.locator("#whatsapp-phone").fill("");
    await page.getByRole("button", { name: /save/i }).first().click();
    await page.waitForTimeout(800);

    // … and leave the checkout number empty as well, so there is no fallback.
    await page.goto(`${BASE}/dashboard/settings/checkout`, { waitUntil: "networkidle" });
    await page.getByRole("switch", { name: "Enable WhatsApp Checkout" }).click();
    await page.locator("#checkout-whatsapp-phone").fill("");
    await page.getByRole("button", { name: /save checkout settings/i }).click();
    await expect(page.getByText("Checkout settings saved")).toBeVisible();

    await page.goto(`${BASE}/store/products`, { waitUntil: "networkidle" });
    await page.locator("a[href^='/store/products/']").first().click();
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await page.waitForTimeout(600);

    await page.goto(`${BASE}/store/cart`, { waitUntil: "networkidle" });
    const button = page.getByRole("button", { name: /checkout on whatsapp/i });
    await expect(button).toBeDisabled();
    await expect(page.getByText(/whatsapp business number/i).first()).toBeVisible();
    // No broken link is offered.
    await expect(page.getByRole("link", { name: /checkout on whatsapp/i })).toHaveCount(0);
  });

  test("turning the mode off restores the standard checkout", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings/checkout`, { waitUntil: "networkidle" });
    await page.getByRole("switch", { name: "Enable WhatsApp Checkout" }).click();
    await page.getByRole("button", { name: /save checkout settings/i }).click();
    await expect(page.getByText("Checkout settings saved")).toBeVisible();

    await page.goto(`${BASE}/store/products`, { waitUntil: "networkidle" });
    await page.locator("a[href^='/store/products/']").first().click();
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await page.waitForTimeout(600);

    await page.goto(`${BASE}/store/cart`, { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: /checkout on whatsapp/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /proceed to checkout/i })).toHaveCount(0);

    // Switch it back off again.
    await page.goto(`${BASE}/dashboard/settings/checkout`, { waitUntil: "networkidle" });
    await page.getByRole("switch", { name: "Enable WhatsApp Checkout" }).click();
    await page.getByRole("button", { name: /save checkout settings/i }).click();
    await expect(page.getByText("Checkout settings saved")).toBeVisible();

    await page.goto(`${BASE}/store/cart`, { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: /proceed to checkout/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /checkout on whatsapp/i })).toHaveCount(0);

    await page.getByRole("link", { name: /proceed to checkout/i }).click();
    await page.waitForURL(/\/store\/checkout/);
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Customer information" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Delivery method" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Order review" })).toBeVisible();
  });

  test("the header dropdowns open, align with their trigger and stay in the viewport", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Account menu" })).toBeEnabled();

    // The account menu opens, lines up with its trigger and is fully visible.
    const account = page.getByRole("button", { name: "Account menu" });
    await account.click();
    const accountMenu = page.getByRole("menu", { name: "Account menu" });
    await expect(accountMenu).toBeVisible();

    const [triggerBox, menuBox] = await Promise.all([
      account.boundingBox(),
      accountMenu.boundingBox(),
    ]);
    expect(triggerBox).not.toBeNull();
    expect(menuBox).not.toBeNull();
    // Right-aligned with the trigger.
    expect(Math.abs(triggerBox!.x + triggerBox!.width - (menuBox!.x + menuBox!.width))).toBeLessThanOrEqual(1);
    // Inside the viewport.
    expect(menuBox!.x).toBeGreaterThanOrEqual(0);
    expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(1440);
    expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(900);

    // Its items can be clicked — including the last one.
    await page.getByRole("menuitem", { name: "Store settings" }).click();
    await expect(page).toHaveURL(/\/dashboard\/settings\/general/);
    await expect(page.getByRole("menu")).toHaveCount(0);

    // The notification menu is wider, and it is measured rather than guessed.
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    const bell = page.getByRole("button", { name: /Notifications/ });
    await bell.click();
    const notificationMenu = page.getByRole("menu", { name: /Notifications/ });
    await expect(notificationMenu).toBeVisible();
    const [bellBox, notificationBox] = await Promise.all([
      bell.boundingBox(),
      notificationMenu.boundingBox(),
    ]);
    expect(
      Math.abs(bellBox!.x + bellBox!.width - (notificationBox!.x + notificationBox!.width)),
    ).toBeLessThanOrEqual(1);
    expect(notificationBox!.x + notificationBox!.width).toBeLessThanOrEqual(1440);
  });

  test("the header dropdowns stay usable on a short and on a mobile viewport", async ({ page }) => {
    // A short viewport: the menu flips above the trigger instead of running
    // off the bottom of the screen.
    await page.setViewportSize({ width: 1280, height: 360 });
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Account menu" }).click();
    const menu = page.getByRole("menu", { name: "Account menu" });
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(360);
    await expect(page.getByRole("menuitem", { name: "Sign out (demo)" })).toBeVisible();

    // Mobile: neither menu may leave the screen.
    await page.setViewportSize({ width: 390, height: 740 });
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Account menu" }).click();
    const accountBox = await page.getByRole("menu", { name: "Account menu" }).boundingBox();
    expect(accountBox!.x).toBeGreaterThanOrEqual(0);
    expect(accountBox!.x + accountBox!.width).toBeLessThanOrEqual(390);

    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /Notifications/ }).click();
    const notificationBox = await page
      .getByRole("menu", { name: /Notifications/ })
      .boundingBox();
    expect(notificationBox!.x).toBeGreaterThanOrEqual(0);
    expect(notificationBox!.x + notificationBox!.width).toBeLessThanOrEqual(390);
  });

  test("no horizontal overflow at mobile widths", async ({ page }) => {
    for (const width of [375, 390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `overflow at ${width}px`).toBe(0);
    }
  });

  test.afterAll(() => {
    if (consoleErrors.length) {
      throw new Error(`Console errors detected:\n${consoleErrors.join("\n")}`);
    }
  });
});
