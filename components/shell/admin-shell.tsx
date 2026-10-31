"use client";

import * as React from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/topbar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { Breadcrumbs } from "@/components/shell/breadcrumbs";
import { CommandPalette } from "@/components/shell/command-palette";
import { ADMIN_NAV } from "@/lib/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

function AdminFooter() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      Back to merchant app
      <ArrowUpRight className="size-3.5" aria-hidden />
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full">
      <div className="hidden lg:flex">
        <React.Suspense fallback={<SidebarFallback />}>
          <Sidebar nav={ADMIN_NAV} footer={<AdminFooter />} />
        </React.Suspense>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar>
          <React.Suspense fallback={null}>
            <Breadcrumbs />
          </React.Suspense>
        </TopBar>
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <div className="mx-auto w-full max-w-page">{children}</div>
        </main>
      </div>
      <React.Suspense fallback={null}>
        <MobileNav />
      </React.Suspense>
      <CommandPalette />
    </div>
  );
}

function SidebarFallback() {
  return <div className="h-dvh w-64 shrink-0 border-r border-line bg-surface" aria-hidden />;
}
