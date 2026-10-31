"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { MERCHANT_NAV, ADMIN_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function buildTrail(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const trail: { label: string; href: string }[] = [];
  let href = "";

  for (const segment of segments) {
    href += `/${segment}`;
    const all = [...MERCHANT_NAV, ...ADMIN_NAV];
    const match = all
      .flatMap((group) => group.items)
      .find((item) => item.href === href);
    const last = segment === segments[segments.length - 1];
    trail.push({
      label: match?.label ?? segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href,
    });
    if (last) break;
  }
  return trail;
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const trail = React.useMemo(() => buildTrail(pathname), [pathname]);

  if (trail.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex items-center gap-1 overflow-x-auto scrollbar-thin text-xs text-ink-muted">
        <li className="flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Home className="size-3.5" aria-hidden />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {trail.map((item, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1">
              <ChevronRight className="size-3.5 shrink-0 text-ink-subtle" aria-hidden />
              {last ? (
                <span aria-current="page" className="whitespace-nowrap font-medium text-ink">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="whitespace-nowrap rounded px-1 py-0.5 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
