"use client";

import * as React from "react";
import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The storefront shell.
 *
 * Every storefront page renders its content inside a `StoreContainer`, so the
 * gutters, the maximum width and the vertical rhythm are identical everywhere.
 * The widths mirror the reading widths the pages need (the catalogue is wide,
 * an article is narrow); the padding scale is the only vertical rhythm there
 * is.
 */

export type StoreContainerWidth = "7xl" | "5xl" | "3xl" | "2xl";
export type StoreContainerPadding = "none" | "sm" | "md" | "lg" | "xl";

const WIDTHS: Record<StoreContainerWidth, string> = {
  "7xl": "max-w-7xl",
  "5xl": "max-w-5xl",
  "3xl": "max-w-3xl",
  "2xl": "max-w-2xl",
};

const PADDINGS: Record<StoreContainerPadding, string> = {
  none: "",
  sm: "py-6",
  md: "py-8",
  lg: "py-10",
  xl: "py-16",
};

export interface StoreContainerProps extends React.HTMLAttributes<HTMLElement> {
  /** The element to render — pages that are an article use `article`. */
  as?: React.ElementType;
  width?: StoreContainerWidth;
  padding?: StoreContainerPadding;
}

export function StoreContainer({
  as,
  width = "7xl",
  padding = "md",
  className,
  children,
  ...props
}: StoreContainerProps) {
  const Tag = (as ?? "div") as React.ElementType;

  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
        WIDTHS[width],
        PADDINGS[padding],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export interface StorePageTitleProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** A small line above the title — the brand of a product, for example. */
  eyebrow?: React.ReactNode;
  /** A badge or a chip that sits next to the title. */
  aside?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * The one page heading treatment: the same size, the same spacing and the
 * same muted description on every storefront page.
 */
export function StorePageTitle({
  title,
  description,
  eyebrow,
  aside,
  className,
  children,
}: StorePageTitleProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-wide text-ink-subtle">{eyebrow}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {aside}
      </div>
      {description ? (
        <p className="max-w-2xl text-base leading-6 text-ink-muted">{description}</p>
      ) : null}
      {children}
    </div>
  );
}

export type StoreLinkButtonProps = Omit<React.ComponentProps<typeof Link>, "ref"> &
  VariantProps<typeof buttonVariants>;

/**
 * The class list of a storefront call to action. It is the same list the
 * `Button` component uses, so a link and a button next to each other have
 * the same height, radius, padding and focus ring.
 */
export function storeLinkButtonClass({
  variant = "primary",
  size = "md",
  block,
  className,
}: {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  block?: VariantProps<typeof buttonVariants>["block"];
  className?: string;
}) {
  return cn(buttonVariants({ variant, size, block }), className);
}

/**
 * A call to action that navigates. It keeps the link semantics (so the
 * browser and the keyboard behave the way they should) while looking exactly
 * like a `Button`.
 */
export function StoreLinkButton({
  href,
  variant = "primary",
  size = "md",
  block,
  className,
  children,
  ...props
}: StoreLinkButtonProps) {
  return (
    <Link
      href={href}
      className={storeLinkButtonClass({ variant, size, block, className })}
      {...props}
    >
      {children}
    </Link>
  );
}
