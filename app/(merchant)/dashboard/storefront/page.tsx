"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/field";
import { StoreHeader } from "@/components/storefront/store-header";
import { StoreFooter } from "@/components/storefront/store-footer";
import { ThemeSections } from "@/components/storefront/sections";
import { cn } from "@/lib/utils";

export default function StorefrontPreviewPage() {
  const theme = useDataStore((state) => state.themes.find((item) => item.isActive) ?? state.themes[0]);
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");

  if (!theme) return null;

  return (
    <Page>
      <PageHeader
        title="Storefront"
        description="A live preview of the customer-facing shop using the published theme and current settings."
        actions={
          <>
            <SegmentedControl
              value={device}
              onChange={setDevice}
              ariaLabel="Preview device"
              options={[
                { value: "desktop", label: <Monitor className="size-3.5" /> },
                { value: "mobile", label: <Smartphone className="size-3.5" /> },
              ]}
            />
            <Button variant="secondary" size="sm" onClick={() => window.open("/store", "_blank")}>
              <ExternalLink className="size-3.5" aria-hidden />
              Open full storefront
            </Button>
            <Link
              href="/dashboard/themes"
              className="inline-flex h-8 items-center rounded-lg bg-brand-600 px-3 text-sm font-medium text-white dark:bg-brand-500 dark:text-brand-950"
            >
              Edit theme
            </Link>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2">
          <span className="size-2.5 rounded-full bg-red-400" aria-hidden />
          <span className="size-2.5 rounded-full bg-amber-400" aria-hidden />
          <span className="size-2.5 rounded-full bg-emerald-400" aria-hidden />
          <span className="ml-2 truncate text-2xs text-ink-subtle">
            northwind-goods.example
          </span>
        </div>
        <div
          className={cn(
            "mx-auto bg-canvas",
            device === "mobile" ? "max-w-96" : "max-w-full",
          )}
        >
          <StoreHeader />
          <div className="max-h-panel overflow-y-auto scrollbar-thin">
            <ThemeSections theme={theme.settings} />
          </div>
          <StoreFooter />
        </div>
      </Card>
    </Page>
  );
}
