"use client";

import * as React from "react";
import NextLink from "next/link";
import { Link as LinkIcon, MoreHorizontal, Plus, Settings2, Trash2 } from "lucide-react";
import { WhatsappIcon, WHATSAPP_GREEN } from "@/components/ui/whatsapp-icon";
import { useDataStore, useStoreSettings } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { campaignService, themeService } from "@/lib/services/storefront";
import { buildWhatsappShare } from "@/lib/services/whatsapp";
import { ANCHOR } from "@/lib/data/catalog";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useDateFormatter, useStoreOrigin, useWhatsappSettings } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page, StatGrid } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { FormGrid } from "@/components/ui/form";
import { DataTable, columnHelper } from "@/components/data-table/data-table";
import { ProductImage } from "@/components/product-image";
import { DropdownMenu, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import type { Campaign } from "@/lib/types";

const STATUS_TONE = {
  draft: "neutral",
  scheduled: "info",
  running: "success",
  completed: "brand",
  paused: "warning",
} as const;

export default function MarketingPage() {
  const campaigns = useDataStore((state) => state.campaigns);
  const products = useDataStore((state) => state.products);
  const categories = useDataStore((state) => state.categories);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const origin = useStoreOrigin();
  const settings = useStoreSettings();
  const whatsapp = useWhatsappSettings();
  const categoryName = React.useCallback(
    (id: string) => categories.find((item) => item.id === id)?.name,
    [categories],
  );
  const date = useDateFormatter();

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    channel: "email" as Campaign["channel"],
    audience: "All subscribers",
    startsAt: ANCHOR.toISOString().slice(0, 10),
    endsAt: new Date(ANCHOR.getTime() + 14 * 86400000).toISOString().slice(0, 10),
  });
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<Campaign | null>(null);
  const [bannerOpen, setBannerOpen] = React.useState(false);
  const themes = useDataStore((state) => state.themes);
  const activeTheme = themes.find((theme) => theme.isActive) ?? themes[0];
  const bannerSection = activeTheme?.settings.sections.find(
    (section) => section.type === "banner",
  );
  const [banner, setBanner] = React.useState(() => ({
    heading: (bannerSection?.props as { heading?: string } | undefined)?.heading ?? "",
    body: (bannerSection?.props as { body?: string } | undefined)?.body ?? "",
    ctaLabel: (bannerSection?.props as { ctaLabel?: string } | undefined)?.ctaLabel ?? "",
    ctaHref: (bannerSection?.props as { ctaHref?: string } | undefined)?.ctaHref ?? "",
  }));

  // The promo slot is a section of the published theme, so the copy has to be
  // written there — otherwise "Save banner" would change nothing.
  const saveBanner = async () => {
    if (!activeTheme || !bannerSection) return;
    try {
      await themeService.update(activeTheme.id, {
        sections: activeTheme.settings.sections.map((section) =>
          section.id === bannerSection.id
            ? { ...section, props: { ...section.props, ...banner } }
            : section,
        ),
      });
      setBannerOpen(false);
      toast({
        variant: "success",
        title: "Banner updated",
        description: "The promo slot now uses this copy.",
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not save the banner",
        description: isMockApiError(error) ? error.message : undefined,
      });
    }
  };

  const create = async () => {
    if (!form.name.trim()) {
      setError("Campaign name is required.");
      return;
    }
    setSaving(true);
    try {
      await campaignService.create({
        name: form.name.trim(),
        channel: form.channel,
        status: "draft",
        audience: form.audience,
        sent: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        spend: 0,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(`${form.endsAt}T23:59:59`).toISOString(),
      });
      toast({ variant: "success", title: "Campaign created", description: form.name });
      setForm({ ...form, name: "" });
      setOpen(false);
    } catch (err) {
      setError(isMockApiError(err) ? err.message : "Could not create the campaign.");
    } finally {
      setSaving(false);
    }
  };

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Campaign",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.original.name}</p>
            <p className="truncate text-2xs text-ink-subtle">{row.original.audience}</p>
          </div>
        ),
      }),
      columnHelper.accessor("channel", {
        header: "Channel",
        cell: ({ getValue }) => (
          <Badge tone="neutral">{(getValue() as string).toUpperCase()}</Badge>
        ),
      }),
      columnHelper.accessor("sent", {
        header: "Sent",
        meta: { align: "right" },
        cell: ({ getValue }) => (
          <span className="tabular-nums text-ink">{(getValue() as number).toLocaleString("en-IN")}</span>
        ),
      }),
      columnHelper.accessor("clicks", {
        header: "Clicks",
        meta: { align: "right" },
        cell: ({ getValue }) => (
          <span className="tabular-nums text-ink">{(getValue() as number).toLocaleString("en-IN")}</span>
        ),
      }),
      columnHelper.accessor("conversions", {
        header: "Conversions",
        meta: { align: "right" },
        cell: ({ getValue }) => (
          <span className="tabular-nums text-ink">{(getValue() as number).toLocaleString("en-IN")}</span>
        ),
      }),
      columnHelper.accessor("revenue", {
        header: "Revenue",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-ink">{money(row.original.revenue)}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const value = getValue() as Campaign["status"];
          return <Badge tone={STATUS_TONE[value]}>{value}</Badge>;
        },
      }),
      columnHelper.accessor("startsAt", {
        header: "Starts",
        meta: { hideBelow: "lg" },
        cell: ({ row }) => <span className="text-ink-muted">{date(row.original.startsAt)}</span>,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <DropdownMenu
            triggerLabel={`Actions for ${row.original.name}`}
            trigger={
              <span className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
                <MoreHorizontal className="size-4" aria-hidden />
              </span>
            }
          >
            <DropdownItem
              icon={<WhatsappIcon className="size-3.5" style={{ color: WHATSAPP_GREEN }} />}
              onClick={async () => {
                await campaignService.update(row.original.id, { status: "running" });
                toast({ variant: "info", title: "Campaign marked as running" });
              }}
            >
              Mark as running
            </DropdownItem>
            <DropdownItem
              icon={<WhatsappIcon className="size-3.5" style={{ color: WHATSAPP_GREEN }} />}
              onClick={async () => {
                await campaignService.update(row.original.id, { status: "completed" });
                toast({ variant: "success", title: "Campaign completed" });
              }}
            >
              Mark as completed
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              danger
              icon={<Trash2 className="size-3.5" />}
              onClick={() => setPendingDelete(row.original)}
            >
              Delete campaign
            </DropdownItem>
          </DropdownMenu>
        ),
      }),
    ],
    [date, money, toast],
  );

  const totals = React.useMemo(
    () => ({
      clicks: campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0),
      conversions: campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0),
      revenue: campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0),
      spend: campaigns.reduce((sum, campaign) => sum + campaign.spend, 0),
    }),
    [campaigns],
  );

  return (
    <Page>
      <PageHeader
        title="Marketing"
        description="Campaigns, promotional banners and product sharing. Sending is simulated in this demo."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setBannerOpen(true)}>
              <LinkIcon className="size-3.5" aria-hidden />
              Promo banner
            </Button>
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-4" aria-hidden />
              New campaign
            </Button>
          </>
        }
      />

      <StatGrid columns={4}>
        {[
          { label: "Total clicks", value: totals.clicks.toLocaleString("en-IN") },
          { label: "Conversions", value: totals.conversions.toLocaleString("en-IN") },
          { label: "Attributed revenue", value: money(totals.revenue) },
          { label: "Ad spend", value: money(totals.spend) },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-line bg-surface p-4 shadow-xs">
            <p className="text-xs font-medium text-ink-muted">{item.label}</p>
            <p className="mt-1.5 text-xl font-semibold tabular-nums text-ink">{item.value}</p>
          </div>
        ))}
      </StatGrid>

      <Card>
        <DataTable
          data={campaigns}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) => `${row.name} ${row.audience} ${row.channel}`}
          searchPlaceholder="Search campaigns…"
          itemLabel="campaigns"
          onExport={(rows) => {
            downloadCsv(
              "campaigns.csv",
              rows.map((row) => ({
                Name: row.name,
                Channel: row.channel,
                Status: row.status,
                Audience: row.audience,
                Sent: row.sent,
                Clicks: row.clicks,
                Conversions: row.conversions,
                Revenue: row.revenue,
                Spend: row.spend,
                Starts: row.startsAt,
                Ends: row.endsAt,
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          emptyTitle="No campaigns yet"
          emptyDescription="Create a campaign to plan your next promotion."
          emptyAction={
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-3.5" aria-hidden />
              New campaign
            </Button>
          }
        />
      </Card>

      <Card>
        <CardHeader
          title="WhatsApp product sharing"
          description="Generates a click-to-chat link using your configured number and message template. Opening it hands the message to WhatsApp — the demo never sends anything."
          actions={
            <NextLink
              href="/dashboard/settings/whatsapp"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
            >
              <Settings2 className="size-3.5" aria-hidden />
              Configure
            </NextLink>
          }
        />
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={whatsapp.enabled ? "success" : "neutral"} dot>
              {whatsapp.enabled ? "Sharing enabled" : "Sharing disabled"}
            </Badge>
            <Badge tone="neutral">{whatsapp.phone || "No number set"}</Badge>
            <Badge tone="outline">{whatsapp.buttonStyle} button</Badge>
            {whatsapp.includeTracking ? <Badge tone="info">UTM tracking on</Badge> : null}
          </div>

          {products.slice(0, 6).map((product) => {
            const share = buildWhatsappShare(
              whatsapp,
              "product",
              {
                path: `/store/products/${product.slug}`,
                title: product.title,
                productTitle: product.title,
                productVariant: product.variants[0]?.title ?? "",
                productPrice: money(product.price),
                storeName: settings.general.storeName,
              },
              origin,
            );
            return (
              <div
                key={product.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3"
              >
                <ProductImage
                  assetId={product.images[0]}
                  alt={product.title}
                  category={categoryName(product.categoryId)}
                  className="size-10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{product.title}</p>
                  <p className="truncate text-2xs text-ink-subtle">
                    {share.message.length > 96
                      ? `${share.message.slice(0, 96)}…`
                      : share.message}
                  </p>
                </div>
                {share.url ? (
                  <a
                    href={share.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300"
                  >
                    <WhatsappIcon className="size-3.5" style={{ color: WHATSAPP_GREEN }} />
                    Share
                  </a>
                ) : (
                  <Badge tone="warning">Set a number</Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!share.url}
                  onClick={() => {
                    void navigator.clipboard?.writeText(share.url ?? "");
                    toast({ variant: "info", title: "WhatsApp link copied" });
                  }}
                >
                  Copy link
                </Button>
              </div>
            );
          })}
        </CardBody>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="New campaign"
        description="Campaigns are tracked locally with deterministic demo performance."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void create()} loading={saving}>
              Create campaign
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}
          <Field label="Campaign name" required htmlFor="campaign-name">
            <Input
              id="campaign-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Diwali gifting guide"
            />
          </Field>
          <FormGrid>
            <Field label="Channel" htmlFor="campaign-channel">
              <Select
                id="campaign-channel"
                value={form.channel}
                onChange={(event) =>
                  setForm({ ...form, channel: event.target.value as Campaign["channel"] })
                }
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="ads">Ads</option>
                <option value="social">Social</option>
              </Select>
            </Field>
            <Field label="Audience" htmlFor="campaign-audience">
              <Input
                id="campaign-audience"
                value={form.audience}
                onChange={(event) => setForm({ ...form, audience: event.target.value })}
              />
            </Field>
            <Field label="Starts" htmlFor="campaign-starts">
              <Input
                id="campaign-starts"
                type="date"
                value={form.startsAt}
                onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
              />
            </Field>
            <Field label="Ends" htmlFor="campaign-ends">
              <Input
                id="campaign-ends"
                type="date"
                value={form.endsAt}
                onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
              />
            </Field>
          </FormGrid>
        </div>
      </Dialog>

      <Dialog
        open={bannerOpen}
        onClose={() => setBannerOpen(false)}
        title="Promotional banner"
        description="The banner copy used across the storefront promo slot."
        footer={
          <>
            <Button variant="ghost" onClick={() => setBannerOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                void saveBanner();
              }}
            >
              Save banner
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Heading" htmlFor="banner-heading">
            <Input
              id="banner-heading"
              value={banner.heading}
              onChange={(event) => setBanner({ ...banner, heading: event.target.value })}
            />
          </Field>
          <Field label="Body" htmlFor="banner-body">
            <Textarea
              id="banner-body"
              rows={2}
              value={banner.body}
              onChange={(event) => setBanner({ ...banner, body: event.target.value })}
            />
          </Field>
          <FormGrid>
            <Field label="Button label" htmlFor="banner-cta">
              <Input
                id="banner-cta"
                value={banner.ctaLabel}
                onChange={(event) => setBanner({ ...banner, ctaLabel: event.target.value })}
              />
            </Field>
            <Field label="Button link" htmlFor="banner-href">
              <Input
                id="banner-href"
                value={banner.ctaHref}
                onChange={(event) => setBanner({ ...banner, ctaHref: event.target.value })}
              />
            </Field>
          </FormGrid>
          <div className="rounded-lg border border-line p-4">
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
              Preview
            </p>
            <p className="mt-1.5 text-md font-semibold text-ink">{banner.heading}</p>
            <p className="mt-1 text-sm text-ink-muted">{banner.body}</p>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        destructive
        title={`Delete "${pendingDelete?.name}"?`}
        description="The campaign and its recorded performance are removed."
        confirmLabel="Delete campaign"
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await campaignService.remove(pendingDelete.id);
            toast({ variant: "success", title: "Campaign deleted" });
            setPendingDelete(null);
          } catch (error) {
            toast({
              variant: "error",
              title: "Could not delete",
              description: isMockApiError(error) ? error.message : undefined,
            });
          }
        }}
      />
    </Page>
  );
}
