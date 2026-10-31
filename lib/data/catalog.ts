import { createRng } from "@/lib/utils";
import type { Category, Collection, Product, ProductVariant } from "@/lib/types";
import { productImageIds } from "./media";

export const CATEGORY_SEED: {
  name: string;
  slug: string;
  parent?: string;
  description: string;
}[] = [
  { name: "Electronics", slug: "electronics", description: "Personal tech, audio and smart home essentials." },
  { name: "Audio", slug: "audio", parent: "electronics", description: "Headphones, speakers and studio sound." },
  { name: "Smart Home", slug: "smart-home", parent: "electronics", description: "Connected lighting, security and comfort." },
  { name: "Computers", slug: "computers", parent: "electronics", description: "Laptops, accessories and desk gear." },
  { name: "Mobile Accessories", slug: "mobile-accessories", parent: "electronics", description: "Chargers, cases and cables." },
  { name: "Apparel", slug: "apparel", description: "Everyday clothing for all seasons." },
  { name: "Men's Clothing", slug: "mens-clothing", parent: "apparel", description: "Shirts, jackets and everyday wear." },
  { name: "Women's Clothing", slug: "womens-clothing", parent: "apparel", description: "Dresses, kurtas and layering pieces." },
  { name: "Kids Clothing", slug: "kids-clothing", parent: "apparel", description: "Soft, durable clothing for little ones." },
  { name: "Footwear", slug: "footwear", description: "Sneakers, sandals and everyday shoes." },
  { name: "Bags & Luggage", slug: "bags-luggage", description: "Totes, backpacks and travel gear." },
  { name: "Beauty & Personal Care", slug: "beauty-personal-care", description: "Daily care and grooming essentials." },
  { name: "Skincare", slug: "skincare", parent: "beauty-personal-care", description: "Serums, creams and cleansers." },
  { name: "Fragrance", slug: "fragrance", parent: "beauty-personal-care", description: "Eau de parfum and body mists." },
  { name: "Home & Living", slug: "home-living", description: "Comfort and character for your space." },
  { name: "Kitchen", slug: "kitchen", parent: "home-living", description: "Cookware, serveware and storage." },
  { name: "Furniture", slug: "furniture", parent: "home-living", description: "Tables, seating and storage solutions." },
  { name: "Sports & Outdoors", slug: "sports-outdoors", description: "Training, camping and cycling gear." },
  { name: "Toys & Games", slug: "toys-games", description: "Play for every age." },
  { name: "Stationery", slug: "stationery", description: "Notebooks, pens and desk tools." },
];

type ProductSeed = {
  title: string;
  brand: string;
  category: string;
  price: number;
  compareAt?: number;
  variants?: { name: string; options: string[]; priceDelta: number }[];
  weight: number;
  tags: string[];
  description: string;
};

