"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ExternalLink, LifeBuoy, LogOut, RotateCcw, Settings, ShieldCheck, Store, UserRound } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { Avatar } from "@/components/ui/avatar";
import {  } from "@/components/ui/button";
import { DropdownMenu, DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/dialog";

export function UserMenu() {
  const router = useRouter();
  const toast = useUIStore((state) => state.toast);
  const resetDemoData = useDataStore((state) => state.resetDemoData);
  const [confirmReset, setConfirmReset] = React.useState(false);

  return (
    <>
      <DropdownMenu
        triggerLabel="Account menu"
        menuClassName="w-60"
        trigger={
          <span className="inline-flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-surface-2">
            <Avatar name="Naveen Raghavan" size="sm" />
            <span className="hidden min-w-0 text-left lg:block">
              <span className="block truncate text-sm font-medium leading-tight text-ink">
                Naveen Raghavan
              </span>
              <span className="block truncate text-2xs leading-tight text-ink-subtle">Owner</span>
            </span>
          </span>
        }
      >
        <DropdownLabel>Signed in as</DropdownLabel>
        <div className="px-2.5 pb-2">
          <p className="text-sm font-medium text-ink">Naveen Raghavan</p>
          <p className="text-2xs text-ink-subtle">naveen.raghavan@example.com</p>
        </div>
        <DropdownSeparator />
        <DropdownItem icon={<UserRound className="size-3.5" />} onClick={() => router.push("/dashboard/settings/staff")}>
          Staff &amp; permissions
        </DropdownItem>
        <DropdownItem icon={<Settings className="size-3.5" />} onClick={() => router.push("/dashboard/settings/general")}>
          Store settings
        </DropdownItem>
        <DropdownItem icon={<ShieldCheck className="size-3.5" />} onClick={() => router.push("/admin")}>
          Platform administration
        </DropdownItem>
        <DropdownItem icon={<Store className="size-3.5" />} onClick={() => router.push("/store")}>
          View storefront
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem icon={<RotateCcw className="size-3.5" />} onClick={() => setConfirmReset(true)}>
          Reset demo data
        </DropdownItem>
        <DropdownItem icon={<LogOut className="size-3.5" />} onClick={() => router.push("/")}>
          Sign out (demo)
        </DropdownItem>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        destructive
        title="Reset demo data?"
        description="Every local edit — products, orders, settings, cart and themes — is restored to the original fixtures. This cannot be undone."
        confirmLabel="Reset everything"
        onConfirm={() => {
          resetDemoData();
          setConfirmReset(false);
          toast({
            variant: "success",
            title: "Demo data reset",
            description: "All local changes were discarded.",
          });
          router.refresh();
        }}
      />
    </>
  );
}

export function HelpMenu() {
  return (
    <DropdownMenu
      triggerLabel="Help"
      menuClassName="w-64"
      trigger={
        <span className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
          <LifeBuoy className="size-4" aria-hidden />
        </span>
      }
    >
      <DropdownLabel>Help &amp; resources</DropdownLabel>
      <DropdownItem icon={<LifeBuoy className="size-3.5" />} onClick={() => undefined}>
        <span className="flex w-full items-center justify-between gap-2">
          Knowledge base
          <ExternalLink className="size-3 text-ink-subtle" aria-hidden />
        </span>
      </DropdownItem>
      <DropdownItem icon={<LifeBuoy className="size-3.5" />} onClick={() => undefined}>
        <span className="flex w-full items-center justify-between gap-2">
          Contact support
          <ExternalLink className="size-3 text-ink-subtle" aria-hidden />
        </span>
      </DropdownItem>
      <DropdownSeparator />
      <div className="px-2.5 py-1.5 text-2xs leading-4 text-ink-subtle">
        <p className="font-medium text-ink-muted">Demo build</p>
        <p className="mt-0.5">
          Trellis Commerce demo. No live integrations, payments or email are connected — every
          action is simulated locally.
        </p>
      </div>
      <DropdownSeparator />
      <Link
        href="/dashboard"
        className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        Back to dashboard
        <ChevronRight className="size-3.5" aria-hidden />
      </Link>
    </DropdownMenu>
  );
}
