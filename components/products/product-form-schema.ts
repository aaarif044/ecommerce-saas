"use client";

import { z } from "zod";

export const productFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  images: z.array(z.string()),
  categoryId: z.string().min(1, "Choose a category"),
  collectionIds: z.array(z.string()),
  brand: z.string().min(1, "Brand is required"),
  sku: z.string().min(2, "SKU is required"),
  barcode: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  compareAtPrice: z.number().min(0, "Compare-at price cannot be negative"),
  costPrice: z.number().min(0, "Cost price cannot be negative"),
  inventory: z.number().min(0, "Inventory cannot be negative"),
  weight: z.number().min(0, "Weight cannot be negative"),
  weightUnit: z.enum(["g", "kg", "lb", "oz"]),
  variants: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(1, "Variant name is required"),
      options: z.array(z.string()),
      sku: z.string().optional(),
      barcode: z.string().optional(),
      price: z.number().min(0, "Price cannot be negative"),
      compareAtPrice: z.number().min(0, "Compare-at price cannot be negative"),
      costPrice: z.number().min(0, "Cost price cannot be negative"),
      inventory: z.number().min(0, "Inventory cannot be negative"),
      weight: z.number().min(0, "Weight cannot be negative"),
    }),
  ),
  seoTitle: z.string().max(70, "Keep the SEO title under 70 characters"),
  seoDescription: z.string().max(160, "Keep the SEO description under 160 characters"),
  visibility: z.enum(["visible", "hidden"]),
  status: z.enum(["active", "draft", "archived"]),
  featured: z.boolean(),
  tags: z.array(z.string()),
  shippingProfileId: z.string(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
