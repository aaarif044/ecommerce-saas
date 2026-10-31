"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, GripVertical, Monitor, Paintbrush, Plus, RotateCcw, Save, Smartphone, Trash2, Type } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { themeService } from "@/lib/services/storefront";
import { isMockApiError } from "@/lib/services/errors";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import { ColorField } from "@/components/ui/color-field";
import { Tabs } from "@/components/ui/tabs";
import { SegmentedControl } from "@/components/ui/field";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { ThemeSections } from "@/components/storefront/sections";
import { MenuEditor } from "@/components/settings/menu-editor";
import { ThemeMiniature } from "@/components/themes/theme-miniature";
import { SectionEditor } from "@/components/themes/section-editor";
import { cn, uniqueId } from "@/lib/utils";
import { useSyncedState } from "@/lib/hooks";
import type { Theme, ThemeSection, ThemeSettings } from "@/lib/types";

type EditorTab = "gallery" | "design" | "header" | "footer" | "navigation" | "sections" | "preview";

const SECTION_TYPES: {
  type: ThemeSection["type"];
  label: string;
  description: string;
}[] = [
  { type: "hero", label: "Hero banner", description: "Headline, supporting copy and two calls to action." },
  { type: "banner", label: "Promo banner", description: "A single highlighted promotion strip." },
  { type: "featured_products", label: "Featured products", description: "A product grid driven by a collection." },
  { type: "featured_collections", label: "Featured collections", description: "Cards linking to curated collections." },
  { type: "product_grid", label: "Product grid", description: "A simple grid of products." },
  { type: "image_text", label: "Image + text", description: "An editorial block with an image and copy." },
  { type: "testimonials", label: "Testimonials", description: "Customer quotes with names and roles." },
  { type: "faq", label: "FAQ", description: "An expandable question and answer list." },
  { type: "newsletter", label: "Newsletter", description: "An email capture block." },
  { type: "rich_text", label: "Rich text", description: "Free-form paragraphs." },
  { type: "spacer", label: "Spacer", description: "Vertical breathing room." },
];

