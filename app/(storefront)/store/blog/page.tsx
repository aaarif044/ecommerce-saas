"use client";

import * as React from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/store/data-store";
import { StoreContainer, StorePageTitle } from "@/components/storefront/store-container";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

export default function BlogListPage() {
  const posts = useDataStore((state) => state.blogPosts);
  const published = posts
    .filter((post) => post.status === "published")
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <StoreContainer width="5xl" padding="lg">
      <StorePageTitle
        title="Stories"
        description="Notes from the workshop, care guides and seasonal edits."
      />

      {published.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {published.map((post) => (
            <Link
              key={post.id}
              href={`/store/blog/${post.slug}`}
              className="group flex flex-col rounded-xl border border-line bg-surface p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Badge key={tag} tone="outline" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h2 className="mt-3 text-md font-semibold leading-6 text-ink group-hover:underline">
                {post.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-muted">{post.excerpt}</p>
              <p className="mt-4 text-xs text-ink-subtle">
                {post.author} · {post.readMinutes} min read · {post.views.toLocaleString("en-IN")} views
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="No stories published yet" />
        </div>
      )}
    </StoreContainer>
  );
}