const PRODUCT_SEED: ProductSeed[] = [
  { title: "Aria Wireless Over-Ear Headphones", brand: "Sonova", category: "audio", price: 12990, compareAt: 15990, weight: 320, tags: ["audio", "wireless"], description: "Hybrid active noise cancelling with 40 hours of playback, plush memory-foam earcups and a foldable travel case." },
  { title: "Harbor 40W USB-C Charger", brand: "Voltra", category: "mobile-accessories", price: 2499, compareAt: 2999, weight: 180, tags: ["charger", "usb-c"], description: "Four-port GaN charger with intelligent power balancing, thermal protection and a braided 2 m cable." },
  { title: "Lumen Smart Bulb 9W (Pack of 4)", brand: "Lumen", category: "smart-home", price: 1799, weight: 220, tags: ["smart", "lighting"], description: "Tunable white smart bulbs with schedules, scenes and app control. Works with voice assistants." },
  { title: "Meridian 14\" Ultralaptop", brand: "Meridian", category: "computers", price: 84900, compareAt: 92900, weight: 1300, tags: ["laptop"], description: "Fanless 14-inch ultralight with a 2.8K OLED panel, 16 GB memory and all-day battery life." },
  { title: "Basalt Mechanical Keyboard 75%", brand: "Basalt", category: "computers", price: 6499, compareAt: 7499, weight: 850, tags: ["keyboard", "desk"], description: "Hot-swappable 75% mechanical keyboard with gasket mount, PBT keycaps and per-key backlighting." },
  { title: "Sable Wireless Mouse", brand: "Basalt", category: "computers", price: 2199, weight: 90, tags: ["mouse"], description: "Low-latency 2.4 GHz mouse with a 26,000 DPI sensor and 70-day battery life." },
  { title: "Cedar & Vetiver Eau de Parfum 50ml", brand: "Aureline", category: "fragrance", price: 4200, compareAt: 4900, weight: 240, tags: ["fragrance", "unisex"], description: "A woody, green fragrance opening with citrus and settling into cedar, vetiver and soft amber." },
  { title: "Nimbus Cloud Cream Moisturiser", brand: "Nimbus", category: "skincare", price: 1450, weight: 120, tags: ["skincare"], description: "Lightweight ceramide moisturiser that absorbs in seconds and layers cleanly under makeup." },
  { title: "Renewal Vitamin C Serum 30ml", brand: "Nimbus", category: "skincare", price: 1890, compareAt: 2190, weight: 110, tags: ["skincare", "serum"], description: "10% stabilised vitamin C with ferulic acid for brighter, more even-looking skin." },
  { title: "Terra Ceramic Dinner Set (16 pc)", brand: "Terra", category: "kitchen", price: 5699, compareAt: 6499, weight: 6200, tags: ["kitchen", "tableware"], description: "Stoneware plates, bowls and side dishes with a reactive glaze. Oven, microwave and dishwasher safe." },
  { title: "Cast Iron Skillet 26cm", brand: "Forge & Co.", category: "kitchen", price: 3299, weight: 3900, tags: ["kitchen", "cookware"], description: "Pre-seasoned cast iron skillet that improves with use. Suitable for stovetop, oven and induction." },
  { title: "Loft Oak Dining Table 160cm", brand: "Loftline", category: "furniture", price: 27900, compareAt: 32900, weight: 42000, tags: ["furniture", "dining"], description: "Solid oak veneer top with powder-coated steel legs. Seats six comfortably." },
  { title: "Loftline Ergo Task Chair", brand: "Loftline", category: "furniture", price: 18900, weight: 16000, tags: ["furniture", "office"], description: "Adjustable lumbar support, breathable mesh back and 4D armrests for long working days." },
  { title: "Everyday Oxford Shirt", brand: "Kettle & Co.", category: "mens-clothing", price: 1899, compareAt: 2299, weight: 320, tags: ["shirt", "cotton"], description: "Regular-fit oxford shirt in 100% combed cotton with mother-of-pearl buttons." },
  { title: "Quilted Bomber Jacket", brand: "Kettle & Co.", category: "mens-clothing", price: 6499, compareAt: 7999, weight: 900, tags: ["jacket"], description: "Water-resistant quilted bomber with ribbed cuffs, storm collar and two zip pockets." },
  { title: "Linen Kurta Set", brand: "Miraas", category: "womens-clothing", price: 3499, weight: 480, tags: ["kurta", "linen"], description: "Breathable cotton-linen kurta with tapered churidar and tonal embroidery at the neckline." },
  { title: "Wrap Midi Dress", brand: "Miraas", category: "womens-clothing", price: 4299, compareAt: 4999, weight: 520, tags: ["dress"], description: "Fluid viscose wrap dress with an adjustable tie waist and a softly draped neckline." },
  { title: "Kids Graphic Tee (2-Pack)", brand: "Little Fern", category: "kids-clothing", price: 899, weight: 180, tags: ["kids", "organic"], description: "Soft organic cotton tees in a two-pack with playful seasonal prints." },
  { title: "Canvas Low-Top Sneakers", brand: "Solemate", category: "footwear", price: 2799, compareAt: 3199, weight: 780, tags: ["sneakers"], description: "Durable vulcanised canvas sneakers with cushioned insoles and rubber toe caps." },
  { title: "Trail Runner GTX", brand: "Trailhead", category: "footwear", price: 8999, compareAt: 9999, weight: 1100, tags: ["running", "waterproof"], description: "Waterproof trail running shoes with a rock plate and aggressive lug pattern for mixed terrain." },
  { title: "Commuter Backpack 24L", brand: "Aegis", category: "bags-luggage", price: 4799, compareAt: 5499, weight: 900, tags: ["backpack"], description: "Weather-resistant commuter pack with a padded 16\" laptop sleeve and magnetic quick-access pocket." },
  { title: "Weekend Duffel 45L", brand: "Aegis", category: "bags-luggage", price: 6299, weight: 1400, tags: ["duffel", "travel"], description: "Cabin-sized duffel with a separate shoe compartment and detachable shoulder strap." },
  { title: "Trailhead 45L Hiking Pack", brand: "Trailhead", category: "sports-outdoors", price: 7499, weight: 1600, tags: ["hiking"], description: "Ventilated hiking pack with a hydration sleeve, load lifters and rain cover." },
  { title: "Cork Yoga Mat 6mm", brand: "Solis", category: "sports-outdoors", price: 2899, weight: 1400, tags: ["yoga"], description: "Natural cork surface over a recycled rubber base with alignment markers." },
  { title: "Adjustable Dumbbell Pair 24kg", brand: "Solis", category: "sports-outdoors", price: 12499, compareAt: 13999, weight: 24000, tags: ["fitness"], description: "Six weight settings per dumbbell from 2.5 kg to 12 kg with a moulded storage tray." },
  { title: "Terra Ribbed Glass Tumblers (Set of 6)", brand: "Terra", category: "kitchen", price: 2199, weight: 1500, tags: ["kitchen", "glass"], description: "Hand-blown ribbed tumblers with a weighted base and soft-touch finish." },
  { title: "Enamel Mug Set of 4", brand: "Forge & Co.", category: "kitchen", price: 1699, weight: 1200, tags: ["kitchen", "mugs"], description: "Camp-style enamel mugs with a speckled glaze and a durable rolled rim." },
  { title: "Arc Desk Lamp", brand: "Norrland", category: "home-living", price: 3999, compareAt: 4599, weight: 1600, tags: ["lighting", "desk"], description: "Adjustable aluminium desk lamp with stepless dimming and a warm-to-cool colour range." },
  { title: "Loom Cotton Throw Blanket", brand: "Norrland", category: "home-living", price: 3299, weight: 1500, tags: ["textile"], description: "Chunky-woven cotton throw finished with a hand-knotted fringe." },
  { title: "Scented Soy Candle — Cedar & Amber", brand: "Aureline", category: "home-living", price: 1499, weight: 450, tags: ["candle", "home"], description: "40-hour burn time in a reusable amber glass vessel with a cotton wick." },
  { title: "Wooden Alphabet Puzzle", brand: "Little Fern", category: "toys-games", price: 1299, weight: 600, tags: ["toy", "wooden"], description: "Hand-painted beechwood puzzle with chunky pieces and a cotton drawstring bag." },
  { title: "Strategy Board Game: Meridian", brand: "Tablefolk", category: "toys-games", price: 2499, compareAt: 2999, weight: 1600, tags: ["board game"], description: "A 60-minute strategy game for 2-4 players with 220 illustrated tiles." },
  { title: "Science Explorer Kit", brand: "Curio", category: "toys-games", price: 3499, weight: 2400, tags: ["toy", "stem"], description: "Build a working volcano, robot and circuit with 40 safe experiments." },
  { title: "Fountain Pen Set (3 pc)", brand: "Nib & Co.", category: "stationery", price: 2299, weight: 320, tags: ["stationery", "writing"], description: "Three resin fountain pens with steel, medium and flex nibs plus two ink cartridges." },
  { title: "A5 Dot Grid Notebook (3 pk)", brand: "Nib & Co.", category: "stationery", price: 1099, weight: 480, tags: ["stationery", "paper"], description: "192 pages of 100 gsm ivory dot-grid paper with ribbon markers." },
  { title: "Desk Organiser Tray Set", brand: "Basalt", category: "stationery", price: 1799, weight: 700, tags: ["desk"], description: "Modular aluminium trays for keys, stationery and small tech accessories." },
  { title: "Volt 65W GaN Charger", brand: "Voltra", category: "mobile-accessories", price: 3999, weight: 150, tags: ["charger", "gan"], description: "Pocket-sized 65 W GaN charger with dual USB-C and a smart power display." },
  { title: "MagSafe Power Bank 10K", brand: "Voltra", category: "mobile-accessories", price: 2999, compareAt: 3499, weight: 240, tags: ["power bank"], description: "Magnetic 10,000 mAh power bank with a fold-out kickstand and pass-through charging." },
  { title: "Everyday Tee — Heavy Cotton", brand: "Kettle & Co.", category: "mens-clothing", price: 1099, weight: 240, tags: ["tee"], description: "240 gsm combed cotton tee with a ribbed neck and a boxy, pre-shrunk cut." },
  { title: "Ribbed Lounge Set", brand: "Miraas", category: "womens-clothing", price: 2799, weight: 600, tags: ["loungewear"], description: "Two-piece ribbed viscose set with a relaxed fit and elasticated waist." },
  { title: "Terra Stoneware Mug (Set of 2)", brand: "Terra", category: "kitchen", price: 1299, weight: 800, tags: ["kitchen", "mugs"], description: "Hand-thrown stoneware mugs with a reactive glaze and a comfortable handle." },
  { title: "Meridian 27\" 4K Monitor", brand: "Meridian", category: "computers", price: 42900, compareAt: 46900, weight: 5200, tags: ["monitor"], description: "27-inch 4K IPS display with 99% sRGB coverage, USB-C power delivery and an adjustable stand." },
  { title: "Aria Studio Monitor Speakers", brand: "Sonova", category: "audio", price: 18900, weight: 6400, tags: ["audio", "speakers"], description: "Near-field studio monitors with 4-inch drivers and a room-accurate DSP profile." },
  { title: "Pulse Earbuds Pro", brand: "Sonova", category: "audio", price: 7999, compareAt: 8999, weight: 60, tags: ["audio", "earbuds"], description: "In-ear earbuds with adaptive transparency, wireless charging case and 32-hour total playback." },
  { title: "Nimbus Clay Mask 75ml", brand: "Nimbus", category: "skincare", price: 1190, weight: 130, tags: ["skincare", "mask"], description: "Kaolin and rose clay treatment that absorbs excess oil without stripping the skin." },
  { title: "Loftline Side Table", brand: "Loftline", category: "furniture", price: 8999, weight: 6500, tags: ["furniture"], description: "Compact round side table in solid oak with a matte natural finish." },
  { title: "Aegis Laptop Sleeve 14\"", brand: "Aegis", category: "bags-luggage", price: 1799, weight: 320, tags: ["sleeve"], description: "Water-repellent felt sleeve with a magnetic closure and a pen loop." },
  { title: "Aegis Tech Organiser Pouch", brand: "Aegis", category: "bags-luggage", price: 1499, weight: 220, tags: ["organiser", "tech"], description: "Soft-structured organiser with padded sleeves for cables, chargers and a pen loop." },
  { title: "Solis Recovery Foam Roller", brand: "Solis", category: "sports-outdoors", price: 2199, compareAt: 2599, weight: 700, tags: ["fitness", "recovery"], description: "Textured EVA foam roller for post-training recovery, with three firmness zones." },
  { title: "Terra Hand-Thrown Serving Bowl", brand: "Terra", category: "kitchen", price: 1899, weight: 1600, tags: ["kitchen", "tableware"], description: "Wide stoneware serving bowl with a reactive glaze. Each piece is unique." },
];

