"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Save } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { productService, type ProductInput } from "@/lib/services/catalog";
import { isMockApiError } from "@/lib/services/errors";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Switch } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MediaPicker } from "./media-picker";
import { VariantEditor } from "./variant-editor";
import { productFormSchema, type ProductFormValues } from "./product-form-schema";
import type { Product } from "@/lib/types";

function defaultValues(product?: Product): ProductFormValues {
  if (product) {
    return {
      title: product.title,
      description: product.description,
      images: product.images,
      categoryId: product.categoryId,
      collectionIds: product.collectionIds,
      brand: product.brand,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? 0,
      costPrice: product.costPrice,
      inventory: product.inventory,
      weight: product.weight,
      weightUnit: product.weightUnit,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        title: variant.title,
        options: variant.options,
        sku: variant.sku,
        barcode: variant.barcode ?? "",
        price: variant.price,
        compareAtPrice: variant.compareAtPrice ?? 0,
        costPrice: variant.costPrice,
        inventory: variant.inventory,
        weight: variant.weight,
      })),
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      visibility: product.visibility,
      status: product.status,
      featured: product.featured,
      tags: product.tags,
      shippingProfileId: product.shippingProfileId,
    };
  }

  return {
    title: "",
    description: "",
    images: ["asset-01"],
    categoryId: "",
    collectionIds: [],
    brand: "",
    sku: "",
    barcode: "",
    price: 0,
    compareAtPrice: 0,
    costPrice: 0,
    inventory: 0,
    weight: 0,
    weightUnit: "g",
    variants: [],
    seoTitle: "",
    seoDescription: "",
    visibility: "visible",
    status: "draft",
    featured: false,
    tags: [],
    shippingProfileId: "ship-standard",
  };
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const categories = useDataStore((state) => state.categories);
  const collections = useDataStore((state) => state.collections);
  const toast = useUIStore((state) => state.toast);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultValues(product),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const status = useWatch({ control, name: "status" });
  const visibility = useWatch({ control, name: "visibility" });

  const onSubmit = async (values: ProductFormValues) => {
    setSaving(true);
    setFormError(null);
    try {
      const payload: ProductInput = {
        ...values,
        compareAtPrice: values.compareAtPrice || undefined,
        barcode: values.barcode ?? "",
        variants: values.variants.map((variant) => ({
          ...variant,
          id: variant.id,
          sku: variant.sku ?? "",
          barcode: variant.barcode ?? "",
          options: variant.options.length ? variant.options : [variant.title],
        })),
      };
      if (product) {
        await productService.update(product.id, payload);
        toast({
          variant: "success",
          title: "Product updated",
          description: `${values.title} has been saved.`,
        });
        router.push(`/dashboard/products/${product.id}`);
      } else {
        const created = await productService.create(payload);
        toast({
          variant: "success",
          title: "Product created",
          description: `${created.title} is saved as ${created.status}.`,
        });
        router.push(`/dashboard/products/${created.id}`);
      }
    } catch (error) {
      const message = isMockApiError(error) ? error.message : "Something went wrong while saving.";
      setFormError(message);
      toast({ variant: "error", title: "Could not save product", description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {formError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {formError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Card>
            <CardHeader title="Product details" description="The name, story and imagery shoppers see." />
            <CardBody className="flex flex-col gap-4">
              <Field label="Title" required error={errors.title?.message} htmlFor="product-title">
                <Input id="product-title" placeholder="e.g. Aria Wireless Headphones" {...register("title")} />
              </Field>
              <Field
                label="Description"
                required
                error={errors.description?.message}
                hint="Plain text. Line breaks are preserved on the storefront."
                htmlFor="product-description"
              >
                <Textarea id="product-description" rows={5} {...register("description")} />
              </Field>
              <Field label="Images" hint="Demo media library — generated tiles, no external photos.">
                <Controller
                  control={control}
                  name="images"
                  render={({ field }) => <MediaPicker value={field.value} onChange={field.onChange} />}
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Pricing" description="Set the price customers pay and your costs." />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Price" required error={errors.price?.message} htmlFor="product-price">
                <Input id="product-price" type="number" min={0} step="0.01" {...register("price", { valueAsNumber: true })} />
              </Field>
              <Field
                label="Compare-at price"
                error={errors.compareAtPrice?.message}
                hint="Shown struck through when higher than price."
                htmlFor="product-compare"
              >
                <Input
                  id="product-compare"
                  type="number"
                  min={0}
                  step="0.01"
                  {...register("compareAtPrice", { valueAsNumber: true })}
                />
              </Field>
              <Field label="Cost price" error={errors.costPrice?.message} htmlFor="product-cost">
                <Input
                  id="product-cost"
                  type="number"
                  min={0}
                  step="0.01"
                  {...register("costPrice", { valueAsNumber: true })}
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Variants"
              description="Each variant keeps its own SKU, price and stock level."
            />
            <CardBody>
              <VariantEditor />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Search appearance" description="Preview how the product shows up in results." />
            <CardBody className="flex flex-col gap-4">
              <Field label="SEO title" error={errors.seoTitle?.message} htmlFor="product-seo-title">
                <Input id="product-seo-title" {...register("seoTitle")} />
              </Field>
              <Field
                label="SEO description"
                error={errors.seoDescription?.message}
                htmlFor="product-seo-description"
              >
                <Textarea id="product-seo-description" rows={3} {...register("seoDescription")} />
              </Field>
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Status" description="Control what shoppers can see." />
            <CardBody className="flex flex-col gap-4">
              <Field label="Status" error={errors.status?.message} htmlFor="product-status">
                <Select id="product-status" {...register("status")}>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </Select>
              </Field>
              <Field label="Visibility" error={errors.visibility?.message} htmlFor="product-visibility">
                <Select id="product-visibility" {...register("visibility")}>
                  <option value="visible">Visible in storefront</option>
                  <option value="hidden">Hidden from storefront</option>
                </Select>
              </Field>
              <Controller
                control={control}
                name="featured"
                render={({ field }) => (
                  <Switch
                    id="product-featured"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    label="Featured product"
                    description="Show in featured collections and the homepage."
                  />
                )}
              />
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={status === "active" ? "success" : status === "draft" ? "warning" : "neutral"}>
                  {status}
                </Badge>
                <Badge tone={visibility === "visible" ? "info" : "neutral"}>{visibility}</Badge>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Organisation" description="Where the product sits in the catalogue." />
            <CardBody className="flex flex-col gap-4">
              <Field label="Category" required error={errors.categoryId?.message} htmlFor="product-category">
                <Select id="product-category" {...register("categoryId")}>
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Collections" hint="Hold ⌘/Ctrl to select more than one.">
                <Controller
                  control={control}
                  name="collectionIds"
                  render={({ field }) => (
                    <select
                      multiple
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(Array.from(event.target.selectedOptions).map((option) => option.value))
                      }
                      className="scrollbar-thin h-32 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
                    >
                      {collections.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                          {collection.title}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </Field>
              <Field label="Brand" required error={errors.brand?.message} htmlFor="product-brand">
                <Input id="product-brand" {...register("brand")} />
              </Field>
              <Field label="SKU" required error={errors.sku?.message} htmlFor="product-sku">
                <Input id="product-sku" className="font-mono text-xs" {...register("sku")} />
              </Field>
              <Field label="Barcode" htmlFor="product-barcode">
                <Input id="product-barcode" className="font-mono text-xs" {...register("barcode")} />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Shipping" description="Weight drives shipping rates." />
            <CardBody className="flex flex-col gap-4">
              <Field label="Weight" error={errors.weight?.message} htmlFor="product-weight">
                <Input id="product-weight" type="number" min={0} {...register("weight", { valueAsNumber: true })} />
              </Field>
              <Field label="Weight unit" htmlFor="product-weight-unit">
                <Select id="product-weight-unit" {...register("weightUnit")}>
                  <option value="g">Grams</option>
                  <option value="kg">Kilograms</option>
                  <option value="lb">Pounds</option>
                  <option value="oz">Ounces</option>
                </Select>
              </Field>
              <Field label="Shipping profile" htmlFor="product-shipping-profile">
                <Select id="product-shipping-profile" {...register("shippingProfileId")}>
                  <option value="ship-standard">Standard shipping</option>
                  <option value="ship-express">Express shipping</option>
                  <option value="ship-free">Free shipping</option>
                </Select>
              </Field>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface/95 py-3 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            reset(defaultValues(product));
            toast({ variant: "info", title: "Changes discarded" });
          }}
        >
          Reset form
        </Button>
        <Button type="submit" variant="primary" loading={saving} loadingText="Saving…">
          {product ? <Save className="size-4" aria-hidden /> : <Package className="size-4" aria-hidden />}
          {product ? "Save changes" : "Create product"}
        </Button>
      </div>
      </form>
    </FormProvider>
  );
}
