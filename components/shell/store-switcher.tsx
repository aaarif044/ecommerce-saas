"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Store } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { DropdownMenu, DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function StoreSwitcher({ collapsed }: { collapsed?: boolean }) {
  const stores = useDataStore((state) => state.demoStores);
  const activeStoreId = useDataStore((state) => state.activeStoreId);
  const setActiveStore = useDataStore((state) => state.setActiveStore);
  const toast = useUIStore((state) => state.toast);
  const [pending, setPending] = React.useState(false);

  const active = stores.find((store) => store.id === activeStoreId) ?? stores[0];

  const handleSelect = async (storeId: string) => {
    if (storeId === activeStoreId) return;
    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 220));
    setActiveStore(storeId);
    setPending(false);
    toast({
      variant: "success",
      title: "Store switched",
      description: `You are now viewing ${stores.find((s) => s.id === storeId)?.name}.`,
    });
  };

  if (collapsed) {
    return (
      <DropdownMenu
        triggerLabel="Switch store"
        align="start"
        menuClassName="w-60"
        triggerClassName="w-full justify-center"
        trigger={
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-200">
            <Store className="size-4" aria-hidden />
          </span>
        }
      >
        <DropdownLabel>Demo stores</DropdownLabel>
        {stores.map((store) => (
          <DropdownItem
            key={store.id}
            active={store.id === activeStoreId}
            onClick={() => void handleSelect(store.id)}
            icon={<Store className="size-3.5" />}
          >
            {store.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu
      triggerLabel="Switch store"
      align="start"
      menuClassName="w-64"
      triggerClassName="w-full justify-between"
      trigger={
        <span
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-left transition-colors hover:border-line-strong",
            pending && "opacity-60",
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-600 text-2xs font-bold text-white dark:bg-brand-500 dark:text-brand-950">
            {active.name.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold leading-tight text-ink">
              {active.name}
            </span>
            <span className="block truncate text-2xs leading-tight text-ink-subtle">
              {active.slug}.example
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-ink-subtle" aria-hidden />
        </span>
      }
    >
      <DropdownLabel>Demo stores</DropdownLabel>
      {stores.map((store) => (
        <DropdownItem
          key={store.id}
          active={store.id === activeStoreId}
          onClick={() => void handleSelect(store.id)}
          icon={store.id === activeStoreId ? <Check className="size-3.5" /> : <Store className="size-3.5" />}
        >
          {store.name}
        </DropdownItem>
      ))}
      <DropdownSeparator />
      <p className="px-2.5 pb-1.5 text-2xs leading-4 text-ink-subtle">
        Demo workspaces share the same catalogue fixtures. Settings, theme and cart are per store.
      </p>
    </DropdownMenu>
  );
}
