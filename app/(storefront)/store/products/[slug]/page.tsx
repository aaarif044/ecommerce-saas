"use client";

import { PageSkeleton } from "@/components/ui/page-skeleton";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { useDataStore, useStoreSettings } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { cartService } from "@/lib/services/checkout";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney } from "@/lib/hooks";
import { ProductImage } from "@/components/product-image";
import { WhatsappShareButton } from "@/components/storefront/whatsapp-share";
import { ProductCard } from "@/components/storefront/store-footer";
import { QuantityStepper } from "@/components/storefront/quantity-stepper";
import {
  StoreContainer,
  StoreLinkButton,
  StorePageTitle,
} from "@/components/storefront/store-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { cn, isSellable } from "@/lib/utils";

export default function ProductDetailPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <ProductDetailPageContent />
    </React.Suspense>
  );
}

function ProductDetailPageContent() {

  const params = useParams<{ slug: string }>();
  const products = useDataStore((state) => state.products);
  const collections = useDataStore((state) => state.collections);
  const categories = useDataStore((state) => state.categories);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const settings = useStoreSettings();

  const product = products.find((item) => item.slug === params.slug);

  const [variantId, setVariantId] = React.useState<string | null>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [activeImage, setActiveImage] = React.useState(0);
  const [adding, setAdding] = React.useState(false);

  if (!product) {
    return (
      <StoreContainer width="3xl" padding="xl">
        <EmptyState
          title="Product not found"
          description="This product may have been removed from the demo catalogue."
          action={
            <StoreLinkButton href="/store/products">Browse all products</StoreLinkButton>
          }
        />
      </StoreContainer>
    );
  }

  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  const category = categories.find((item) => item.id === product.categoryId);
  const inStock = (variant?.inventory ?? 0) > 0;
  const related = products
    .filter(
      (item) =>
        item.id !== product.id &&
        isSellable(item) &&
        (item.categoryId === product.categoryId || item.collectionIds.some((id) => product.collectionIds.includes(id))),
    )
    .slice(0, 4);
  const productCollections = collections.filter((item) => product.collectionIds.includes(item.id));

  const addToCart = async () => {
    if (!variant) return;
    setAdding(true);
    try {
      cartService.addItem(product.id, variant.id, quantity);
      toast({
        variant: "success",
        title: "Added to cart",
        description: `${product.title} · ${variant.title}`,
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not add to cart",
        description: isMockApiError(error) ? error.message : undefined,
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <StoreContainer>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
          <li>
            <Link href="/store" className="hover:text-ink">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/store/products" className="hover:text-ink">
              Products
            </Link>
          </li>
          {category ? (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/store/categories/${category.slug}`} className="hover:text-ink">
                  {category.name}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden>/</li>
          <li className="font-medium text-ink">{product.title}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <ProductImage
            assetId={product.images[activeImage]}
            alt={product.title}
            ratio="square"
            className="w-full"
          />
          {product.images.length > 1 ? (
            <div className="flex gap-2">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={activeImage === index}
                  className={cn(
                    "w-16 overflow-hidden rounded-lg border-2 transition-colors",
                    activeImage === index ? "border-brand-500" : "border-transparent hover:border-line-strong",
                  )}
                >
                  <ProductImage assetId={image} alt="" className="h-16 w-full" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col">
          <StorePageTitle eyebrow={product.brand} title={product.title} />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {inStock ? (
              <Badge tone="success" dot>
                In stock
              </Badge>
            ) : (
              <Badge tone="danger" dot>
                Sold out
              </Badge>
            )}
            {product.featured ? <Badge tone="brand">Featured</Badge> : null}
            <span className="text-xs text-ink-subtle">SKU {product.sku}</span>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold tabular-nums text-ink">
              {money(variant?.price ?? product.price)}
            </span>
            {(variant?.compareAtPrice ?? product.compareAtPrice) ? (
              <span className="text-md tabular-nums text-ink-subtle line-through">
                {money(variant?.compareAtPrice ?? product.compareAtPrice ?? 0)}
              </span>
            ) : null}
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <Badge tone="danger">Save {money(product.compareAtPrice - product.price)}</Badge>
            ) : null}
          </div>

          <p className="mt-4 text-base leading-7 text-ink-muted">{product.description}</p>

          {product.variants.length > 1 ? (
            <fieldset className="mt-6">
              <legend className="text-xs font-semibold uppercase tracking-wide text-ink">
                Options
              </legend>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Options">
                {product.variants.map((item) => {
                  // The first variant is the one on screen until the shopper
                  // picks another, so it has to start out selected.
                  const selected = (variantId ?? product.variants[0]?.id) === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setVariantId(item.id);
                        setQuantity(1);
                      }}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                        selected
                          ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-200"
                          : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
                      )}
                    >
                      {item.title}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantityStepper
              size="lg"
              value={quantity}
              onChange={(value) => setQuantity(value)}
              max={variant?.inventory ?? 0}
            />
            <Button
              variant="primary"
              size="lg"
              className="flex-1 sm:flex-none sm:px-8"
              onClick={() => void addToCart()}
              loading={adding}
              disabled={!inStock}
            >
              {inStock ? "Add to cart" : "Sold out"}
            </Button>
            <WhatsappShareButton
              surface="product"
              payload={{
                path: `/store/products/${product.slug}`,
                title: product.title,
                productTitle: product.title,
                productVariant: variant?.title ?? "",
                productPrice: money(variant?.price ?? product.price),
                storeName: settings.general.storeName,
              }}
            />
          </div>

          <p className="mt-2 text-xs text-ink-subtle">
            {variant ? `${variant.inventory} units available for this option.` : ""}
          </p>

          <ul className="mt-6 grid gap-2.5 border-t border-line pt-6 text-sm text-ink-muted">
            <li className="flex items-center gap-2.5">
              <Truck className="size-4 shrink-0 text-ink-subtle" aria-hidden />
              Free standard delivery on orders over ₹1,999 · 2–4 working days
            </li>
            <li className="flex items-center gap-2.5">
              <Undo2 className="size-4 shrink-0 text-ink-subtle" aria-hidden />
              30-day free returns, no questions asked
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 shrink-0 text-ink-subtle" aria-hidden />
              One-year warranty against manufacturing defects
            </li>
          </ul>

          {productCollections.length ? (
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                Collections
              </span>
              {productCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/store/collections/${collection.slug}`}
                  className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
                >
                  {collection.title}
                </Link>
              ))}
            </div>
          ) : null}

          {product.tags.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                Tags
              </span>
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs text-ink-muted"
                >
                  <Check className="size-3" aria-hidden />
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {related.length ? (
        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight text-ink">You may also like</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </StoreContainer>
  );
}