export function ThemeEditor() {
  const themes = useDataStore((state) => state.themes);
  const collections = useDataStore((state) => state.collections);
  const navMenus = useDataStore((state) => state.navMenus);
  const toast = useUIStore((state) => state.toast);

  const [tab, setTab] = React.useState<EditorTab>("gallery");
  const [activeThemeId, setActiveThemeId] = React.useState(
    themes.find((theme) => theme.isActive)?.id ?? themes[0]?.id,
  );
  const [saving, setSaving] = React.useState(false);
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [editingSection, setEditingSection] = React.useState<ThemeSection | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [restoreOpen, setRestoreOpen] = React.useState(false);

  const activeTheme = themes.find((theme) => theme.id === activeThemeId) ?? themes[0];
  const headerMenuId =
    navMenus.find((menu) => menu.location === "header")?.id ?? navMenus[0]?.id ?? "";

  // The draft mirrors the selected theme until the merchant edits it.
  const source = activeTheme?.settings ?? null;
  const [draft, setDraft] = useSyncedState<ThemeSettings | null>(source);
  const dirty = Boolean(draft && source && draft !== source);

  const selectTheme = (theme: Theme) => {
    setActiveThemeId(theme.id);
    setTab("design");
  };

  const update = (patch: Partial<ThemeSettings>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const updateSection = (id: string, patch: Partial<ThemeSection>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            sections: current.sections.map((section) =>
              section.id === id ? { ...section, ...patch } : section,
            ),
          }
        : current,
    );
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setDraft((current) => {
      if (!current) return current;
      const next = [...current.sections];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, sections: next };
    });
  };

  const addSection = (type: ThemeSection["type"]) => {
    const meta = SECTION_TYPES.find((item) => item.type === type);
    const defaults: Record<string, Record<string, unknown>> = {
      hero: {
        headline: "A headline that sells",
        subhead: "One line that explains the value.",
        primaryLabel: "Shop now",
        primaryHref: "/store/products",
        secondaryLabel: "Learn more",
        secondaryHref: "/store/pages/about",
        tone: 0,
        align: "left",
      },
      banner: {
        heading: "Seasonal promotion",
        body: "A short line about the offer.",
        ctaLabel: "Shop the edit",
        ctaHref: "/store/products",
        tone: 5,
      },
      featured_products: {
        heading: "Featured products",
        subheading: "Hand-picked by the team",
        collectionId: collections[0]?.id ?? "",
        limit: 8,
        columns: 4,
      },
      featured_collections: {
        heading: "Shop by collection",
        collectionIds: collections.slice(0, 4).map((collection) => collection.id),
      },
      product_grid: { heading: "New arrivals", categoryId: "", limit: 8, columns: 4 },
      image_text: {
        heading: "Our story",
        body: "Say something memorable about the brand.",
        primaryLabel: "Read more",
        primaryHref: "/store/pages/about",
        tone: 3,
        imagePosition: "right",
      },
      testimonials: {
        heading: "What customers say",
        testimonials: [
          { quote: "Absolutely loved the quality.", author: "Priya S.", role: "Bengaluru" },
          { quote: "Arrived a day early and beautifully packed.", author: "Rohan M.", role: "Pune" },
        ],
      },
      faq: {
        heading: "Questions, answered",
        items: [{ q: "How long does delivery take?", a: "2-4 working days in metros." }],
      },
      newsletter: {
        heading: "Get early access",
        body: "One email a week, nothing else.",
        buttonLabel: "Subscribe",
      },
      rich_text: { heading: "A note from us", body: "Write your story here." },
      spacer: { height: 40 },
    };

    const section: ThemeSection = {
      id: uniqueId("sec"),
      type,
      name: meta?.label ?? type,
      visible: true,
      props: defaults[type] ?? {},
    };
    setDraft((current) =>
      current ? { ...current, sections: [...current.sections, section] } : current,
    );
    setAddOpen(false);
    setEditingSection(section);
  };

  const save = async (publish = false) => {
    if (!draft || !activeTheme) return;
    setSaving(true);
    try {
      if (publish) {
        await themeService.update(activeTheme.id, draft);
        await themeService.publish(activeTheme.id);
        toast({
          variant: "success",
          title: "Theme published",
          description: `${activeTheme.name} is now live on the storefront.`,
        });
      } else {
        await themeService.update(activeTheme.id, draft);
        toast({
          variant: "info",
          title: "Draft saved",
          description: "Changes are stored locally. Publish to apply them to the storefront.",
        });
      }
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not save the theme",
        description: isMockApiError(error) ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const restore = async () => {
    if (!activeTheme) return;
    setSaving(true);
    try {
      await themeService.restoreDefaults(activeTheme.id);
      setRestoreOpen(false);
      toast({ variant: "success", title: "Theme restored", description: "Defaults re-applied." });
    } finally {
      setSaving(false);
    }
  };

  if (!activeTheme || !draft) return null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Themes"
        description="Customise colours, typography, layout and homepage sections. Changes are local until you publish."
        actions={
          <>
            {dirty ? <Badge tone="warning" dot>Unsaved changes</Badge> : null}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRestoreOpen(true)}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Restore defaults
            </Button>
            <Button variant="secondary" size="sm" loading={saving} onClick={() => void save(false)}>
              <Save className="size-3.5" aria-hidden />
              Save draft
            </Button>
            <Button variant="primary" size="sm" loading={saving} onClick={() => void save(true)}>
              Publish
            </Button>
          </>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        ariaLabel="Theme editor sections"
        items={[
          { value: "gallery", label: "Gallery" },
          { value: "design", label: "Design" },
          { value: "header", label: "Header" },
          { value: "footer", label: "Footer" },
          { value: "navigation", label: "Navigation" },
          { value: "sections", label: "Homepage sections" },
          { value: "preview", label: "Preview" },
        ]}
      />

      {tab === "gallery" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {themes.map((theme) => (
            <Card key={theme.id} className={cn(theme.isActive && "ring-2 ring-brand-500")}>
              <div className="relative overflow-hidden border-b border-line bg-surface">
                <ThemeMiniature theme={theme} />
                {theme.isActive ? (
                  <Badge tone="success" className="absolute right-2 top-2">
                    Live
                  </Badge>
                ) : null}
              </div>
              <CardBody>
                <h3 className="text-base font-semibold text-ink">{theme.name}</h3>
                <p className="mt-1 text-xs leading-5 text-ink-muted">{theme.description}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  {["primaryColor", "accentColor", "backgroundColor"].map((key) => (
                    <span
                      key={key}
                      className="size-5 rounded-md border border-line"
                      style={{
                        backgroundColor: theme.settings[key as "primaryColor"],
                      }}
                      aria-hidden
                    />
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => selectTheme(theme)}>
                    <Paintbrush className="size-3.5" aria-hidden />
                    Edit
                  </Button>
                  {!theme.isActive ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await themeService.publish(theme.id);
                        toast({ variant: "success", title: `${theme.name} published` });
                      }}
                    >
                      Publish
                    </Button>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "design" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Brand"
              description="Logo, favicon and colour palette."
            />
            <CardBody className="flex flex-col gap-4">
              <Field label="Logo text" htmlFor="theme-logo">
                <Input
                  id="theme-logo"
                  value={draft.logoText}
                  onChange={(event) => update({ logoText: event.target.value })}
                />
              </Field>
              <Field label="Favicon letter" hint="Shown in the browser tab in the demo." htmlFor="theme-favicon">
                <Input
                  id="theme-favicon"
                  maxLength={2}
                  value={draft.faviconEmoji}
                  onChange={(event) => update({ faviconEmoji: event.target.value })}
                  className="w-20 text-center"
                />
              </Field>
              <ColorField
                id="theme-primary"
                label="Primary colour"
                value={draft.primaryColor}
                onChange={(value) => update({ primaryColor: value })}
              />
              <ColorField
                id="theme-accent"
                label="Accent colour"
                value={draft.accentColor}
                onChange={(value) => update({ accentColor: value })}
              />
              <ColorField
                id="theme-background"
                label="Background"
                value={draft.backgroundColor}
                onChange={(value) => update({ backgroundColor: value })}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Typography"
              description="Applied across the storefront preview."
            />
            <CardBody className="flex flex-col gap-4">
              <Field label="Heading font" htmlFor="theme-heading-font">
                <Select
                  id="theme-heading-font"
                  value={draft.headingFont}
                  onChange={(event) => update({ headingFont: event.target.value })}
                >
                  <option>Geist</option>
                  <option>Inter</option>
                  <option>System UI</option>
                  <option>Georgia</option>
                </Select>
              </Field>
              <Field label="Body font" htmlFor="theme-body-font">
                <Select
                  id="theme-body-font"
                  value={draft.bodyFont}
                  onChange={(event) => update({ bodyFont: event.target.value })}
                >
                  <option>Geist</option>
                  <option>Inter</option>
                  <option>System UI</option>
                  <option>Georgia</option>
                </Select>
              </Field>
              <div className="rounded-lg border border-line bg-surface-2 p-4">
                <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
                  <Type className="size-3.5" aria-hidden />
                  Preview
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                  Considered everyday goods
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  Body copy in {draft.bodyFont} at a comfortable reading size.
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                  Announcement bar
                </p>
                <Switch
                  checked={draft.announcement.enabled}
                  onCheckedChange={(checked) =>
                    update({ announcement: { ...draft.announcement, enabled: checked } })
                  }
                  label="Show announcement bar"
                />
                <Field label="Announcement text" htmlFor="theme-announcement">
                  <Input
                    id="theme-announcement"
                    value={draft.announcement.text}
                    onChange={(event) =>
                      update({ announcement: { ...draft.announcement, text: event.target.value } })
                    }
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Link label" htmlFor="theme-announcement-label">
                    <Input
                      id="theme-announcement-label"
                      value={draft.announcement.linkLabel}
                      onChange={(event) =>
                        update({
                          announcement: { ...draft.announcement, linkLabel: event.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field label="Link URL" htmlFor="theme-announcement-href">
                    <Input
                      id="theme-announcement-href"
                      value={draft.announcement.linkHref}
                      onChange={(event) =>
                        update({
                          announcement: { ...draft.announcement, linkHref: event.target.value },
                        })
                      }
                    />
                  </Field>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === "header" ? (
        <Card>
          <CardHeader title="Header" description="Navigation layout and visible controls." />
          <CardBody className="flex flex-col gap-4">
            <Field label="Layout" htmlFor="theme-header-layout">
              <Select
                id="theme-header-layout"
                value={draft.header.layout}
                onChange={(event) =>
                  update({
                    header: {
                      ...draft.header,
                      layout: event.target.value as ThemeSettings["header"]["layout"],
                    },
                  })
                }
              >
                <option value="standard">Standard — logo left, nav right</option>
                <option value="centered">Centered — logo centred above nav</option>
                <option value="minimal">Minimal — logo and icons only</option>
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Switch
                checked={draft.header.sticky}
                onCheckedChange={(checked) =>
                  update({ header: { ...draft.header, sticky: checked } })
                }
                label="Sticky header"
              />
              <Switch
                checked={draft.header.showNavigation}
                onCheckedChange={(checked) =>
                  update({ header: { ...draft.header, showNavigation: checked } })
                }
                label="Show main navigation"
              />
              <Switch
                checked={draft.header.showSearch}
                onCheckedChange={(checked) =>
                  update({ header: { ...draft.header, showSearch: checked } })
                }
                label="Show search"
              />
              <Switch
                checked={draft.header.showCart}
                onCheckedChange={(checked) =>
                  update({ header: { ...draft.header, showCart: checked } })
                }
                label="Show cart"
              />
              <Switch
                checked={draft.header.showAccount}
                onCheckedChange={(checked) =>
                  update({ header: { ...draft.header, showAccount: checked } })
                }
                label="Show account"
              />
            </div>
          </CardBody>
        </Card>
      ) : null}

      {tab === "footer" ? (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Footer content" />
            <CardBody className="flex flex-col gap-4">
              <Field label="Tagline" htmlFor="theme-footer-tagline">
                <Textarea
                  id="theme-footer-tagline"
                  rows={2}
                  value={draft.footer.tagline}
                  onChange={(event) =>
                    update({ footer: { ...draft.footer, tagline: event.target.value } })
                  }
                />
              </Field>
              <Field label="Copyright" htmlFor="theme-footer-copyright">
                <Input
                  id="theme-footer-copyright"
                  value={draft.footer.copyright}
                  onChange={(event) =>
                    update({ footer: { ...draft.footer, copyright: event.target.value } })
                  }
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Switch
                  checked={draft.footer.showPaymentIcons}
                  onCheckedChange={(checked) =>
                    update({ footer: { ...draft.footer, showPaymentIcons: checked } })
                  }
                  label="Show payment icons"
                />
                <Switch
                  checked={draft.footer.showSocial}
                  onCheckedChange={(checked) =>
                    update({ footer: { ...draft.footer, showSocial: checked } })
                  }
                  label="Show social links"
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Footer columns"
              description="Each column holds a title and a list of links."
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    update({
                      footer: {
                        ...draft.footer,
                        columns: [
                          ...draft.footer.columns,
                          {
                            id: uniqueId("col"),
                            title: "New column",
                            links: [],
                          },
                        ],
                      },
                    })
                  }
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add column
                </Button>
              }
            />
            <CardBody className="flex flex-col gap-4">
              {draft.footer.columns.map((column, columnIndex) => (
                <div key={column.id} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={column.title}
                      aria-label={`Column ${columnIndex + 1} title`}
                      onChange={(event) => {
                        const columns = [...draft.footer.columns];
                        columns[columnIndex] = { ...column, title: event.target.value };
                        update({ footer: { ...draft.footer, columns } });
                      }}
                      className="max-w-56"
                    />
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Remove column ${columnIndex + 1}`}
                      onClick={() =>
                        update({
                          footer: {
                            ...draft.footer,
                            columns: draft.footer.columns.filter((item) => item.id !== column.id),
                          },
                        })
                      }
                      className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => {
                        const columns = [...draft.footer.columns];
                        columns[columnIndex] = {
                          ...column,
                          links: [
                            ...column.links,
                            { id: uniqueId("l"), label: "New link", href: "/store" },
                          ],
                        };
                        update({ footer: { ...draft.footer, columns } });
                      }}
                    >
                      <Plus className="size-3.5" aria-hidden />
                      Link
                    </Button>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {column.links.map((link, linkIndex) => (
                      <li key={link.id} className="flex flex-wrap items-center gap-2">
                        <Input
                          value={link.label}
                          aria-label={`Link ${linkIndex + 1} label`}
                          onChange={(event) => {
                            const columns = [...draft.footer.columns];
                            const links = [...column.links];
                            links[linkIndex] = { ...link, label: event.target.value };
                            columns[columnIndex] = { ...column, links };
                            update({ footer: { ...draft.footer, columns } });
                          }}
                          className="max-w-48"
                        />
                        <Input
                          value={link.href}
                          aria-label={`Link ${linkIndex + 1} URL`}
                          onChange={(event) => {
                            const columns = [...draft.footer.columns];
                            const links = [...column.links];
                            links[linkIndex] = { ...link, href: event.target.value };
                            columns[columnIndex] = { ...column, links };
                            update({ footer: { ...draft.footer, columns } });
                          }}
                          className="max-w-64 font-mono text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="iconSm"
                          aria-label={`Remove link ${linkIndex + 1}`}
                          onClick={() => {
                            const columns = [...draft.footer.columns];
                            columns[columnIndex] = {
                              ...column,
                              links: column.links.filter((item) => item.id !== link.id),
                            };
                            update({ footer: { ...draft.footer, columns } });
                          }}
                          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === "navigation" ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink-muted">
            The header and footer menus are edited here and are shared with the Navigation screen.
          </div>
          <MenuEditor menuId={headerMenuId} />
        </div>
      ) : null}

      {tab === "sections" ? (
        <Card>
          <CardHeader
            title="Homepage sections"
            description="Reorder, hide, edit or remove sections."
            actions={
              <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="size-3.5" aria-hidden />
                Add section
              </Button>
            }
          />
          <CardBody className="flex flex-col gap-2">
            {draft.sections.map((section, index) => (
              <div
                key={section.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-2/50 px-3 py-2.5"
              >
                <GripVertical className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{section.name}</p>
                  <p className="truncate text-2xs text-ink-subtle">
                    {SECTION_TYPES.find((item) => item.type === section.type)?.description}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label={`Move ${section.name} up`}
                    disabled={index === 0}
                    onClick={() => moveSection(index, -1)}
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label={`Move ${section.name} down`}
                    disabled={index === draft.sections.length - 1}
                    onClick={() => moveSection(index, 1)}
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label={`${section.visible ? "Hide" : "Show"} ${section.name}`}
                    onClick={() => updateSection(section.id, { visible: !section.visible })}
                  >
                    {section.visible ? (
                      <Eye className="size-3.5" />
                    ) : (
                      <EyeOff className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label={`Duplicate ${section.name}`}
                    onClick={() => {
                      const copy = {
                        ...section,
                        id: uniqueId("sec"),
                        name: `${section.name} copy`,
                      };
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              sections: [
                                ...current.sections.slice(0, index + 1),
                                copy,
                                ...current.sections.slice(index + 1),
                              ],
                            }
                          : current,
                      );
                                      }}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label={`Edit ${section.name}`}
                    onClick={() => setEditingSection(section)}
                  >
                    <Paintbrush className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label={`Remove ${section.name}`}
                    onClick={() => {
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              sections: current.sections.filter((item) => item.id !== section.id),
                            }
                          : current,
                      );
                                      }}
                    className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {tab === "preview" ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl
              value={device}
              onChange={setDevice}
              ariaLabel="Preview device"
              options={[
                { value: "desktop", label: <Monitor className="size-3.5" /> },
                { value: "mobile", label: <Smartphone className="size-3.5" /> },
              ]}
            />
            <p className="text-xs text-ink-subtle">
              Preview uses the draft — publish to apply it to the live storefront.
            </p>
          </div>
          <div
            className={cn(
              "mx-auto w-full overflow-hidden rounded-xl border border-line bg-surface shadow-sm",
              device === "mobile" ? "max-w-96" : "max-w-full",
            )}
          >
            <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2">
              <span className="size-2.5 rounded-full bg-red-400" aria-hidden />
              <span className="size-2.5 rounded-full bg-amber-400" aria-hidden />
              <span className="size-2.5 rounded-full bg-emerald-400" aria-hidden />
              <span className="ml-2 truncate text-2xs text-ink-subtle">
                {activeTheme.name.toLowerCase().replace(/\s+/g, "-")}.example
              </span>
            </div>
            <div className="max-h-menu overflow-y-auto scrollbar-thin">
              <ThemeSections theme={draft} />
            </div>
          </div>
        </div>
      ) : null}

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a homepage section"
        description="Pick a block to add to the end of the homepage."
        size="lg"
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SECTION_TYPES.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => addSection(item.type)}
              className="rounded-lg border border-line p-3 text-left transition-colors hover:border-brand-400 hover:bg-brand-50/40 dark:hover:bg-brand-950/30"
            >
              <p className="text-sm font-medium text-ink">{item.label}</p>
              <p className="mt-0.5 text-2xs leading-4 text-ink-muted">{item.description}</p>
            </button>
          ))}
        </div>
      </Dialog>

      {editingSection ? (
        <SectionEditor
          key={editingSection.id}
          section={editingSection}
          collections={collections}
          onClose={() => setEditingSection(null)}
          onSave={(updated) => {
            if (editingSection) updateSection(editingSection.id, updated);
            setEditingSection(null);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        title="Restore the default configuration?"
        description={`“${activeTheme.name}” returns to its shipped settings. Any local changes to this theme are discarded.`}
        confirmLabel="Restore defaults"
        onConfirm={() => void restore()}
      />
    </div>
  );
}
