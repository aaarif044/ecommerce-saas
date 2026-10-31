import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function sum<T>(items: T[], pick: (item: T) => number) {
  return items.reduce((total, item) => total + pick(item), 0);
}

export function groupBy<T, K extends string | number>(
  items: T[],
  key: (item: T) => K,
) {
  return items.reduce<Record<K, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function formatNumber(value: number, locale = "en-IN") {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Deterministic pseudo-random generator (mulberry32). */
export function createRng(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickOne<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length) % list.length];
}

export function pickMany<T>(rng: () => number, list: readonly T[], count: number): T[] {
  const copy = [...list];
  const out: T[] = [];
  for (let i = 0; i < count && copy.length > 0; i += 1) {
    const index = Math.floor(rng() * copy.length);
    out.push(copy.splice(index, 1)[0]);
  }
  return out;
}

export function sleep(ms = 220) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/**
 * A product is sellable when it is published *and* visible. Checking only the
 * status would put drafts and hidden products in front of shoppers.
 */
export function isSellable(product: { status: string; visibility: string }) {
  return product.status === "active" && product.visibility === "visible";
}

/**
 * Product counts per category, including the products of its child
 * categories. A parent category such as "Electronics" owns no products of its
 * own, so the rolled-up number is the only one that means anything.
 */
export function rolledUpCategoryCounts(
  categories: { id: string; parentId: string | null }[],
  products: { categoryId: string }[],
): Map<string, number> {
  const direct = new Map<string, number>();
  for (const product of products) {
    direct.set(product.categoryId, (direct.get(product.categoryId) ?? 0) + 1);
  }

  const childrenOf = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const list = childrenOf.get(category.parentId) ?? [];
    list.push(category.id);
    childrenOf.set(category.parentId, list);
  }

  const counts = new Map<string, number>();
  const resolving = new Set<string>();
  const resolve = (id: string): number => {
    const cached = counts.get(id);
    if (cached !== undefined) return cached;
    if (resolving.has(id)) return 0; // defensive: a cycle cannot recurse forever
    resolving.add(id);
    const own = direct.get(id) ?? 0;
    const total =
      own +
      (childrenOf.get(id) ?? []).reduce((sum, child) => sum + resolve(child), 0);
    resolving.delete(id);
    counts.set(id, total);
    return total;
  };

  for (const category of categories) resolve(category.id);
  return counts;
}

/**
 * Splits a total across lines so the parts add up to the whole. The naive
 * `Math.round(line * total)` leaves rounding dust behind, which makes the line
 * items of an order disagree with the order total.
 */
export function allocateProportionally(subtotals: number[], total: number): number[] {
  const sum = subtotals.reduce((acc, value) => acc + value, 0);
  if (subtotals.length === 0) return [];
  if (sum <= 0 || total <= 0) return subtotals.map(() => 0);

  const exact = subtotals.map((value) => (value / sum) * total);
  const floored = exact.map((value) => Math.floor(value));
  let remainder = total - floored.reduce((acc, value) => acc + value, 0);

  const order = exact
    .map((value, index) => ({
      index,
      fraction: value - Math.floor(value),
      subtotal: subtotals[index],
    }))
    .sort((a, b) => b.fraction - a.fraction || b.subtotal - a.subtotal);

  const result = [...floored];
  for (let i = 0; remainder > 0 && order.length > 0; i += 1) {
    result[order[i % order.length].index] += 1;
    remainder -= 1;
  }
  return result;
}

let idCounter = 0;

/**
 * Monotonic id generator. Deterministic within a session and safe to call from
 * event handlers without relying on `Date.now()` during render.
 */
export function uniqueId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter.toString(36)}`;
}
