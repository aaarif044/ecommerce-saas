"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { useDataStore, useStoreSettings } from "@/lib/store/data-store";
import { calculateTotals, defaultShippingMethod, shippingQuoteFor, taxRateResolver, validateDiscount } from "@/lib/services/checkout";
import { useMoney } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card, CardBody } from "@/components/ui/card";
import { ProductImage } from "@/components/product-image";
import { EmptyState } from "@/components/ui/states";
import { WhatsappShareButton } from "@/components/storefront/whatsapp-share";
import { WhatsappCheckoutButton } from "@/components/storefront/whatsapp-checkout-button";
import { QuantityStepper } from "@/components/storefront/quantity-stepper";
import {
  StoreContainer,
  StoreLinkButton,
  StorePageTitle,
} from "@/components/storefront/store-container";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.couponCode);
  const discountId = useCartStore((state) => state.discountId);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const settings = useStoreSettings();
  const money = useMoney();

  const [code, setCode] = React.useState(couponCode ?? "");
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [couponNotice, setCouponNotice] = React.useState<string | null>(null);
  const allDiscounts = useDataStore((state) => state.discounts);
  const zones = useDataStore((state) => state.shippingZones);
  const discount = allDiscounts.find((item) => item.id === discountId) ?? null;

  const totals = calculateTotals(items, {
    discount,
    shipping: shippingQuoteFor(
      defaultShippingMethod(zones, settings.shipping),
      settings.shipping.freeShippingThreshold,
    ),
    freeShippingThreshold: settings.shipping.freeShippingThreshold,
    taxRateFor: taxRateResolver(settings.taxes),
  });

  const apply = () => {
    if (!code.trim()) {
      applyCoupon(null, null, 0);
      setCouponError(null);
      setCouponNotice(null);
      return;
    }
    const result = validateDiscount(code, totals.subtotal);
    if (!result.discount) {
      setCouponError(result.error ?? "That coupon cannot be applied.");
      setCouponNotice(null);
      applyCoupon(null, null, 0);
      return;
    }
    // The amount is derived with the same code path the totals use, so the
    // coupon the cart reports is the coupon the order is charged with.
    const preview = calculateTotals(items, {
      discount: result.discount,
      shipping: shippingQuoteFor(
        defaultShippingMethod(zones, settings.shipping),
        settings.shipping.freeShippingThreshold,
      ),
      freeShippingThreshold: settings.shipping.freeShippingThreshold,
      taxRateFor: taxRateResolver(settings.taxes),
    });
    applyCoupon(result.discount.code, result.discount.id, preview.discountTotal);
    setCouponError(null);
    setCouponNotice(`Coupon ${result.discount.code} applied.`);
  };

  return (
    <StoreContainer>
      <StorePageTitle title="Your cart" />

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<ShoppingBag className="size-5" aria-hidden />}
            title="Your cart is empty"
            description="Browse the catalogue and add something you like."
            action={<StoreLinkButton href="/store/products">Shop all products</StoreLinkButton>}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <ul className="divide-y divide-line">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 p-4">
                    <ProductImage assetId={item.assetId} alt={item.title} className="size-24 shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/store/products/${item.slug}`}
                            className="text-base font-medium text-ink hover:underline"
                          >
                            {item.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-ink-subtle">
                            {item.variantTitle} · {item.sku}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.title} from cart`}
                          className="text-ink-subtle hover:text-red-600 dark:hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                        <QuantityStepper
                          value={item.quantity}
                          max={item.maxQuantity}
                          onChange={(value) => updateQuantity(item.id, value)}
                        />
                        <div className="text-right">
                          <p className="text-base font-semibold tabular-nums text-ink">
                            {money(item.unitPrice * item.quantity)}
                          </p>
                          <p className="text-2xs text-ink-subtle">{money(item.unitPrice)} each</p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            {/* The checkout button covers the same surface, so the share
                control would only get in its way. */}
            {settings.checkout.whatsapp.enabled ? null : (
              <Card className="mt-4">
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">Share your cart</p>
                    <p className="text-xs text-ink-muted">
                      Send the items to a friend on WhatsApp — the link reopens this cart.
                    </p>
                  </div>
                  <WhatsappShareButton
                    surface="cart"
                    payload={{
                      path: "/store/cart",
                      title: "Your cart",
                      cartCount: totals.itemCount,
                      cartTotal: money(totals.total),
                      discountCode: couponCode ?? "",
                    }}
                  />
                </CardBody>
              </Card>
            )}

            <Card className="mt-4">
              <CardBody>
                <Field label="Discount code" error={couponError} hint={couponNotice ?? undefined}>
                  <div className="flex gap-2">
                    <Input
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="e.g. MONSOON15"
                      className="font-mono uppercase"
                      aria-label="Discount code"
                    />
                    <Button variant="secondary" onClick={apply}>
                      Apply
                    </Button>
                  </div>
                </Field>
              </CardBody>
            </Card>
          </div>

          <aside>
            <Card className="sticky top-24">
              <CardBody>
                <h2 className="text-md font-semibold text-ink">Order summary</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Subtotal</dt>
                    <dd className="tabular-nums text-ink">{money(totals.subtotal)}</dd>
                  </div>
                  {totals.discountTotal ? (
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Discount{couponCode ? ` (${couponCode})` : ""}</dt>
                      <dd className="tabular-nums text-emerald-600 dark:text-emerald-400">
                        − {money(totals.discountTotal)}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Shipping</dt>
                    <dd className="tabular-nums text-ink">
                      {totals.shippingTotal === 0 ? "Free" : money(totals.shippingTotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">
                      Tax{totals.effectiveTaxRate ? ` (${totals.effectiveTaxRate}%)` : ""}
                    </dt>
                    <dd className="tabular-nums text-ink">{money(totals.taxTotal)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2.5 text-md font-semibold">
                    <dt className="text-ink">Total</dt>
                    <dd className="tabular-nums text-ink">{money(totals.total)}</dd>
                  </div>
                </dl>

                {totals.freeShippingRemaining > 0 ? (
                  <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-950/50 dark:text-brand-200">
                    Add {money(totals.freeShippingRemaining)} more for free delivery.
                  </p>
                ) : (
                  <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
                    You have qualified for free delivery.
                  </p>
                )}

                {couponCode && !totals.appliedDiscount ? (
                  <p
                    role="status"
                    className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                  >
                    Coupon {couponCode} no longer applies to this cart. It has been removed from the
                    total.
                  </p>
                ) : null}

                {settings.checkout.whatsapp.enabled ? (
                  <>
                    <WhatsappCheckoutButton totals={totals} className="mt-4" />
                    <p className="mt-2 text-center text-2xs leading-4 text-ink-subtle">
                      This store checks out over WhatsApp. Your order is sent to the shop in a
                      message — nothing is charged here.
                    </p>
                  </>
                ) : (
                  <StoreLinkButton
                    href="/store/checkout"
                    size="lg"
                    block
                    className="mt-4"
                  >
                    Proceed to checkout
                  </StoreLinkButton>
                )}
                <StoreLinkButton
                  href="/store/products"
                  variant="ghost"
                  size="lg"
                  block
                  className="mt-2"
                >
                  Continue shopping
                </StoreLinkButton>
              </CardBody>
            </Card>
          </aside>
        </div>
      )}
    </StoreContainer>
  );
}