const VARIANT_SETS: { name: string; options: string[]; priceDelta: number }[] = [
  { name: "Small", options: ["Small"], priceDelta: 0 },
  { name: "Medium", options: ["Medium"], priceDelta: 0 },
  { name: "Large", options: ["Large"], priceDelta: 200 },
];

const COLOUR_SETS: { name: string; options: string[]; priceDelta: number }[] = [
  { name: "Midnight", options: ["Midnight"], priceDelta: 0 },
  { name: "Sand", options: ["Sand"], priceDelta: 0 },
  { name: "Olive", options: ["Olive"], priceDelta: 100 },
];

export const ANCHOR = (() => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
})();

export function daysAgo(days: number, hour = 11, minute = 30) {
  const date = new Date(ANCHOR);
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function monthsAgo(months: number, day = 12) {
  const date = new Date(ANCHOR);
  date.setMonth(date.getMonth() - months, day);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

/**
 * Clamps a timestamp to the end of the demo's "today".
 *
 * Fixtures are anchored to midnight, so a record dated "today at 19:00" would
 * sit in the future whenever the demo is opened in the morning. Nothing in the
 * dataset is allowed to be dated beyond today.
 *
 * The clamp is anchored to the day rather than to the wall clock on purpose:
 * the fixtures are generated both on the server and in the browser, and a
 * wall-clock clamp would give the two copies a different timestamp and break
 * hydration.
 */
export function clampToDay(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const endOfDay = new Date(ANCHOR);
  endOfDay.setHours(23, 59, 59, 999);
  return date.getTime() > endOfDay.getTime() ? endOfDay.toISOString() : iso;
}

export function buildCategories(): Category[] {
  const bySlug = new Map<string, Category>();
  CATEGORY_SEED.forEach((seed, index) => {
    const parent = seed.parent ? (bySlug.get(seed.parent)?.id ?? null) : null;
    const category: Category = {
      id: `cat-${String(index + 1).padStart(2, "0")}`,
      name: seed.name,
      slug: seed.slug,
      parentId: parent,
      description: seed.description,
      imageTone: index,
      productCount: 0,
      visibility: "visible",
      seoTitle: `${seed.name} — Northwind Goods`,
      seoDescription: seed.description,
      position: index + 1,
      createdAt: monthsAgo(14 - Math.min(index, 12)),
    };
    bySlug.set(seed.slug, category);
  });
  const categories = Array.from(bySlug.values());
  const counts = new Map<string, number>();
  categories.forEach((category) => {
    const seed = CATEGORY_SEED.find((s) => s.slug === category.slug)!;
    const count = PRODUCT_SEED.filter((p) => p.category === seed.slug).length;
    counts.set(category.slug, count);
  });
  return categories.map((category) => {
    const own = counts.get(category.slug) ?? 0;
    const children = categories.filter((c) => c.parentId === category.id);
    const total = own + children.reduce((sum, child) => sum + (counts.get(child.slug) ?? 0), 0);
    return { ...category, productCount: total };
  });
}

export function buildProducts(categories: Category[]): Product[] {
  const rng = createRng(90210);
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  return PRODUCT_SEED.map((seed, index) => {
    const category = categoryBySlug.get(seed.category)!;
    const id = `prd-${String(index + 1).padStart(3, "0")}`;
    const sku = `NW-${category.slug.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(4, "0")}`;
    const inventory = Math.floor(rng() * 140);
    const isVariantProduct = index % 3 === 0;
    const variantSet = index % 2 === 0 ? VARIANT_SETS : COLOUR_SETS;
    const variants: ProductVariant[] = isVariantProduct
      ? variantSet.map((variant, vIndex) => ({
          id: `${id}-v${vIndex + 1}`,
          title: variant.name,
          options: variant.options,
          sku: `${sku}-${vIndex + 1}`,
          barcode: `890${String(1000000 + index * 100 + vIndex)}`,
          price: seed.price + variant.priceDelta,
          compareAtPrice: seed.compareAt ? seed.compareAt + variant.priceDelta : undefined,
          costPrice: Math.round((seed.price + variant.priceDelta) * 0.58),
          inventory: Math.max(0, Math.floor(inventory / 2) + vIndex * 3),
          weight: seed.weight,
          imageTone: index,
        }))
      : [
          {
            id: `${id}-v1`,
            title: "Default",
            options: ["Default"],
            sku,
            barcode: `890${String(1000000 + index * 100)}`,
            price: seed.price,
            compareAtPrice: seed.compareAt,
            costPrice: Math.round(seed.price * 0.58),
            inventory,
            weight: seed.weight,
            imageTone: index,
          },
        ];

    const totalInventory = variants.reduce((sum, v) => sum + v.inventory, 0);
    const status: Product["status"] =
      index % 17 === 3 ? "draft" : index % 23 === 5 ? "archived" : "active";
    const visibility: Product["visibility"] = index % 19 === 7 ? "hidden" : "visible";

    return {
      id,
      title: seed.title,
      slug: seed.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-"),
      description: seed.description,
      images: productImageIds(index, 3),
      categoryId: category.id,
      collectionIds: [],
      brand: seed.brand,
      sku,
      barcode: `890${String(1000000 + index * 100)}`,
      price: seed.price,
      compareAtPrice: seed.compareAt,
      costPrice: Math.round(seed.price * 0.58),
      inventory: totalInventory,
      variants,
      weight: seed.weight,
      weightUnit: "g",
      shippingProfileId: "ship-standard",
      seoTitle: `${seed.title} | Northwind Goods`,
      seoDescription: seed.description.slice(0, 155),
      visibility,
      status,
      featured: index % 6 === 2,
      tags: seed.tags,
      createdAt: monthsAgo(11 - (index % 10)),
      updatedAt: daysAgo(index % 45, 9, 15),
    } satisfies Product;
  });
}

export const COLLECTION_SEED: {
  title: string;
  slug: string;
  description: string;
  type: Collection["type"];
}[] = [
  { title: "Bestsellers", slug: "bestsellers", description: "The pieces our customers keep coming back for.", type: "featured" },
  { title: "New Arrivals", slug: "new-arrivals", description: "The latest additions to the shelves.", type: "manual" },
  { title: "Work From Home", slug: "work-from-home", description: "Desk upgrades for long, comfortable days.", type: "manual" },
  { title: "Travel Essentials", slug: "travel-essentials", description: "Bags, footwear and layers for the road.", type: "manual" },
  { title: "Weekend Kitchen", slug: "weekend-kitchen", description: "Cookware and tableware for slow weekends.", type: "manual" },
  { title: "Skin Routine", slug: "skin-routine", description: "A four-step routine for calm, even skin.", type: "manual" },
  { title: "Gift Under ₹2,000", slug: "gift-under-2000", description: "Small, considered gifts at friendly prices.", type: "manual" },
  { title: "Monsoon Ready", slug: "monsoon-ready", description: "Waterproof, breathable and ready for the rain.", type: "manual" },
  { title: "Home Office Upgrade", slug: "home-office-upgrade", description: "Light, seating and storage that work harder.", type: "manual" },
  { title: "Festive Edit", slug: "festive-edit", description: "Warm tones and celebratory gifting.", type: "manual" },
  { title: "Trail Season", slug: "trail-season", description: "Gear for weekend trails and longer routes.", type: "manual" },
  { title: "Staff Picks", slug: "staff-picks", description: "What the Northwind team reaches for daily.", type: "manual" },
];

export function buildCollections(products: Product[]): Collection[] {
  const rng = createRng(4242);
  // A collection is a storefront surface: it may only contain products that
  // are actually sellable.
  const sellable = products.filter(
    (product) => product.status === "active" && product.visibility === "visible",
  );
  const pool = sellable.length ? sellable : products;
  return COLLECTION_SEED.map((seed, index) => {
    const size = seed.type === "featured" ? 12 : 6 + Math.floor(rng() * 6);
    const offset = index * 3;
    const productIds = Array.from(
      { length: size },
      (_, i) => pool[(offset + i * 5) % pool.length].id,
    );
    return {
      id: `col-${String(index + 1).padStart(2, "0")}`,
      title: seed.title,
      slug: seed.slug,
      description: seed.description,
      imageTone: index,
      productIds: Array.from(new Set(productIds)),
      type: seed.type,
      visibility: "visible",
      seoTitle: `${seed.title} — Northwind Goods`,
      seoDescription: seed.description,
      createdAt: monthsAgo(10 - (index % 8)),
      updatedAt: daysAgo(index * 3, 14, 5),
    } satisfies Collection;
  });
}
