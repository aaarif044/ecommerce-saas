"use client";

import { useSyncedState } from "@/lib/hooks";
import * as React from "react";
import { Eye, Lock, Save } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { settingsService } from "@/lib/services/settings";
import { isMockApiError } from "@/lib/services/errors";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";

export default function StorefrontSettingsPage() {
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);
  const toast = useUIStore((state) => state.toast);

  const [form, setForm] = useSyncedState(settings.storefront);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await settingsService.updateStorefront(form);
      toast({ variant: "success", title: "Storefront preferences saved" });
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
      title="Storefront preferences"
      description="Visibility, publication state, search metadata and customer-facing behaviour."
    >
      <Page gap="sm">
        <Card>
          <CardHeader title="Visibility" description="Who can reach the storefront." />
          <CardBody className="flex flex-col gap-4">
            <Field label="Store visibility" htmlFor="storefront-visibility">
              <select
                id="storefront-visibility"
                value={form.visibility}
                onChange={(event) =>
                  setForm({ ...form, visibility: event.target.value as typeof form.visibility })
                }
                className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-xs focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="public">Public — anyone can visit</option>
                <option value="password">Password protected</option>
                <option value="private">Private — staff only</option>
              </select>
            </Field>
            {form.visibility === "password" ? (
              <Field
                label="Store password"
                hint="Preview only — the demo never enforces it on the real storefront."
                htmlFor="storefront-password"
              >
                <Input
                  id="storefront-password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="max-w-56"
                />
              </Field>
            ) : null}
            <Switch
              checked={form.published}
              onCheckedChange={(checked) => setForm({ ...form, published: checked })}
              label="Publish the storefront"
              description="Unpublish to take the shop offline without changing any data."
            />
            <div className="flex flex-wrap gap-2">
              <Badge tone={form.published ? "success" : "warning"}>
                {form.published ? "Published" : "Unpublished"}
              </Badge>
              <Badge tone="neutral">{form.visibility}</Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Search metadata" description="Default title and description for the store." />
          <CardBody className="flex flex-col gap-4">
            <Field label="SEO title" htmlFor="storefront-seo-title">
              <Input
                id="storefront-seo-title"
                value={form.seoTitle}
                onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
              />
            </Field>
            <Field label="SEO description" htmlFor="storefront-seo-description">
              <Textarea
                id="storefront-seo-description"
                rows={3}
                value={form.seoDescription}
                onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}
              />
            </Field>
            <Field
              label="Social sharing image"
              hint="A generated demo tile is used for social previews."
              htmlFor="storefront-social"
            >
              <Input
                id="storefront-social"
                type="number"
                min={0}
                max={11}
                value={form.socialImageTone}
                onChange={(event) =>
                  setForm({ ...form, socialImageTone: Number(event.target.value) })
                }
                className="w-24"
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Product display" />
          <CardBody className="flex flex-col gap-3">
            <Switch
              checked={form.showOutOfStock}
              onCheckedChange={(checked) => setForm({ ...form, showOutOfStock: checked })}
              label="Show out-of-stock products"
              description="Sold-out items stay visible but cannot be added to the cart."
            />
            <Switch
              checked={form.showVendor}
              onCheckedChange={(checked) => setForm({ ...form, showVendor: checked })}
              label="Show brand / vendor"
            />
            <Switch
              checked={form.showReviews}
              onCheckedChange={(checked) => setForm({ ...form, showReviews: checked })}
              label="Show reviews"
              description="Stored for the demo; the demo catalogue ships no reviews."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Customer accounts" />
          <CardBody className="flex flex-col gap-3">
            <Switch
              checked={form.allowCustomerAccounts}
              onCheckedChange={(checked) =>
                setForm({ ...form, allowCustomerAccounts: checked })
              }
              label="Allow customer accounts"
            />
            <Switch
              checked={form.requireAccount}
              onCheckedChange={(checked) => setForm({ ...form, requireAccount: checked })}
              label="Require an account at checkout"
              description="Guests cannot check out without signing in."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Cart" />
          <CardBody className="flex flex-col gap-3">
            <Field label="Cart behaviour" htmlFor="cart-mode">
              <select
                id="cart-mode"
                value={form.cartMode}
                onChange={(event) =>
                  setForm({ ...form, cartMode: event.target.value as typeof form.cartMode })
                }
                className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-xs focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="drawer">Slide-out drawer</option>
                <option value="page">Dedicated cart page</option>
              </select>
            </Field>
            <Switch
              checked={form.showCartQuantity}
              onCheckedChange={(checked) => setForm({ ...form, showCartQuantity: checked })}
              label="Show item count in the cart icon"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Password protection preview"
            description="How a password-protected storefront is presented."
          />
          <CardBody>
            <div className="rounded-xl border border-line bg-surface-2 p-6 text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-surface text-ink-subtle shadow-xs">
                <Lock className="size-5" aria-hidden />
              </span>
              <p className="mt-3 text-base font-semibold text-ink">This store is password protected</p>
              <p className="mt-1 text-sm text-ink-muted">
                Enter the store password to continue shopping.
              </p>
              <div className="mx-auto mt-4 flex max-w-xs gap-2">
                <Input placeholder="Store password" aria-label="Store password preview" />
                <Button variant="primary" size="sm">
                  <Eye className="size-3.5" aria-hidden />
                  Enter
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <FormActions>
          <Button variant="primary" loading={saving} onClick={() => void save()}>
            <Save className="size-4" aria-hidden />
            Save preferences
          </Button>
        </FormActions>
      </Page>
    </SettingsLayout>
  );
}
