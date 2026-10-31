"use client";

import { PageSkeleton } from "@/components/ui/page-skeleton";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Globe,
  IndianRupee,
  Mail,
  MapPin,
  Package,
  ShieldAlert,
  ShoppingBag,
  Store,
} from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { merchantService } from "@/lib/services/platform";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useDateFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { CardGrid, Page, StatGrid } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/states";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/input";
import { DescriptionRow } from "@/components/ui/table";
import type { Merchant } from "@/lib/types";

const STATUS_TONE = {
  active: "success",
  trial: "info",
  past_due: "warning",
  suspended: "danger",
} as const;

export default function AdminMerchantDetailPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <AdminMerchantDetailPageContent />
    </React.Suspense>
  );
}

function AdminMerchantDetailPageContent() {
  const params = useParams<{ id: string }>();
  const merchant = useDataStore((state) => state.merchants.find((item) => item.id === params.id));
  const plans = useDataStore((state) => state.plans);
  const auditLog = useDataStore((state) => state.auditLog);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const date = useDateFormatter();

  if (!merchant) {
    return (
      <Page>
        <PageHeader title="Merchant not found" />
        <EmptyState
          title="This merchant no longer exists"
          action={
            <Link
              href="/admin/merchants"
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white dark:bg-brand-500 dark:text-brand-950"
            >
              Back to merchants
            </Link>
          }
        />
      </Page>
    );
  }

  const merchantAudit = auditLog.filter((entry) => entry.target.includes(merchant.businessName));

  return (
    <Page>
      <PageHeader
        eyebrow="Platform administration"
        title={merchant.businessName}
        description={`${merchant.storeName} · ${merchant.storeSlug}.example`}
        actions={
          <>
            <Badge tone={STATUS_TONE[merchant.status as Merchant["status"]]}>
              {merchant.status.replace(/_/g, " ")}
            </Badge>
            <Button
              variant={merchant.status === "suspended" ? "secondary" : "dangerGhost"}
              size="sm"
              onClick={async () => {
                try {
                  await merchantService.updateStatus(
                    merchant.id,
                    merchant.status === "suspended" ? "active" : "suspended",
                  );
                  toast({
                    variant: merchant.status === "suspended" ? "success" : "warning",
                    title:
                      merchant.status === "suspended"
                        ? "Merchant restored"
                        : "Merchant suspended (preview)",
                  });
                } catch (error) {
                  toast({
                    variant: "error",
                    title: "Could not update",
                    description: isMockApiError(error) ? error.message : undefined,
                  });
                }
              }}
            >
              <ShieldAlert className="size-3.5" aria-hidden />
              {merchant.status === "suspended" ? "Restore merchant" : "Suspend merchant"}
            </Button>
            <Link
              href="/admin/merchants"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-surface-2"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Back
            </Link>
          </>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          label="Lifetime GMV"
          value={money(merchant.gmv)}
          icon={IndianRupee}
          tone="brand"
        />
        <StatCard
          label="Orders"
          value={merchant.orderCount.toLocaleString("en-IN")}
          icon={ShoppingBag}
          tone="sky"
        />
        <StatCard
          label="Products"
          value={merchant.productCount.toLocaleString("en-IN")}
          icon={Package}
          tone="violet"
        />
        <StatCard
          label="Average order value"
          value={money(merchant.orderCount ? merchant.gmv / merchant.orderCount : 0)}
          icon={Store}
          tone="emerald"
        />
      </StatGrid>

      <CardGrid columns={2}>
        <Card>
          <CardHeader title="Account" />
          <CardBody className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-3">
              <Avatar name={merchant.businessName} size="md" />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{merchant.businessName}</p>
                <p className="truncate text-xs text-ink-subtle">{merchant.ownerName}</p>
              </div>
            </div>
            <p className="flex items-center gap-2 text-ink-muted">
              <Mail className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{merchant.email}</span>
            </p>
            <p className="flex items-center gap-2 text-ink-muted">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {merchant.country}
            </p>
            <p className="flex items-center gap-2 text-ink-muted">
              <Globe className="size-3.5 shrink-0" aria-hidden />
              <span className="font-mono text-xs">{merchant.storeSlug}.example</span>
            </p>
            <div className="grid grid-cols-2 gap-3 border-t border-line pt-3">
              <div>
                <p className="text-2xs uppercase tracking-wide text-ink-subtle">Joined</p>
                <p className="text-sm text-ink">{date(merchant.createdAt)}</p>
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wide text-ink-subtle">Last active</p>
                <p className="text-sm text-ink">{date(merchant.lastActiveAt)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Subscription" description="Plan and entitlements." />
          <CardBody className="flex flex-col gap-4">
            <Field label="Plan" htmlFor="merchant-plan">
              <Select
                id="merchant-plan"
                value={merchant.planId}
                onChange={async (event) => {
                  await merchantService.changePlan(merchant.id, event.target.value);
                  toast({ variant: "success", title: "Merchant plan changed" });
                }}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            </Field>
            <dl className="space-y-2">
              {plans
                .filter((plan) => plan.id === merchant.planId)
                .map((plan) => (
                  <React.Fragment key={plan.id}>
                    {plan.limits.map((limit) => (
                      <DescriptionRow key={limit.label} label={limit.label} value={limit.value} />
                    ))}
                    <DescriptionRow label="Price" value={`${money(plan.monthlyPrice)} / month`} />
                  </React.Fragment>
                ))}
            </dl>
          </CardBody>
        </Card>
      </CardGrid>

      <Card>
        <CardHeader title="Platform activity" description="Audit entries for this merchant." />
        <CardBody className="p-0">
          {merchantAudit.length ? (
            <ul className="divide-y divide-line">
              {merchantAudit.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  <Badge
                    tone={
                      entry.severity === "critical"
                        ? "danger"
                        : entry.severity === "warning"
                          ? "warning"
                          : "info"
                    }
                  >
                    {entry.severity}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{entry.action}</p>
                    <p className="truncate text-2xs text-ink-subtle">
                      {entry.actor} · {entry.ip}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {date(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">
              No audit entries recorded for this merchant.
            </p>
          )}
        </CardBody>
      </Card>
    </Page>
  );
}
