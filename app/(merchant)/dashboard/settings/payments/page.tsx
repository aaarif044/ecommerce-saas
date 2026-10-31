"use client";

import { useSyncedState } from "@/lib/hooks";
import * as React from "react";
import { CreditCard, HandCoins, Info, Lock, Save } from "lucide-react";
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
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import type { PaymentMethod } from "@/lib/types";

const METHODS: {
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
    description: "Collect payment at the door with an optional handling fee.",
    icon: HandCoins,
  },
  {
    value: "manual",
    label: "Manual payment",
    description: "Show bank details and reconcile transfers by hand.",
    icon: Lock,
  },
];

export default function PaymentSettingsPage() {
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);
  const toast = useUIStore((state) => state.toast);

  const [form, setForm] = useSyncedState(settings.payments);
  const [saving, setSaving] = React.useState(false);

  const toggleMethod = (method: PaymentMethod, enabled: boolean) => {
    setForm((current) => {
      const enabledMethods = enabled
        ? Array.from(new Set([...current.enabledMethods, method]))
        : current.enabledMethods.filter((item) => item !== method);
      return {
        ...current,
        enabledMethods,
        defaultMethod: enabledMethods.includes(current.defaultMethod)
          ? current.defaultMethod
          : (enabledMethods[0] ?? current.defaultMethod),
      };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await settingsService.updatePayments(form);
      toast({ variant: "success", title: "Payment settings saved" });
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
      title="Payment settings"
      description="Enable payment methods and configure how they behave at checkout."
    >
      <Page gap="sm">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="flex items-center gap-2 font-medium">
            <Info className="size-4 shrink-0" aria-hidden />
            Simulated payments only
          </p>
          <p className="mt-1 leading-5">
            No payment provider is connected and no card details are requested. The demo records
            transactions locally.
          </p>
        </div>

        <Card>
          <CardHeader title="Payment methods" description="Select what appears at checkout." />
          <CardBody className="flex flex-col gap-3">
            {METHODS.map((method) => {
              const enabled = form.enabledMethods.includes(method.value);
              const Icon = method.icon;
              return (
                <div
                  key={method.value}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3"
                >
                  <Icon className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{method.label}</p>
                    <p className="text-xs leading-5 text-ink-muted">{method.description}</p>
                  </div>
                  {form.defaultMethod === method.value ? (
                    <Badge tone="brand">Default</Badge>
                  ) : null}
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => toggleMethod(method.value, checked)}
                    label={enabled ? "Enabled" : "Disabled"}
                  />
                </div>
              );
            })}
            {form.enabledMethods.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                At least one payment method should stay enabled so the demo checkout can complete.
              </p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Configuration" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Default method" htmlFor="payment-default">
              <Select
                id="payment-default"
                value={form.defaultMethod}
                onChange={(event) =>
                  setForm({ ...form, defaultMethod: event.target.value as PaymentMethod })
                }
              >
                {METHODS.filter((method) => form.enabledMethods.includes(method.value)).map(
                  (method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ),
                )}
              </Select>
            </Field>
            <Field label="Cash on delivery fee" htmlFor="cod-fee">
              <Input
                id="cod-fee"
                type="number"
                min={0}
                value={form.codFee}
                onChange={(event) => setForm({ ...form, codFee: Number(event.target.value) })}
              />
            </Field>
            <Field label="Capture mode" htmlFor="capture-mode">
              <Select
                id="capture-mode"
                value={form.captureMode}
                onChange={(event) =>
                  setForm({ ...form, captureMode: event.target.value as typeof form.captureMode })
                }
              >
                <option value="automatic">Automatic — capture immediately</option>
                <option value="manual">Manual — capture on fulfilment</option>
              </Select>
            </Field>
            <Field label="Statement descriptor" htmlFor="statement-descriptor">
              <Input
                id="statement-descriptor"
                value={form.statementDescriptor}
                onChange={(event) =>
                  setForm({ ...form, statementDescriptor: event.target.value.toUpperCase() })
                }
                className="font-mono text-xs"
              />
            </Field>
            <Field label="Manual payment instructions" htmlFor="manual-instructions" className="sm:col-span-2">
              <Textarea
                id="manual-instructions"
                rows={3}
                value={form.manualInstructions}
                onChange={(event) => setForm({ ...form, manualInstructions: event.target.value })}
              />
            </Field>
          </CardBody>
        </Card>

        <FormActions>
          <Button variant="primary" loading={saving} onClick={() => void save()}>
            <Save className="size-4" aria-hidden />
            Save payment settings
          </Button>
        </FormActions>
      </Page>
    </SettingsLayout>
  );
}
