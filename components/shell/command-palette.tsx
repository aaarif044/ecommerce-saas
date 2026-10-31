"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Search } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { MERCHANT_NAV, ADMIN_NAV } from "@/lib/navigation";
import { cn, rolledUpCategoryCounts } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

interface Command {
  id: string;
  label: string;
  group: string;
  hint?: string;
  href: string;
  icon: React.ReactNode;
}

export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((state) => state.commandPaletteOpen);
  const setOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const products = useDataStore((state) => state.products);
  const orders = useDataStore((state) => state.orders);
  const customers = useDataStore((state) => state.customers);
  const collections = useDataStore((state) => state.collections);
  const categories = useDataStore((state) => state.categories);

  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        // `setOpen` is a store action that takes the new value directly — it
        // is not a React state setter, so an updater function would be stored
        // as the state instead of being applied.
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  const [wasOpen, setWasOpen] = React.useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }

  React.useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Escape closes the palette wherever the focus happens to be — the input is
  // not always focused yet when the palette opens.
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  const commands = React.useMemo<Command[]>(() => {
    const navCommands: Command[] = [
      ...MERCHANT_NAV.flatMap((group) =>
        group.items.map((item) => ({
          id: `nav-${item.href}`,
          label: item.label,
          group: "Go to",
          hint: group.label,
          href: item.href,
          icon: <item.icon className="size-4" aria-hidden />,
        })),
      ),
      ...ADMIN_NAV.flatMap((group) =>
        group.items.map((item) => ({
          id: `admin-${item.href}`,
          label: item.label,
          group: "Platform",
          hint: group.label,
          href: item.href,
          icon: <item.icon className="size-4" aria-hidden />,
        })),
      ),
    ];

    const quickActions: Command[] = [
      {
        id: "action-new-product",
        label: "Create a new product",
        group: "Actions",
        href: "/dashboard/products/new",
        icon: <ArrowRight className="size-4" aria-hidden />,
      },
      {
        id: "action-view-store",
        label: "Open storefront preview",
        group: "Actions",
        href: "/dashboard/storefront",
        icon: <ArrowRight className="size-4" aria-hidden />,
      },
      {
        id: "action-new-discount",
        label: "Create a discount code",
        group: "Actions",
        href: "/dashboard/discounts",
        icon: <ArrowRight className="size-4" aria-hidden />,
      },
    ];

    const term = query.trim().toLowerCase();

    const categoryCounts = rolledUpCategoryCounts(categories, products);

    const productCommands: Command[] = products.map((product) => ({
      id: `product-${product.id}`,
      label: product.title,
      group: "Products",
      hint: product.sku,
      href: `/dashboard/products/${product.id}`,
      icon: <ArrowRight className="size-4" aria-hidden />,
    }));

    const orderCommands: Command[] = orders.map((order) => ({
      id: `order-${order.id}`,
      label: `${order.orderNumber} · ${order.customerName}`,
      group: "Orders",
      hint: formatMoney(order.total, { currency: order.currency }),
      href: `/dashboard/orders/${order.id}`,
      icon: <ArrowRight className="size-4" aria-hidden />,
    }));

    const customerCommands: Command[] = customers.map((customer) => ({
      id: `customer-${customer.id}`,
      label: customer.name,
      group: "Customers",
      hint: customer.email,
      href: `/dashboard/customers/${customer.id}`,
      icon: <ArrowRight className="size-4" aria-hidden />,
    }));

    const collectionCommands: Command[] = collections.map((collection) => ({
      id: `collection-${collection.id}`,
      label: collection.title,
      group: "Collections",
      hint: `${collection.productIds.length} products`,
      href: "/dashboard/collections",
      icon: <ArrowRight className="size-4" aria-hidden />,
    }));

    const categoryCommands: Command[] = categories.map((category) => ({
      id: `category-${category.id}`,
      label: category.name,
      group: "Categories",
      hint: `${categoryCounts.get(category.id) ?? 0} products`,
      href: "/dashboard/categories",
      icon: <ArrowRight className="size-4" aria-hidden />,
    }));

    const all = [
      ...quickActions,
      ...navCommands,
      ...productCommands,
      ...orderCommands,
      ...customerCommands,
      ...collectionCommands,
      ...categoryCommands,
    ];

    if (!term) {
      return [...quickActions, ...navCommands.slice(0, 8)];
    }
    return all
      .filter(
        (command) =>
          command.label.toLowerCase().includes(term) ||
          command.group.toLowerCase().includes(term) ||
          command.hint?.toLowerCase().includes(term),
      )
      .slice(0, 30);
  }, [query, products, orders, customers, collections, categories]);

  const [lastQuery, setLastQuery] = React.useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setActiveIndex(0);
  }

  if (!open) return null;

  const grouped = commands.reduce<Record<string, Command[]>>((acc, command) => {
    (acc[command.group] ||= []).push(command);
    return acc;
  }, {});

  let flatIndex = -1;

  const handleSelect = (command: Command) => {
    setOpen(false);
    router.push(command.href);
  };

  return (
    <div className="fixed inset-0 z-80 flex items-start justify-center px-4 pt-[10vh]">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-overlay animate-fade-in"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative z-10 flex max-h-menu w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop animate-scale-in"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-ink-subtle" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, orders, customers or jump to a page…"
            aria-label="Command palette search"
            className="h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                // With no results there is nothing to move to, so the index
                // must not drop below zero.
                setActiveIndex((index) =>
                  commands.length ? Math.min(index + 1, commands.length - 1) : 0,
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                const command = commands[activeIndex];
                if (command) handleSelect(command);
              } else if (event.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          <kbd className="hidden rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-2xs text-ink-subtle sm:block">
            Esc
          </kbd>
        </div>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
          {commands.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-ink-muted">
              No results for “{query}”.
            </p>
          ) : (
            Object.entries(grouped).map(([group, groupCommands]) => (
              <div key={group} className="mb-2 last:mb-0">
                <p className="px-2.5 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                  {group}
                </p>
                <ul>
                  {groupCommands.map((command) => {
                    flatIndex += 1;
                    const index = flatIndex;
                    const active = index === activeIndex;
                    return (
                      <li key={command.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => handleSelect(command)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                            active ? "bg-surface-2 text-ink" : "text-ink-muted hover:bg-surface-2",
                          )}
                        >
                          <span className="shrink-0 text-ink-subtle">{command.icon}</span>
                          <span className="min-w-0 flex-1 truncate text-sm">{command.label}</span>
                          {command.hint ? (
                            <span className="shrink-0 text-2xs text-ink-subtle">{command.hint}</span>
                          ) : null}
                          {active ? (
                            <CornerDownLeft className="size-3.5 shrink-0 text-ink-subtle" aria-hidden />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
