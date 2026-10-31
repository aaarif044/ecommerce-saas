"use client";

import { PageSkeleton } from "@/components/ui/page-skeleton";
import * as React from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useMoney, useDateTimeFormatter } from "@/lib/hooks";
import { ProductImage } from "@/components/product-image";
import {
  StoreContainer,
  StoreLinkButton,
  StorePageTitle,
} from "@/components/storefront/store-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_STATUS_LABELS } from "@/lib/services/sales";

export default function OrderConfirmationPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <OrderConfirmationPageContent />
    </React.Suspense>
  );
}

function OrderConfirmationPageContent() {

  const params = useParams<{ id: string }>();
  const order = useDataStore((state) => state.orders.find((item) => item.id === params.id));
  const money = useMoney();
  const dateTime = useDateTimeFormatter();

  if (!order) {
    return (
      <StoreContainer width="3xl" padding="xl">
        <EmptyState
          title="Order not found"
          description="We could not find that order in the demo dataset."
          action={<StoreLinkButton href="/store">Back to the shop</StoreLinkButton>}
        />
      </StoreContainer>
    );
  }

  return (
    <StoreContainer width="3xl" padding="lg">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <StorePageTitle
          className="mt-4 items-center text-center"
          title="Thank you — your order is placed"
          description={
            <>
              Order <span className="font-semibold text-ink">{order.orderNumber}</span> was placed on{" "}
              {dateTime(order.createdAt)}.
            </>
          }
        />
        <Badge tone="warning" className="mt-3 max-w-full whitespace-normal text-center">
          Simulated order — no payment was taken and no email was sent
        </Badge>
      </div>

      <Card className="mt-8 overflow-hidden">
        <CardHeader title="Items" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead align="right">Qty</TableHead>
              <TableHead align="right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lineItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ProductImage assetId={item.assetId} alt={item.title} className="size-12 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                      <p className="truncate text-2xs text-ink-subtle">{item.variantTitle}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell align="right" className="tabular-nums text-ink-muted">
                  {item.quantity}
                </TableCell>
                <TableCell align="right" className="font-medium tabular-nums">
                  {money(item.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="tabular-nums text-ink">{money(order.subtotal)}</dd>
          </div>
          {order.discountTotal ? (
            <div className="flex justify-between">
              <dt className="text-ink-muted">Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt>
              <dd className="tabular-nums text-emerald-600 dark:text-emerald-400">
                − {money(order.discountTotal)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-ink-muted">Shipping</dt>
            <dd className="tabular-nums text-ink">
              {order.shippingTotal === 0 ? "Free" : money(order.shippingTotal)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Tax</dt>
            <dd className="tabular-nums text-ink">{money(order.taxTotal)}</dd>
          </div>
          {order.handlingFee ? (
            <div className="flex justify-between">
              <dt className="text-ink-muted">Handling fee</dt>
              <dd className="tabular-nums text-ink">{money(order.handlingFee)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-line pt-2.5 text-md font-semibold">
            <dt className="text-ink">Total</dt>
            <dd className="tabular-nums text-ink">{money(order.total, order.currency)}</dd>
          </div>
        </dl>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              <Package className="size-4 text-ink-subtle" aria-hidden />
              Delivery address
            </h2>
            <address className="mt-3 not-italic text-sm leading-6 text-ink-muted">
              {order.shippingAddress.name}
              <br />
              {order.shippingAddress.line1}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </address>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              <Truck className="size-4 text-ink-subtle" aria-hidden />
              Fulfilment
            </h2>
            <p className="mt-3 text-sm text-ink-muted">{order.shippingMethodName}</p>
            <p className="mt-1 text-sm text-ink-muted">
              Status: {ORDER_STATUS_LABELS[order.status]}
            </p>
            <p className="mt-1 text-xs text-ink-subtle">
              A tracking number appears once the warehouse processes the order.
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <StoreLinkButton href="/store/products">Continue shopping</StoreLinkButton>
        <StoreLinkButton href="/dashboard/orders" variant="secondary">
          View in merchant dashboard
        </StoreLinkButton>
      </div>
    </StoreContainer>
  );
}
