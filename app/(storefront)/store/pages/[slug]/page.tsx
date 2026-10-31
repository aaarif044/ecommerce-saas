"use client";

import { PageSkeleton } from "@/components/ui/page-skeleton";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDataStore } from "@/lib/store/data-store";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import {
  StoreContainer,
  StoreLinkButton,
  StorePageTitle,
  storeLinkButtonClass,
} from "@/components/storefront/store-container";

export default function StorePage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <StorePageContent />
    </React.Suspense>
  );
}

function StorePageContent() {

  const params = useParams<{ slug: string }>();
  const pages = useDataStore((state) => state.pages);
  const page = pages.find((item) => item.slug === params.slug);

  if (!page) {
    return (
      <StoreContainer width="3xl" padding="xl">
        <EmptyState
          title="Page not found"
          description="This page may have been unpublished or removed."
          action={<StoreLinkButton href="/store">Back to the shop</StoreLinkButton>}
        />
      </StoreContainer>
    );
  }

  const paragraphs = page.content.split("\n\n");
  const faqItems =
    page.template === "faq"
      ? paragraphs
          .filter((block) => block.includes("?"))
          .map((block) => {
            const [question, ...rest] = block.split("\n");
            return { question, answer: rest.join(" ") };
          })
      : [];

  return (
    <StoreContainer as="article" width="3xl" padding="lg">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-xs text-ink-muted">
          <li>
            <Link href="/store" className="hover:text-ink">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-ink">{page.title}</li>
        </ol>
      </nav>

      <StorePageTitle
        title={page.title}
        aside={page.status === "draft" ? <Badge tone="warning">Draft preview</Badge> : null}
      />

      {page.template === "faq" && faqItems.length ? (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {faqItems.map((item) => (
            <li key={item.question} className="px-4 py-3.5">
              <p className="text-base font-medium text-ink">{item.question}</p>
              <p className="mt-1 text-sm leading-6 text-ink-muted">{item.answer}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 space-y-4 text-md leading-7 text-ink-muted">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}

      {page.template === "contact" ? (
        <Card className="mt-8">
          <CardBody>
            <h2 className="text-base font-semibold text-ink">Get in touch</h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{page.content}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="mailto:hello@northwind.example"
                className={storeLinkButtonClass({ variant: "primary" })}
              >
                Email support
              </a>
              <StoreLinkButton href="/store/contact" variant="secondary">
                Contact form
              </StoreLinkButton>
            </div>
          </CardBody>
        </Card>
      ) : null}
    </StoreContainer>
  );
}
