"use client";

import * as React from "react";
import { Check, CreditCard, Download, Sparkles, XCircle } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { settingsService } from "@/lib/services/settings";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useDateFormatter } from "@/lib/hooks";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "@/lib/types";

export default function SubscriptionSettingsPage() {
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);
  const plans = useDataStore((state) => state.plans);
  const products = useDataStore((state) => state.products);
  const orders = useDataStore((state) => state.orders);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const date = useDateFormatter();

  const [cycle, setCycle] = React.useState<"monthly" | "annual">(
    settings.subscription.billingCycle,
  );
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const currentPlan = plans.find((plan) => plan.id === settings.subscription.planId) ?? plans[0];

  const usage = React.useMemo(
    () => ({
      products: { used: products.length, limit: currentPlan.limits[0]?.value ?? "—" },
      orders: { used: orders.length, limit: currentPlan.limits[1]?.value ?? "—" },
      staff: { used: settings.staff.length, limit: currentPlan.limits[2]?.value ?? "—" },
    }),
    [products.length, orders.length, settings.staff.length, currentPlan],
  );

  const limitValue = (value: string) => {
    if (value === "Unlimited") return Infinity;
    const parsed = Number(value.replace(/[^0-9]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const changePlan = async (plan: SubscriptionPlan) => {
    setBusy(true);
    try {
      await settingsService.changePlan(plan.id, cycle);
      toast({
        variant: "success",
        title: `Switched to ${plan.name}`,
        description: "A demo invoice was created. No payment was taken.",
      });
      setSelectedPlan(null);
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not change plan",
        description: isMockApiError(error) ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsLayout
      title="Subscription & billing"
      description="Your plan, usage and billing history. Everything here is simulated."
    >
      <Page gap="sm">
        <Card>
          <CardHeader
            title="Current plan"
            description={`${currentPlan.name} · ${settings.subscription.billingCycle} billing`}
            actions={
              <Badge
                tone={
                  settings.subscription.status === "active"
                    ? "success"
                    : settings.subscription.status === "cancelled"
                      ? "danger"
                      : "warning"
                }
              >
                {settings.subscription.status}
              </Badge>
            }
          />
          <CardBody>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold tracking-tight text-ink">
                  {money(
                    settings.subscription.billingCycle === "annual"
                      ? currentPlan.annualPrice
                      : currentPlan.monthlyPrice,
                  )}
                  <span className="ml-1 text-sm font-normal text-ink-muted">
                    /
                    {settings.subscription.billingCycle === "annual" ? "year" : "month"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-ink-muted">{currentPlan.tagline}</p>
                <p className="mt-2 text-xs text-ink-subtle">
                  Renews {date(settings.subscription.renewsAt)} · card ending{" "}
                  {settings.subscription.paymentMethodLast4}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCancelOpen(true)}
                  disabled={settings.subscription.status === "cancelled"}
                >
                  <XCircle className="size-3.5" aria-hidden />
                  Cancel subscription
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedPlan(currentPlan);
                  }}
                >
                  <Sparkles className="size-3.5" aria-hidden />
                  Change plan
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Usage" description="Meters reset at the start of each billing period." />
          <CardBody className="flex flex-col gap-4">
            {[
              { label: "Products", ...usage.products },
              { label: "Orders this month", ...usage.orders },
              { label: "Staff seats", ...usage.staff },
            ].map((meter) => {
              const limit = limitValue(meter.limit);
              const pct = limit === Infinity ? 12 : Math.min(100, (meter.used / Math.max(1, limit)) * 100);
              return (
                <div key={meter.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{meter.label}</span>
                    <span className="text-ink-muted">
                      {meter.used.toLocaleString("en-IN")} / {meter.limit}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    tone={pct > 85 ? "danger" : pct > 60 ? "warning" : "brand"}
                    label={`${meter.label} usage`}
                  />
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Plan comparison"
            description="Switch at any time — the change is applied to the demo subscription."
            actions={
              <SegmentedControl
                value={cycle}
                onChange={setCycle}
                ariaLabel="Billing cycle"
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "annual", label: "Annual · 2 months free" },
                ]}
              />
            }
          />
          <CardBody className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const active = plan.id === currentPlan.id;
              const price = cycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "flex flex-col rounded-xl border p-4",
                    active
                      ? "border-brand-500 ring-2 ring-brand-500/20"
                      : "border-line",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-ink">{plan.name}</h3>
                    {plan.recommended ? <Badge tone="brand">Popular</Badge> : null}
                  </div>
                  <p className="mt-1 min-h-10 text-xs leading-5 text-ink-muted">{plan.tagline}</p>
                  <p className="mt-3 text-xl font-semibold tracking-tight text-ink">
                    {money(price)}
                    <span className="ml-1 text-xs font-normal text-ink-muted">
                      /{cycle === "annual" ? "year" : "month"}
                    </span>
                  </p>
                  <ul className="mt-3 flex-1 space-y-1.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5 text-xs text-ink-muted">
                        <Check
                          className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                          aria-hidden
                        />
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
                  <Button
                    variant={active ? "secondary" : "primary"}
                    size="sm"
                    className="mt-4"
                    disabled={active}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {active ? "Current plan" : `Switch to ${plan.name}`}
                  </Button>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Billing history"
            description="Demo invoices generated by the subscription flow."
            actions={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  downloadCsv(
                    "invoices.csv",
                    settings.invoices.map((invoice) => ({
                      Number: invoice.number,
                      Date: invoice.date,
                      Description: invoice.description,
                      Plan: invoice.planName,
                      Amount: invoice.amount,
                      Currency: invoice.currency,
                      Status: invoice.status,
                    })),
                  );
                  toast({ variant: "success", title: "Export ready" });
                }}
              >
                <Download className="size-3.5" aria-hidden />
                Export CSV
              </Button>
            }
          />
          <CardBody className="p-0">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead align="right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.invoices.map((invoice) => (
                    <TableRow key={invoice.id} interactive>
                      <TableCell>{invoice.number}</TableCell>
                      <TableCell>{date(invoice.date)}</TableCell>
                      <TableCell>{invoice.description}</TableCell>
                      <TableCell>
                        <Badge
                          tone={
                            invoice.status === "paid"
                              ? "success"
                              : invoice.status === "open"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell align="right">
                        {money(invoice.amount, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </CardBody>
        </Card>
      </Page>

      <Dialog
        open={Boolean(selectedPlan)}
        onClose={() => setSelectedPlan(null)}
        title={selectedPlan ? `Switch to ${selectedPlan.name}` : "Change plan"}
        description="A demo invoice is created. No payment is processed."
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedPlan(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={() => {
                if (selectedPlan) void changePlan(selectedPlan);
              }}
            >
              <CreditCard className="size-4" aria-hidden />
              Confirm change
            </Button>
          </>
        }
      >
        {selectedPlan ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-line bg-surface-2 p-3">
              <p className="text-sm font-medium text-ink">{selectedPlan.name}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{selectedPlan.tagline}</p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {money(cycle === "annual" ? selectedPlan.annualPrice : selectedPlan.monthlyPrice)}
                <span className="ml-1 text-xs font-normal text-ink-muted">
                  /{cycle === "annual" ? "year" : "month"}
                </span>
              </p>
            </div>
            <ul className="space-y-1.5">
              {selectedPlan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5 text-sm text-ink-muted">
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        destructive
        title="Cancel the subscription?"
        description="The demo subscription is marked as cancelled. The store keeps working and you can re-activate it at any time."
        confirmLabel="Cancel subscription"
        onConfirm={async () => {
          try {
            await settingsService.cancelSubscription();
            toast({ variant: "info", title: "Subscription cancelled" });
            setCancelOpen(false);
          } catch (error) {
            toast({
              variant: "error",
              title: "Could not cancel",
              description: isMockApiError(error) ? error.message : undefined,
            });
          }
        }}
      />
    </SettingsLayout>
  );
}
