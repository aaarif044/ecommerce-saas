"use client";

import * as React from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/topbar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { Breadcrumbs } from "@/components/shell/breadcrumbs";
import { CommandPalette } from "@/components/shell/command-palette";

export function MerchantShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full">
      <div className="hidden lg:flex">
        <React.Suspense fallback={<SidebarFallback />}>
          <Sidebar />
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
