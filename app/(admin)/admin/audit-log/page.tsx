"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { downloadCsv } from "@/lib/services/csv";
import { useDateTimeFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {  } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {  } from "@/components/ui/search-input";
import { DataTable, columnHelper } from "@/components/data-table/data-table";
import type { PlatformAuditEntry } from "@/lib/types";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";

export default function AdminAuditLogPage() {
  const auditLog = useDataStore((state) => state.auditLog);
  const toast = useUIStore((state) => state.toast);
  const dateTime = useDateTimeFormatter();

  const [severity, setSeverity] = React.useState("all");

  const filtered = React.useMemo(
    () =>
      auditLog.filter((entry) => severity === "all" || entry.severity === severity),
    [auditLog, severity],
  );

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("createdAt", {
        header: "When",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-ink-muted">{dateTime(row.original.createdAt)}</span>
        ),
      }),
      columnHelper.accessor("actor", {
        header: "Actor",
        cell: ({ row }) => (
          <span className="font-medium text-ink">{row.original.actor}</span>
        ),
      }),
      columnHelper.accessor("action", {
        header: "Action",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-ink">{row.original.action}</span>
        ),
      }),
      columnHelper.accessor("targetType", {
        header: "Target type",
        cell: ({ row }) => <span className="text-ink-muted">{row.original.targetType}</span>,
      }),
      columnHelper.accessor("target", {
        header: "Target",
        cell: ({ row }) => <span className="text-ink-muted">{row.original.target}</span>,
      }),
      columnHelper.accessor("ip", {
        header: "IP",
        meta: { hideBelow: "lg" },
        cell: ({ row }) => (
          <span className="font-mono text-xs text-ink-subtle">{row.original.ip}</span>
        ),
      }),
      columnHelper.accessor("severity", {
        header: "Severity",
        cell: ({ row }) => {
          const value = row.original.severity as PlatformAuditEntry["severity"];
          return (
            <Badge tone={value === "critical" ? "danger" : value === "warning" ? "warning" : "info"}>
              {value}
            </Badge>
          );
        },
      }),
    ],
    [dateTime],
  );

  return (
    <Page>
      <PageHeader
        eyebrow="Platform administration"
        title="Audit log"
        description="Every recorded platform action. Entries are appended when platform-level changes are made."
      />

      <Card>
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) => `${row.action} ${row.actor} ${row.target} ${row.targetType}`}
          searchPlaceholder="Search actions, actors or targets…"
          itemLabel="entries"
          initialPageSize={15}
          toolbar={
            <FilterBar>
              <FilterSelect
                label="severity"
                value={severity}
                onChange={setSeverity}
                options={[
                  { value: "all", label: "All severities" },
                  { value: "info", label: "Info" },
                  { value: "warning", label: "Warning" },
                  { value: "critical", label: "Critical" }
                ]}
              />
            </FilterBar>
          }
          onExport={(rows) => {
            downloadCsv(
              "audit-log.csv",
              rows.map((row) => ({
                Timestamp: row.createdAt,
                Actor: row.actor,
                Action: row.action,
                Target: row.target,
                Target_type: row.targetType,
                IP: row.ip,
                Severity: row.severity,
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          emptyTitle="No audit entries match these filters"
        />
      </Card>

      <Card>
        <CardHeader title="How the log works" />
        <CardBody>
          <p className="flex items-start gap-2 text-sm leading-6 text-ink-muted">
            <FileText className="mt-0.5 size-4 shrink-0" aria-hidden />
            Entries are produced by platform-level actions such as suspending a merchant, changing a
            plan or updating global settings. Merchant-side activity appears in the merchant
            dashboard instead.
          </p>
        </CardBody>
      </Card>
    </Page>
  );
}
