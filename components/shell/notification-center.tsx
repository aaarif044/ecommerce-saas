"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck, CircleAlert, CircleCheck, Info, Package, RefreshCcw, Settings, ShoppingBag, TriangleAlert, UserRound } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useDateTimeFormatter } from "@/lib/hooks";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NotificationRecord } from "@/lib/types";

const ICONS: Record<NotificationRecord["type"], typeof Bell> = {
  order: ShoppingBag,
  fulfillment: Package,
  return: RefreshCcw,
  refund: CircleCheck,
  inventory: CircleAlert,
  customer: UserRound,
  store: Settings,
  subscription: Info,
  system: Info,
};

const SEVERITY: Record<NotificationRecord["severity"], string> = {
  info: "text-sky-600 dark:text-sky-400",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
};

export function NotificationCenter() {
  const notifications = useDataStore((state) => state.notifications);
  const patch = useDataStore((state) => state.patch);
  const dateTime = useDateTimeFormatter();

  const unread = notifications.filter((notification) => !notification.read).length;

  const markAllRead = () => {
    patch({
      notifications: notifications.map((notification) => ({ ...notification, read: true })),
    });
  };

  return (
    <DropdownMenu
      triggerLabel={`Notifications, ${unread} unread`}
      menuClassName="w-88 p-0"
      trigger={
        <span className="relative inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
          <Bell className="size-4" aria-hidden />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-3xs font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </span>
      }
    >
      <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
        <p className="text-sm font-semibold text-ink">Notifications</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={markAllRead}
          disabled={!unread}
          className="h-7 px-2 text-xs"
        >
          <CheckCheck className="size-3.5" aria-hidden />
          Mark all read
        </Button>
      </div>
      <div className="scrollbar-thin max-h-88 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-ink-muted">
            You are all caught up.
          </p>
        ) : (
          notifications.map((notification) => {
            const Icon = ICONS[notification.type];
            return (
              <Link
                key={notification.id}
                href={notification.href}
                onClick={() => {
                  patch({
                    notifications: notifications.map((item) =>
                      item.id === notification.id ? { ...item, read: true } : item,
                    ),
                  });
                }}
                className="flex gap-2.5 border-b border-line px-3 py-2.5 transition-colors last:border-0 hover:bg-surface-2"
              >
                <Icon
                  className={cn("mt-0.5 size-4 shrink-0", SEVERITY[notification.severity])}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-5 text-ink">
                      {notification.title}
                    </span>
                    {!notification.read ? (
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-ink-muted">
                    {notification.body}
                  </span>
                  <span className="mt-1 block text-2xs text-ink-subtle">
                    {dateTime(notification.createdAt)}
                  </span>
                </span>
              </Link>
            );
          })
        )}
      </div>
      <div className="border-t border-line px-3 py-2">
        <Link
          href="/dashboard/settings/notifications"
          className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
        >
          <TriangleAlert className="size-3.5" aria-hidden />
          Notification preferences
        </Link>
      </div>
    </DropdownMenu>
  );
}
