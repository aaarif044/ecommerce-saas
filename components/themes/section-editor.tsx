"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import type { ThemeSection } from "@/lib/types";

export function SectionEditor({
  section,
  collections,
  onClose,
  onSave,
}: {
  section: ThemeSection;
  collections: { id: string; title: string }[];
  onClose: () => void;
  onSave: (patch: Partial<ThemeSection>) => void;
}) {
  const [props, setProps] = React.useState<Record<string, unknown>>(() => ({
    ...section.props,
  }));

  const setProp = (key: string, value: unknown) => setProps((current) => ({ ...current, [key]: value }));

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={`Edit ${section.name}`}
      description="Changes apply to the draft. Publish to push them live."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave({ props })}>
            Save section
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {section.type === "hero" ? (
          <>
            <Field label="Headline" htmlFor="sec-headline">
              <Input
                id="sec-headline"
                value={(props.headline as string) ?? ""}
                onChange={(event) => setProp("headline", event.target.value)}
              />
            </Field>
            <Field label="Sub-headline" htmlFor="sec-subhead">
              <Textarea
                id="sec-subhead"
                rows={2}
                value={(props.subhead as string) ?? ""}
                onChange={(event) => setProp("subhead", event.target.value)}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Primary button label" htmlFor="sec-primary-label">
                <Input
                  id="sec-primary-label"
                  value={(props.primaryLabel as string) ?? ""}
                  onChange={(event) => setProp("primaryLabel", event.target.value)}
                />
              </Field>
              <Field label="Primary button link" htmlFor="sec-primary-href">
                <Input
                  id="sec-primary-href"
                  value={(props.primaryHref as string) ?? ""}
                  onChange={(event) => setProp("primaryHref", event.target.value)}
                />
              </Field>
              <Field label="Secondary button label" htmlFor="sec-secondary-label">
                <Input
                  id="sec-secondary-label"
                  value={(props.secondaryLabel as string) ?? ""}
                  onChange={(event) => setProp("secondaryLabel", event.target.value)}
                />
              </Field>
              <Field label="Secondary button link" htmlFor="sec-secondary-href">
                <Input
                  id="sec-secondary-href"
                  value={(props.secondaryHref as string) ?? ""}
                  onChange={(event) => setProp("secondaryHref", event.target.value)}
                />
              </Field>
            </div>
          </>
        ) : null}

        {section.type === "banner" ? (
          <>
            <Field label="Heading" htmlFor="sec-banner-heading">
              <Input
                id="sec-banner-heading"
                value={(props.heading as string) ?? ""}
                onChange={(event) => setProp("heading", event.target.value)}
              />
            </Field>
            <Field label="Body" htmlFor="sec-banner-body">
              <Textarea
                id="sec-banner-body"
                rows={2}
                value={(props.body as string) ?? ""}
                onChange={(event) => setProp("body", event.target.value)}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Button label" htmlFor="sec-banner-cta">
                <Input
                  id="sec-banner-cta"
                  value={(props.ctaLabel as string) ?? ""}
                  onChange={(event) => setProp("ctaLabel", event.target.value)}
                />
              </Field>
              <Field label="Button link" htmlFor="sec-banner-href">
                <Input
                  id="sec-banner-href"
                  value={(props.ctaHref as string) ?? ""}
                  onChange={(event) => setProp("ctaHref", event.target.value)}
                />
              </Field>
            </div>
          </>
        ) : null}

        {section.type === "featured_products" ? (
          <>
            <Field label="Heading" htmlFor="sec-feat-heading">
              <Input
                id="sec-feat-heading"
                value={(props.heading as string) ?? ""}
                onChange={(event) => setProp("heading", event.target.value)}
              />
            </Field>
            <Field label="Sub-heading" htmlFor="sec-feat-subheading">
              <Input
                id="sec-feat-subheading"
                value={(props.subheading as string) ?? ""}
                onChange={(event) => setProp("subheading", event.target.value)}
              />
            </Field>
            <Field label="Collection" htmlFor="sec-feat-collection">
              <Select
                id="sec-feat-collection"
                value={(props.collectionId as string) ?? ""}
                onChange={(event) => setProp("collectionId", event.target.value)}
              >
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Products to show" htmlFor="sec-feat-limit">
                <Input
                  id="sec-feat-limit"
                  type="number"
                  min={2}
                  max={12}
                  value={(props.limit as number) ?? 8}
                  onChange={(event) => setProp("limit", Number(event.target.value))}
                />
              </Field>
              <Field label="Columns" htmlFor="sec-feat-columns">
                <Select
                  id="sec-feat-columns"
                  value={String((props.columns as number) ?? 4)}
                  onChange={(event) => setProp("columns", Number(event.target.value))}
                >
                  <option value="2">2 columns</option>
                  <option value="3">3 columns</option>
                  <option value="4">4 columns</option>
                </Select>
              </Field>
            </div>
          </>
        ) : null}

        {section.type === "featured_collections" ? (
          <>
            <Field label="Heading" htmlFor="sec-collections-heading">
              <Input
                id="sec-collections-heading"
                value={(props.heading as string) ?? ""}
                onChange={(event) => setProp("heading", event.target.value)}
              />
            </Field>
            <Field label="Collections" hint="Select the collections to display.">
              <select
                multiple
                value={(props.collectionIds as string[]) ?? []}
                onChange={(event) =>
                  setProp(
                    "collectionIds",
                    Array.from(event.target.selectedOptions).map((option) => option.value),
                  )
                }
                className="scrollbar-thin h-32 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
              >
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.title}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : null}

        {section.type === "image_text" ? (
          <>
            <Field label="Heading" htmlFor="sec-image-heading">
              <Input
                id="sec-image-heading"
                value={(props.heading as string) ?? ""}
                onChange={(event) => setProp("heading", event.target.value)}
              />
            </Field>
            <Field label="Body" htmlFor="sec-image-body">
              <Textarea
                id="sec-image-body"
                rows={4}
                value={(props.body as string) ?? ""}
                onChange={(event) => setProp("body", event.target.value)}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Button label" htmlFor="sec-image-label">
                <Input
                  id="sec-image-label"
                  value={(props.primaryLabel as string) ?? ""}
                  onChange={(event) => setProp("primaryLabel", event.target.value)}
                />
              </Field>
              <Field label="Image position" htmlFor="sec-image-position">
                <Select
                  id="sec-image-position"
                  value={(props.imagePosition as string) ?? "right"}
                  onChange={(event) => setProp("imagePosition", event.target.value)}
                >
                  <option value="right">Image right</option>
                  <option value="left">Image left</option>
                </Select>
              </Field>
            </div>
          </>
        ) : null}

        {section.type === "testimonials" ? (
          <>
            <Field label="Heading" htmlFor="sec-testimonials-heading">
              <Input
                id="sec-testimonials-heading"
                value={(props.heading as string) ?? ""}
                onChange={(event) => setProp("heading", event.target.value)}
              />
            </Field>
            <div className="flex flex-col gap-2">
              {((props.testimonials as { quote: string; author: string; role: string }[]) ?? []).map(
                (testimonial, index) => (
                  <div key={index} className="rounded-lg border border-line p-3">
                    <Field label={`Quote ${index + 1}`} htmlFor={`testimonial-quote-${index}`}>
                      <Textarea
                        id={`testimonial-quote-${index}`}
                        rows={2}
                        value={testimonial.quote}
                        onChange={(event) => {
                          const list = [
                            ...((props.testimonials as typeof testimonial[]) ?? []),
                          ];
                          list[index] = { ...testimonial, quote: event.target.value };
                          setProp("testimonials", list);
                        }}
                      />
                    </Field>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <Field label="Author" htmlFor={`testimonial-author-${index}`}>
                        <Input
                          id={`testimonial-author-${index}`}
                          value={testimonial.author}
                          onChange={(event) => {
                            const list = [...((props.testimonials as typeof testimonial[]) ?? [])];
                            list[index] = { ...testimonial, author: event.target.value };
                            setProp("testimonials", list);
                          }}
                        />
                      </Field>
                      <Field label="Location" htmlFor={`testimonial-role-${index}`}>
                        <Input
                          id={`testimonial-role-${index}`}
                          value={testimonial.role}
                          onChange={(event) => {
                            const list = [...((props.testimonials as typeof testimonial[]) ?? [])];
                            list[index] = { ...testimonial, role: event.target.value };
                            setProp("testimonials", list);
                          }}
                        />
                      </Field>
                    </div>
                  </div>
                ),
              )}
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={() =>
                  setProp("testimonials", [
                    ...((props.testimonials as { quote: string; author: string; role: string }[]) ?? []),
                    { quote: "New testimonial", author: "Customer", role: "City" },
                  ])
                }
              >
                <Plus className="size-3.5" aria-hidden />
                Add testimonial
              </Button>
            </div>
          </>
        ) : null}

        {section.type === "faq" ? (
          <>
            <Field label="Heading" htmlFor="sec-faq-heading">
              <Input
                id="sec-faq-heading"
                value={(props.heading as string) ?? ""}
                onChange={(event) => setProp("heading", event.target.value)}
              />
            </Field>
            <div className="flex flex-col gap-2">
              {((props.items as { q: string; a: string }[]) ?? []).map((item, index) => (
                <div key={index} className="rounded-lg border border-line p-3">
                  <Field label="Question" htmlFor={`faq-q-${index}`}>
                    <Input
                      id={`faq-q-${index}`}
                      value={item.q}
                      onChange={(event) => {
                        const list = [...((props.items as typeof item[]) ?? [])];
                        list[index] = { ...item, q: event.target.value };
                        setProp("items", list);
                      }}
                    />
                  </Field>
                  <Field label="Answer" htmlFor={`faq-a-${index}`} className="mt-2">
                    <Textarea
                      id={`faq-a-${index}`}
                      rows={2}
                      value={item.a}
                      onChange={(event) => {
                        const list = [...((props.items as typeof item[]) ?? [])];
                        list[index] = { ...item, a: event.target.value };
                        setProp("items", list);
                      }}
                    />
                  </Field>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={() =>
                  setProp("items", [
                    ...((props.items as { q: string; a: string }[]) ?? []),
                    { q: "New question", a: "New answer" },
                  ])
                }
              >
                <Plus className="size-3.5" aria-hidden />
                Add question
              </Button>
            </div>
          </>
        ) : null}

        {section.type === "newsletter" ? (
          <>
            <Field label="Heading" htmlFor="sec-news-heading">
              <Input
                id="sec-news-heading"
                value={(props.heading as string) ?? ""}
                onChange={(event) => setProp("heading", event.target.value)}
              />
            </Field>
            <Field label="Body" htmlFor="sec-news-body">
              <Textarea
                id="sec-news-body"
                rows={2}
                value={(props.body as string) ?? ""}
                onChange={(event) => setProp("body", event.target.value)}
              />
            </Field>
            <Field label="Button label" htmlFor="sec-news-button">
              <Input
                id="sec-news-button"
                value={(props.buttonLabel as string) ?? ""}
                onChange={(event) => setProp("buttonLabel", event.target.value)}
              />
            </Field>
          </>
        ) : null}

        {section.type === "rich_text" ? (
          <>
            <Field label="Heading" htmlFor="sec-rich-heading">
              <Input
                id="sec-rich-heading"
                value={(props.heading as string) ?? ""}
                onChange={(event) => setProp("heading", event.target.value)}
              />
            </Field>
            <Field label="Body" htmlFor="sec-rich-body">
              <Textarea
                id="sec-rich-body"
                rows={6}
                value={(props.body as string) ?? ""}
                onChange={(event) => setProp("body", event.target.value)}
              />
            </Field>
          </>
        ) : null}

        {section.type === "product_grid" ? (
          <>
            <Field label="Heading" htmlFor="sec-grid-heading">
              <Input
                id="sec-grid-heading"
                value={(props.heading as string) ?? ""}
                onChange={(event) => setProp("heading", event.target.value)}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Products to show" htmlFor="sec-grid-limit">
                <Input
                  id="sec-grid-limit"
                  type="number"
                  min={2}
                  max={16}
                  value={(props.limit as number) ?? 8}
                  onChange={(event) => setProp("limit", Number(event.target.value))}
                />
              </Field>
              <Field label="Columns" htmlFor="sec-grid-columns">
                <Select
                  id="sec-grid-columns"
                  value={String((props.columns as number) ?? 4)}
                  onChange={(event) => setProp("columns", Number(event.target.value))}
                >
                  <option value="2">2 columns</option>
                  <option value="3">3 columns</option>
                  <option value="4">4 columns</option>
                </Select>
              </Field>
            </div>
          </>
        ) : null}

        {section.type === "spacer" ? (
          <Field label="Height in pixels" htmlFor="sec-spacer-height">
            <Input
              id="sec-spacer-height"
              type="number"
              min={8}
              max={160}
              value={(props.height as number) ?? 40}
              onChange={(event) => setProp("height", Number(event.target.value))}
            />
          </Field>
        ) : null}
      </div>
    </Dialog>
  );
}
