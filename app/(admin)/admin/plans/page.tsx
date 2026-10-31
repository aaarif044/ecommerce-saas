"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { planService } from "@/lib/services/platform";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { CardGrid, Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { DropdownMenu, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import { FormFull, FormGrid } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SubscriptionPlan } from "@/lib/types";

export default function AdminPlansPage() {
  const plans = useDataStore((state) => state.plans);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SubscriptionPlan | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    tagline: "",
    monthlyPrice: 0,
    annualPrice: 0,
    features: "",
    productLimit: "2,000",
    orderLimit: "5,000",
    staffLimit: "5",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<SubscriptionPlan | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      tagline: "",
      monthlyPrice: 0,
      annualPrice: 0,
      features: "",
      productLimit: "2,000",
      orderLimit: "5,000",
      staffLimit: "5",
    });
    setError(null);
    setOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      tagline: plan.tagline,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      features: plan.features.join("\n"),
      productLimit: plan.limits[0]?.value ?? "—",
      orderLimit: plan.limits[1]?.value ?? "—",
      staffLimit: plan.limits[2]?.value ?? "—",
    });
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError("Plan name is required.");
      return;
    }
    setSaving(true);
    try {
      const limits = [
        { label: "Products", value: form.productLimit },
        { label: "Orders / month", value: form.orderLimit },
        { label: "Staff seats", value: form.staffLimit },
      ];
      const features = form.features
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (editing) {
        await planService.update(editing.id, {
          name: form.name.trim(),
          tagline: form.tagline,
          monthlyPrice: form.monthlyPrice,
          annualPrice: form.annualPrice,
          features,
          limits,
        });
        toast({ variant: "success", title: "Plan updated" });
      } else {
        await planService.create({
          name: form.name.trim(),
          tagline: form.tagline,
          monthlyPrice: form.monthlyPrice,
          annualPrice: form.annualPrice,
          features,
          limits,
          accentTone: plans.length % 4,
          recommended: false,
        });
        toast({ variant: "success", title: "Plan created" });
      }
      setOpen(false);
    } catch (err) {
      setError(isMockApiError(err) ? err.message : "Could not save the plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Platform administration"
        title="Subscription plans"
        description="The plan catalogue merchants can subscribe to. Changes apply to the demo subscription engine."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            New plan
          </Button>
        }
      />

      <Card>
        <CardHeader title="Plans" description={`${plans.length} plans available.`} />
        <CardBody>
          <CardGrid columns={4} className="gap-3">
            {plans.map((plan) => (
              <div key={plan.id} className="flex flex-col rounded-xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-ink">{plan.name}</h3>
                    <p className="mt-0.5 text-xs text-ink-muted">{plan.tagline}</p>
                  </div>
                  <DropdownMenu
                    triggerLabel={`Actions for ${plan.name}`}
                    trigger={
                      <span className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
                        <MoreHorizontal className="size-4" aria-hidden />
                      </span>
                    }
                  >
                    <DropdownItem icon={<Pencil className="size-3.5" />} onClick={() => openEdit(plan)}>
                      Edit plan
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      danger
                      icon={<Trash2 className="size-3.5" />}
                      onClick={() => setPendingDelete(plan)}
                    >
                      Delete plan
                    </DropdownItem>
                  </DropdownMenu>
                </div>

                <p className="mt-3 text-xl font-semibold tracking-tight text-ink">
                  {money(plan.monthlyPrice)}
                  <span className="ml-1 text-xs font-normal text-ink-muted">/month</span>
                </p>
                <p className="text-xs text-ink-subtle">
                  {money(plan.annualPrice)} billed annually
                </p>

                <ul className="mt-3 flex-1 space-y-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-xs leading-5 text-ink-muted">
                      {feature}
                    </li>
                  ))}
                </ul>

                <ul className="mt-3 space-y-1 border-t border-line pt-3 text-2xs text-ink-subtle">
                  {plan.limits.map((limit) => (
                    <li key={limit.label} className="flex justify-between">
                      <span>{limit.label}</span>
                      <span className="font-medium text-ink-muted">{limit.value}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex items-center justify-between">
                  <Badge tone="info">{plan.subscribers.toLocaleString("en-IN")} merchants</Badge>
                  {plan.recommended ? <Badge tone="brand">Recommended</Badge> : null}
                </div>
              </div>
            ))}
          </CardGrid>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Entitlements matrix" description="Which plan unlocks which entitlement." />
        <CardBody>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entitlement</TableHead>
                {plans.map((plan) => (
                  <TableHead key={plan.id} align="center">
                    {plan.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { label: "Custom domain + SSL", unlocked: (id: string) => id === "plan-3" || id === "plan-4" },
                { label: "Advanced roles", unlocked: (id: string) => id === "plan-3" || id === "plan-4" },
                { label: "Returns workflow", unlocked: (id: string) => id === "plan-2" || id === "plan-3" || id === "plan-4" },
                { label: "Email marketing", unlocked: (id: string) => id !== "plan-1" },
                { label: "Audit log", unlocked: (id: string) => id === "plan-4" },
                { label: "SSO", unlocked: (id: string) => id === "plan-4" },
              ].map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="text-ink-muted">{row.label}</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} align="center">
                      {row.unlocked(plan.id) ? (
                        <span className="text-emerald-600 dark:text-emerald-400" aria-label="Included">
                          ✓
                        </span>
                      ) : (
                        <span className="text-ink-subtle" aria-label="Not included">
                          —
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Plan usage" />
        <CardBody>
          <Table compact>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead align="right">Subscribers</TableHead>
                <TableHead align="right">MRR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium text-ink">{plan.name}</TableCell>
                  <TableCell align="right" className="tabular-nums">
                    {plan.subscribers.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell align="right" className="tabular-nums">
                    {money(plan.monthlyPrice * plan.subscribers)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              downloadCsv(
                "plans.csv",
                plans.map((plan) => ({
                  Name: plan.name,
                  Tagline: plan.tagline,
                  Monthly: plan.monthlyPrice,
                  Annual: plan.annualPrice,
                  Subscribers: plan.subscribers,
                  Features: plan.features.join("; "),
                  Limits: plan.limits.map((l) => `${l.label}: ${l.value}`).join("; "),
                })),
              );
              toast({ variant: "success", title: "Export ready" });
            }}
          >
            Export plans
          </Button>
        </CardBody>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={editing ? "Edit plan" : "New plan"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void save()} loading={saving}>
              {editing ? "Save changes" : "Create plan"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}
          <FormGrid>
            <Field label="Plan name" required htmlFor="plan-name">
              <Input
                id="plan-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field label="Tagline" htmlFor="plan-tagline">
              <Input
                id="plan-tagline"
                value={form.tagline}
                onChange={(event) => setForm({ ...form, tagline: event.target.value })}
              />
            </Field>
            <Field label="Monthly price" htmlFor="plan-monthly">
              <Input
                id="plan-monthly"
                type="number"
                min={0}
                value={form.monthlyPrice}
                onChange={(event) =>
                  setForm({ ...form, monthlyPrice: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Annual price" htmlFor="plan-annual">
              <Input
                id="plan-annual"
                type="number"
                min={0}
                value={form.annualPrice}
                onChange={(event) =>
                  setForm({ ...form, annualPrice: Number(event.target.value) })
                }
              />
            </Field>
            <FormFull>
              <Field label="Features" hint="One per line." htmlFor="plan-features">
                <Textarea
                  id="plan-features"
                  rows={5}
                  value={form.features}
                  onChange={(event) => setForm({ ...form, features: event.target.value })}
                />
              </Field>
            </FormFull>
          </FormGrid>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Product limit" htmlFor="plan-product-limit">
              <Input
                id="plan-product-limit"
                value={form.productLimit}
                onChange={(event) => setForm({ ...form, productLimit: event.target.value })}
              />
            </Field>
            <Field label="Order limit" htmlFor="plan-order-limit">
              <Input
                id="plan-order-limit"
                value={form.orderLimit}
                onChange={(event) => setForm({ ...form, orderLimit: event.target.value })}
              />
            </Field>
            <Field label="Staff limit" htmlFor="plan-staff-limit">
              <Input
                id="plan-staff-limit"
                value={form.staffLimit}
                onChange={(event) => setForm({ ...form, staffLimit: event.target.value })}
              />
            </Field>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        destructive
        title={`Delete "${pendingDelete?.name}"?`}
        description="The plan is removed from the catalogue. At least one plan must remain."
        confirmLabel="Delete plan"
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await planService.remove(pendingDelete.id);
            toast({ variant: "success", title: "Plan deleted" });
            setPendingDelete(null);
          } catch (error) {
            toast({
              variant: "error",
              title: "Could not delete",
              description: isMockApiError(error) ? error.message : undefined,
            });
          }
        }}
      />
    </Page>
  );
}
