"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Render, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { useSession } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";
import { pagesApi } from "@/lib/pages";
import { websitesApi, type WebsiteOverview } from "@/lib/websites";
import { puckConfig } from "@/lib/puck-config";
import { EditorRouteProvider, type PreviewEntryRef } from "@/lib/editor-route-context";
import { GlobalComponentsProvider, withGlobalFooterDefaults, withGlobalHeaderDefaults } from "@/lib/global-components-panel";
import { googleFontsHref, themeCssVarsToStyleText, withThemeDefaults } from "@/lib/theme";
import type { NavbarProps, FooterProps } from "@/lib/puck-components/sections";

const noop = () => {};

interface Resolved {
  content: Data;
  pageName: string;
  pageSlug: string;
  isDynamicTemplate: boolean;
  previewEntry: PreviewEntryRef | null;
}

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
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, session, router]);

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
            isDynamicTemplate: full.isDynamic,
            previewEntry: null,
          });
          return;
        }

        // No page owns this path directly — try resolving it as a dynamic
        // route (e.g. /blog/hello-world against a "/blog" dynamic page).
        const { page, entry } = await pagesApi.resolve(workspaceId, websiteId, normalized);
        if (cancelled) return;
        setResolved({
          content: page.content,
          pageName: page.name,
          pageSlug: normalized,
          isDynamicTemplate: true,
          previewEntry: { collectionId: entry.collectionId, entryId: entry.id },
        });
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? `Nothing is published at "${path}" in this website.`
            : "Couldn't load this preview.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, workspaceId, websiteId, path]);

  const theme = useMemo(
    () => (website ? withThemeDefaults(website.theme) : null),
    [website],
  );
  const header = useMemo<NavbarProps | null>(
    () => (website ? withGlobalHeaderDefaults(website.globalHeader as Partial<NavbarProps>) : null),
    [website],
  );
  const footer = useMemo<FooterProps | null>(
    () => (website ? withGlobalFooterDefaults(website.globalFooter as Partial<FooterProps>) : null),
    [website],
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900">
        <span className="flex items-center gap-2 font-medium">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          Draft preview — this is not the live site
        </span>
        <span className="flex items-center gap-3">
          {website && <span className="hidden font-mono text-amber-700 sm:inline">{website.name}{path}</span>}
          <Link href={`/dashboard/websites/${websiteId}`} className="font-medium underline hover:no-underline">
            Back to website
          </Link>
        </span>
      </div>

      {theme && (
        <>
          <style dangerouslySetInnerHTML={{ __html: themeCssVarsToStyleText(theme) }} />
          <link
            rel="stylesheet"
            href={googleFontsHref([theme.typography.headingFont, theme.typography.bodyFont])}
          />
        </>
      )}

      {error ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Link
            href={`/dashboard/websites/${websiteId}`}
            className="text-sm font-medium text-foreground hover:underline"
          >
            ← Back to website
          </Link>
        </div>
      ) : !resolved || !header || !footer ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading preview…</p>
        </div>
      ) : (
        <EditorRouteProvider
          workspaceId={workspaceId}
          websiteId={websiteId}
          previewEntry={resolved.previewEntry}
        >
          <GlobalComponentsProvider
            header={header}
            footer={footer}
            onHeaderChange={noop}
            onFooterChange={noop}
          >
            {resolved.isDynamicTemplate && !resolved.previewEntry && (
              <div className="mx-auto max-w-2xl px-4 pt-6 text-center text-sm text-muted-foreground">
                This is a dynamic template. Open it with an entry slug — e.g.{" "}
                <span className="font-mono">{resolved.pageSlug}/your-entry-slug</span>.
              </div>
            )}
            <Render config={puckConfig} data={resolved.content} />
          </GlobalComponentsProvider>
        </EditorRouteProvider>
      )}
    </div>
  );
}
