"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { ProductFormValues } from "./product-form-schema";

export function VariantEditor() {
  const { register, control, watch, setValue } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const variants = watch("variants");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Variants</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() =>
            append({
              title: "New variant",
              options: ["New variant"],
              sku: "",
              barcode: "",
              price: 0,
              compareAtPrice: 0,
              costPrice: 0,
              inventory: 0,
              weight: 0,
            })
          }
        >
          <Plus className="size-3.5" aria-hidden />
          Add variant
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-sm text-ink-muted">
          This product has no variants. Add one to track per-option stock and pricing.
        </p>
      ) : null}

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border border-line bg-surface-2/50 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">
              Variant {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={() => remove(index)}
              aria-label={`Remove variant ${index + 1}`}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Variant name" htmlFor={`variant-title-${index}`}>
              <Input id={`variant-title-${index}`} {...register(`variants.${index}.title`)} />
            </Field>
            <Field label="SKU" htmlFor={`variant-sku-${index}`}>
              <Input
                id={`variant-sku-${index}`}
                {...register(`variants.${index}.sku`)}
                className="font-mono text-xs"
              />
            </Field>
            <Field label="Barcode" htmlFor={`variant-barcode-${index}`}>
              <Input
                id={`variant-barcode-${index}`}
                {...register(`variants.${index}.barcode`)}
                className="font-mono text-xs"
              />
            </Field>
            <Field label="Price" htmlFor={`variant-price-${index}`}>
              <Input
                id={`variant-price-${index}`}
                type="number"
                min={0}
                step="0.01"
                {...register(`variants.${index}.price`, { valueAsNumber: true })}
              />
            </Field>
            <Field label="Compare-at price" htmlFor={`variant-compare-${index}`}>
              <Input
                id={`variant-compare-${index}`}
                type="number"
                min={0}
                step="0.01"
                {...register(`variants.${index}.compareAtPrice`, { valueAsNumber: true })}
              />
            </Field>
            <Field label="Cost price" htmlFor={`variant-cost-${index}`}>
              <Input
                id={`variant-cost-${index}`}
                type="number"
                min={0}
                step="0.01"
                {...register(`variants.${index}.costPrice`, { valueAsNumber: true })}
              />
            </Field>
            <Field label="Inventory" htmlFor={`variant-inventory-${index}`}>
              <Input
                id={`variant-inventory-${index}`}
                type="number"
                min={0}
                {...register(`variants.${index}.inventory`, { valueAsNumber: true })}
              />
            </Field>
            <Field label="Weight (g)" htmlFor={`variant-weight-${index}`}>
              <Input
                id={`variant-weight-${index}`}
                type="number"
                min={0}
                {...register(`variants.${index}.weight`, { valueAsNumber: true })}
              />
            </Field>
          </div>
        </div>
      ))}

      {fields.length > 0 ? (
        <p className="text-2xs text-ink-subtle">
          Total stock across variants:{" "}
          <span className="font-medium text-ink">
            {(variants ?? []).reduce((sum, variant) => sum + (variant?.inventory ?? 0), 0)} units
          </span>
          . Inventory is also managed from the Inventory screen.
        </p>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => {
          const current = watch("price") ?? 0;
          const cost = watch("costPrice") ?? 0;
          setValue("variants", [
            {
              title: "Default",
              options: ["Default"],
              sku: "",
              barcode: "",
              price: current,
              compareAtPrice: 0,
              costPrice: cost,
              inventory: 0,
              weight: watch("weight") ?? 0,
            },
          ]);
        }}
      >
        <Plus className="size-3.5" aria-hidden />
        Use a single default variant
      </Button>
    </div>
  );
}
