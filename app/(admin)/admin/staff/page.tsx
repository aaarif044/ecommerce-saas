"use client";

import * as React from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { useDateFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page, StatGrid } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FormFull, FormGrid } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
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

export default function AdminStaffPage() {
  const auditLog = useDataStore((state) => state.auditLog);
  const merchants = useDataStore((state) => state.merchants);
  const toast = useUIStore((state) => state.toast);
  const date = useDateFormatter();

  const [staff, setStaff] = React.useState([
    { id: "pstf-1", name: "Aditi Rao", email: "aditi.rao@trellis.example", role: "Super admin", lastActiveAt: "2026-10-19T09:12:00.000Z" },
    { id: "pstf-2", name: "Marco Silva", email: "marco.silva@trellis.example", role: "Operations", lastActiveAt: "2026-10-18T16:40:00.000Z" },
    { id: "pstf-3", name: "Hana Ito", email: "hana.ito@trellis.example", role: "Support", lastActiveAt: "2026-10-19T07:05:00.000Z" },
    { id: "pstf-4", name: "Yusuf Demir", email: "yusuf.demir@trellis.example", role: "Billing", lastActiveAt: "2026-10-17T11:22:00.000Z" },
    { id: "pstf-5", name: "Elena Costa", email: "elena.costa@trellis.example", role: "Support", lastActiveAt: "2026-10-15T13:48:00.000Z" },
  ]);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [invite, setInvite] = React.useState({ name: "", email: "", role: "Support" });
  const [error, setError] = React.useState<string | null>(null);

  return (
    <Page>
      <PageHeader
        eyebrow="Platform administration"
        title="Platform staff"
        description="The internal team that operates the marketplace."
        actions={
          <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" aria-hidden />
            Invite staff
          </Button>
        }
      />

      <Card>
        <CardHeader title="Team" description={`${staff.length} platform staff members.`} />
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id} className="hover:bg-surface-2/60">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{member.name}</p>
                        <p className="truncate text-2xs text-ink-subtle">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={member.role}
                      aria-label={`Role for ${member.name}`}
                      onChange={(event) =>
                        setStaff((current) =>
                          current.map((entry) =>
                            entry.id === member.id
                              ? { ...entry, role: event.target.value }
                              : entry,
                          ),
                        )
                      }
                      className="h-8 w-40"
                    >
                      {PLATFORM_ROLES.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell className="text-ink-muted">{date(member.lastActiveAt)}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStaff((current) => current.filter((entry) => entry.id !== member.id));
                        toast({ variant: "info", title: "Staff member removed" });
                      }}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Recent platform activity"
          description="Audit entries for the platform team."
        />
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            {auditLog.slice(0, 8).map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                <Badge
                  tone={
                    entry.severity === "critical"
                      ? "danger"
                      : entry.severity === "warning"
                        ? "warning"
                        : "info"
                  }
                >
                  {entry.severity}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{entry.action}</p>
                  <p className="truncate text-2xs text-ink-subtle">
                    {entry.actor} · {entry.targetType} · {entry.ip}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-ink-muted">{date(entry.createdAt)}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Merchants managed" description="Snapshot of the merchant base." />
        <CardBody>
          <StatGrid columns={3}>
            {[
              { label: "Total merchants", value: merchants.length },
              { label: "Platform staff", value: staff.length },
              { label: "Access roles defined", value: PLATFORM_ROLES.length },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-line bg-surface-2/50 p-3">
                <p className="text-xs text-ink-muted">{item.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{item.value}</p>
              </div>
            ))}
          </StatGrid>
        </CardBody>
      </Card>

      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite platform staff"
        description="The invitation is recorded locally — no email is sent."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!invite.name.trim() || !invite.email.includes("@")) {
                  setError("Enter a name and a valid email address.");
                  return;
                }
                setError(null);
                setStaff((current) => [
                  ...current,
                  {
                    id: `pstf-${Date.now().toString(36)}`,
                    name: invite.name.trim(),
                    email: invite.email.trim(),
                    role: invite.role,
                    lastActiveAt: new Date().toISOString(),
                  },
                ]);
                setInvite({ name: "", email: "", role: "Support" });
                setInviteOpen(false);
                toast({ variant: "success", title: "Platform staff added" });
              }}
            >
              <ShieldCheck className="size-4" aria-hidden />
              Add staff member
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
          <FormGrid>
            <Field label="Full name" required htmlFor="platform-staff-name">
              <Input
                id="platform-staff-name"
                value={invite.name}
                onChange={(event) => setInvite({ ...invite, name: event.target.value })}
              />
            </Field>
            <Field label="Email address" required htmlFor="platform-staff-email">
              <Input
                id="platform-staff-email"
                type="email"
                value={invite.email}
                onChange={(event) => setInvite({ ...invite, email: event.target.value })}
              />
            </Field>
            <FormFull>
              <Field label="Role" htmlFor="platform-staff-role">
                <Select
                  id="platform-staff-role"
                  value={invite.role}
                  onChange={(event) => setInvite({ ...invite, role: event.target.value })}
                >
                  {PLATFORM_ROLES.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormFull>
          </FormGrid>
        </div>
      </Dialog>
    </Page>
  );
}
