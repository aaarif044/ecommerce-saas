"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { navigationService } from "@/lib/services/storefront";
import { isMockApiError } from "@/lib/services/errors";
import { uniqueId } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import type { NavMenu, NavMenuItem } from "@/lib/types";

export function MenuEditor({ menuId }: { menuId: string }) {
  const menus = useDataStore((state) => state.navMenus);
  const toast = useUIStore((state) => state.toast);
  const menu = menus.find((item) => item.id === menuId) ?? menus[0];

  // The editor keeps its own draft and writes it back once the typing stops.
  // Writing on every keystroke meant every change was built from the
  // previous (still in flight) snapshot, so fast typing lost characters.
  const [draft, setDraft] = React.useState<{ menuId: string; items: NavMenuItem[] } | null>(
    null,
  );
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const items =
    draft && menu && draft.menuId === menu.id ? draft.items : (menu?.items ?? []);

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const commit = (next: NavMenuItem[]) => {
    if (!menu) return;
    setDraft({ menuId: menu.id, items: next });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      navigationService
        .update(menu.id, { items: next })
        .then(() => toast({ variant: "success", title: "Menu updated" }))
        .catch((error) =>
          toast({
            variant: "error",
            title: "Could not update the menu",
            description: isMockApiError(error) ? error.message : undefined,
          }),
        );
    }, 400);
  };

  const updateMenu = async (patch: Partial<NavMenu>) => {
    if (!menu) return;
    try {
      await navigationService.update(menu.id, patch);
      toast({ variant: "success", title: "Menu updated" });
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not update the menu",
        description: isMockApiError(error) ? error.message : undefined,
      });
    }
  };

  const updateItem = (itemId: string, patch: Partial<NavMenuItem>) => {
    commit(
      items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    const item: NavMenuItem = {
      id: uniqueId("mi"),
      label: "New link",
      href: "/store/products",
      visible: true,
      children: [],
    };
    commit([...items, item]);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  const removeItem = (itemId: string) => {
    commit(items.filter((item) => item.id !== itemId));
  };

  const addChild = (parentId: string) => {
    commit(
      items.map((item) =>
        item.id === parentId
          ? {
              ...item,
              children: [
                ...item.children,
                {
                  id: uniqueId("mi"),
                  label: "New sub-link",
                  href: "/store/products",
                  visible: true,
                  children: [],
                },
              ],
            }
          : item,
      ),
    );
  };

  if (!menu) return null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title={menu.name}
          description={`Location: ${menu.location.replace(/_/g, " ")}`}
          actions={
            <Button variant="secondary" size="sm" onClick={() => addItem()}>
              <Plus className="size-3.5" aria-hidden />
              Add menu item
            </Button>
          }
        />
        <CardBody>
          <ul className="flex flex-col gap-2">
            {items.map((item, index) => (
              <li key={item.id} className="rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={item.label}
                    aria-label={`Label for ${item.label}`}
                    onChange={(event) => updateItem(item.id, { label: event.target.value })}
                    className="max-w-56 font-medium"
                  />
                  <Input
                    value={item.href}
                    aria-label={`URL for ${item.label}`}
                    onChange={(event) => updateItem(item.id, { href: event.target.value })}
                    className="max-w-64 font-mono text-xs"
                  />
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Move ${item.label} up`}
                      disabled={index === 0}
                      onClick={() => moveItem(index, -1)}
                    >
                      <ChevronUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Move ${item.label} down`}
                      disabled={index === items.length - 1}
                      onClick={() => moveItem(index, 1)}
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`${item.visible ? "Hide" : "Show"} ${item.label}`}
                      onClick={() => updateItem(item.id, { visible: !item.visible })}
                    >
                      {item.visible ? (
                        <Eye className="size-3.5" />
                      ) : (
                        <EyeOff className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Add sub-item under ${item.label}`}
                      onClick={() => addChild(item.id)}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Remove ${item.label}`}
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {item.children.length ? (
                  <ul className="mt-3 space-y-2 border-l border-line pl-4">
                    {item.children.map((child, childIndex) => (
                      <li key={child.id} className="flex flex-wrap items-center gap-2">
                        <Input
                          value={child.label}
                          aria-label={`Label for ${child.label}`}
                          onChange={(event) =>
                            updateItem(item.id, {
                              children: item.children.map((entry) =>
                                entry.id === child.id
                                  ? { ...entry, label: event.target.value }
                                  : entry,
                              ),
                            })
                          }
                          className="max-w-56"
                        />
                        <Input
                          value={child.href}
                          aria-label={`URL for ${child.label}`}
                          onChange={(event) =>
                            updateItem(item.id, {
                              children: item.children.map((entry) =>
                                entry.id === child.id
                                  ? { ...entry, href: event.target.value }
                                  : entry,
                              ),
                            })
                          }
                          className="max-w-64 font-mono text-xs"
                        />
                        <div className="ml-auto flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="iconSm"
                            aria-label={`Move ${child.label} up`}
                            disabled={childIndex === 0}
                            onClick={() => {
                              const children = [...item.children];
                              [children[childIndex], children[childIndex - 1]] = [
                                children[childIndex - 1],
                                children[childIndex],
                              ];
                              updateItem(item.id, { children });
                            }}
                          >
                            <ChevronUp className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="iconSm"
                            aria-label={`Move ${child.label} down`}
                            disabled={childIndex === item.children.length - 1}
                            onClick={() => {
                              const children = [...item.children];
                              [children[childIndex], children[childIndex + 1]] = [
                                children[childIndex + 1],
                                children[childIndex],
                              ];
                              updateItem(item.id, { children });
                            }}
                          >
                            <ChevronDown className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="iconSm"
                            aria-label={`Remove ${child.label}`}
                            onClick={() =>
                              updateItem(item.id, {
                                children: item.children.filter((entry) => entry.id !== child.id),
                              })
                            }
                            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>

          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              This menu is empty. Add the first item.
            </p>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Menu settings" />
        <CardBody className="flex flex-col gap-4">
          <Field label="Menu name" htmlFor={`menu-name-${menu.id}`}>
            <Input
              id={`menu-name-${menu.id}`}
              value={menu.name}
              onChange={(event) => void updateMenu({ name: event.target.value })}
            />
          </Field>
          <Switch
            checked={menu.location === "header"}
            onCheckedChange={(checked) => void updateMenu({ location: checked ? "header" : "footer" })}
            label="Show in the header"
            description="Header menus appear in the main navigation bar."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{items.filter((item) => item.visible).length} visible items</Badge>
            <Badge tone="neutral">{items.length} total items</Badge>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export function MenuPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const menus = useDataStore((state) => state.navMenus);
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)} aria-label="Select menu">
      {menus.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </Select>
  );
}
