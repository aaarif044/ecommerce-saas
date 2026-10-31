"use client";

import * as React from "react";
import { Activity, Plug } from "lucide-react";
import { WhatsappIcon, WHATSAPP_GREEN } from "@/components/ui/whatsapp-icon";
import { useDataStore } from "@/lib/store/data-store";
import { PageHeader } from "@/components/shell/page-header";
import { Page, StatGrid } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PROVIDER_HEALTH = [
  { name: "SimulatedPay", region: "ap-south-1", uptime: 99.98, latency: 120, status: "operational" },
  { name: "BlueDart Express", region: "in-west-1", uptime: 99.71, latency: 240, status: "operational" },
  { name: "Delhivery", region: "in-south-1", uptime: 98.94, latency: 310, status: "degraded" },
  { name: "Mailchimp", region: "us-east-1", uptime: 99.88, latency: 180, status: "operational" },
  { name: "WhatsApp Business", region: "sg-central-1", uptime: 99.42, latency: 280, status: "operational" },
  { name: "Intercom", region: "us-west-2", uptime: 97.12, latency: 520, status: "outage" },
  { name: "Stripe (Test Mode)", region: "eu-west-1", uptime: 99.95, latency: 150, status: "operational" },
  { name: "Shiprocket", region: "in-south-1", uptime: 99.6, latency: 260, status: "operational" },
];

export default function AdminIntegrationsPage() {
  const integrations = useDataStore((state) => state.integrations);

  const connected = integrations.filter((integration) => integration.status === "connected").length;
  const operational = PROVIDER_HEALTH.filter((provider) => provider.status === "operational").length;

  return (
    <Page>
      <PageHeader
        eyebrow="Platform administration"
        title="Integration status"
        description="Availability of the connectors the marketplace exposes. Health figures are simulated."
      />

      <StatGrid columns={3}>
        <StatCard
          label="Connectors listed"
          value={integrations.length.toString()}
          icon={Plug}
          tone="brand"
        />
        <StatCard
          label="Connected by merchants"
          value={connected.toString()}
          icon={Activity}
          tone="emerald"
        />
        <StatCard
          label="Providers operational"
          value={`${operational}/${PROVIDER_HEALTH.length}`}
          icon={Activity}
          tone={operational === PROVIDER_HEALTH.length ? "emerald" : "amber"}
        />
      </StatGrid>

      <Card>
        <CardHeader title="Provider health" description="Rolling 30-day window." />
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Region</TableHead>
                <TableHead align="right">Uptime</TableHead>
                <TableHead align="right">Latency</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROVIDER_HEALTH.map((provider) => (
                <TableRow key={provider.name} className="hover:bg-surface-2/60">
                  <TableCell className="font-medium text-ink">{provider.name}</TableCell>
                  <TableCell className="font-mono text-xs text-ink-muted">
                    {provider.region}
                  </TableCell>
                  <TableCell align="right" className="tabular-nums">
                    {provider.uptime}%
                  </TableCell>
                  <TableCell align="right" className="tabular-nums">
                    {provider.latency} ms
                  </TableCell>
                  <TableCell>
                    <Badge
                      tone={
                        provider.status === "operational"
                          ? "success"
                          : provider.status === "degraded"
                            ? "warning"
                            : "danger"
                      }
                      dot
                    >
                      {provider.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Integrations offered" description="Everything in the merchant marketplace." />
        <CardBody>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => (
              <li
                key={integration.id}
                className="flex items-center gap-3 rounded-lg border border-line p-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-2xs font-bold text-brand-700 dark:bg-brand-950/60 dark:text-brand-200">
                  {integration.name.toLowerCase().includes("whatsapp") ? (
                    <WhatsappIcon className="size-4" style={{ color: WHATSAPP_GREEN }} />
                  ) : (
                    integration.logoText
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{integration.name}</p>
                  <p className="truncate text-2xs capitalize text-ink-subtle">
                    {integration.category}
                  </p>
                </div>
                <Badge
                  tone={
                    integration.status === "connected"
                      ? "success"
                      : integration.status === "disabled"
                        ? "neutral"
                        : "info"
                  }
                >
                  {integration.status}
                </Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </Page>
  );
}
