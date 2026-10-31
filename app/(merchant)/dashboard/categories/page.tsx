"use client";

import * as React from "react";
import { FolderTree, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { categoryService } from "@/lib/services/catalog";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, Textarea, Input } from "@/components/ui/input";
import { Field, Switch } from "@/components/ui/field";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import {  } from "@/components/ui/states";
import { DataTable, columnHelper, selectionColumn } from "@/components/data-table/data-table";
import { ProductImage } from "@/components/product-image";
import { DropdownMenu, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import { rolledUpCategoryCounts } from "@/lib/utils";
import type { Category } from "@/lib/types";

interface CategoryForm {
  name: string;
  slug: string;
  parentId: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  visibility: "visible" | "hidden";
  imageTone: number;
}

const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  parentId: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  visibility: "visible",
  imageTone: 0,
};

export default function CategoriesPage() {
  const categories = useDataStore((state) => state.categories);
  const products = useDataStore((state) => state.products);
  const toast = useUIStore((state) => state.toast);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [form, setForm] = React.useState<CategoryForm>(EMPTY_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<Category | null>(null);

  const nameMap = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const productCountMap = React.useMemo(
    () => rolledUpCategoryCounts(categories, products),
    [categories, products],
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, imageTone: categories.length % 12 });
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ?? "",
      description: category.description,
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
      visibility: category.visibility,
      imageTone: category.imageTone,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setFormError("Category name is required.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await categoryService.update(editing.id, {
          name: form.name.trim(),
          parentId: form.parentId || null,
          description: form.description,
          seoTitle: form.seoTitle || form.name,
          seoDescription: form.seoDescription || form.description,
          visibility: form.visibility,
          imageTone: form.imageTone,
        });
        toast({ variant: "success", title: "Category updated", description: form.name });
      } else {
        await categoryService.create({
          name: form.name.trim(),
          slug: form.slug,
          parentId: form.parentId || null,
          description: form.description,
          imageTone: form.imageTone,
          visibility: form.visibility,
          seoTitle: form.seoTitle || form.name,
          seoDescription: form.seoDescription || form.description,
          position: categories.length + 1,
        });
        toast({ variant: "success", title: "Category created", description: form.name });
      }
      setDialogOpen(false);
    } catch (error) {
      const message = isMockApiError(error) ? error.message : "Could not save the category.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const columns = React.useMemo(
    () => [
      selectionColumn<Category>({ getRowId: (row) => row.id }),
      columnHelper.accessor("name", {
        header: "Category",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <ProductImage
              assetId={`asset-${String((row.original.imageTone % 12) + 1).padStart(2, "0")}`}
              alt={row.original.name}
              className="size-9 shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{row.original.name}</p>
              <p className="truncate text-2xs text-ink-subtle">/{row.original.slug}</p>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("parentId", {
        header: "Parent",
        cell: ({ row }) => (
          <span className="text-ink-muted">
            {row.original.parentId ? (nameMap.get(row.original.parentId) ?? "—") : "Top level"}
          </span>
        ),
      }),
      columnHelper.accessor("description", {
        header: "Description",
        meta: { hideBelow: "lg" },
        cell: ({ getValue }) => (
          <span className="line-clamp-1 text-ink-muted">{getValue()}</span>
        ),
      }),
      columnHelper.display({
        id: "count",
        header: "Products",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="tabular-nums text-ink">{productCountMap.get(row.original.id) ?? 0}</span>
        ),
      }),
      columnHelper.accessor("visibility", {
        header: "Visibility",
        cell: ({ getValue }) => (
          <Badge tone={getValue() === "visible" ? "info" : "neutral"}>{getValue()}</Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        meta: { align: "right" },
        cell: ({ row }) => (
          <DropdownMenu
            triggerLabel={`Actions for ${row.original.name}`}
            trigger={
              <span className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
                <MoreHorizontal className="size-4" aria-hidden />
              </span>
            }
          >
            <DropdownItem icon={<Pencil className="size-3.5" />} onClick={() => openEdit(row.original)}>
              Edit category
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              danger
              icon={<Trash2 className="size-3.5" />}
              onClick={() => setPendingDelete(row.original)}
            >
              Delete category
            </DropdownItem>
          </DropdownMenu>
        ),
      }),
    ],
    [nameMap, productCountMap],
  );

  return (
    <Page>
      <PageHeader
        title="Categories"
        description="Organise the catalogue into a hierarchy. The same records drive the storefront navigation."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            New category
          </Button>
        }
      />

      <Card>
        <DataTable
          data={categories}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) => `${row.name} ${row.description} ${row.slug}`}
          searchPlaceholder="Search categories…"
          enableSelection
          itemLabel="categories"
          onExport={(rows) => {
            downloadCsv(
              "categories.csv",
              rows.map((row) => ({
                Name: row.name,
                Slug: row.slug,
                Parent: row.parentId ? (nameMap.get(row.parentId) ?? "") : "",
                Description: row.description,
                Visibility: row.visibility,
                Products: productCountMap.get(row.id) ?? 0,
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          emptyTitle="No categories yet"
          emptyDescription="Create your first category to organise the catalogue."
          emptyAction={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" aria-hidden />
              New category
            </Button>
          }
        />
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit category" : "New category"}
        description="Categories appear in the storefront menu and on product pages."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void save()} loading={saving}>
              {editing ? "Save changes" : "Create category"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError ? (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {formError}
            </p>
          ) : null}
          <Field label="Name" required htmlFor="category-name">
            <Input
              id="category-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Parent category" hint="Leave empty for a top-level category." htmlFor="category-parent">
            <Select
              id="category-parent"
              value={form.parentId}
              onChange={(event) => setForm({ ...form, parentId: event.target.value })}
            >
              <option value="">Top level</option>
              {categories
                .filter((category) => category.id !== editing?.id)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Description" htmlFor="category-description">
            <Textarea
              id="category-description"
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
          <Field label="Category image" hint="Pick a generated tile for the category card.">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 12 }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setForm({ ...form, imageTone: index })}
                  aria-pressed={form.imageTone === index}
                  aria-label={`Category tile ${index + 1}`}
                  className={`size-10 overflow-hidden rounded-lg border-2 ${
                    form.imageTone === index ? "border-brand-500" : "border-transparent"
                  }`}
                >
                  <ProductImage assetId={`asset-${String(index + 1).padStart(2, "0")}`} alt="" className="h-full w-full border-0" />
                </button>
              ))}
            </div>
          </Field>
          <Field label="SEO title" htmlFor="category-seo-title">
            <Input
              id="category-seo-title"
              value={form.seoTitle}
              onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
            />
          </Field>
          <Field label="SEO description" htmlFor="category-seo-description">
            <Textarea
              id="category-seo-description"
              rows={2}
              value={form.seoDescription}
              onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}
            />
          </Field>
          <Switch
            checked={form.visibility === "visible"}
            onCheckedChange={(checked) =>
              setForm({ ...form, visibility: checked ? "visible" : "hidden" })
            }
            label="Visible in the storefront"
            description="Hidden categories stay in the dashboard but are removed from the menu."
          />
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        destructive
        title={`Delete "${pendingDelete?.name}"?`}
        description="Products in this category will be left uncategorised. This cannot be undone in the demo."
        confirmLabel="Delete category"
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await categoryService.remove(pendingDelete.id);
            toast({ variant: "success", title: "Category deleted" });
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

      <p className="flex items-center gap-1.5 text-2xs text-ink-subtle">
        <FolderTree className="size-3.5" aria-hidden />
        {categories.length} categories · {categories.filter((c) => c.parentId).length} nested
      </p>
    </Page>
  );
}
