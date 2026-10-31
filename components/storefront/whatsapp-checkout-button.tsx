"use client";

import * as React from "react";
import { useCartStore } from "@/lib/store/cart-store";
import { useStoreSettings } from "@/lib/store/data-store";
import { useMoney, useStoreOrigin, useWhatsappSettings } from "@/lib/hooks";
import { buildWhatsappCheckout, type WhatsappCheckout } from "@/lib/services/whatsapp";
import type { CartTotals } from "@/lib/services/checkout";
import { cn } from "@/lib/utils";
import { WhatsappIcon, WHATSAPP_GREEN } from "@/components/ui/whatsapp-icon";

/**
 * Builds the WhatsApp order message for the current cart. It reuses the
 * totals the caller already computed, so the message always shows the same
 * total the shopper sees.
 */
export function useWhatsappCheckout(totals: CartTotals): WhatsappCheckout {
  const settings = useStoreSettings();
  const whatsapp = useWhatsappSettings();
  const items = useCartStore((state) => state.items);
  const origin = useStoreOrigin();
  const money = useMoney();

  return React.useMemo(
    () =>
      buildWhatsappCheckout(
        settings.checkout.whatsapp,
        whatsapp.phone,
        {
          items: items.map((item) => ({
            title: item.title,
            variantTitle: item.variantTitle,
            quantity: item.quantity,
            lineTotal: money(item.unitPrice * item.quantity),
          })),
          itemCount: totals.itemCount,
          total: money(totals.total),
          storeName: settings.general.storeName,
          path: "/store/cart",
        },
        origin,
      ),
    [settings.checkout.whatsapp, settings.general.storeName, whatsapp.phone, items, money, totals.itemCount, totals.total, origin],
  );
}

export interface WhatsappCheckoutButtonProps {
  totals: CartTotals;
  className?: string;
  label?: string;
}

/**
 * The "Checkout on WhatsApp" call to action. It hands the order to WhatsApp
 * as a pre-filled message; nothing is ever sent on the merchant's behalf.
 *
 * When no business number is configured the button is disabled and says why,
 * so the shopper is never sent to a broken link.
 */
export function WhatsappCheckoutButton({
  totals,
  className,
  label = "Checkout on WhatsApp",
}: WhatsappCheckoutButtonProps) {
  const checkout = useWhatsappCheckout(totals);

  if (!checkout.url) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <button
          type="button"
          disabled
          aria-describedby="whatsapp-checkout-hint"
          className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-emerald-600/40 text-sm font-medium text-white"
        >
          <WhatsappIcon className="size-4" style={{ color: WHATSAPP_GREEN }} />
          {label}
        </button>
        <p id="whatsapp-checkout-hint" className="text-xs text-ink-muted">
          {checkout.error === "invalid_number"
            ? "The WhatsApp business number is not valid yet. The store owner can fix it in Settings → Checkout."
            : "WhatsApp checkout is not available yet — the store owner still has to add a WhatsApp business number in Settings → Checkout."}
        </p>
      </div>
    );
  }

  return (
    <a
      href={checkout.url}
      target="_blank"
      rel="noopener noreferrer"
      title={checkout.message}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-700",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <WhatsappIcon className="size-4" style={{ color: "#ffffff" }} />
      {label}
    </a>
  );
}
