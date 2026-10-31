"use client";

import * as React from "react";
import Link from "next/link";
import { Copy, ExternalLink, Info, Save } from "lucide-react";
import { WhatsappIcon, WHATSAPP_GREEN } from "@/components/ui/whatsapp-icon";
import { useStoreSettings } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { useSyncedState, useStoreOrigin, useWhatsappSettings } from "@/lib/hooks";
import { whatsappService, WHATSAPP_SURFACES, WHATSAPP_VARIABLES } from "@/lib/services/whatsapp";
import { isMockApiError } from "@/lib/services/errors";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field, Switch, SegmentedControl } from "@/components/ui/field";
import type { WhatsappSettings, WhatsappSurface } from "@/lib/types";

const TEMPLATE_FIELDS: {
  surface: WhatsappSurface;
  key: keyof WhatsappSettings;
  label: string;
  hint: string;
}[] = [
  {
    surface: "product",
    key: "productTemplate",
    label: "Product message",
    hint: "Shown when a shopper shares a product page.",
  },
  {
    surface: "collection",
    key: "collectionTemplate",
    label: "Collection message",
    hint: "Shown when a shopper shares a collection.",
  },
  {
    surface: "category",
    key: "categoryTemplate",
    label: "Category message",
    hint: "Shown when a shopper shares a category listing.",
  },
  {
    surface: "blog",
    key: "blogTemplate",
    label: "Article message",
    hint: "Shown when a shopper shares a blog post.",
  },
  {
    surface: "cart",
    key: "cartTemplate",
    label: "Cart message",
    hint: "Shown when a shopper shares their cart.",
  },
];

