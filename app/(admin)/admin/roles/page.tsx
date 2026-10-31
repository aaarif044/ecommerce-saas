"use client";

import * as React from "react";
import { Check, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { CardGrid, Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ALL_PERMISSIONS } from "@/lib/data/settings";

const PLATFORM_ROLES = [
  {
    id: "role-superadmin",
    name: "Super admin",
    description: "Unrestricted access to every platform surface.",
    permissions: ALL_PERMISSIONS.flatMap((group) => [...group.items]),
  },
  {
    id: "role-ops",
    name: "Operations",
    description: "Merchant lifecycle, plans and support.",
    permissions: ["merchant.read", "merchant.write", "plans.read", "plans.write", "support.read", "support.write"],
  },
  {
    id: "role-support",
    name: "Support",
    description: "Read-only merchant context plus ticket handling.",
    permissions: ["merchant.read", "support.read", "support.write", "audit.read"],
  },
  {
    id: "role-billing",
    name: "Billing",
    description: "Plans, invoices and subscription changes.",
    permissions: ["plans.read", "plans.write", "billing.read", "billing.write", "merchant.read"],
  },
];

export default function AdminRolesPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Platform administration"
        title="Roles & permissions"
        description="What each platform role can reach. Roles apply to the administration interface only."
      />

      <CardGrid columns={2}>
        {PLATFORM_ROLES.map((role) => (
          <Card key={role.id}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <KeyRound className="size-4 text-ink-subtle" aria-hidden />
                  {role.name}
                </span>
              }
              description={role.description}
              actions={<Badge tone="brand">{role.permissions.length} permissions</Badge>}
            />
            <CardBody>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((permission) => (
                  <Badge key={permission} tone="outline" size="sm">
                    {permission}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </CardGrid>

      <Card>
        <CardHeader title="Permission matrix" description="The full platform permission set." />
        <CardBody>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                {PLATFORM_ROLES.map((role) => (
                  <TableHead key={role.id} align="center">
                    {role.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ALL_PERMISSIONS.flatMap((group) => group.items).map((permission) => (
                <TableRow key={permission}>
                  <TableCell className="font-mono text-xs text-ink-muted">{permission}</TableCell>
                  {PLATFORM_ROLES.map((role) => (
                    <TableCell key={role.id} align="center">
                      {role.permissions.includes(permission) ? (
                        <Check
                          className="mx-auto size-4 text-emerald-600 dark:text-emerald-400"
                          aria-label="Allowed"
                        />
                      ) : (
                        <span className="text-ink-subtle" aria-label="Not allowed">
                          —
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </Page>
  );
}
