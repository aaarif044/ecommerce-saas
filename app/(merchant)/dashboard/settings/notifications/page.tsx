"use client";

import { useSyncedState } from "@/lib/hooks";
import * as React from "react";
import { Bell, Mail, Save } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { settingsService } from "@/lib/services/settings";
import { isMockApiError } from "@/lib/services/errors";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form";
import { Select } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NOTIFICATION_EVENT_LABELS } from "@/lib/data/settings";
import type { NotificationEvent } from "@/lib/types";

const EVENTS = Object.keys(NOTIFICATION_EVENT_LABELS) as NotificationEvent[];

export default function NotificationSettingsPage() {
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);
  const notifications = useDataStore((state) => state.notifications);
  const patch = useDataStore((state) => state.patch);
  const toast = useUIStore((state) => state.toast);

  const [form, setForm] = useSyncedState(settings.notifications);
  const [saving, setSaving] = React.useState(false);

  const toggle = (channel: "email" | "inApp", key: NotificationEvent, value: boolean) => {
    setForm((current) => ({
      ...current,
      [channel]: { ...current[channel], [key]: value },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await settingsService.updateNotifications(form);
      toast({ variant: "success", title: "Notification preferences saved" });
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

  const unread = notifications.filter((notification) => !notification.read).length;

  return (
    <SettingsLayout
      title="Notification preferences"
      description="Choose which events raise an email alert, an in-app alert, or both."
    >
      <Page gap="sm">
        <Card>
          <CardHeader
            title="Event subscriptions"
            description="Each event can be delivered by email and in-app independently."
          />
          <CardBody className="p-0">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead align="center">Email</TableHead>
                    <TableHead align="center">In-app</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EVENTS.map((event) => (
                    <TableRow key={event} interactive>
                      <TableCell className="font-medium text-ink">
                        {NOTIFICATION_EVENT_LABELS[event]}
                      </TableCell>
                      <TableCell align="center">
                        <input
                          type="checkbox"
                          aria-label={`Email alerts for ${NOTIFICATION_EVENT_LABELS[event]}`}
                          checked={form.email[event]}
                          onChange={(changeEvent) => toggle("email", event, changeEvent.target.checked)}
                          className="size-4 rounded border-line-strong accent-brand-600"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <input
                          type="checkbox"
                          aria-label={`In-app alerts for ${NOTIFICATION_EVENT_LABELS[event]}`}
                          checked={form.inApp[event]}
                          onChange={(changeEvent) => toggle("inApp", event, changeEvent.target.checked)}
                          className="size-4 rounded border-line-strong accent-brand-600"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Delivery" description="How often notifications are bundled." />
          <CardBody className="flex flex-col gap-4">
            <Field label="Digest frequency" htmlFor="digest-frequency">
              <Select
                id="digest-frequency"
                value={form.digestFrequency}
                onChange={(event) =>
                  setForm({
                    ...form,
                    digestFrequency: event.target.value as typeof form.digestFrequency,
                  })
                }
              >
                <option value="realtime">As it happens</option>
                <option value="daily">Daily summary</option>
                <option value="weekly">Weekly summary</option>
              </Select>
            </Field>
            <Switch
              checked={form.merchantDigest}
              onCheckedChange={(checked) => setForm({ ...form, merchantDigest: checked })}
              label="Merchant performance digest"
              description="A weekly email with revenue, orders and top products."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Notification centre"
            description={`${unread} unread of ${notifications.length} recorded events.`}
            actions={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  patch({
                    notifications: notifications.map((notification) => ({
                      ...notification,
                      read: true,
                    })),
                  });
                  toast({ variant: "info", title: "All notifications marked as read" });
                }}
              >
                Mark all as read
              </Button>
            }
          />
          <CardBody className="p-0">
            <ul className="divide-y divide-line">
              {notifications.slice(0, 8).map((notification) => (
                <li key={notification.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-subtle">
                    {notification.type === "order" ? (
                      <Bell className="size-3.5" aria-hidden />
                    ) : (
                      <Mail className="size-3.5" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{notification.title}</p>
                    <p className="text-xs text-ink-muted">{notification.body}</p>
                  </div>
                  <Badge tone={notification.read ? "neutral" : "brand"}>
                    {notification.read ? "Read" : "New"}
                  </Badge>
                </li>
              ))}
            </ul>
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
