"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Mail, Quote } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import type { Product, ThemeSection, ThemeSettings } from "@/lib/types";
import { ProductCard } from "./store-footer";
import { StoreContainer, StoreLinkButton } from "./store-container";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, isSellable } from "@/lib/utils";

function useCategorySlug() {
  const categories = useDataStore((state) => state.categories);
  return React.useCallback(
    (categoryId: string) => categories.find((item) => item.id === categoryId)?.slug,
    [categories],
  );
}

function Section({
  children,
  className,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string;
}) {
  return (
    <StoreContainer
      as="section"
      padding="lg"
      className={className}
      style={tone ? { backgroundColor: tone } : undefined}
    >
      {children}
    </StoreContainer>
  );
}

function HeroSection({
  section,
  theme,
  products,
  categorySlug,
}: {
  section: ThemeSection;
  theme: ThemeSettings;
  products: Product[];
  categorySlug: (id: string) => string | undefined;
}) {
  const props = section.props as {
    headline: string;
    subhead: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    tone: number;
    align: string;
  };
  const primary = theme.primaryColor;
  const heroProducts = products.filter(isSellable).slice(0, 2);

  return (
    <section
      className="relative overflow-hidden border-b border-line"
      style={{
        backgroundImage: `linear-gradient(135deg, ${primary}14 0%, transparent 55%), linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)`,
      }}
    >
      <StoreContainer className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div className={cn(props.align === "center" && "text-center")}>
          <p
            className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-2xs font-semibold uppercase tracking-wide"
            style={{ backgroundColor: `${primary}18`, color: primary }}
          >
            New season
          </p>
          <h1 className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {props.headline}
          </h1>
          <p className="mt-4 max-w-lg text-md leading-7 text-ink-muted">{props.subhead}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <StoreLinkButton
              href={props.primaryHref}
              size="lg"
              style={{ backgroundColor: primary }}
              className="text-white transition-transform hover:-translate-y-0.5 dark:text-white"
            >
              {props.primaryLabel}
              <ArrowRight className="size-4" aria-hidden />
            </StoreLinkButton>
            {props.secondaryLabel ? (
              <StoreLinkButton href={props.secondaryHref} variant="secondary" size="lg">
                {props.secondaryLabel}
              </StoreLinkButton>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {heroProducts.map((product, index) => (
            <ProductImage
              key={product.id}
              assetId={product.images[0]}
              alt={product.title}
              category={categorySlug(product.categoryId)}
              ratio="portrait"
              className={index === 1 ? "mt-6 w-full" : "w-full"}
            />
          ))}
        </div>
      </StoreContainer>
    </section>
  );
}

function FeaturedProductsSection({
  section,
  products,
  collections,
}: {
  section: ThemeSection;
  products: Product[];
  collections: { id: string; title: string; slug: string }[];
}) {
  const props = section.props as {
    heading: string;
    subheading: string;
    collectionId: string;
    limit: number;
    columns: number;
  };
  const categorySlug = useCategorySlug();
  const collection = collections.find((item) => item.id === props.collectionId);
  const selected = React.useMemo(() => {
    const inCollection = collection
      ? products.filter((product) => collection.id && product.collectionIds.includes(collection.id))
      : [];
    const source = inCollection.length ? inCollection : products;
    return source.filter(isSellable).slice(0, props.limit ?? 8);
  }, [products, collection, props.limit]);

  return (
    <Section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {props.heading}
          </h2>
          {props.subheading ? (
            <p className="mt-1 text-sm text-ink-muted">{props.subheading}</p>
          ) : null}
        </div>
        {collection ? (
          <Link
            href={`/store/collections/${collection.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
      <div
        className="grid grid-cols-2 gap-3 sm:gap-4"
        style={{ gridTemplateColumns: `repeat(${Math.min(props.columns ?? 4, 4)}, minmax(0, 1fr))` }}
      >
        {selected.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              ...product,
              category: categorySlug(product.categoryId),
            }}
          />
        ))}
      </div>
    </Section>
  );
}

function FeaturedCollectionsSection({
  section,
  collections,
  products,
}: {
  section: ThemeSection;
  collections: { id: string; title: string; slug: string; description: string; imageTone: number }[];
  products: Product[];
}) {
  const props = section.props as {
    heading: string;
    collectionIds: string[];
  };
  const selected = collections.filter((collection) => props.collectionIds.includes(collection.id));

  return (
    <Section className="bg-surface-2">
      <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        {props.heading}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {selected.map((collection) => {
          const count = products.filter((product) => product.collectionIds.includes(collection.id)).length;
          return (
            <Link
              key={collection.id}
              href={`/store/collections/${collection.slug}`}
              className="group relative overflow-hidden rounded-xl border border-line"
            >
              <ProductImage
                assetId={`asset-${String((collection.imageTone % 12) + 1).padStart(2, "0")}`}
                alt={collection.title}
                ratio="square"
                rounded="rounded-none"
                className="w-full"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
                <p className="text-sm font-semibold text-white">{collection.title}</p>
                <p className="text-2xs text-white/80">{count} products</p>
              </div>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

function ImageTextSection({ section, theme }: { section: ThemeSection; theme: ThemeSettings }) {
  const props = section.props as {
    heading: string;
    body: string;
    primaryLabel: string;
    primaryHref: string;
    tone: number;
    imagePosition: string;
  };

  return (
    <Section>
      <div
        className={cn(
          "grid items-center gap-8 lg:grid-cols-2",
          props.imagePosition === "left" && "lg:[&>*:first-child]:order-2",
        )}
      >
        <ProductImage
          assetId={`asset-${String((props.tone % 12) + 1).padStart(2, "0")}`}
          alt={props.heading}
          ratio="portrait"
          className="w-full"
        />
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {props.heading}
          </h2>
          <p className="mt-3 text-base leading-7 text-ink-muted">{props.body}</p>
          {props.primaryLabel ? (
            <StoreLinkButton
              href={props.primaryHref}
              className="mt-6 text-white dark:text-white"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {props.primaryLabel}
              <ArrowRight className="size-4" aria-hidden />
            </StoreLinkButton>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

function BannerSection({ section, theme }: { section: ThemeSection; theme: ThemeSettings }) {
  const props = section.props as {
    heading: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
    tone: number;
  };

  return (
    <Section className="py-0">
      <div
        className="flex flex-col items-start justify-between gap-5 overflow-hidden rounded-2xl p-8 sm:flex-row sm:items-center sm:p-10"
        style={{
          backgroundImage: `linear-gradient(120deg, ${theme.accentColor}22 0%, ${theme.primaryColor}18 100%)`,
          border: `1px solid ${theme.primaryColor}33`,
        }}
      >
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {props.heading}
          </h2>
          <p className="mt-2 max-w-xl text-base leading-6 text-ink-muted">{props.body}</p>
        </div>
        {props.ctaLabel ? (
          <StoreLinkButton
            href={props.ctaHref}
            size="lg"
            className="shrink-0 text-white dark:text-white"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {props.ctaLabel}
            <ArrowRight className="size-4" aria-hidden />
          </StoreLinkButton>
        ) : null}
      </div>
    </Section>
  );
}

function TestimonialsSection({ section }: { section: ThemeSection }) {
  const props = section.props as {
    heading: string;
    testimonials: { quote: string; author: string; role: string }[];
  };

  return (
    <Section className="bg-surface-2">
      <h2 className="mb-6 text-center text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        {props.heading}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {props.testimonials.map((testimonial) => (
          <figure
            key={testimonial.author}
            className="rounded-xl border border-line bg-surface p-5"
          >
            <Quote className="size-5 text-ink-subtle" aria-hidden />
            <blockquote className="mt-3 text-base leading-6 text-ink">
              {testimonial.quote}
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-50 text-2xs font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-200">
                {testimonial.author.slice(0, 2).toUpperCase()}
              </span>
              <span>
                <span className="block font-medium text-ink">{testimonial.author}</span>
                {testimonial.role}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

function FaqSection({ section }: { section: ThemeSection }) {
  const props = section.props as { heading: string; items: { q: string; a: string }[] };
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <Section className="max-w-3xl">
      <h2 className="mb-6 text-center text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        {props.heading}
      </h2>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {props.items.map((item, index) => (
          <li key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(open === index ? null : index)}
              aria-expanded={open === index}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="text-base font-medium text-ink">{item.q}</span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-ink-subtle transition-transform",
                  open === index && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {open === index ? (
              <p className="px-4 pb-4 text-sm leading-6 text-ink-muted">{item.a}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function NewsletterSection({ section, theme }: { section: ThemeSection; theme: ThemeSettings }) {
  const props = section.props as { heading: string; body: string; buttonLabel: string };
  const [email, setEmail] = React.useState("");
  const [done, setDone] = React.useState(false);

  return (
    <Section className="py-0">
      <div className="rounded-2xl border border-line bg-surface-2 p-8 text-center sm:p-12">
        <Mail className="mx-auto size-6 text-ink-subtle" aria-hidden />
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {props.heading}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-base leading-6 text-ink-muted">{props.body}</p>
        {done ? (
          <p className="mt-5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Thanks — you are on the demo list. No email was actually sent.
          </p>
        ) : (
          <form
            className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (!email.includes("@")) return;
              setDone(true);
            }}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <Input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-11 flex-1"
            />
            <Button
              type="submit"
              size="lg"
              className="text-sm text-white dark:text-white"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {props.buttonLabel}
            </Button>
          </form>
        )}
      </div>
    </Section>
  );
}

function RichTextSection({ section }: { section: ThemeSection }) {
  const props = section.props as { heading: string; body: string };
  return (
    <Section className="max-w-3xl">
      <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{props.heading}</h2>
      <div className="mt-3 space-y-3 text-base leading-7 text-ink-muted">
        {props.body.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </Section>
  );
}

function ProductGridSection({
  section,
  products,
}: {
  section: ThemeSection;
  products: Product[];
}) {
  const props = section.props as { heading: string; categoryId: string; limit: number; columns: number };
  const categorySlug = useCategorySlug();
  const selected = products
    .filter(
      (product) =>
        isSellable(product) &&
        (!props.categoryId || product.categoryId === props.categoryId),
    )
    .slice(0, props.limit ?? 8);

  return (
    <Section>
      {props.heading ? (
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {props.heading}
        </h2>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {selected.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              ...product,
              category: categorySlug(product.categoryId),
            }}
          />
        ))}
      </div>
    </Section>
  );
}

function SpacerSection({ section }: { section: ThemeSection }) {
  const props = section.props as { height: number };
  return <div style={{ height: props.height ?? 32 }} aria-hidden />;
}

export function ThemeSections({ theme }: { theme: ThemeSettings }) {
  const products = useDataStore((state) => state.products);
  const collections = useDataStore((state) => state.collections);
  const categorySlug = useCategorySlug();

  return (
    <>
      {theme.sections
        .filter((section) => section.visible)
        .map((section) => {
          switch (section.type) {
            case "hero":
              return (
                <HeroSection
                  key={section.id}
                  section={section}
                  theme={theme}
                  products={products}
                  categorySlug={categorySlug}
                />
              );
            case "featured_products":
              return (
                <FeaturedProductsSection
                  key={section.id}
                  section={section}
                  products={products}
                  collections={collections}
                />
              );
            case "featured_collections":
              return (
                <FeaturedCollectionsSection
                  key={section.id}
                  section={section}
                  collections={collections}
                  products={products}
                />
              );
            case "image_text":
              return <ImageTextSection key={section.id} section={section} theme={theme} />;
            case "banner":
              return <BannerSection key={section.id} section={section} theme={theme} />;
            case "testimonials":
              return <TestimonialsSection key={section.id} section={section} />;
            case "faq":
              return <FaqSection key={section.id} section={section} />;
            case "newsletter":
              return <NewsletterSection key={section.id} section={section} theme={theme} />;
            case "rich_text":
              return <RichTextSection key={section.id} section={section} />;
            case "product_grid":
              return (
                <ProductGridSection key={section.id} section={section} products={products} />
              );
            case "spacer":
              return <SpacerSection key={section.id} section={section} />;
            default:
              return null;
          }
        })}
    </>
  );
}
