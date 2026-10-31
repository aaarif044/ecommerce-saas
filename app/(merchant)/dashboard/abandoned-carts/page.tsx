"use client";

import * as React from "react";
import NextLink from "next/link";
import { Copy, Eye, Mail, RotateCcw, ShoppingCart } from "lucide-react";
import { WhatsappIcon, WHATSAPP_GREEN } from "@/components/ui/whatsapp-icon";
import { useDataStore, useStoreSettings } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { abandonedCartService } from "@/lib/services/sales";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useMoney, useDateTimeFormatter, useStoreOrigin, useWhatsappSettings } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page, StatGrid } from "@/components/shell/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { DataTable, columnHelper } from "@/components/data-table/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { Sheet } from "@/components/ui/sheet";
import { ProductImage } from "@/components/product-image";
import { buildWhatsappShare } from "@/lib/services/whatsapp";
import type { AbandonedCart } from "@/lib/types";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";

const RECOVERY_TONE = {
  not_contacted: "neutral",
  recovery_sent: "info",
  recovered: "success",
  expired: "danger",
} as const;

export default function AbandonedCartsPage() {
  const carts = useDataStore((state) => state.abandonedCarts);
  const toast = useUIStore((state) => state.toast);
  const money = useMoney();
  const dateTime = useDateTimeFormatter();

  const [status, setStatus] = React.useState("all");
  const [preview, setPreview] = React.useState<AbandonedCart | null>(null);
  const [busy, setBusy] = React.useState(false);
  const origin = useStoreOrigin();
  const storeSettings = useStoreSettings();
  const whatsapp = useWhatsappSettings();

  const recoveryShare = preview
    ? buildWhatsappShare(
        whatsapp,
        "cart",
        {
          path: `/store/cart/recover/${preview.recoveryToken}`,
          title: "Your abandoned cart",
          cartCount: preview.items.length,
          cartTotal: money(preview.cartValue),
          customerName: preview.customerName.split(" ")[0],
          storeName: storeSettings.general.storeName,
        },
        origin,
      )
    : { url: null, message: "", phone: "", truncated: false };

  const filtered = React.useMemo(
    () => carts.filter((cart) => status === "all" || cart.recoveryStatus === status),
    [carts, status],
  );

  const totals = React.useMemo(
    () => ({
      value: carts.reduce((sum, cart) => sum + cart.cartValue, 0),
      open: carts.filter((cart) => cart.recoveryStatus !== "recovered" && cart.recoveryStatus !== "expired").length,
      recovered: carts.filter((cart) => cart.recoveryStatus === "recovered").length,
    }),
    [carts],
  );

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("customerName", {
        header: "Customer",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.original.customerName}</p>
            <p className="truncate text-2xs text-ink-subtle">{row.original.email}</p>
          </div>
        ),
      }),
      columnHelper.display({
        id: "items",
        header: "Products",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            {row.original.items.slice(0, 3).map((item: AbandonedCart["items"][number], index: number) => (
              <ProductImage
                key={`${item.productId}-${index}`}
                assetId={undefined}
                tone={index}
                alt={item.title}
                className="size-7 shrink-0"
              />
            ))}
            {row.original.items.length > 3 ? (
              <span className="text-2xs text-ink-subtle">+{row.original.items.length - 3}</span>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor("cartValue", {
        header: "Cart value",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-ink">{money(row.original.cartValue)}</span>
        ),
      }),
      columnHelper.accessor("lastActivityAt", {
        header: "Last activity",
        cell: ({ row }) => (
          <span className="text-ink-muted">{dateTime(row.original.lastActivityAt)}</span>
        ),
      }),
      columnHelper.accessor("recoveryStatus", {
        header: "Recovery",
        cell: ({ getValue }) => {
          const value = getValue() as AbandonedCart["recoveryStatus"];
          return <Badge tone={RECOVERY_TONE[value]}>{value.replace(/_/g, " ")}</Badge>;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setPreview(row.original)}>
              <Eye className="size-3.5" aria-hidden />
              Preview
            </Button>
          </div>
        ),
      }),
    ],
    [dateTime, money],
  );

  const sendRecovery = async (cart: AbandonedCart) => {
    setBusy(true);
    try {
      await abandonedCartService.markRecoverySent(cart.id);
      toast({
        variant: "success",
        title: "Recovery link sent (simulated)",
        description: `No email was delivered — the demo only records the action for ${cart.email}.`,
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not send",
        description: isMockApiError(error) ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const markRecovered = async (cart: AbandonedCart) => {
    setBusy(true);
    try {
      await abandonedCartService.markRecovered(cart.id);
      toast({ variant: "success", title: "Cart marked as recovered" });
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not update",
        description: isMockApiError(error) ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Abandoned carts"
        description="Carts shoppers left behind. Recovery actions are simulated — no message is ever sent."
      />

      <StatGrid columns={3}>
        <StatCard
          label="Total cart value"
          value={money(totals.value)}
          icon={ShoppingCart}
          tone="brand"
        />
        <StatCard label="Open carts" value={totals.open.toString()} icon={RotateCcw} tone="amber" />
        <StatCard label="Recovered" value={totals.recovered.toString()} icon={Mail} tone="emerald" />
      </StatGrid>

      <Card>
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) => `${row.customerName} ${row.email} ${row.items.map((i) => i.title).join(" ")}`}
          searchPlaceholder="Search customer or product…"
          itemLabel="carts"
          toolbar={
            <FilterBar>
              <FilterSelect
                label="recovery status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "not_contacted", label: "Not contacted" },
                  { value: "recovery_sent", label: "Recovery sent" },
                  { value: "recovered", label: "Recovered" },
                  { value: "expired", label: "Expired" }
                ]}
              />
            </FilterBar>
          }
          onExport={(rows) => {
            downloadCsv(
              "abandoned-carts.csv",
              rows.map((row) => ({
                Customer: row.customerName,
                Email: row.email,
                Items: row.items.map((item) => `${item.title} x${item.quantity}`).join("; "),
                Cart_value: row.cartValue,
                Created: row.createdAt,
                Last_activity: row.lastActivityAt,
                Recovery_status: row.recoveryStatus,
                Recovery_token: row.recoveryToken,
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          emptyTitle="No abandoned carts match this filter"
        />
      </Card>

      <Sheet
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Recovery preview"
        description="What the shopper would receive. Nothing is sent automatically."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Close
            </Button>
            {preview ? (
              <>
                <Button
                  variant="secondary"
                  loading={busy}
                  onClick={() => void markRecovered(preview)}
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Mark recovered
                </Button>
                <Button
                  variant="primary"
                  loading={busy}
                  onClick={() => void sendRecovery(preview)}
                >
                  <Mail className="size-3.5" aria-hidden />
                  Send recovery link
                </Button>
              </>
            ) : null}
          </>
        }
      >
        {preview ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-line bg-surface-2 p-3.5">
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                Recovery link
              </p>
              <p className="mt-1 break-all font-mono text-xs text-ink">
                {`${typeof window !== "undefined" ? window.location.origin : "https://demo.local"}/store/cart/recover/${preview.recoveryToken}`}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1.5"
                onClick={() => {
                  const url = `${window.location.origin}/store/cart/recover/${preview.recoveryToken}`;
                  void navigator.clipboard?.writeText(url);
                  toast({ variant: "info", title: "Link copied to clipboard" });
                }}
              >
                <Copy className="size-3.5" aria-hidden />
                Copy link
              </Button>
            </div>

            <div>
              <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                Items left behind
              </p>
              <ul className="space-y-2">
                {preview.items.map((item, index) => (
                  <li key={`${item.productId}-${index}`} className="flex items-center gap-3">
                    <ProductImage tone={index} alt={item.title} className="size-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                      <p className="text-2xs text-ink-subtle">
                        {item.variantTitle} · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-ink">
                      {money(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-right text-sm font-semibold text-ink">
                Cart total {money(preview.cartValue)}
              </p>
            </div>

            <div className="rounded-lg border border-line p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <WhatsappIcon className="size-3.5" style={{ color: WHATSAPP_GREEN }} />
                WhatsApp click-to-chat
              </p>
              <p className="mt-1 text-2xs leading-4 text-ink-subtle">
                Opens WhatsApp with a pre-filled recovery message built from your WhatsApp
                template. The demo never sends it for you.
              </p>
              <p className="mt-2 break-all rounded-lg bg-surface-2 px-2.5 py-2 font-mono text-2xs text-ink-muted">
                {recoveryShare.message}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {recoveryShare.url ? (
                  <a
                    href={recoveryShare.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Open WhatsApp link
                  </a>
                ) : (
                  <span className="text-xs text-ink-subtle">
                    Set a business number in WhatsApp settings to build a link.
                  </span>
                )}
                <NextLink
                  href="/dashboard/settings/whatsapp"
                  className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
                >
                  WhatsApp settings
                </NextLink>
              </div>
            </div>
          </div>
        ) : null}
      </Sheet>
    </Page>
  );
}
