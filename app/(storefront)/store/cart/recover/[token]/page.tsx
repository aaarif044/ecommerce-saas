"use client";

import { PageSkeleton } from "@/components/ui/page-skeleton";
import * as React from "react";
import { useParams } from "next/navigation";
import { useDataStore } from "@/lib/store/data-store";
import { useCartStore } from "@/lib/store/cart-store";
import { useMoney } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProductImage } from "@/components/product-image";
import { EmptyState } from "@/components/ui/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  StoreContainer,
  StoreLinkButton,
  StorePageTitle,
} from "@/components/storefront/store-container";

export default function RecoverCartPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <RecoverCartPageContent />
    </React.Suspense>
  );
}

function RecoverCartPageContent() {

  const params = useParams<{ token: string }>();
  const carts = useDataStore((state) => state.abandonedCarts);
  const addItem = useCartStore((state) => state.addItem);
  const money = useMoney();

  const cart = carts.find((item) => item.recoveryToken === params.token);

  if (!cart) {
    return (
      <StoreContainer width="2xl" padding="xl">
        <EmptyState
          title="This recovery link is not valid"
          description="The link may have expired. Browse the shop to start again."
          action={<StoreLinkButton href="/store/products">Shop all products</StoreLinkButton>}
        />
      </StoreContainer>
    );
  }

  return (
    <StoreContainer width="2xl" padding="lg">
      <Badge tone="brand" dot>
        Recovery link
      </Badge>
      <StorePageTitle
        className="mt-3"
        title={`Welcome back, ${cart.customerName.split(" ")[0]}`}
        description={`We saved ${cart.items.length} item${cart.items.length === 1 ? "" : "s"} for you. Add them back to your cart whenever you are ready.`}
      />

      <Card className="mt-6 overflow-hidden">
        <Table compact>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead align="right">Qty</TableHead>
              <TableHead align="right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cart.items.map((item, index) => (
              <TableRow key={`${item.productId}-${index}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ProductImage tone={index} alt={item.title} className="size-12 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                      <p className="truncate text-2xs text-ink-subtle">{item.variantTitle}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell align="right" className="tabular-nums text-ink-muted">
                  ×{item.quantity}
                </TableCell>
                <TableCell align="right" className="font-medium tabular-nums">
                  {money(item.price * item.quantity)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-md font-semibold text-ink">Cart total {money(cart.cartValue)}</p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              cart.items.forEach((item, itemIndex) => {
                const product = useDataStore
                  .getState()
                  .products.find((entry) => entry.id === item.productId);
                const variant = product?.variants.find((entry) => entry.title === item.variantTitle);
                if (!product || !variant) return;
                addItem({
                  id: `cart-${variant.id}-${Date.now().toString(36)}-${itemIndex}`,
                  productId: product.id,
                  variantId: variant.id,
                  title: product.title,
                  variantTitle: variant.title,
                  slug: product.slug,
                  sku: variant.sku,
                  assetId: product.images[0],
                  unitPrice: variant.price,
                  quantity: item.quantity,
                  weight: variant.weight,
                  maxQuantity: variant.inventory,
                });
              });
            }}
          >
            Add all to cart
          </Button>
          <StoreLinkButton href="/store/checkout">Go to checkout</StoreLinkButton>
        </div>
      </div>
    </StoreContainer>
  );
}
