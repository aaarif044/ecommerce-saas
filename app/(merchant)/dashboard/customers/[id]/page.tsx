"use client";

import { PageSkeleton } from "@/components/ui/page-skeleton";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Mail, MapPin, Phone, ShoppingBag, StickyNote, Tag, UserRound } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { customerService } from "@/lib/services/sales";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useDateFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page, StatGrid } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/states";
import { FormActions } from "@/components/ui/form";
import { StatCard } from "@/components/dashboard/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_STATUS_LABELS } from "@/lib/services/sales";
import { IndianRupee, Receipt, ShoppingCart } from "lucide-react";

const SEGMENT_TONE = {
  vip: "brand",
  loyal: "success",
  new: "info",
  at_risk: "warning",
  dormant: "neutral",
  wholesale: "outline",
} as const;

export default function CustomerDetailPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <CustomerDetailPageContent />
    </React.Suspense>
  );
}

function CustomerDetailPageContent() {

  const params = useParams<{ id: string }>();
  const customer = useDataStore((state) => state.customers.find((item) => item.id === params.id));
  const orders = useDataStore((state) => state.orders);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const date = useDateFormatter();

  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [tagInput, setTagInput] = React.useState("");

  if (!customer) {
    return (
      <Page>
        <PageHeader title="Customer not found" />
        <EmptyState
          title="This customer no longer exists"
          description="They may have been removed while resetting the demo data."
          action={
            <Link
              href="/dashboard/customers"
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white dark:bg-brand-500 dark:text-brand-950"
            >
              Back to customers
            </Link>
          }
        />
      </Page>
    );
  }

  const customerOrders = orders
    .filter((order) => order.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const addTag = async () => {
    const value = tagInput.trim();
    if (!value) return;
    await customerService.update(customer.id, {
      tags: customer.tags.includes(value) ? customer.tags : [...customer.tags, value],
    });
    setTagInput("");
    toast({ variant: "success", title: "Tag added", description: value });
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Customer"
        title={customer.name}
        description={`${customer.email} · joined ${date(customer.createdAt)}`}
        actions={
          <>
            <Badge tone={SEGMENT_TONE[customer.segment]}>{customer.segment.replace(/_/g, " ")}</Badge>
            {customer.status === "blocked" ? <Badge tone="danger">Blocked</Badge> : null}
            <Link
              href="/dashboard/customers"
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
          label="Total spent"
          value={money(customer.totalSpent)}
          icon={IndianRupee}
          tone="emerald"
        />
        <StatCard
          label="Average order value"
          value={money(customer.averageOrderValue)}
          icon={Receipt}
          tone="brand"
        />
        <StatCard
          label="Orders placed"
          value={customer.orderCount.toString()}
          icon={ShoppingBag}
          tone="sky"
        />
        <StatCard
          label="Last order"
          value={customer.lastOrderAt ? date(customer.lastOrderAt) : "Never"}
          icon={ShoppingCart}
          tone="violet"
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Card>
            <CardHeader title="Order history" description={`${customerOrders.length} orders in the demo dataset.`} />
            <CardBody className="p-0">
              {customerOrders.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead align="right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="font-medium text-ink hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-ink-muted">{date(order.createdAt)}</TableCell>
                        <TableCell>
                          <Badge
                            tone={
                              order.status === "delivered"
                                ? "success"
                                : order.status === "cancelled"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {ORDER_STATUS_LABELS[order.status]}
                          </Badge>
                        </TableCell>
                        <TableCell align="right" className="font-medium tabular-nums text-ink">
                          {money(order.total, order.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="px-4 py-8 text-center text-sm text-ink-muted">
                  This customer has not placed an order yet.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notes" description="Private notes for your team." />
            <CardBody className="flex flex-col gap-3">
              {customer.notes ? (
                <p className="rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm leading-5 text-ink-muted">
                  {customer.notes}
                </p>
              ) : (
                <p className="text-sm text-ink-muted">No notes yet.</p>
              )}
              <Field label="Add a note" htmlFor="customer-note">
                <Textarea
                  id="customer-note"
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="e.g. Prefers WhatsApp updates and a monthly invoice."
                />
              </Field>
              <FormActions sticky={false}>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={busy}
                  onClick={async () => {
                    if (!note.trim()) return;
                    setBusy(true);
                    try {
                      await customerService.update(customer.id, {
                        notes: customer.notes ? `${customer.notes}\n${note.trim()}` : note.trim(),
                      });
                      setNote("");
                      toast({ variant: "success", title: "Note saved" });
                    } catch (error) {
                      toast({
                        variant: "error",
                        title: "Could not save note",
                        description: isMockApiError(error) ? error.message : undefined,
                      });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <StickyNote className="size-3.5" aria-hidden />
                  Save note
                </Button>
              </FormActions>
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Profile" />
            <CardBody className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-3">
                <Avatar name={customer.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{customer.name}</p>
                  <p className="truncate text-xs text-ink-subtle">{customer.segment}</p>
                </div>
              </div>
              <p className="flex items-center gap-2 text-ink-muted">
                <Mail className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{customer.email}</span>
              </p>
              <p className="flex items-center gap-2 text-ink-muted">
                <Phone className="size-3.5 shrink-0" aria-hidden />
                {customer.phone}
              </p>
              <Switch
                checked={customer.marketingConsent}
                onCheckedChange={async (checked) => {
                  await customerService.update(customer.id, { marketingConsent: checked });
                  toast({
                    variant: "info",
                    title: checked ? "Marketing consent granted" : "Marketing consent revoked",
                  });
                }}
                label="Marketing consent"
                description="Customer has opted in to campaign emails."
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tags" description="Used for segmentation and campaigns." />
            <CardBody className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                {customer.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={async () => {
                      await customerService.update(customer.id, {
                        tags: customer.tags.filter((item) => item !== tag),
                      });
                      toast({ variant: "info", title: `Removed tag "${tag}"` });
                    }}
                    className="group inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs text-ink-muted transition-colors hover:border-red-200 hover:text-red-600"
                  >
                    <Tag className="size-3" aria-hidden />
                    {tag}
                    <span className="sr-only">Remove tag</span>
                  </button>
                ))}
                {customer.tags.length === 0 ? (
                  <p className="text-sm text-ink-muted">No tags yet.</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void addTag();
                    }
                  }}
                  placeholder="Add a tag"
                  aria-label="New tag"
                  className="h-9 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <Button variant="secondary" size="sm" onClick={() => void addTag()}>
                  Add
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Address book" />
            <CardBody className="flex flex-col gap-3">
              {customer.addresses.length ? (
                customer.addresses.map((address) => (
                  <address key={address.id ?? address.line1} className="not-italic text-xs leading-5 text-ink-muted">
                    <p className="flex items-center gap-1.5 font-medium text-ink">
                      <MapPin className="size-3.5" aria-hidden />
                      {address.name}
                    </p>
                    {address.line1}
                    {address.line2 ? (
                      <>
                        <br />
                        {address.line2}
                      </>
                    ) : null}
                    <br />
                    {address.city}, {address.state} {address.postalCode}
                    <br />
                    {address.country}
                    <br />
                    {address.phone}
                  </address>
                ))
              ) : (
                <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                  <UserRound className="size-3.5" aria-hidden />
                  No saved addresses.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </Page>
  );
}
