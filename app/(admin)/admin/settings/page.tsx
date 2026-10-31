"use client";

import { useSyncedState } from "@/lib/hooks";
import * as React from "react";
import { Save } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { platformService } from "@/lib/services/platform";
import { isMockApiError } from "@/lib/services/errors";
import { PageHeader } from "@/components/shell/page-header";
import { CardGrid, Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form";

export default function AdminSettingsPage() {
  const platformSettings = useDataStore((state) => state.platformSettings);
  const merchants = useDataStore((state) => state.merchants);
  const toast = useUIStore((state) => state.toast);

  const [form, setForm] = useSyncedState(platformSettings);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await platformService.updateSettings(form);
      toast({ variant: "success", title: "Platform settings saved" });
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
    <Page>
      <PageHeader
        eyebrow="Platform administration"
        title="Platform settings"
        description="Global configuration for the marketplace. Saving writes an audit entry."
      />

      <CardGrid columns={2}>
        <Card>
          <CardHeader title="Identity" description="How the platform presents itself." />
          <CardBody className="flex flex-col gap-4">
            <Field label="Platform name" htmlFor="platform-name">
              <Input
                id="platform-name"
                value={form.platformName}
                onChange={(event) => setForm({ ...form, platformName: event.target.value })}
              />
            </Field>
            <Field label="Platform support email" htmlFor="platform-email">
              <Input
                id="platform-email"
                type="email"
                value={form.supportEmail}
                onChange={(event) => setForm({ ...form, supportEmail: event.target.value })}
              />
            </Field>
            <Field
              label="Default trial length"
              hint="Days a new merchant can use the platform before billing starts."
              htmlFor="platform-trial"
            >
              <Input
                id="platform-trial"
                type="number"
                min={0}
                max={90}
                value={form.defaultTrialDays}
                onChange={(event) =>
                  setForm({ ...form, defaultTrialDays: Number(event.target.value) })
                }
                className="w-24"
              />
            </Field>
            <Field
              label="Marketplace commission"
              hint="Illustrative percentage taken from merchant GMV."
              htmlFor="platform-commission"
            >
              <Input
                id="platform-commission"
                type="number"
                min={0}
                max={20}
                step="0.1"
                value={form.commissionRate}
                onChange={(event) =>
                  setForm({ ...form, commissionRate: Number(event.target.value) })
                }
                className="w-24"
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Status" description="Global switches for the marketplace." />
          <CardBody className="flex flex-col gap-3">
            <Switch
              checked={form.maintenanceMode}
              onCheckedChange={(checked) => setForm({ ...form, maintenanceMode: checked })}
              label="Maintenance mode"
              description="Shows a maintenance notice on merchant stores."
            />
            <Switch
              checked={form.marketplaceLive}
              onCheckedChange={(checked) => setForm({ ...form, marketplaceLive: checked })}
              label="Marketplace live"
              description="Allow new merchants to sign up."
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={form.maintenanceMode ? "danger" : "success"}>
                {form.maintenanceMode ? "Maintenance" : "Operational"}
              </Badge>
              <Badge tone={form.marketplaceLive ? "info" : "neutral"}>
                {form.marketplaceLive ? "Accepting sign-ups" : "Sign-ups closed"}
              </Badge>
              <Badge tone="neutral">{merchants.length} merchants</Badge>
            </div>
          </CardBody>
        </Card>
      </CardGrid>

      <FormActions>
        <Button variant="primary" loading={saving} onClick={() => void save()}>
          <Save className="size-4" aria-hidden />
          Save platform settings
        </Button>
      </FormActions>
    </Page>
  );
}
