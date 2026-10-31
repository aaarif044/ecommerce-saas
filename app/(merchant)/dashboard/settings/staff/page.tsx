"use client";

import * as React from "react";
import { Check, Mail, Plus, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { settingsService } from "@/lib/services/settings";
import { isMockApiError } from "@/lib/services/errors";
import { useDateFormatter } from "@/lib/hooks";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { Page } from "@/components/shell/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/data/settings";
import type { StaffMember } from "@/lib/types";

const ROLE_LABELS: Record<StaffMember["role"], string> = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Manager",
  support: "Support agent",
  fulfillment: "Fulfilment",
  analyst: "Analyst",
};

export default function StaffSettingsPage() {
  const settings = useDataStore((state) => state.settingsByStore[state.activeStoreId]);
  const toast = useUIStore((state) => state.toast);
  const date = useDateFormatter();

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [invite, setInvite] = React.useState({ name: "", email: "", role: "support" as StaffMember["role"] });
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [pendingRemove, setPendingRemove] = React.useState<StaffMember | null>(null);
  const [roleOpen, setRoleOpen] = React.useState(false);
  const [newRole, setNewRole] = React.useState({ name: "", description: "" });

  const staff = settings.staff;
  const customRoles = settings.customRoles;

  const inviteMember = async () => {
    if (!invite.name.trim() || !invite.email.includes("@")) {
      setInviteError("Enter a name and a valid email address.");
      return;
    }
    setSaving(true);
    try {
      await settingsService.inviteStaff({
        name: invite.name.trim(),
        email: invite.email.trim(),
        role: invite.role,
      });
      toast({
        variant: "success",
        title: "Invitation recorded",
        description: `${invite.email.trim()} was invited. No email is sent in the demo.`,
      });
      setInvite({ name: "", email: "", role: "support" });
      setInviteOpen(false);
    } catch (error) {
      setInviteError(isMockApiError(error) ? error.message : "Could not invite the staff member.");
    } finally {
      setSaving(false);
    }
  };

  const permissionCount = (role: StaffMember["role"]) =>
    (ROLE_PERMISSIONS[role] ?? []).length +
    customRoles.filter((entry) => entry.id === role).length;

  return (
    <SettingsLayout
      title="Staff & permissions"
      description="Invite teammates, assign roles and review what each role can do."
    >
      <Page gap="sm">
        <Card>
          <CardHeader
            title="Team"
            description={`${staff.length} people have access to this store.`}
            actions={
              <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="size-3.5" aria-hidden />
                Invite staff
              </Button>
            }
          />
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </TableRow>
              </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id} interactive>
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
                          onChange={async (event) => {
                            await settingsService.updateStaff(member.id, {
                              role: event.target.value as StaffMember["role"],
                            });
                            toast({ variant: "info", title: "Role updated" });
                          }}
                          className="h-8 w-40"
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          tone={
                            member.status === "active"
                              ? "success"
                              : member.status === "invited"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.lastActiveAt ? date(member.lastActiveAt) : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              await settingsService.updateStaff(member.id, {
                                status: member.status === "suspended" ? "active" : "suspended",
                              });
                              toast({ variant: "info", title: "Access updated" });
                            }}
                          >
                            {member.status === "suspended" ? "Restore" : "Suspend"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="iconSm"
                            aria-label={`Remove ${member.name}`}
                            onClick={() => setPendingRemove(member)}
                            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Permission matrix"
            description="What each built-in role can do. Custom roles are listed below."
          />
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission</TableHead>
                  {Object.keys(ROLE_LABELS).map((role) => (
                    <TableHead key={role} align="center">
                      {ROLE_LABELS[role as StaffMember["role"]]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_PERMISSIONS.map((group) => (
                  <React.Fragment key={group.group}>
                    <TableRow>
                      <TableCell
                        colSpan={Object.keys(ROLE_LABELS).length + 1}
                        className="bg-surface-2/70 text-2xs font-semibold uppercase tracking-wide text-ink-subtle"
                      >
                        {group.group}
                      </TableCell>
                    </TableRow>
                    {group.items.map((permission) => (
                      <TableRow key={permission}>
                        <TableCell>{permission}</TableCell>
                        {Object.keys(ROLE_LABELS).map((role) => {
                          const allowed = (ROLE_PERMISSIONS[role] ?? []).includes(permission);
                          return (
                            <TableCell key={role} align="center">
                              {allowed ? (
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
                          );
                        })}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Custom roles"
            description="Extra roles with their own permission sets."
            actions={
              <Button variant="secondary" size="sm" onClick={() => setRoleOpen(true)}>
                <Plus className="size-3.5" aria-hidden />
                New role
              </Button>
            }
          />
          <CardBody className="flex flex-col gap-3">
            {customRoles.length ? (
              customRoles.map((role) => (
                <div key={role.id} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ShieldCheck className="size-4 text-ink-subtle" aria-hidden />
                    <p className="text-sm font-medium text-ink">{role.name}</p>
                    <Badge tone="neutral">{role.permissions.length} permissions</Badge>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Remove ${role.name}`}
                      onClick={async () => {
                        await settingsService.removeCustomRole(role.id);
                        toast({ variant: "info", title: "Role removed" });
                      }}
                      className="ml-auto text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{role.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {role.permissions.map((permission) => (
                      <Badge key={permission} tone="outline" size="sm">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-muted">No custom roles yet.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Access summary" description="A quick read on current access." />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total members", value: staff.length },
                {
                  label: "Active now",
                  value: staff.filter((member) => member.status === "active").length,
                },
                { label: "Pending invitations", value: staff.filter((member) => member.status === "invited").length },
                { label: "Custom roles", value: customRoles.length },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-line bg-surface-2/50 p-3">
                  <p className="text-xs text-ink-muted">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-subtle">
              Owners and administrators hold {permissionCount("owner")} permissions each. The
              Manager role holds {permissionCount("manager")}.
            </p>
          </CardBody>
        </Card>
      </Page>

      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a staff member"
        description="The invitation is recorded locally — no email is sent."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void inviteMember()} loading={saving}>
              <Mail className="size-4" aria-hidden />
              Send invitation
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {inviteError ? (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {inviteError}
            </p>
          ) : null}
          <Field label="Full name" required htmlFor="invite-name">
            <Input
              id="invite-name"
              value={invite.name}
              onChange={(event) => setInvite({ ...invite, name: event.target.value })}
            />
          </Field>
          <Field label="Email address" required htmlFor="invite-email">
            <Input
              id="invite-email"
              type="email"
              value={invite.email}
              onChange={(event) => setInvite({ ...invite, email: event.target.value })}
            />
          </Field>
          <Field label="Role" htmlFor="invite-role">
            <Select
              id="invite-role"
              value={invite.role}
              onChange={(event) =>
                setInvite({ ...invite, role: event.target.value as StaffMember["role"] })
              }
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        title="Create a custom role"
        description="Custom roles start with a copy of the manager permission set."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRoleOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!newRole.name.trim()) return;
                await settingsService.addCustomRole({
                  name: newRole.name.trim(),
                  description: newRole.description || "Custom role",
                  permissions: ROLE_PERMISSIONS.manager,
                });
                setNewRole({ name: "", description: "" });
                setRoleOpen(false);
                toast({ variant: "success", title: "Custom role created" });
              }}
            >
              Create role
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Role name" required htmlFor="role-name">
            <Input
              id="role-name"
              value={newRole.name}
              onChange={(event) => setNewRole({ ...newRole, name: event.target.value })}
            />
          </Field>
          <Field label="Description" htmlFor="role-description">
            <Input
              id="role-description"
              value={newRole.description}
              onChange={(event) => setNewRole({ ...newRole, description: event.target.value })}
            />
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        onClose={() => setPendingRemove(null)}
        destructive
        title={`Remove ${pendingRemove?.name}?`}
        description="The staff member loses access to this store immediately."
        confirmLabel="Remove access"
        onConfirm={async () => {
          if (!pendingRemove) return;
          try {
            await settingsService.removeStaff(pendingRemove.id);
            toast({ variant: "success", title: "Staff member removed" });
            setPendingRemove(null);
          } catch (error) {
            toast({
              variant: "error",
              title: "Could not remove",
              description: isMockApiError(error) ? error.message : undefined,
            });
          }
        }}
      />
    </SettingsLayout>
  );
}
