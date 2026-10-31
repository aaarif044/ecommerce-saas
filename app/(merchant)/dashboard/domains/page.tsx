"use client";

import * as React from "react";
import { Copy, Globe, Plus, RefreshCw, ShieldCheck, Star, Trash2 } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { settingsService } from "@/lib/services/settings";
import { isMockApiError } from "@/lib/services/errors";
import { useDateTimeFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CustomDomain } from "@/lib/types";

export default function DomainsPage() {
  const domains = useDataStore((state) => state.customDomains);
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);
  const toast = useUIStore((state) => state.toast);
  const dateTime = useDateTimeFormatter();

  const [addOpen, setAddOpen] = React.useState(false);
  const [hostname, setHostname] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<CustomDomain | null>(null);
  const [verifying, setVerifying] = React.useState<string | null>(null);

  const add = async () => {
    setSaving(true);
    setError(null);
    try {
      const domain = await settingsService.addDomain(hostname);
      toast({
        variant: "success",
        title: "Domain added",
        description: `${domain.hostname} is pending verification.`,
      });
      setHostname("");
      setAddOpen(false);
    } catch (err) {
      setError(isMockApiError(err) ? err.message : "Could not add the domain.");
    } finally {
      setSaving(false);
    }
  };

  const verify = async (id: string) => {
    setVerifying(id);
    try {
      await settingsService.verifyDomain(id);
      toast({
        variant: "success",
        title: "Domain verified (simulated)",
        description: "DNS records were marked as verified and SSL was provisioned in the demo.",
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Verification failed",
        description: isMockApiError(error) ? error.message : undefined,
      });
    } finally {
      setVerifying(null);
    }
  };

  const statusTone = (domain: CustomDomain) =>
    domain.status === "verified"
      ? ("success" as const)
      : domain.status === "failed"
        ? ("danger" as const)
        : ("warning" as const);

  return (
    <Page>
      <PageHeader
        title="Domains"
        description="Connect a custom domain. The verification and SSL steps in this demo are simulated — no real DNS or certificate is requested."
        actions={
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Add domain
          </Button>
        }
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="flex items-center gap-2 font-medium">
          <Globe className="size-4 shrink-0" aria-hidden />
          Demo domain workflow
        </p>
        <p className="mt-1 leading-5">
          Trellis never queries public DNS, never requests a certificate and never issues an SSL
          certificate. Pressing “Verify” only flips local demo state.
        </p>
      </div>

      <Card>
        <CardHeader title="Default store URL" description="Always available, even with no custom domain." />
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-sm text-ink">
              {settings.general.storeSlug}.example
            </span>
            <Badge tone="info">Default</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard?.writeText(
                  `https://${settings.general.storeSlug}.example`,
                );
                toast({ variant: "info", title: "URL copied" });
              }}
            >
              <Copy className="size-3.5" aria-hidden />
              Copy
            </Button>
          </div>
        </CardBody>
      </Card>

      {domains.map((domain) => (
        <Card key={domain.id}>
          <CardHeader
            title={
              <span className="flex flex-wrap items-center gap-2">
                {domain.hostname}
                {domain.isPrimary ? <Badge tone="brand">Primary</Badge> : null}
                <Badge tone={statusTone(domain)}>{domain.status}</Badge>
                <Badge tone={domain.sslStatus === "active" ? "success" : "warning"}>
                  SSL {domain.sslStatus}
                </Badge>
              </span>
            }
            description={
              domain.lastCheckedAt
                ? `Last checked ${dateTime(domain.lastCheckedAt)}`
                : "Not checked yet"
            }
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {!domain.isPrimary ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      await settingsService.setPrimaryDomain(domain.id);
                      toast({ variant: "success", title: "Primary domain updated" });
                    }}
                  >
                    <Star className="size-3.5" aria-hidden />
                    Make primary
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  size="sm"
                  loading={verifying === domain.id}
                  onClick={() => void verify(domain.id)}
                >
                  <RefreshCw className="size-3.5" aria-hidden />
                  {domain.status === "verified" ? "Re-verify" : "Verify domain"}
                </Button>
                <Button
                  variant="dangerGhost"
                  size="sm"
                  onClick={() => setPendingDelete(domain)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Remove
                </Button>
              </div>
            }
          />
          <CardBody>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              DNS records
            </h3>
            <p className="mt-1 text-xs text-ink-muted">
              Add these records at your DNS provider, then run the demo verification.
            </p>
            <div className="mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domain.dnsRecords.map((record) => (
                    <TableRow key={`${record.type}-${record.name}`}>
                      <TableCell className="font-mono text-xs text-ink">{record.type}</TableCell>
                      <TableCell className="font-mono text-xs text-ink-muted">{record.name}</TableCell>
                      <TableCell className="font-mono text-xs text-ink-muted">
                        {record.value}
                      </TableCell>
                      <TableCell>
                        {record.verified ? (
                          <Badge tone="success" dot>
                            Verified
                          </Badge>
                        ) : (
                          <Badge tone="warning" dot>
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-subtle">
              <ShieldCheck className="size-3.5" aria-hidden />
              SSL certificates in this demo are simulated and never issued.
            </p>
          </CardBody>
        </Card>
      ))}

      {!domains.length ? (
        <Card>
          <CardBody>
            <p className="py-6 text-center text-sm text-ink-muted">
              No custom domains connected. The default store URL works without one.
            </p>
          </CardBody>
        </Card>
      ) : null}

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a custom domain"
        description="Enter the hostname you want to connect. The demo creates a pending domain with sample DNS records."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void add()} loading={saving}>
              Add domain
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
          <Field label="Domain" required htmlFor="domain-hostname">
            <Input
              id="domain-hostname"
              value={hostname}
              onChange={(event) => setHostname(event.target.value)}
              placeholder="shop.yourbrand.com"
            />
          </Field>
          <p className="text-xs leading-5 text-ink-subtle">
            Adding a domain is optional — the store keeps working on{" "}
            {settings.general.storeSlug}.example.
          </p>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        destructive
        title={`Remove ${pendingDelete?.hostname}?`}
        description="The domain is disconnected and the demo DNS records are discarded."
        confirmLabel="Remove domain"
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await settingsService.removeDomain(pendingDelete.id);
            toast({ variant: "success", title: "Domain removed" });
            setPendingDelete(null);
          } catch (error) {
            toast({
              variant: "error",
              title: "Could not remove",
              description: isMockApiError(error) ? error.message : undefined,
            });
          }
        }}
      />
    </Page>
  );
}
