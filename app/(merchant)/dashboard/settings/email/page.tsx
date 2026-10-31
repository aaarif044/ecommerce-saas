"use client";

import { useSyncedState } from "@/lib/hooks";
import * as React from "react";
import { Eye, RotateCcw, Save } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { settingsService, emailTemplateService } from "@/lib/services/settings";
import { isMockApiError } from "@/lib/services/errors";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import { Tabs } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";

export default function EmailSettingsPage() {
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);
  const templates = useDataStore((state) => state.emailTemplates);
  const toast = useUIStore((state) => state.toast);

  const [form, setForm] = useSyncedState(settings.email);
  const [saving, setSaving] = React.useState(false);
  const [tab, setTab] = React.useState("sender");
  const [preview, setPreview] = React.useState<(typeof templates)[number] | null>(null);
  const [editing, setEditing] = React.useState<(typeof templates)[number] | null>(null);
  const [draft, setDraft] = React.useState({ subject: "", previewText: "", body: "" });

  const save = async () => {
    setSaving(true);
    try {
      await settingsService.updateEmail(form);
      toast({ variant: "success", title: "Email settings saved" });
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

  const renderTemplate = (text: string) =>
    text
      .replace(/\{\{\s*store_name\s*\}\}/g, settings.general.storeName)
      .replace(/\{\{store_owner_name\}\}/g, "Naveen Raghavan")
      .replace(/\{\{order_number\}\}/g, "#NW-4820")
      .replace(/\{\{customer_first_name\}\}/g, "Aditi")
      .replace(/\{\{total\}\}/g, "₹12,480")
      .replace(/\{\{subtotal\}\}/g, "₹11,860")
      .replace(/\{\{shipping\}\}/g, "Free")
      .replace(/\{\{line_items\}\}/g, "2 × Aria Wireless Headphones — ₹25,980")
      .replace(/\{\{tracking_url\}\}/g, "https://demo.local/track/BD123456")
      .replace(/\{\{tracking_number\}\}/g, "BD123456789")
      .replace(/\{\{carrier_name\}\}/g, "BlueDart Express")
      .replace(/\{\{estimated_delivery\}\}/g, "24 Oct 2026")
      .replace(/\{\{refund_amount\}\}/g, "₹2,250")
      .replace(/\{\{product_title\}\}/g, "Meridian 14\" Ultralaptop")
      .replace(/\{\{sku\}\}/g, "NW-COM-0021")
      .replace(/\{\{inventory_count\}\}/g, "3")
      .replace(/\{\{cart_item_count\}\}/g, "2")
      .replace(/\{\{discount_code\}\}/g, "MONSOON15")
      .replace(/\{\{recovery_link\}\}/g, "https://demo.local/store/cart/recover/rcv_demo");

  return (
    <SettingsLayout
      title="Email settings"
      description="Sender identity and transactional templates. No email is ever sent from this demo."
    >
      <Page gap="sm">
        <Tabs
          value={tab}
          onChange={setTab}
          ariaLabel="Email settings sections"
          items={[
            { value: "sender", label: "Sender" },
            { value: "templates", label: "Templates", badge: templates.length },
          ]}
        />

        {tab === "sender" ? (
          <>
            <Card>
              <CardHeader title="Sender identity" description="Used in the From field of every email." />
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <Field label="Sender name" htmlFor="sender-name">
                  <Input
                    id="sender-name"
                    value={form.senderName}
                    onChange={(event) => setForm({ ...form, senderName: event.target.value })}
                  />
                </Field>
                <Field label="Sender email" htmlFor="sender-email">
                  <Input
                    id="sender-email"
                    type="email"
                    value={form.senderEmail}
                    onChange={(event) => setForm({ ...form, senderEmail: event.target.value })}
                  />
                </Field>
                <Field label="Reply-to email" htmlFor="reply-to">
                  <Input
                    id="reply-to"
                    type="email"
                    value={form.replyToEmail}
                    onChange={(event) => setForm({ ...form, replyToEmail: event.target.value })}
                  />
                </Field>
                <Field label="Support email" htmlFor="support-email">
                  <Input
                    id="support-email"
                    type="email"
                    value={form.supportEmail}
                    onChange={(event) => setForm({ ...form, supportEmail: event.target.value })}
                  />
                </Field>
                <Field label="Footer text" htmlFor="email-footer" className="sm:col-span-2">
                  <Textarea
                    id="email-footer"
                    rows={2}
                    value={form.footerText}
                    onChange={(event) => setForm({ ...form, footerText: event.target.value })}
                  />
                </Field>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Transactional emails" description="Choose which flows send a message." />
              <CardBody className="flex flex-col gap-3">
                <Switch
                  checked={form.orderEmails}
                  onCheckedChange={(checked) => setForm({ ...form, orderEmails: checked })}
                  label="Order emails"
                  description="Confirmation and status updates for new orders."
                />
                <Switch
                  checked={form.shippingEmails}
                  onCheckedChange={(checked) => setForm({ ...form, shippingEmails: checked })}
                  label="Shipping emails"
                  description="Dispatch and delivery notifications."
                />
                <Switch
                  checked={form.refundEmails}
                  onCheckedChange={(checked) => setForm({ ...form, refundEmails: checked })}
                  label="Refund emails"
                  description="Confirmation that a refund was issued."
                />
                <Switch
                  checked={form.merchantAlerts}
                  onCheckedChange={(checked) => setForm({ ...form, merchantAlerts: checked })}
                  label="Merchant alerts"
                  description="Low stock, failed payments and account changes."
                />
              </CardBody>
            </Card>

            <FormActions>
              <Button variant="primary" loading={saving} onClick={() => void save()}>
                <Save className="size-4" aria-hidden />
                Save email settings
              </Button>
            </FormActions>
          </>
        ) : null}

        {tab === "templates" ? (
          <Card>
            <CardHeader
              title="Email templates"
              description="Preview and edit the copy used by each transactional email."
            />
            <CardBody className="p-0">
              <ul className="divide-y divide-line">
                {templates.map((template) => (
                  <li key={template.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-ink">{template.name}</p>
                        <Badge tone="neutral">{template.category}</Badge>
                        <Badge tone={template.enabled ? "success" : "neutral"}>
                          {template.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-ink-muted">{template.subject}</p>
                      <p className="mt-0.5 truncate font-mono text-2xs text-ink-subtle">
                        {template.variables.join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPreview(template);
                        }}
                      >
                        <Eye className="size-3.5" aria-hidden />
                        Preview
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditing(template);
                          setDraft({
                            subject: template.subject,
                            previewText: template.previewText,
                            body: template.body,
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await emailTemplateService.update(template.id, {
                            enabled: !template.enabled,
                          });
                          toast({ variant: "info", title: "Template updated" });
                        }}
                      >
                        {template.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        aria-label={`Reset ${template.name}`}
                        onClick={async () => {
                          await emailTemplateService.reset(template.id);
                          toast({ variant: "info", title: "Template reset" });
                        }}
                      >
                        <RotateCcw className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : null}
      </Page>

      <Dialog
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        size="lg"
        title={preview?.name ?? "Template preview"}
        description="Variables are replaced with demo values. No email is sent."
        footer={
          <Button variant="primary" onClick={() => setPreview(null)}>
            Close
          </Button>
        }
      >
        {preview ? (
          <div className="rounded-xl border border-line">
            <div className="border-b border-line bg-surface-2 px-4 py-3">
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                Subject
              </p>
              <p className="mt-0.5 text-base font-medium text-ink">
                {renderTemplate(preview.subject)}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {renderTemplate(preview.previewText)}
              </p>
            </div>
            <pre className="whitespace-pre-wrap px-4 py-4 font-sans text-sm leading-6 text-ink-muted">
              {renderTemplate(preview.body)}
            </pre>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        size="lg"
        title={`Edit ${editing?.name ?? "template"}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!editing) return;
                await emailTemplateService.update(editing.id, draft);
                toast({ variant: "success", title: "Template updated" });
                setEditing(null);
              }}
            >
              Save template
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Subject" htmlFor="template-subject">
            <Input
              id="template-subject"
              value={draft.subject}
              onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
            />
          </Field>
          <Field label="Preview text" htmlFor="template-preview">
            <Input
              id="template-preview"
              value={draft.previewText}
              onChange={(event) => setDraft({ ...draft, previewText: event.target.value })}
            />
          </Field>
          <Field label="Body" htmlFor="template-body">
            <Textarea
              id="template-body"
              rows={10}
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              className="font-mono text-xs"
            />
          </Field>
          {editing ? (
            <div className="rounded-lg border border-line bg-surface-2 p-3">
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                Available variables
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {editing.variables.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        body: `${current.body}{{${variable}}}`,
                      }))
                    }
                    className="rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-2xs text-ink-muted transition-colors hover:border-brand-400 hover:text-brand-600"
                  >
                    {`{{${variable}}}`}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Dialog>
    </SettingsLayout>
  );
}
