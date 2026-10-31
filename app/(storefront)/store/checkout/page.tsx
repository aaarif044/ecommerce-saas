"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, HandCoins, Info, Lock, Package, Truck } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { useDataStore, useStoreSettings } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { calculateTotals, checkoutService, shippingQuoteFor, taxRateResolver } from "@/lib/services/checkout";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Radio, Select, Textarea } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ProductImage } from "@/components/product-image";
import { EmptyState } from "@/components/ui/states";
import { CheckoutSteps } from "@/components/storefront/checkout-steps";
import {
  StoreContainer,
  StoreLinkButton,
  StorePageTitle,
} from "@/components/storefront/store-container";
import type { AddressForm, PaymentMethod } from "@/lib/types";

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: typeof CreditCard;
}[] = [
  {
    value: "online_simulated",
    label: "Simulated online payment",
    description: "A demo gateway that authorises instantly. No card details are collected.",
    icon: CreditCard,
  },
  {
    value: "cod",
    label: "Cash on delivery",
    description: "Pay the courier when the parcel arrives.",
    icon: HandCoins,
  },
  {
    value: "manual",
    label: "Manual bank transfer",
    description: "Transfer the amount and share the reference afterwards.",
    icon: Lock,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.couponCode);
  const discountId = useCartStore((state) => state.discountId);
  const settings = useStoreSettings();
  const discounts = useDataStore((state) => state.discounts);
  const zones = useDataStore((state) => state.shippingZones);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();

  const discount = discounts.find((item) => item.id === discountId) ?? null;
  const availableMethods = React.useMemo(
    () => zones.flatMap((zone) => zone.methods),
    [zones],
  );

  const [shippingMethodId, setShippingMethodId] = React.useState<string>(
    availableMethods[0]?.id ?? "ship-standard",
  );
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
    settings.payments.defaultMethod,
  );
  const [sameAsShipping, setSameAsShipping] = React.useState(
    settings.checkout.billingSameAsShipping,
  );
  const [marketingOptIn, setMarketingOptIn] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [giftMessage, setGiftMessage] = React.useState("");
  const [placing, setPlacing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [email, setEmail] = React.useState("");
  const [shipping, setShipping] = React.useState<AddressForm>({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: settings.regional.state,
    postalCode: "",
    country: settings.regional.country,
    countryCode: settings.regional.countryCode,
  });
  const [billing, setBilling] = React.useState<AddressForm>({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: settings.regional.state,
    postalCode: "",
    country: settings.regional.country,
    countryCode: settings.regional.countryCode,
  });

  const selectedMethod = availableMethods.find((method) => method.id === shippingMethodId);
  const shippingQuote = React.useMemo(
    () => shippingQuoteFor(selectedMethod, settings.shipping.freeShippingThreshold),
    [selectedMethod, settings.shipping.freeShippingThreshold],
  );

  const totals = calculateTotals(items, {
    discount,
    shipping: shippingQuote,
    freeShippingThreshold: settings.shipping.freeShippingThreshold,
    taxRateFor: taxRateResolver(settings.taxes),
    // The cash-on-delivery surcharge is announced to the shopper, so it has to
    // be part of the total as well.
    handlingFee:
      paymentMethod === "cod" ? (settings.payments.codFee ?? 0) : 0,
  });

  // The discounted cart value, which is what the free-shipping thresholds are
  // measured against.
  const taxable = Math.max(0, totals.subtotal - totals.discountTotal);
  const couponGivesFreeShipping = totals.appliedDiscount?.type === "free_shipping";
  const methodIsFree = (method: (typeof availableMethods)[number]) =>
    method.type === "free" ||
    couponGivesFreeShipping ||
    (method.freeThreshold !== null && taxable >= method.freeThreshold);

  const placeOrder = async () => {
    setError(null);
    if (settings.storefront.requireAccount) {
      setError("This store requires an account at checkout. Sign in from the account menu to continue.");
      return;
    }
    if (!settings.checkout.guestCheckout && !email.includes("@")) {
      setError("A valid email address is required.");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (settings.checkout.requireShippingAddress && !shipping.line1) {
      setError("A shipping address is required.");
      return;
    }
    setPlacing(true);
    try {
      const { order } = await checkoutService.placeOrder({
        details: {
          email,
          shippingAddress: { ...shipping, email },
          billingAddress: { ...billing, email },
          billingSameAsShipping: sameAsShipping,
          shippingMethodId,
          paymentMethod,
          customerNote: note,
          giftMessage,
          marketingOptIn,
        },
        items,
        totals,
        discount,
      });
      toast({
        variant: "success",
        title: "Order placed",
        description: `${order.orderNumber} — this is a simulated order.`,
      });
      router.push(`/store/order/${order.id}`);
    } catch (err) {
      const message = isMockApiError(err) ? err.message : "Could not place the order.";
      setError(message);
    } finally {
      setPlacing(false);
    }
  };

  if (!items.length) {
    return (
      <StoreContainer width="3xl" padding="xl">
        <EmptyState
          icon={<Package className="size-5" aria-hidden />}
          title="Your cart is empty"
          description="Add a product before checking out."
          action={<StoreLinkButton href="/store/products">Shop all products</StoreLinkButton>}
        />
      </StoreContainer>
    );
  }

  const steps = [
    {
      id: "customer",
      label: "Customer information",
      complete: email.includes("@") && shipping.name.trim().length > 0,
    },
    {
      id: "address",
      label: "Shipping address",
      complete: shipping.line1.trim().length > 0 && shipping.city.trim().length > 0,
    },
    {
      id: "delivery",
      label: "Delivery method",
      complete: Boolean(selectedMethod),
    },
    {
      id: "payment",
      label: "Payment method",
      complete: Boolean(paymentMethod),
    },
    {
      id: "review",
      label: "Order review",
      complete: items.length > 0,
    },
  ];

  return (
    <StoreContainer>
      <StorePageTitle
        title="Checkout"
        description="Demo checkout — no payment is processed and no email is sent."
      />

      {settings.checkout.whatsapp.enabled ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          This store checks out over WhatsApp.{" "}
          <Link href="/store/cart" className="font-medium underline">
            Go back to the cart
          </Link>{" "}
          to send your order as a message.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      <CheckoutSteps steps={steps} className="mt-5" />

      <form
        className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          void placeOrder();
        }}
      >
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader title="Customer information" />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email address" required htmlFor="checkout-email">
                  <Input
                    id="checkout-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>
                <Field label="Phone number" htmlFor="checkout-phone">
                  <Input
                    id="checkout-phone"
                    value={shipping.phone}
                    onChange={(event) => setShipping({ ...shipping, phone: event.target.value })}
                    placeholder="+91 00000 00000"
                  />
                </Field>
              </div>
              <div className="mt-4">
                <Switch
                  checked={marketingOptIn}
                  onCheckedChange={setMarketingOptIn}
                  label="Send me product updates"
                  description="Demo only — nothing is emailed."
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Shipping address" />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required htmlFor="ship-name">
                  <Input
                    id="ship-name"
                    required
                    value={shipping.name}
                    onChange={(event) => setShipping({ ...shipping, name: event.target.value })}
                  />
                </Field>
                <Field label="Address line 1" required htmlFor="ship-line1">
                  <Input
                    id="ship-line1"
                    required
                    value={shipping.line1}
                    onChange={(event) => setShipping({ ...shipping, line1: event.target.value })}
                  />
                </Field>
                <Field label="Address line 2" htmlFor="ship-line2">
                  <Input
                    id="ship-line2"
                    value={shipping.line2}
                    onChange={(event) => setShipping({ ...shipping, line2: event.target.value })}
                  />
                </Field>
                <Field label="City" required htmlFor="ship-city">
                  <Input
                    id="ship-city"
                    required
                    value={shipping.city}
                    onChange={(event) => setShipping({ ...shipping, city: event.target.value })}
                  />
                </Field>
                <Field label="State / province" htmlFor="ship-state">
                  <Input
                    id="ship-state"
                    value={shipping.state}
                    onChange={(event) => setShipping({ ...shipping, state: event.target.value })}
                  />
                </Field>
                <Field label="Postal code" htmlFor="ship-postal">
                  <Input
                    id="ship-postal"
                    value={shipping.postalCode}
                    onChange={(event) =>
                      setShipping({ ...shipping, postalCode: event.target.value })
                    }
                  />
                </Field>
                <Field label="Country" htmlFor="ship-country">
                  <Select
                    id="ship-country"
                    value={shipping.country}
                    onChange={(event) => setShipping({ ...shipping, country: event.target.value })}
                  >
                    <option>India</option>
                    <option>United Kingdom</option>
                    <option>United States</option>
                    <option>United Arab Emirates</option>
                    <option>Singapore</option>
                    <option>Ireland</option>
                  </Select>
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Truck className="size-4 text-ink-subtle" aria-hidden />
                  Delivery method
                </span>
              }
            />
            <CardBody>
              <div className="space-y-2">
                {availableMethods.map((method) => {
                  const free = methodIsFree(method);
                  return (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        shippingMethodId === method.id
                          ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/30"
                          : "border-line hover:border-line-strong"
                      }`}
                    >
                      <Radio
                        name="shipping-method"
                        value={method.id}
                        checked={shippingMethodId === method.id}
                        onChange={() => setShippingMethodId(method.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{method.name}</span>
                        <span className="block text-2xs text-ink-subtle">
                          {method.carrier} · {method.estimateMinDays}–{method.estimateMaxDays} working days
                        </span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-ink">
                        {free ? "Free" : money(method.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <CreditCard className="size-4 text-ink-subtle" aria-hidden />
                  Payment method
                  <Badge tone="warning">Simulated</Badge>
                </span>
              }
            />
            <CardBody>
              <div className="space-y-2">
                {PAYMENT_METHODS.filter((method) =>
                  settings.payments.enabledMethods.includes(method.value),
                ).map((method) => {
                  const Icon = method.icon;
                  return (
                    <label
                      key={method.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        paymentMethod === method.value
                          ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/30"
                          : "border-line hover:border-line-strong"
                      }`}
                    >
                      <Radio
                        name="payment-method"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={() => setPaymentMethod(method.value)}
                        className="mt-1"
                      />
                      <Icon className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{method.label}</span>
                        <span className="block text-2xs leading-4 text-ink-subtle">
                          {method.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {paymentMethod === "manual" ? (
                <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2.5 text-xs leading-5 text-ink-muted">
                  {settings.payments.manualInstructions}
                </p>
              ) : null}
              {paymentMethod === "cod" && settings.payments.codFee > 0 ? (
                <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-ink-muted">
                  A handling fee of {money(settings.payments.codFee)} applies to cash on delivery.
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Additional details" />
            <CardBody>
              <div className="grid gap-4">
                {/* The billing fields follow the switch, not the store setting:
                    otherwise unchecking "same as shipping" would hide the only
                    place the billing address can be typed. */}
                {!sameAsShipping ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Billing name" htmlFor="bill-name">
                      <Input
                        id="bill-name"
                        value={billing.name}
                        onChange={(event) => setBilling({ ...billing, name: event.target.value })}
                      />
                    </Field>
                    <Field label="Billing address" htmlFor="bill-line1">
                      <Input
                        id="bill-line1"
                        value={billing.line1}
                        onChange={(event) => setBilling({ ...billing, line1: event.target.value })}
                      />
                    </Field>
                    <Field label="Billing city" htmlFor="bill-city">
                      <Input
                        id="bill-city"
                        value={billing.city}
                        onChange={(event) => setBilling({ ...billing, city: event.target.value })}
                      />
                    </Field>
                    <Field label="Billing postal code" htmlFor="bill-postal">
                      <Input
                        id="bill-postal"
                        value={billing.postalCode}
                        onChange={(event) =>
                          setBilling({ ...billing, postalCode: event.target.value })
                        }
                      />
                    </Field>
                  </div>
                ) : null}
                <Switch
                  checked={sameAsShipping}
                  onCheckedChange={setSameAsShipping}
                  label="Billing address is the same as shipping"
                />
                {settings.checkout.allowOrderNotes ? (
                  <Field label="Order notes" htmlFor="checkout-note">
                    <Textarea
                      id="checkout-note"
                      rows={3}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Delivery instructions, gift message or anything else."
                    />
                  </Field>
                ) : null}
                {settings.checkout.giftMessage ? (
                  <Field label="Gift message" htmlFor="checkout-gift">
                    <Input
                      id="checkout-gift"
                      value={giftMessage}
                      onChange={(event) => setGiftMessage(event.target.value)}
                      placeholder="Happy birthday!"
                    />
                  </Field>
                ) : null}
                {settings.checkout.termsCheckbox ? (
                  <label className="flex items-start gap-2 text-xs leading-5 text-ink-muted">
                    <Checkbox required className="mt-0.5" />
                    <span>
                      I agree to the demo terms of service. No contract is formed and no goods will be
                      shipped.
                    </span>
                  </label>
                ) : null}
              </div>
            </CardBody>
          </Card>
        </div>

        <aside>
          <Card className="sticky top-24">
            <CardBody>
              <h2 className="text-md font-semibold text-ink">Order review</h2>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <ProductImage assetId={item.assetId} alt={item.title} className="size-12 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                      <p className="truncate text-2xs text-ink-subtle">
                        {item.variantTitle} · ×{item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-ink">
                      {money(item.unitPrice * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
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
                {settings.checkout.showTaxBreakdown ? (
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">
                      Tax{totals.effectiveTaxRate ? ` (${totals.effectiveTaxRate}%)` : ""}
                    </dt>
                    <dd className="tabular-nums text-ink">{money(totals.taxTotal)}</dd>
                  </div>
                ) : null}
                {totals.handlingFee ? (
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Cash on delivery fee</dt>
                    <dd className="tabular-nums text-ink">{money(totals.handlingFee)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-line pt-2.5 text-md font-semibold">
                  <dt className="text-ink">Total</dt>
                  <dd className="tabular-nums text-ink">{money(totals.total)}</dd>
                </div>
              </dl>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                className="mt-4"
                loading={placing}
                loadingText="Placing order…"
              >
                Place demo order
              </Button>
              <p className="mt-3 flex items-start gap-1.5 text-2xs leading-4 text-ink-subtle">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                This places a simulated order in the demo dataset. No payment is taken and no
                confirmation email is sent.
              </p>
            </CardBody>
          </Card>
        </aside>
      </form>
    </StoreContainer>
  );
}
