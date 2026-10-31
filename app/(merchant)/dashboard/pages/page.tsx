"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, FileText, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { pageService } from "@/lib/services/storefront";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useDateFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { FormGrid } from "@/components/ui/form";
import { DataTable, columnHelper, selectionColumn } from "@/components/data-table/data-table";
import { DropdownMenu, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import type { StorePage } from "@/lib/types";

interface PageForm {
  title: string;
  slug: string;
  content: string;
  status: "published" | "draft";
  template: StorePage["template"];
  seoTitle: string;
  seoDescription: string;
  showInFooter: boolean;
}

const EMPTY: PageForm = {
  title: "",
  slug: "",
  content: "",
  status: "draft",
  template: "standard",
  seoTitle: "",
  seoDescription: "",
  showInFooter: true,
};

export default function PagesAdminPage() {
  const pages = useDataStore((state) => state.pages);
  const toast = useUIStore((state) => state.toast);
  const date = useDateFormatter();

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<StorePage | null>(null);
  const [form, setForm] = React.useState<PageForm>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<StorePage | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setError(null);
    setOpen(true);
  };

  const openEdit = React.useCallback(
    (page: StorePage) => {
      setEditing(page);
      setForm({
        title: page.title,
        slug: page.slug,
        content: page.content,
        status: page.status,
        template: page.template,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        showInFooter: page.showInFooter,
      });
      setError(null);
      setOpen(true);
    },
    [],
  );

  const save = async () => {
    if (!form.title.trim()) {
      setError("Page title is required.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await pageService.update(editing.id, {
          title: form.title.trim(),
          content: form.content,
          status: form.status,
          template: form.template,
          seoTitle: form.seoTitle || form.title,
          seoDescription: form.seoDescription || form.content.slice(0, 150),
          showInFooter: form.showInFooter,
        });
        toast({ variant: "success", title: "Page updated" });
      } else {
        await pageService.create({
          title: form.title.trim(),
          slug: form.slug,
          content: form.content,
          status: form.status,
          template: form.template,
          seoTitle: form.seoTitle || form.title,
          seoDescription: form.seoDescription || form.content.slice(0, 150),
          showInFooter: form.showInFooter,
        });
        toast({ variant: "success", title: "Page created" });
      }
      setOpen(false);
    } catch (err) {
      setError(isMockApiError(err) ? err.message : "Could not save the page.");
    } finally {
      setSaving(false);
    }
  };

  const columns = React.useMemo(
    () => [
      selectionColumn<StorePage>({ getRowId: (row) => row.id }),
      columnHelper.accessor("title", {
        header: "Page",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.original.title}</p>
            <p className="truncate text-2xs text-ink-subtle">/store/pages/{row.original.slug}</p>
          </div>
        ),
      }),
      columnHelper.accessor("template", {
        header: "Template",
        cell: ({ getValue }) => (
          <Badge tone="neutral">{(getValue() as string).replace(/_/g, " ")}</Badge>
        ),
      }),
      columnHelper.accessor("showInFooter", {
        header: "Footer",
        cell: ({ getValue }) => (
          <Badge tone={(getValue() as boolean) ? "info" : "neutral"}>
            {(getValue() as boolean) ? "Shown" : "Hidden"}
          </Badge>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => (
          <Badge tone={(getValue() as string) === "published" ? "success" : "warning"}>
            {getValue() as string}
          </Badge>
        ),
      }),
      columnHelper.accessor("updatedAt", {
        header: "Updated",
        meta: { hideBelow: "md" },
        cell: ({ row }) => <span className="text-ink-muted">{date(row.original.updatedAt)}</span>,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <DropdownMenu
            triggerLabel={`Actions for ${row.original.title}`}
            trigger={
              <span className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
                <MoreHorizontal className="size-4" aria-hidden />
              </span>
            }
          >
            <DropdownItem
              icon={<Eye className="size-3.5" />}
              onClick={() => window.open(`/store/pages/${row.original.slug}`, "_blank")}
            >
              Preview page
            </DropdownItem>
            <DropdownItem icon={<Pencil className="size-3.5" />} onClick={() => openEdit(row.original)}>
              Edit page
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              icon={<FileText className="size-3.5" />}
              onClick={async () => {
                await pageService.update(row.original.id, {
                  status: row.original.status === "published" ? "draft" : "published",
                });
                toast({ variant: "info", title: "Page status updated" });
              }}
            >
              {row.original.status === "published" ? "Unpublish" : "Publish"}
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              danger
              icon={<Trash2 className="size-3.5" />}
              onClick={() => setPendingDelete(row.original)}
            >
              Delete page
            </DropdownItem>
          </DropdownMenu>
        ),
      }),
    ],
    [date, openEdit, toast],
  );

  return (
    <Page>
      <PageHeader
        title="Pages"
        description="Static content pages such as about, shipping policies and FAQ."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            New page
          </Button>
        }
      />

      <Card>
        <DataTable
          data={pages}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) => `${row.title} ${row.content} ${row.slug}`}
          searchPlaceholder="Search pages…"
          enableSelection
          itemLabel="pages"
          onExport={(rows) => {
            downloadCsv(
              "pages.csv",
              rows.map((row) => ({
                Title: row.title,
                Slug: row.slug,
                Template: row.template,
                Status: row.status,
                In_footer: row.showInFooter ? "yes" : "no",
                SEO_title: row.seoTitle,
                Updated: row.updatedAt,
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          emptyTitle="No pages yet"
          emptyDescription="Create a page to publish policies or editorial content."
          emptyAction={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" aria-hidden />
              New page
            </Button>
          }
        />
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={editing ? "Edit page" : "New page"}
        description="Content is plain text. Blank lines create new paragraphs on the storefront."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void save()} loading={saving}>
              {editing ? "Save changes" : "Create page"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}
          <Field label="Title" required htmlFor="page-title">
            <Input
              id="page-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </Field>
          <Field label="Content" htmlFor="page-content">
            <Textarea
              id="page-content"
              rows={8}
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
            />
          </Field>
          <FormGrid>
            <Field label="Status" htmlFor="page-status">
              <Select
                id="page-status"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as PageForm["status"] })
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </Field>
            <Field label="Template" htmlFor="page-template">
              <Select
                id="page-template"
                value={form.template}
                onChange={(event) =>
                  setForm({ ...form, template: event.target.value as PageForm["template"] })
                }
              >
                <option value="standard">Standard</option>
                <option value="contact">Contact</option>
                <option value="faq">FAQ</option>
              </Select>
            </Field>
            <Field label="SEO title" htmlFor="page-seo-title">
              <Input
                id="page-seo-title"
                value={form.seoTitle}
                onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
              />
            </Field>
            <Field label="SEO description" htmlFor="page-seo-description">
              <Input
                id="page-seo-description"
                value={form.seoDescription}
                onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}
              />
            </Field>
          </FormGrid>
          <Switch
            checked={form.showInFooter}
            onCheckedChange={(checked) => setForm({ ...form, showInFooter: checked })}
            label="Show in the footer navigation"
          />
          {editing ? (
            <Link
              href={`/store/pages/${editing.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-300"
            >
              <Eye className="size-3.5" aria-hidden />
              Preview on storefront
            </Link>
          ) : null}
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        destructive
        title={`Delete "${pendingDelete?.title}"?`}
        description="The page is removed from the storefront. This cannot be undone in the demo."
        confirmLabel="Delete page"
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await pageService.remove(pendingDelete.id);
            toast({ variant: "success", title: "Page deleted" });
            setPendingDelete(null);
          } catch (error) {
            toast({
              variant: "error",
              title: "Could not delete",
              description: isMockApiError(error) ? error.message : undefined,
            });
          }
        }}
      />
    </Page>
  );
}
