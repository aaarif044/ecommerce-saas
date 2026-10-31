"use client";

import * as React from "react";
import { useRegionalSettings, useStoreSettings } from "@/lib/store/data-store";
import { DEFAULT_WHATSAPP_SETTINGS } from "@/lib/data/settings";
import { formatDate, formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import type { CurrencyCode, WhatsappSettings } from "@/lib/types";

export function useMoney() {
  const regional = useRegionalSettings();
  return React.useCallback(
    (amount: number, currency?: CurrencyCode) =>
      formatMoney(amount, {
        currency: currency ?? regional.currency,
        locale: regional.numberLocale,
        symbol: regional.currencySymbol,
        symbolFirst: regional.currencyFormat === "symbol_first",
        decimals: regional.currencyDecimals,
      }),
    [regional],
  );
}

export function useMoneyCompact() {
  const regional = useRegionalSettings();
  return React.useCallback(
    (amount: number, currency?: CurrencyCode) =>
      formatMoney(amount, {
        currency: currency ?? regional.currency,
        locale: regional.numberLocale,
        symbol: regional.currencySymbol,
        symbolFirst: regional.currencyFormat === "symbol_first",
        decimals: regional.currencyDecimals,
        compact: true,
      }),
    [regional],
  );
}

export function useDateFormatter() {
  const regional = useRegionalSettings();
  return React.useCallback(
    (iso: string | Date, withTime = false) =>
      formatDate(iso, {
        dateFormat: regional.dateFormat,
        timeFormat: regional.timeFormat,
        timeZone: regional.timezone,
        withTime,
      }),
    [regional],
  );
}

export function useDateTimeFormatter() {
  const regional = useRegionalSettings();
  return React.useCallback(
    (iso: string | Date) =>
      formatDateTime(iso, {
        dateFormat: regional.dateFormat,
        timeFormat: regional.timeFormat,
        timeZone: regional.timezone,
        withTime: true,
      }),
    [regional],
  );
}

export function useNumberFormatter() {
  const regional = useRegionalSettings();
  return React.useCallback(
    (value: number, decimals = 0) => formatNumber(value, regional.numberLocale, decimals),
    [regional],
  );
}

/**
 * Local state that re-syncs when the source value changes identity.
 * Uses the "adjust state during render" pattern instead of an effect, which
 * avoids the cascading-render warning and keeps the form in step with the
 * store after a save.
 */
export function useSyncedState<T>(value: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(value);
  const [source, setSource] = React.useState<T>(value);

  if (source !== value) {
    setSource(value);
    setState(value);
  }

  return [state, setState];
}

const noopSubscribe = () => () => {};

/**
 * Hydration-safe "are we on the client yet" flag. Uses
 * `useSyncExternalStore` so the value flips without a setState-in-effect.
 */
export function useIsMounted() {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * The absolute origin of the storefront, safe to read during render.
 * The server snapshot keeps the first paint deterministic and the client
 * snapshot swaps in the real origin straight after hydration.
 */
export function useStoreOrigin(fallback = "https://northwind-goods.example") {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => (typeof window !== "undefined" ? window.location.origin : fallback),
    () => fallback,
  );
}

/**
 * The WhatsApp settings, with a safe fallback.
 *
 * `localStorage` can hold a snapshot written before the WhatsApp section
 * existed, so the value is always guaranteed to be complete here.
 */
export function useWhatsappSettings(): WhatsappSettings {
  const settings = useStoreSettings();
  return settings?.whatsapp ?? DEFAULT_WHATSAPP_SETTINGS;
}
