/**
 * Safe localStorage helpers. All demo persistence flows through here so a
 * corrupted or outdated payload never crashes the app — it simply falls back
 * to the deterministic fixtures.
 */

export const STORAGE_PREFIX = "trellis-demo:";

export const STORAGE_KEYS = {
  dataset: "dataset",
  settings: "settings",
  theme: "ui-theme",
  cart: "cart",
  activeStore: "active-store",
  sidebar: "sidebar-collapsed",
} as const;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function storageKey(key: string) {
  return `${STORAGE_PREFIX}${key}`;
}

export function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    if (parsed === null || parsed === undefined) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    // Storage can be full or blocked (private mode). The demo keeps working
    // in-memory; only persistence is lost.
  }
}

export function removeStorage(key: string) {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(storageKey(key));
  } catch {
    /* noop */
  }
}

export function clearDemoStorage() {
  if (!isBrowser()) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    /* noop */
  }
}

export function readThemePreference(): "light" | "dark" | "system" {
  if (!isBrowser()) return "system";
  const stored = window.localStorage.getItem(storageKey(STORAGE_KEYS.theme));
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export function writeThemePreference(value: "light" | "dark" | "system") {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(storageKey(STORAGE_KEYS.theme), value);
  } catch {
    /* noop */
  }
}
