"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { publicPreviewApi, type PublicPreviewResponse } from "@/lib/preview";
import { SitePreviewFrame, type ResolvedPreview } from "@/components/preview/SitePreviewFrame";

export default function SharedPreviewPage() {
  const params = useParams<{ token: string; path?: string[] }>();
  const token = params.token;
  const path = useMemo(() => {
    const segments = Array.isArray(params.path) ? params.path : [];
    return "/" + segments.join("/");
  }, [params.path]);

  const [data, setData] = useState<PublicPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setData(null);
        setError(null);
      }
    });
    publicPreviewApi
      .resolve(token, path === "" ? "/" : path)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 403
            ? "This preview link is invalid or has expired."
            : err instanceof ApiError && err.status === 404
              ? `Nothing resolves at "${path}".`
              : "Couldn't load this preview.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token, path]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-muted-foreground">Loading preview…</p>
      </div>
    );
  }

  const resolved: ResolvedPreview = {
    content: data.page.content,
    pageName: data.page.name,
    pageSlug: data.page.slug,
    seoTitle: data.page.seo?.title,
    isDynamicTemplate: data.page.isDynamic,
    previewEntry: data.entry
      ? {
          collectionId: data.entry.collectionId,
          entryId: data.entry.id,
          data: data.entry.data,
          fields: data.collectionFields ?? [],
        }
      : null,
  };

  return (
    <SitePreviewFrame
      mode="shared"
      workspaceId=""
      websiteId={data.website.id}
      websiteName={data.website.name}
      theme={data.website.theme}
      header={data.website.globalHeader}
      footer={data.website.globalFooter}
      resolved={resolved}
      titleTemplate={data.website.seo?.titleTemplate}
      currentPath={path}
    />
  );
}
