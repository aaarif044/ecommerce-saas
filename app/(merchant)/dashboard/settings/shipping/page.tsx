"use client";

import * as React from "react";
import { Save, Truck } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { settingsService } from "@/lib/services/settings";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useSyncedState } from "@/lib/hooks";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export default function ShippingSettingsPage() {
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);
  const zones = useDataStore((state) => state.shippingZones);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();

  const [form, setForm] = useSyncedState(settings.shipping);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await settingsService.updateShipping(form);
      toast({ variant: "success", title: "Shipping settings saved" });
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
      title="Shipping settings"
      description="Defaults for delivery, handling and the origin address."
    >
      <Page gap="sm">
        <Card>
          <CardHeader title="Delivery defaults" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Free shipping threshold"
              hint="Orders above this value ship free with the standard method."
              htmlFor="free-shipping"
            >
              <Input
                id="free-shipping"
                type="number"
                min={0}
                value={form.freeShippingThreshold}
                onChange={(event) =>
                  setForm({ ...form, freeShippingThreshold: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Handling days" htmlFor="handling-days">
              <Input
                id="handling-days"
                type="number"
                min={0}
                max={14}
                value={form.handlingDays}
                onChange={(event) => setForm({ ...form, handlingDays: Number(event.target.value) })}
              />
            </Field>
            <Field label="Default shipping zone" htmlFor="default-zone">
              <Select
                id="default-zone"
                value={form.defaultZoneId}
                onChange={(event) => setForm({ ...form, defaultZoneId: event.target.value })}
              >
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Weight unit" htmlFor="weight-unit">
              <Select
                id="weight-unit"
                value={form.weightUnit}
                onChange={(event) =>
                  setForm({ ...form, weightUnit: event.target.value as typeof form.weightUnit })
                }
              >
                <option value="g">Grams</option>
                <option value="kg">Kilograms</option>
                <option value="lb">Pounds</option>
                <option value="oz">Ounces</option>
              </Select>
            </Field>
            <Field label="Origin country" htmlFor="origin-country">
              <Input
                id="origin-country"
                value={form.originCountry}
                onChange={(event) => setForm({ ...form, originCountry: event.target.value })}
              />
            </Field>
            <Field label="Origin postal code" htmlFor="origin-postal">
              <Input
                id="origin-postal"
                value={form.originPostalCode}
                onChange={(event) => setForm({ ...form, originPostalCode: event.target.value })}
                className="font-mono text-xs"
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Zones and rates"
            description="Rate cards used by the storefront checkout."
          />
          <CardBody className="flex flex-col gap-4">
            {zones.map((zone) => (
              <div key={zone.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-ink">{zone.name}</h3>
                  <Badge tone="neutral">{zone.countries.join(", ")}</Badge>
                </div>
                <ul className="mt-3 space-y-2">
                  {zone.methods.map((method) => (
                    <li
                      key={method.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2"
                    >
                      <Truck className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{method.name}</p>
                        <p className="text-2xs text-ink-subtle">
                          {method.carrier} · {method.estimateMinDays}–{method.estimateMaxDays} days
                          {method.type === "weight" && method.minWeight !== null
                            ? ` · ${method.minWeight}–${method.maxWeight} kg`
                            : ""}
                          {method.freeThreshold
                            ? ` · free over ${money(method.freeThreshold)}`
                            : ""}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-ink">
                        {method.type === "free" ? "Free" : money(method.price)}
                      </span>
                      <Badge tone="outline">{method.type}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardBody>
        </Card>

        <FormActions>
          <Button variant="primary" loading={saving} onClick={() => void save()}>
            <Save className="size-4" aria-hidden />
            Save shipping settings
          </Button>
        </FormActions>
      </Page>
    </SettingsLayout>
  );
}
