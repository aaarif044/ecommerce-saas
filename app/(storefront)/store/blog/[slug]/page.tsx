"use client";

import { PageSkeleton } from "@/components/ui/page-skeleton";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDataStore } from "@/lib/store/data-store";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { WhatsappShareButton } from "@/components/storefront/whatsapp-share";
import {
  StoreContainer,
  StoreLinkButton,
  StorePageTitle,
} from "@/components/storefront/store-container";

export default function BlogPostPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <BlogPostPageContent />
    </React.Suspense>
  );
}

function BlogPostPageContent() {

  const params = useParams<{ slug: string }>();
  const posts = useDataStore((state) => state.blogPosts);
  const post = posts.find((item) => item.slug === params.slug);

  if (!post) {
    return (
      <StoreContainer width="3xl" padding="xl">
        <EmptyState
          title="Story not found"
          description="This article may have been unpublished."
          action={<StoreLinkButton href="/store/blog">All stories</StoreLinkButton>}
        />
      </StoreContainer>
    );
  }

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
          <li>
            <Link href="/store/blog" className="hover:text-ink">
              Stories
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-ink">{post.title}</li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge key={tag} tone="outline" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
        <WhatsappShareButton
          surface="blog"
          payload={{
            path: `/store/blog/${post.slug}`,
            title: post.title,
            blogTitle: post.title,
          }}
        />
      </div>
      <StorePageTitle
        className="mt-3"
        title={post.title}
      >
        <p className="text-sm text-ink-subtle">
          {post.author} · {post.readMinutes} min read
        </p>
      </StorePageTitle>
      <p className="mt-5 text-md font-medium leading-7 text-ink">{post.excerpt}</p>
      <div className="mt-4 space-y-4 text-md leading-7 text-ink-muted">
        {post.content.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </StoreContainer>
  );
}
