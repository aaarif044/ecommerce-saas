"use client";

import * as React from "react";
import { LifeBuoy, Timer, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Page, StatGrid } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUIStore } from "@/lib/store/ui-store";
import { useDateTimeFormatter } from "@/lib/hooks";

const TICKETS = [
  { id: "TCK-4210", subject: "Refund not showing on statement", merchant: "Blue Palm Traders", priority: "high", status: "open", updated: "2026-10-19T15:20:00.000Z" },
  { id: "TCK-4207", subject: "Cannot connect a custom domain", merchant: "Saffron Lane", priority: "medium", status: "open", updated: "2026-10-19T11:05:00.000Z" },
  { id: "TCK-4202", subject: "Billing invoice shows wrong period", merchant: "Cedar and Salt", priority: "medium", status: "pending", updated: "2026-10-18T09:42:00.000Z" },
  { id: "TCK-4196", subject: "Bulk product import fails", merchant: "Pine & Parcel", priority: "low", status: "open", updated: "2026-10-17T16:18:00.000Z" },
  { id: "TCK-4191", subject: "Password-protected storefront preview", merchant: "Trailhead Outfitters", priority: "low", status: "resolved", updated: "2026-10-16T12:00:00.000Z" },
  { id: "TCK-4188", subject: "Request plan upgrade mid-cycle", merchant: "Velvet Fig Studio", priority: "medium", status: "resolved", updated: "2026-10-15T10:33:00.000Z" },
];

const PRIORITY_TONE = { high: "danger", medium: "warning", low: "neutral" } as const;
const STATUS_TONE = { open: "info", pending: "warning", resolved: "success" } as const;

export default function AdminSupportPage() {
  const toast = useUIStore((state) => state.toast);
  const dateTime = useDateTimeFormatter();

  const open = TICKETS.filter((ticket) => ticket.status !== "resolved").length;
  const resolved = TICKETS.filter((ticket) => ticket.status === "resolved").length;

  return (
    <Page>
      <PageHeader
        eyebrow="Platform administration"
        title="Support overview"
        description="A snapshot of merchant support load. Tickets are illustrative fixtures."
      />

      <StatGrid columns={3}>
        <StatCard label="Open tickets" value={open.toString()} icon={LifeBuoy} tone="amber" />
        <StatCard label="Resolved" value={resolved.toString()} icon={TrendingUp} tone="emerald" />
        <StatCard
          label="Median first response"
          value="2h 14m"
          icon={Timer}
          tone="brand"
          footnote="Demo target: under 4 hours"
        />
      </StatGrid>

      <Card>
        <CardHeader title="Tickets" description="Most recently updated first." />
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TICKETS.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-surface-2/60">
                  <TableCell className="font-mono text-xs text-ink">{ticket.id}</TableCell>
                  <TableCell className="font-medium text-ink">{ticket.subject}</TableCell>
                  <TableCell className="text-ink-muted">{ticket.merchant}</TableCell>
                  <TableCell>
                    <Badge tone={PRIORITY_TONE[ticket.priority as keyof typeof PRIORITY_TONE]}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[ticket.status as keyof typeof STATUS_TONE]}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-ink-muted">{dateTime(ticket.updated)}</TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toast({
                            variant: "info",
                            title: `${ticket.id} assigned to you`,
                            description: "No reply is sent — this is a demo action.",
                          })
                        }
                      >
                        Assign
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          toast({
                            variant: "success",
                            title: `${ticket.id} marked resolved`,
                          })
                        }
                      >
                        Resolve
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </Page>
  );
}
