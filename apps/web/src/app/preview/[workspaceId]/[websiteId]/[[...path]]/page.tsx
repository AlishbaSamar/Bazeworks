"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";
import { pagesApi } from "@/lib/pages";
import { websitesApi, type WebsiteOverview } from "@/lib/websites";
import { publishingApi } from "@/lib/publishing";
import { SitePreviewFrame, type ResolvedPreview } from "@/components/preview/SitePreviewFrame";

export default function PreviewPage() {
  const router = useRouter();
  const params = useParams<{ workspaceId: string; websiteId: string; path?: string[] }>();
  const { data: session, isPending } = useSession();

  const workspaceId = params.workspaceId;
  const websiteId = params.websiteId;
  const path = useMemo(() => {
    const segments = Array.isArray(params.path) ? params.path : [];
    return "/" + segments.join("/");
  }, [params.path]);

  const [website, setWebsite] = useState<WebsiteOverview | null>(null);
  const [resolved, setResolved] = useState<ResolvedPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, session, router]);

  useEffect(() => {
    if (!session) return;
    publishingApi
      .createPreviewLink(workspaceId, websiteId)
      .then((r) => setShareUrl(r.url))
      .catch(() => setShareUrl(undefined));
  }, [session, workspaceId, websiteId]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setResolved(null);
      setError(null);
    });

    (async () => {
      try {
        const site = await websitesApi.get(workspaceId, websiteId);
        if (cancelled) return;
        setWebsite(site);

        const normalized = path === "" ? "/" : path;
        const exact = site.pages.find((p) => p.slug === normalized);

        if (exact) {
          const full = await pagesApi.get(workspaceId, websiteId, exact.id);
          if (cancelled) return;
          setResolved({
            content: full.content,
            pageName: full.name,
            pageSlug: full.slug,
            seoTitle: full.seo?.title,
            isDynamicTemplate: full.isDynamic,
            previewEntry: null,
          });
          return;
        }

        const { page, entry } = await pagesApi.resolve(workspaceId, websiteId, normalized);
        if (cancelled) return;
        setResolved({
          content: page.content,
          pageName: page.name,
          pageSlug: normalized,
          seoTitle: page.seo?.title,
          isDynamicTemplate: true,
          previewEntry: { collectionId: entry.collectionId, entryId: entry.id },
        });
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? `Nothing resolves at "${path}" in this website.`
            : "Couldn't load this preview.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, workspaceId, websiteId, path]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Link href={`/dashboard/websites/${websiteId}`} className="text-sm font-medium text-foreground hover:underline">
          ← Back to website
        </Link>
      </div>
    );
  }

  if (!website || !resolved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-muted-foreground">Loading preview…</p>
      </div>
    );
  }

  return (
    <SitePreviewFrame
      mode="draft"
      workspaceId={workspaceId}
      websiteId={websiteId}
      websiteName={website.name}
      theme={website.theme as Record<string, unknown>}
      header={website.globalHeader}
      footer={website.globalFooter}
      resolved={resolved}
      titleTemplate={website.seo?.titleTemplate}
      currentPath={path}
      backHref={`/dashboard/websites/${websiteId}`}
      shareUrl={shareUrl}
    />
  );
}
