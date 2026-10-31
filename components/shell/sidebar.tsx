"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store/ui-store";
import { MERCHANT_NAV, type NavGroup } from "@/lib/navigation";
import { StoreSwitcher } from "./store-switcher";
import { Tooltip } from "@/components/ui/tooltip";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  nav = MERCHANT_NAV,
  footer,
}: {
  nav?: NavGroup[];
  footer?: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

  const groupOpen = (group: NavGroup) => {
    if (openGroups[group.label] !== undefined) return openGroups[group.label];
    return true;
  };

  return (
    <aside
      className={cn(
        "sticky top-0 z-40 flex h-dvh shrink-0 flex-col border-r border-line bg-surface transition-width duration-200",
        collapsed ? "w-18" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center gap-2 border-b border-line px-4",
          collapsed && "justify-center px-2",
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white dark:bg-brand-500 dark:text-brand-950">
            T
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight text-ink">
                Trellis
              </span>
              <span className="block truncate text-2xs leading-tight text-ink-subtle">
                Commerce demo
              </span>
            </span>
          ) : null}
        </Link>
      </div>

      <div className="border-b border-line p-3">
        <StoreSwitcher collapsed={collapsed} />
      </div>

      <nav aria-label="Main" className="scrollbar-thin flex-1 overflow-y-auto px-2.5 py-3">
        {nav.map((group) => {
          const open = groupOpen(group);
          return (
            <div key={group.label} className="mb-4 last:mb-0">
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((current) => ({ ...current, [group.label]: !open }))
                  }
                  aria-expanded={open}
                  className="mb-1 flex w-full items-center justify-between rounded-md px-2 py-1 text-2xs font-semibold uppercase tracking-wide text-ink-subtle transition-colors hover:text-ink"
                >
                  {group.label}
                  <ChevronDown
                    className={cn("size-3.5 transition-transform", open && "rotate-180")}
                    aria-hidden
                  />
                </button>
              ) : (
                <div className="mx-auto mb-2 h-px w-6 bg-line" aria-hidden />
              )}
              {open ? (
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;
                    const link = (
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          active
                            ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-200"
                            : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                          collapsed && "justify-center px-0",
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      </Link>
                    );
                    return (
                      <li key={item.href}>
                        {collapsed ? (
                          <Tooltip content={item.label} className="w-full">
                            {link}
                          </Tooltip>
                        ) : (
                          link
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line p-2.5">
        {footer}
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-4" aria-hidden />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
