"use client";

import { PageSkeleton } from "@/components/ui/page-skeleton";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, CreditCard, MapPin, MessageSquarePlus, Package, RotateCcw, Truck, User, XCircle } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { orderService, ORDER_STATUS_LABELS, ORDER_TRANSITIONS, PAYMENT_STATUS_LABELS, FULFILLMENT_STATUS_LABELS } from "@/lib/services/sales";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useDateTimeFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import { DescriptionRow } from "@/components/ui/table";
import { ProductImage } from "@/components/product-image";
import { EmptyState } from "@/components/ui/states";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

const ORDER_TONE: Record<OrderStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

const PAYMENT_TONE: Record<PaymentStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
  pending: "warning",
  authorized: "info",
  paid: "success",
  partially_refunded: "warning",
  refunded: "neutral",
  failed: "danger",
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = ORDER_TRANSITIONS;

export default function OrderDetailPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <OrderDetailPageContent />
    </React.Suspense>
  );
}

function OrderDetailPageContent() {

  const params = useParams<{ id: string }>();
  const order = useDataStore((state) => state.orders.find((item) => item.id === params.id));
  const payments = useDataStore((state) => state.payments);
  const shipments = useDataStore((state) => state.shipments);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const dateTime = useDateTimeFormatter();

  const [busy, setBusy] = React.useState(false);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [trackOpen, setTrackOpen] = React.useState(false);
  const [tracking, setTracking] = React.useState({ carrier: "BlueDart Express", trackingNumber: "" });
  const [refundOpen, setRefundOpen] = React.useState(false);
  const [refund, setRefund] = React.useState({ amount: 0, reason: "Customer request" });
  const [actionError, setActionError] = React.useState<string | null>(null);

  if (!order) {
    return (
      <Page>
        <PageHeader title="Order not found" />
        <EmptyState
          title="This order no longer exists"
          description="It may have been removed while resetting the demo data."
          action={
            <Link
              href="/dashboard/orders"
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white dark:bg-brand-500 dark:text-brand-950"
            >
              Back to orders
            </Link>
          }
        />
      </Page>
    );
  }

  const payment = payments.find((item) => item.orderId === order.id);
  const shipment = shipments.find((item) => item.orderId === order.id);

  const run = async (fn: () => Promise<unknown>, successTitle: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      toast({ variant: "success", title: successTitle });
    } catch (error) {
      const message = isMockApiError(error) ? error.message : "The action could not be completed.";
      setActionError(message);
      toast({ variant: "error", title: "Action failed", description: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Order"
        title={order.orderNumber}
        description={`Placed ${dateTime(order.createdAt)} · ${order.channel.replace(/_/g, " ")}`}
        actions={
          <>
            <Badge tone={ORDER_TONE[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
            <Badge tone={PAYMENT_TONE[order.paymentStatus]}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </Badge>
            <Link
              href="/dashboard/orders"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-xs transition-colors hover:bg-surface-2"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Back
            </Link>
          </>
        }
      />

      {actionError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {actionError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Card>
            <CardHeader
              title="Items"
              description={`${order.lineItems.length} line item${order.lineItems.length === 1 ? "" : "s"}`}
            />
            <CardBody className="p-0">
              <ul className="divide-y divide-line">
                {order.lineItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <ProductImage assetId={item.assetId} alt={item.title} className="size-12 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                      <p className="truncate text-2xs text-ink-subtle">
                        {item.variantTitle} · {item.sku} · Qty {item.quantity}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium tabular-nums text-ink">
                        {money(item.total)}
                      </p>
                      <p className="text-2xs tabular-nums text-ink-subtle">
                        {money(item.unitPrice)} each
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Order timeline" description="Every recorded event for this order." />
            <CardBody>
              <ol className="relative space-y-4 border-l border-line pl-5">
                {order.timeline.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      aria-hidden
                      className="absolute -left-[1.6rem] top-1 size-2.5 rounded-full border-2 border-surface bg-brand-500"
                    />
                    <p className="text-sm font-medium text-ink">{event.title}</p>
                    {event.description ? (
                      <p className="mt-0.5 text-xs leading-5 text-ink-muted">{event.description}</p>
                    ) : null}
                    <p className="mt-0.5 text-2xs text-ink-subtle">
                      {dateTime(event.createdAt)} · {event.actor}
                    </p>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Internal notes"
              description="Only visible to your team."
              actions={
                <Button variant="secondary" size="sm" onClick={() => setNoteOpen(true)}>
                  <MessageSquarePlus className="size-3.5" aria-hidden />
                  Add note
                </Button>
              }
            />
            <CardBody className="p-0">
              {order.internalNotes.length ? (
                <ul className="divide-y divide-line">
                  {order.internalNotes.map((item) => (
                    <li key={item.id} className="px-4 py-3">
                      <p className="text-sm leading-5 text-ink">{item.body}</p>
                      <p className="mt-1 text-2xs text-ink-subtle">
                        {item.author} · {dateTime(item.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-6 text-center text-sm text-ink-muted">
                  No internal notes on this order yet.
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Actions" description="Status changes are validated." />
            <CardBody className="flex flex-col gap-2">
              {NEXT_STATUS[order.status].length ? (
                NEXT_STATUS[order.status].map((next) => (
                  <Button
                    key={next}
                    variant={next === "cancelled" ? "dangerGhost" : "secondary"}
                    size="sm"
                    block
                    loading={busy}
                    onClick={() =>
                      void run(
                        () => orderService.updateStatus(order.id, next),
                        `Order ${ORDER_STATUS_LABELS[next].toLowerCase()}`,
                      )
                    }
                  >
                    {next === "cancelled" ? (
                      <XCircle className="size-3.5" aria-hidden />
                    ) : next === "shipped" ? (
                      <Truck className="size-3.5" aria-hidden />
                    ) : (
                      <Package className="size-3.5" aria-hidden />
                    )}
                    {next === "confirmed"
                      ? "Confirm order"
                      : next === "processing"
                        ? "Start processing"
                        : next === "shipped"
                          ? "Mark as shipped"
                          : next === "delivered"
                            ? "Mark as delivered"
                            : "Cancel order"}
                  </Button>
                ))
              ) : (
                <p className="rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink-muted">
                  This order has reached a final state — no further status changes are possible.
                </p>
              )}
              <Button
                variant="secondary"
                size="sm"
                block
                onClick={() => {
                  setTracking({
                    carrier: order.carrier ?? "BlueDart Express",
                    trackingNumber: order.trackingNumber ?? "",
                  });
                  setTrackOpen(true);
                }}
              >
                <Truck className="size-3.5" aria-hidden />
                Add tracking details
              </Button>
              <Button
                variant="secondary"
                size="sm"
                block
                onClick={() => {
                  setRefund({
                    amount: Math.max(0, order.total - order.refundedTotal),
                    reason: "Customer request",
                  });
                  setRefundOpen(true);
                }}
                disabled={order.paymentStatus === "refunded"}
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Process demo refund
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Summary" description="Totals are recalculated from the line items." />
            <CardBody>
              <dl className="space-y-2">
                <DescriptionRow label="Subtotal" value={money(order.subtotal)} />
                {order.discountTotal ? (
                  <DescriptionRow
                    label={`Discount${order.discountCode ? ` (${order.discountCode})` : ""}`}
                    value={
                      <span className="text-emerald-600 dark:text-emerald-400">
                        − {money(order.discountTotal)}
                      </span>
                    }
                  />
                ) : null}
                <DescriptionRow label="Tax" value={money(order.taxTotal)} />
                <DescriptionRow label="Shipping" value={money(order.shippingTotal)} />
                {order.handlingFee ? (
                  <DescriptionRow label="Handling fee" value={money(order.handlingFee)} />
                ) : null}
                {order.refundedTotal ? (
                  <DescriptionRow
                    label="Refunded"
                    value={
                      <span className="text-red-600 dark:text-red-400">
                        − {money(order.refundedTotal)}
                      </span>
                    }
                    tone="danger"
                  />
                ) : null}
                <DescriptionRow
                  className="mt-2 border-t border-line pt-2.5"
                  label={<span className="font-semibold text-ink">Total</span>}
                  value={
                    <span className="text-md font-semibold">
                      {money(order.total, order.currency)}
                    </span>
                  }
                />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Payment" description="Simulated — no real charges were made." />
            <CardBody className="flex flex-col gap-3 text-sm">
              <div className="flex items-start gap-2.5">
                <CreditCard className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
                <div>
                  <p className="font-medium text-ink">
                    {payment ? payment.gateway : order.paymentStatus.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {payment ? `Reference ${payment.reference}` : "No payment record attached"}
                  </p>
                </div>
              </div>
              {payment?.cardLast4 ? (
                <p className="text-xs text-ink-muted">Simulated card ending {payment.cardLast4}</p>
              ) : null}
              {payment?.refunds.length ? (
                <div className="rounded-lg border border-line bg-surface-2 p-2.5">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                    Refund history
                  </p>
                  <ul className="mt-1 space-y-1">
                    {payment.refunds.map((item) => (
                      <li key={item.id} className="text-xs text-ink-muted">
                        {money(item.amount)} · {item.reason} · {dateTime(item.createdAt)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Fulfilment" description="Shipping and tracking." />
            <CardBody className="flex flex-col gap-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Truck className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
                <div>
                  <p className="font-medium text-ink">{order.shippingMethodName}</p>
                  <p className="text-xs text-ink-muted">
                    {FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus]}
                  </p>
                </div>
              </div>
              {order.trackingNumber ? (
                <p className="font-mono text-xs text-ink-muted">
                  {order.carrier} · {order.trackingNumber}
                </p>
              ) : (
                <p className="text-xs text-ink-muted">No tracking number recorded yet.</p>
              )}
              {shipment?.estimatedDelivery ? (
                <p className="text-xs text-ink-muted">
                  Estimated delivery {dateTime(shipment.estimatedDelivery)}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Customer" />
            <CardBody className="flex flex-col gap-3 text-sm">
              <div className="flex items-start gap-2.5">
                <User className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
                <div className="min-w-0">
                  <p className="font-medium text-ink">{order.customerName}</p>
                  <p className="truncate text-xs text-ink-muted">{order.customerEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
                <address className="not-italic text-xs leading-5 text-ink-muted">
                  {order.shippingAddress.name}
                  <br />
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 ? (
                    <>
                      <br />
                      {order.shippingAddress.line2}
                    </>
                  ) : null}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode}
                  <br />
                  {order.shippingAddress.country}
                  <br />
                  {order.shippingAddress.phone}
                </address>
              </div>
              {order.customerNote ? (
                <div className="rounded-lg border border-line bg-surface-2 p-2.5">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                    Customer note
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-muted">{order.customerNote}</p>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>

      <Dialog
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Add an internal note"
        description="Notes are only visible to your team and are added to the timeline."
        footer={
          <>
            <Button variant="ghost" onClick={() => setNoteOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={() =>
                void run(async () => {
                  await orderService.addNote(order.id, note);
                  setNote("");
                  setNoteOpen(false);
                }, "Note added")
              }
            >
              Add note
            </Button>
          </>
        }
      >
        <Field label="Note" required htmlFor="order-note">
          <Textarea
            id="order-note"
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Customer requested a call before delivery."
          />
        </Field>
      </Dialog>

      <Dialog
        open={trackOpen}
        onClose={() => setTrackOpen(false)}
        title="Add tracking details"
        description="Recording a tracking number marks the order as shipped."
        footer={
          <>
            <Button variant="ghost" onClick={() => setTrackOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={() =>
                void run(async () => {
                  await orderService.addTracking(
                    order.id,
                    tracking.carrier,
                    tracking.trackingNumber,
                  );
                  setTrackOpen(false);
                }, "Tracking added")
              }
            >
              Save tracking
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Carrier" htmlFor="tracking-carrier">
            <Select
              id="tracking-carrier"
              value={tracking.carrier}
              onChange={(event) => setTracking({ ...tracking, carrier: event.target.value })}
            >
              <option>BlueDart Express</option>
              <option>Delhivery Surface</option>
              <option>Ecom Express</option>
              <option>Ekart Logistics</option>
            </Select>
          </Field>
          <Field label="Tracking number" required htmlFor="tracking-number">
            <Input
              id="tracking-number"
              value={tracking.trackingNumber}
              onChange={(event) =>
                setTracking({ ...tracking, trackingNumber: event.target.value })
              }
              placeholder="e.g. BD123456789"
            />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title="Process a demo refund"
        description="No money moves. The refund is recorded against the demo payment."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRefundOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={() =>
                void run(async () => {
                  await orderService.refund(order.id, refund.amount, refund.reason);
                  setRefundOpen(false);
                }, "Demo refund processed")
              }
            >
              Process refund
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Refund amount"
            required
            hint={`Remaining refundable balance: ${money(order.total - order.refundedTotal)}`}
            htmlFor="refund-amount"
          >
            <Input
              id="refund-amount"
              type="number"
              min={0}
              max={order.total - order.refundedTotal}
              value={refund.amount}
              onChange={(event) => setRefund({ ...refund, amount: Number(event.target.value) })}
            />
          </Field>
          <Field label="Reason" htmlFor="refund-reason">
            <Textarea
              id="refund-reason"
              rows={3}
              value={refund.reason}
              onChange={(event) => setRefund({ ...refund, reason: event.target.value })}
            />
          </Field>
        </div>
      </Dialog>
    </Page>
  );
}