export default function WhatsappSettingsPage() {
  const settings = useStoreSettings();
  const toast = useUIStore((state) => state.toast);
  const origin = useStoreOrigin();
  const whatsappDefaults = useWhatsappSettings();
  const [form, setForm] = useSyncedState<WhatsappSettings>(whatsappDefaults);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSurface, setActiveSurface] = React.useState<WhatsappSurface>("product");

  const update = (patch: Partial<WhatsappSettings>) =>
    setForm((current) => ({ ...current, ...patch }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await whatsappService.update(form);
      toast({ variant: "success", title: "WhatsApp settings saved" });
    } catch (err) {
      const message = isMockApiError(err) ? err.message : "Could not save the WhatsApp settings.";
      setError(message);
      toast({ variant: "error", title: "Could not save", description: message });
    } finally {
      setSaving(false);
    }
  };

  const previewVars = React.useMemo<Record<string, string>>(
    () => ({
      store_name: settings.general.storeName,
      customer_name: "Aditi",
      url: `${origin}/store/products/aria-wireless-over-ear-headphones?utm_source=${form.utmSource || "whatsapp"}&utm_medium=whatsapp`,
      title: "Aria Wireless Over-Ear Headphones",
      product_title: "Aria Wireless Over-Ear Headphones",
      product_variant: "Medium",
      product_price: "₹12,990",
      collection_title: "Bestsellers",
      category_title: "Audio",
      blog_title: "How we choose our workshops",
      cart_count: "2",
      cart_total: "₹21,480",
      discount_code: "MONSOON15",
    }),
    [form.utmSource, origin, settings.general.storeName],
  );

  const activeTemplate =
    TEMPLATE_FIELDS.find((field) => field.surface === activeSurface)?.key ?? "messageTemplate";
  const previewMessage = (form[activeTemplate] as string).replace(
    /\{\{\s*([a-z_]+)\s*\}\}/gi,
    (match, key: string) => previewVars[key] ?? match,
  );
  const previewUrl = `https://wa.me/${form.phone.replace(/\D/g, "")}?text=${encodeURIComponent(previewMessage)}`;

  return (
    <SettingsLayout
      title="WhatsApp"
      description="Let shoppers share your store on WhatsApp. Messages are pre-filled and handed to WhatsApp by the shopper — nothing is sent automatically."
      actions={
        <>
          <Badge tone={form.enabled ? "success" : "neutral"} dot>
            {form.enabled ? "Enabled" : "Disabled"}
          </Badge>
          <Button variant="primary" size="sm" loading={saving} onClick={() => void save()}>
            <Save className="size-3.5" aria-hidden />
            Save settings
          </Button>
        </>
      }
    >
      <Page gap="sm">
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        ) : null}

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="flex items-center gap-2 font-medium">
            <Info className="size-4 shrink-0" aria-hidden />
            Click-to-chat links only
          </p>
          <p className="mt-1 leading-5">
            Trellis never connects to the WhatsApp Business API, never sends a message and never
            reads a customer’s phone number. The demo only builds an encoded
            <span className="mx-1 font-mono text-xs">wa.me</span> link for the shopper to open.
          </p>
        </div>

        <Card>
          <CardHeader title="Connection" description="Where the pre-filled message is addressed." />
          <CardBody className="flex flex-col gap-4">
            <Switch
              checked={form.enabled}
              onCheckedChange={(checked) => update({ enabled: checked })}
              label="Enable WhatsApp sharing"
              description="Turn off to hide every share control on the storefront."
            />
            <Field
              label="Business WhatsApp number"
              hint="Include the country code, for example +91 90000 00000."
              htmlFor="whatsapp-phone"
            >
              <Input
                id="whatsapp-phone"
                value={form.phone}
                onChange={(event) => update({ phone: event.target.value })}
                inputMode="tel"
                className="max-w-72 font-mono text-sm"
                placeholder="+91 90000 00000"
              />
            </Field>
            <Field
              label="Default message"
              hint="Used when a surface has no specific template."
              htmlFor="whatsapp-default-template"
            >
              <Textarea
                id="whatsapp-default-template"
                rows={2}
                value={form.messageTemplate}
                onChange={(event) => update({ messageTemplate: event.target.value })}
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Where to show the share button"
            description="Each surface can be turned on or off independently."
          />
          <CardBody className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {WHATSAPP_SURFACES.map((surface) => {
                const key = {
                  product: "showOnProducts",
                  collection: "showOnCollections",
                  category: "showOnCategories",
                  blog: "showOnBlog",
                  cart: "showOnCart",
                }[surface.value] as keyof WhatsappSettings;
                return (
                  <div
                    key={surface.value}
                    className="flex items-start gap-3 rounded-lg border border-line p-3"
                  >
                    <Switch
                      checked={Boolean(form[key])}
                      onCheckedChange={(checked) => update({ [key]: checked } as Partial<WhatsappSettings>)}
                      label={surface.label}
                      description={surface.description}
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Button style" htmlFor="whatsapp-style">
                <SegmentedControl
                  value={form.buttonStyle}
                  onChange={(value) => update({ buttonStyle: value })}
                  ariaLabel="Share button style"
                  options={[
                    { value: "label", label: "With label" },
                    { value: "icon", label: "Icon only" },
                    { value: "floating", label: "Floating" },
                  ]}
                />
              </Field>
              <Field
                label="Floating position"
                hint="Only used by the floating button style."
                htmlFor="whatsapp-position"
              >
                <Select
                  id="whatsapp-position"
                  value={form.position}
                  onChange={(event) =>
                    update({ position: event.target.value as WhatsappSettings["position"] })
                  }
                >
                  <option value="bottom-right">Bottom right</option>
                  <option value="bottom-left">Bottom left</option>
                </Select>
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Message templates"
            description="One template per surface. Click a variable to insert it."
          />
          <CardBody className="flex flex-col gap-4">
            <SegmentedControl
              value={activeSurface}
              onChange={setActiveSurface}
              ariaLabel="Template surface"
              options={WHATSAPP_SURFACES.map((surface) => ({
                value: surface.value,
                label: surface.label,
              }))}
            />

            {TEMPLATE_FIELDS.filter((field) => field.surface === activeSurface).map((field) => (
              <Field key={field.key} label={field.label} hint={field.hint} htmlFor={`whatsapp-${field.key}`}>
                <Textarea
                  id={`whatsapp-${field.key}`}
                  rows={3}
                  value={form[field.key] as string}
                  onChange={(event) =>
                    update({ [field.key]: event.target.value } as Partial<WhatsappSettings>)
                  }
                  className="font-mono text-xs"
                />
              </Field>
            ))}

            <div className="rounded-lg border border-line bg-surface-2 p-3">
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                Insert a variable
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {WHATSAPP_VARIABLES.filter(
                  (variable) =>
                    variable.surfaces === "all" ||
                    variable.surfaces === activeSurface ||
                    (Array.isArray(variable.surfaces) && variable.surfaces.includes(activeSurface)),
                ).map((variable) => (
                  <button
                    key={variable.key}
                    type="button"
                    onClick={() => {
                      const token = `{{${variable.key}}}`;
                      const current = form[activeTemplate] as string;
                      update({
                        [activeTemplate]: `${current}${current.endsWith(" ") || current === "" ? "" : " "}${token}`,
                      } as Partial<WhatsappSettings>);
                    }}
                    className="rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-2xs text-ink-muted transition-colors hover:border-brand-400 hover:text-brand-600"
                    title={variable.label}
                  >
                    {`{{${variable.key}}}`}
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Link tracking"
            description="Append campaign parameters to every shared link."
          />
          <CardBody className="flex flex-col gap-4">
            <Switch
              checked={form.includeTracking}
              onCheckedChange={(checked) => update({ includeTracking: checked })}
              label="Add UTM parameters to shared links"
              description="Shared links are tagged so you can attribute traffic in Analytics."
            />
            <Field label="UTM source" htmlFor="whatsapp-utm-source">
              <Input
                id="whatsapp-utm-source"
                value={form.utmSource}
                onChange={(event) => update({ utmSource: event.target.value })}
                className="max-w-56 font-mono text-sm"
                placeholder="whatsapp"
              />
            </Field>
            <Switch
              checked={form.copyLinkOnShare}
              onCheckedChange={(checked) => update({ copyLinkOnShare: checked })}
              label="Copy the product link when the share button is used"
              description="Handy when you also share the item over email or SMS."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Preview"
            description="Exactly what a shopper sees when they tap the share button."
          />
          <CardBody className="flex flex-col gap-4">
            <div className="rounded-xl border border-line bg-surface-2 p-4">
              <div className="flex items-center gap-2">
                <span
                  className="flex size-8 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: WHATSAPP_GREEN }}
                >
                  <WhatsappIcon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{settings.general.storeName}</p>
                  <p className="text-2xs text-ink-subtle">
                    {form.phone || "No number configured"} · {activeSurface}
                  </p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-lg rounded-tl-sm bg-surface px-3 py-2.5 text-sm leading-6 text-ink shadow-xs">
                {previewMessage}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                Click-to-chat link
              </p>
              <p className="break-all rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-2xs text-ink-muted">
                {previewUrl}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard?.writeText(previewUrl);
                    toast({ variant: "info", title: "Link copied to clipboard" });
                  }}
                >
                  <Copy className="size-3.5" aria-hidden />
                  Copy link
                </Button>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  Open WhatsApp
                </a>
                <Link
                  href="/dashboard/marketing"
                  className="inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium text-brand-600 hover:underline dark:text-brand-300"
                >
                  Go to marketing
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </Page>
    </SettingsLayout>
  );
}
