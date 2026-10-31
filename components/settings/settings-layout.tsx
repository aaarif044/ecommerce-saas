'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PageHeader } from '@/components/shell/page-header';
import { cn } from '@/lib/utils';

const SETTINGS_NAV = [
  { label: 'General', href: '/dashboard/settings/general' },
  { label: 'Regional Preferences', href: '/dashboard/settings/regional' },
  { label: 'Notifications', href: '/dashboard/settings/notifications' },
  { label: 'Email', href: '/dashboard/settings/email' },
  { label: 'Storefront Preferences', href: '/dashboard/settings/storefront' },
  { label: 'WhatsApp', href: '/dashboard/settings/whatsapp' },
  { label: 'Checkout', href: '/dashboard/settings/checkout' },
  { label: 'Payments', href: '/dashboard/settings/payments' },
  { label: 'Shipping', href: '/dashboard/settings/shipping' },
  { label: 'Taxes', href: '/dashboard/settings/taxes' },
  { label: 'Staff & Permissions', href: '/dashboard/settings/staff' },
  { label: 'Subscription & Billing', href: '/dashboard/settings/subscription' },
];

export function SettingsLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';

  return (
    <div className='flex flex-col gap-5'>
      <PageHeader title={title} description={description} actions={actions} />

      <div className='flex flex-col gap-5 lg:flex-row'>
        {/* <nav aria-label="Settings sections" className="lg:w-56 lg:shrink-0">
          <ul className="flex gap-1 overflow-x-auto scrollbar-thin pb-1 lg:flex-col lg:overflow-visible">
            {SETTINGS_NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-200"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav> */}

        <div className='min-w-0 flex-1'>{children}</div>
      </div>
    </div>
  );
}
