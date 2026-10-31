"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { settingsService } from "@/lib/services/settings";
import { isMockApiError } from "@/lib/services/errors";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { MediaPicker } from "@/components/products/media-picker";
import { useController } from "react-hook-form";
import { useStoreOrigin } from "@/lib/hooks";

const schema = z.object({
  storeName: z.string().min(2, "Store name is required"),
  storeSlug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only"),
  description: z.string().min(10, "Add a short description"),
  logoText: z.string().min(1, "Logo text is required"),
  faviconEmoji: z.string().min(1).max(2),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(6, "Enter a phone number"),
  legalName: z.string().min(2, "Legal business name is required"),
  addressLine1: z.string().min(3, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  taxId: z.string().optional(),
  status: z.enum(["active", "in_setup", "paused"]),
  images: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

export default function GeneralSettingsPage() {
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);
  const toast = useUIStore((state) => state.toast);
  const origin = useStoreOrigin();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeName: settings.general.storeName,
      storeSlug: settings.general.storeSlug,
      description: settings.general.description,
      logoText: settings.general.logoText,
      faviconEmoji: settings.general.faviconEmoji,
      email: settings.general.email,
      phone: settings.general.phone,
      legalName: settings.general.legalName,
      addressLine1: settings.general.addressLine1,
      addressLine2: settings.general.addressLine2,
      city: settings.general.city,
      state: settings.general.state,
      postalCode: settings.general.postalCode,
      country: settings.general.country,
      taxId: settings.general.taxId,
      status: settings.general.status,
      images: settings.general.images?.length
        ? settings.general.images
        : [settings.general.logoText.slice(0, 2).toUpperCase()],
    },
  });

  const images = useController({ control, name: "images" });

  const onSubmit = async (values: FormValues) => {
    try {
      await settingsService.updateGeneral({
        storeName: values.storeName,
        storeSlug: values.storeSlug,
        description: values.description,
        logoText: values.logoText,
        faviconEmoji: values.faviconEmoji,
        email: values.email,
        phone: values.phone,
        legalName: values.legalName,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2 ?? "",
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        country: values.country,
        taxId: values.taxId ?? "",
        status: values.status,
        images: values.images,
      });
      toast({ variant: "success", title: "Store details saved" });
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not save",
        description: isMockApiError(error) ? error.message : undefined,
      });
    }
  };

  return (
    <SettingsLayout
      title="General settings"
      description="Your store identity, business information and status."
    >
      <Page
        gap="sm"
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Card>
          <CardHeader title="Store identity" description="Shown across the dashboard and storefront." />
          <CardBody className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Store name" required error={errors.storeName?.message} htmlFor="store-name">
                <Input id="store-name" {...register("storeName")} />
              </Field>
              <Field
                label="Store slug"
                required
                error={errors.storeSlug?.message}
                hint={`${origin}/${settings.general.storeSlug}`}
                htmlFor="store-slug"
              >
                <Input id="store-slug" {...register("storeSlug")} className="font-mono text-xs" />
              </Field>
            </div>
            <Field
              label="Store description"
              required
              error={errors.description?.message}
              htmlFor="store-description"
            >
              <Textarea id="store-description" rows={3} {...register("description")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Logo text" error={errors.logoText?.message} htmlFor="store-logo">
                <Input id="store-logo" {...register("logoText")} />
              </Field>
              <Field label="Favicon" error={errors.faviconEmoji?.message} htmlFor="store-favicon">
                <Input id="store-favicon" maxLength={2} {...register("faviconEmoji")} className="w-20" />
              </Field>
            </div>
            <Field label="Brand tile" hint="A generated tile used as the storefront logo mark.">
              <MediaPicker value={images.field.value} onChange={images.field.onChange} max={3} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Contact details" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Store email" required error={errors.email?.message} htmlFor="store-email">
              <Input id="store-email" type="email" {...register("email")} />
            </Field>
            <Field label="Phone" required error={errors.phone?.message} htmlFor="store-phone">
              <Input id="store-phone" {...register("phone")} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Business information" description="Used on invoices and legal pages." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Legal business name"
              required
              error={errors.legalName?.message}
              htmlFor="legal-name"
            >
              <Input id="legal-name" {...register("legalName")} />
            </Field>
            <Field label="Tax registration ID" htmlFor="tax-id">
              <Input id="tax-id" {...register("taxId")} className="font-mono text-xs" />
            </Field>
            <Field label="Address line 1" required error={errors.addressLine1?.message} htmlFor="address1">
              <Input id="address1" {...register("addressLine1")} />
            </Field>
            <Field label="Address line 2" htmlFor="address2">
              <Input id="address2" {...register("addressLine2")} />
            </Field>
            <Field label="City" required error={errors.city?.message} htmlFor="city">
              <Input id="city" {...register("city")} />
            </Field>
            <Field label="State" required error={errors.state?.message} htmlFor="state">
              <Input id="state" {...register("state")} />
            </Field>
            <Field label="Postal code" required error={errors.postalCode?.message} htmlFor="postal">
              <Input id="postal" {...register("postalCode")} />
            </Field>
            <Field label="Country" required error={errors.country?.message} htmlFor="country">
              <Input id="country" {...register("country")} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Store status" description="Controls what the storefront shows." />
          <CardBody className="flex flex-col gap-4">
            <Field label="Status" error={errors.status?.message} htmlFor="store-status">
              <Select id="store-status" {...register("status")}>
                <option value="active">Active</option>
                <option value="in_setup">In setup</option>
                <option value="paused">Paused</option>
              </Select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Badge tone={settings.general.status === "active" ? "success" : "warning"}>
                {settings.general.status.replace(/_/g, " ")}
              </Badge>
              <Badge tone="info">Last saved locally</Badge>
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => reset()}>
            Reset
          </Button>
          <Button type="submit" variant="primary">
            <Save className="size-4" aria-hidden />
            Save changes
          </Button>
        </div>
      </Page>
    </SettingsLayout>
  );
}
