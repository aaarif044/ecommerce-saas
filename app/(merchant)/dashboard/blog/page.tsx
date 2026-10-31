"use client";

import * as React from "react";
import { Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useUIStore } from "@/lib/store/ui-store";
import { blogService } from "@/lib/services/storefront";
import { downloadCsv } from "@/lib/services/csv";
import { isMockApiError } from "@/lib/services/errors";
import { useDateFormatter } from "@/lib/hooks";
import { PageHeader } from "@/components/shell/page-header";
import { Page } from "@/components/shell/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { FormGrid } from "@/components/ui/form";
import { DataTable, columnHelper, selectionColumn } from "@/components/data-table/data-table";
import { DropdownMenu, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import type { BlogPost } from "@/lib/types";

interface BlogForm {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string[];
  status: "published" | "draft";
}

const EMPTY: BlogForm = {
  title: "",
  excerpt: "",
  content: "",
  author: "Naveen Raghavan",
  tags: [],
  status: "draft",
};

export default function BlogAdminPage() {
  const posts = useDataStore((state) => state.blogPosts);
  const toast = useUIStore((state) => state.toast);
  const date = useDateFormatter();

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BlogPost | null>(null);
  const [form, setForm] = React.useState<BlogForm>(EMPTY);
  const [tagInput, setTagInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<BlogPost | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setTagInput("");
    setError(null);
    setOpen(true);
  };

  const openEdit = React.useCallback(
    (post: BlogPost) => {
      setEditing(post);
      setForm({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        author: post.author,
        tags: [...post.tags],
        status: post.status,
      });
      setTagInput("");
      setError(null);
      setOpen(true);
    },
    [],
  );

  const save = async () => {
    if (!form.title.trim()) {
      setError("A title is required.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await blogService.update(editing.id, {
          title: form.title.trim(),
          excerpt: form.excerpt,
          content: form.content,
          author: form.author,
          tags: form.tags,
          status: form.status,
        });
        toast({ variant: "success", title: "Post updated" });
      } else {
        await blogService.create({
          title: form.title.trim(),
          slug: "",
          excerpt: form.excerpt,
          content: form.content,
          author: form.author,
          tags: form.tags,
          status: form.status,
          publishedAt: new Date().toISOString(),
          readMinutes: Math.max(1, Math.round(form.content.split(" ").length / 200)),
          views: 0,
        });
        toast({ variant: "success", title: "Post created" });
      }
      setOpen(false);
    } catch (err) {
      setError(isMockApiError(err) ? err.message : "Could not save the post.");
    } finally {
      setSaving(false);
    }
  };

  const columns = React.useMemo(
    () => [
      selectionColumn<BlogPost>({ getRowId: (row) => row.id }),
      columnHelper.accessor("title", {
        header: "Post",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.original.title}</p>
            <p className="truncate text-2xs text-ink-subtle">/store/blog/{row.original.slug}</p>
          </div>
        ),
      }),
      columnHelper.accessor("author", {
        header: "Author",
        meta: { hideBelow: "md" },
        cell: ({ getValue }) => <span className="text-ink-muted">{getValue() as string}</span>,
      }),
      columnHelper.accessor("tags", {
        header: "Tags",
        meta: { hideBelow: "lg" },
        cell: ({ row }) => (
          <span className="flex flex-wrap gap-1">
            {row.original.tags.map((tag: string) => (
              <Badge key={tag} tone="outline" size="sm">
                {tag}
              </Badge>
            ))}
          </span>
        ),
      }),
      columnHelper.accessor("views", {
        header: "Views",
        meta: { align: "right" },
        cell: ({ getValue }) => (
          <span className="tabular-nums text-ink">{(getValue() as number).toLocaleString("en-IN")}</span>
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
      columnHelper.accessor("publishedAt", {
        header: "Published",
        meta: { hideBelow: "md" },
        cell: ({ row }) => <span className="text-ink-muted">{date(row.original.publishedAt)}</span>,
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
              onClick={() => window.open(`/store/blog/${row.original.slug}`, "_blank")}
            >
              Preview post
            </DropdownItem>
            <DropdownItem icon={<Pencil className="size-3.5" />} onClick={() => openEdit(row.original)}>
              Edit post
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              icon={<Pencil className="size-3.5" />}
              onClick={async () => {
                await blogService.update(row.original.id, {
                  status: row.original.status === "published" ? "draft" : "published",
                });
                toast({ variant: "info", title: "Post status updated" });
              }}
            >
              {row.original.status === "published" ? "Move to draft" : "Publish"}
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              danger
              icon={<Trash2 className="size-3.5" />}
              onClick={() => setPendingDelete(row.original)}
            >
              Delete post
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
        title="Blog"
        description="Editorial content published to the storefront Stories section."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            New post
          </Button>
        }
      />

      <Card>
        <DataTable
          data={posts}
          columns={columns}
          getRowId={(row) => row.id}
          searchAccessor={(row) => `${row.title} ${row.excerpt} ${row.author} ${row.tags.join(" ")}`}
          searchPlaceholder="Search posts…"
          enableSelection
          itemLabel="posts"
          onExport={(rows) => {
            downloadCsv(
              "blog-posts.csv",
              rows.map((row) => ({
                Title: row.title,
                Author: row.author,
                Status: row.status,
                Tags: row.tags.join("; "),
                Views: row.views,
                Published: row.publishedAt,
              })),
            );
            toast({ variant: "success", title: "Export ready" });
          }}
          emptyTitle="No posts yet"
          emptyDescription="Write the first story for your storefront."
          emptyAction={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" aria-hidden />
              New post
            </Button>
          }
        />
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={editing ? "Edit post" : "New post"}
        description="Posts are published to /store/blog."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void save()} loading={saving}>
              {editing ? "Save changes" : "Create post"}
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
          <Field label="Title" required htmlFor="post-title">
            <Input
              id="post-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </Field>
          <Field label="Excerpt" htmlFor="post-excerpt">
            <Textarea
              id="post-excerpt"
              rows={2}
              value={form.excerpt}
              onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
            />
          </Field>
          <Field label="Content" htmlFor="post-content">
            <Textarea
              id="post-content"
              rows={8}
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
            />
          </Field>
          <FormGrid>
            <Field label="Author" htmlFor="post-author">
              <Input
                id="post-author"
                value={form.author}
                onChange={(event) => setForm({ ...form, author: event.target.value })}
              />
            </Field>
            <Field label="Status" htmlFor="post-status">
              <Select
                id="post-status"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as BlogForm["status"] })
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </Field>
          </FormGrid>
          <Field label="Tags" hint="Press Enter to add a tag.">
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setForm({ ...form, tags: form.tags.filter((item) => item !== tag) })
                  }
                  className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs text-ink-muted hover:border-red-200 hover:text-red-600"
                >
                  {tag} ×
                </button>
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const value = tagInput.trim();
                if (!value || form.tags.includes(value)) return;
                setForm({ ...form, tags: [...form.tags, value] });
                setTagInput("");
              }}
              placeholder="Add a tag"
              className="mt-2"
            />
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        destructive
        title={`Delete "${pendingDelete?.title}"?`}
        description="The post is removed from the storefront blog."
        confirmLabel="Delete post"
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await blogService.remove(pendingDelete.id);
            toast({ variant: "success", title: "Post deleted" });
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
