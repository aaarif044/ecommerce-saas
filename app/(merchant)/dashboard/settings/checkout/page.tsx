"use client";

import { useSyncedState, useStoreOrigin, useWhatsappSettings } from "@/lib/hooks";
import * as React from "react";
import { Save, ShoppingCart } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { settingsService } from "@/lib/services/settings";
import { isMockApiError } from "@/lib/services/errors";
import {
  buildWhatsappCheckout,
  WHATSAPP_CHECKOUT_VARIABLES,
} from "@/lib/services/whatsapp";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import { WhatsappIcon, WHATSAPP_GREEN } from "@/components/ui/whatsapp-icon";

export default function CheckoutSettingsPage() {
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);
  const toast = useUIStore((state) => state.toast);
  const origin = useStoreOrigin();
  const whatsapp = useWhatsappSettings();

  const [form, setForm] = useSyncedState(settings.checkout);
  const [saving, setSaving] = React.useState(false);

  const updateWhatsapp = (patch: Partial<typeof form.whatsapp>) => {
    setForm({ ...form, whatsapp: { ...form.whatsapp, ...patch } });
  };

  // The preview uses a sample cart so the merchant can see the message the
  // shopper will send.
  const preview = buildWhatsappCheckout(
    form.whatsapp,
    whatsapp.phone,
    {
      items: [
        { title: "Aria Wireless Over-Ear Headphones", variantTitle: "Midnight", quantity: 2, lineTotal: "₹25,980" },
        { title: "Harbor 40W USB-C Charger", variantTitle: "Default", quantity: 1, lineTotal: "₹2,499" },
      ],
      itemCount: 3,
      total: "₹32,442",
      storeName: settings.general.storeName,
      path: "/store/cart",
    },
    origin,
  );

  const save = async () => {
    setSaving(true);
    try {
      await settingsService.updateCheckout(form);
      toast({ variant: "success", title: "Checkout settings saved" });
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not save",
        description: isMockApiError(error) ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsLayout
      title="Checkout settings"
      description="What the customer sees and must provide while checking out."
    >
      <Page gap="sm">
        <Card>
          <CardHeader title="Customer" description="Guest checkout and account requirements." />
          <CardBody className="flex flex-col gap-3">
            <Switch
              checked={form.guestCheckout}
              onCheckedChange={(checked) => setForm({ ...form, guestCheckout: checked })}
              label="Allow guest checkout"
              description="Customers can order without creating an account."
            />
            <Switch
              checked={form.requireAccount}
              onCheckedChange={(checked) => setForm({ ...form, requireAccount: checked })}
              label="Require a customer account"
            />
            <Switch
              checked={form.termsCheckbox}
              onCheckedChange={(checked) => setForm({ ...form, termsCheckbox: checked })}
              label="Require accepting the terms"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Address" />
          <CardBody className="flex flex-col gap-3">
            <Switch
              checked={form.requireShippingAddress}
              onCheckedChange={(checked) =>
                setForm({ ...form, requireShippingAddress: checked })
              }
              label="Require a shipping address"
            />
            <Switch
              checked={form.requireBillingAddress}
              onCheckedChange={(checked) =>
                setForm({ ...form, requireBillingAddress: checked })
              }
              label="Require a billing address"
            />
            <Switch
              checked={form.billingSameAsShipping}
              onCheckedChange={(checked) =>
                setForm({ ...form, billingSameAsShipping: checked })
              }
              label="Pre-fill billing with the shipping address"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Order summary" description="What appears beside the checkout form." />
          <CardBody className="flex flex-col gap-3">
            <Switch
              checked={form.showOrderSummary}
              onCheckedChange={(checked) => setForm({ ...form, showOrderSummary: checked })}
              label="Show the order summary"
            />
            <Switch
              checked={form.showTaxBreakdown}
              onCheckedChange={(checked) => setForm({ ...form, showTaxBreakdown: checked })}
              label="Show the tax breakdown"
            />
            <Switch
              checked={form.showShippingOptions}
              onCheckedChange={(checked) => setForm({ ...form, showShippingOptions: checked })}
              label="Show shipping options"
            />
            <Switch
              checked={form.allowOrderNotes}
              onCheckedChange={(checked) => setForm({ ...form, allowOrderNotes: checked })}
              label="Allow order notes"
            />
            <Switch
              checked={form.giftMessage}
              onCheckedChange={(checked) => setForm({ ...form, giftMessage: checked })}
              label="Allow a gift message"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="WhatsApp checkout"
            description="Let shoppers send their order straight to your WhatsApp business number."
          />
          <CardBody className="flex flex-col gap-4">
            <Switch
              checked={form.whatsapp.enabled}
              onCheckedChange={(checked) => updateWhatsapp({ enabled: checked })}
              label="Enable WhatsApp Checkout"
              description="When this is on, the cart shows a “Checkout on WhatsApp” button instead of the standard checkout. No order is placed in the demo — the shopper sends the message themselves."
            />

            {form.whatsapp.enabled ? (
              <>
                <Field
                  label="WhatsApp business number"
                  hint={
                    form.whatsapp.phone.trim()
                      ? "The number that receives the order."
                      : `Leave empty to use the WhatsApp number from Settings → WhatsApp (${whatsapp.phone || "not set"}).`
                  }
                  htmlFor="checkout-whatsapp-phone"
                >
                  <Input
                    id="checkout-whatsapp-phone"
                    value={form.whatsapp.phone}
                    onChange={(event) => updateWhatsapp({ phone: event.target.value })}
                    placeholder="+91 90000 00000"
                    className="max-w-64"
                  />
                </Field>

                <Field
                  label="Order message"
                  hint="The message the shopper sends. Click a variable to insert it."
                  htmlFor="checkout-whatsapp-message"
                >
                  <Textarea
                    id="checkout-whatsapp-message"
                    rows={6}
                    value={form.whatsapp.message}
                    onChange={(event) => updateWhatsapp({ message: event.target.value })}
                  />
                </Field>

                <div className="rounded-lg border border-line bg-surface-2 p-3">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                    Insert a variable
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {WHATSAPP_CHECKOUT_VARIABLES.map((variable) => (
                      <button
                        key={variable.key}
                        type="button"
                        onClick={() => {
                          const token = `{{${variable.key}}}`;
                          const current = form.whatsapp.message;
                          const separator =
                            current === "" || current.endsWith(" ") || current.endsWith("\n")
                              ? ""
                              : " ";
                          updateWhatsapp({ message: `${current}${separator}${token}` });
                        }}
                        className="rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-2xs text-ink-muted transition-colors hover:border-brand-400 hover:text-brand-600"
                        title={variable.label}
                      >
                        {`{{${variable.key}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-surface p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">
                    <WhatsappIcon className="size-4" style={{ color: WHATSAPP_GREEN }} />
                    Message preview
                  </p>
                  {preview.error ? (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                      {preview.error === "missing_number"
                        ? "Add a WhatsApp business number to enable the button. Until then the storefront tells the shopper that no number is configured."
                        : "That number is not a valid WhatsApp number — it needs 8 to 15 digits, including the country code."}
                    </p>
                  ) : (
                    <>
                      <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-ink-muted">
                        {preview.message}
                      </p>
                      <p className="mt-3 truncate font-mono text-2xs text-ink-subtle">
                        {preview.url}
                      </p>
                    </>
                  )}
                </div>
              </>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Preview" description="A summary of the active checkout rules." />
          <CardBody>
            <div className="rounded-xl border border-line bg-surface-2 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                <ShoppingCart className="size-4 text-ink-subtle" aria-hidden />
                Checkout rules
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-muted">
                {[
                  ["Checkout mode", form.whatsapp.enabled ? "WhatsApp" : "Standard"],
                  ["Guest checkout", form.guestCheckout ? "Allowed" : "Not allowed"],
                  ["Account required", form.requireAccount ? "Yes" : "No"],
                  ["Billing address", form.requireBillingAddress ? "Required" : "Optional"],
                  ["Terms acceptance", form.termsCheckbox ? "Required" : "Not shown"],
                  ["Order notes", form.allowOrderNotes ? "Enabled" : "Hidden"],
                  ["Gift message", form.giftMessage ? "Enabled" : "Hidden"],
                ].map(([label, value]) => (
                  <li key={label} className="flex items-center justify-between gap-3">
                    <span>{label}</span>
                    <span className="font-medium text-ink">{value}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={form.whatsapp.enabled ? "success" : "neutral"}>
                  {form.whatsapp.enabled ? "WhatsApp checkout" : "Standard checkout"}
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        <FormActions>
          <Button variant="primary" loading={saving} onClick={() => void save()}>
            <Save className="size-4" aria-hidden />
            Save checkout settings
          </Button>
        </FormActions>
      </Page>
    </SettingsLayout>
  );
}
