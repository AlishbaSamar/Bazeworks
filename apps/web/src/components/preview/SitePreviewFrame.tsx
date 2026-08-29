"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Render, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig } from "@/lib/puck-config";
import { EditorRouteProvider, type PreviewEntryRef } from "@/lib/editor-route-context";
import {
  GlobalComponentsProvider,
  withGlobalFooterDefaults,
  withGlobalHeaderDefaults,
} from "@/lib/global-components-panel";
import { googleFontsHref, themeCssVarsToStyleText, withThemeDefaults } from "@/lib/theme";
import type { NavbarProps, FooterProps } from "@/lib/puck-components/sections";

const noop = () => {};

type Device = "desktop" | "tablet" | "mobile";
const DEVICE_WIDTH: Record<Device, number | null> = { desktop: null, tablet: 820, mobile: 390 };

export interface ResolvedPreview {
  content: Data;
  pageName: string;
  pageSlug: string;
  seoTitle?: string;
  isDynamicTemplate: boolean;
  previewEntry: PreviewEntryRef | null;
}

export function SitePreviewFrame({
  mode,
  workspaceId,
  websiteId,
  websiteName,
  theme: rawTheme,
  header: rawHeader,
  footer: rawFooter,
  resolved,
  titleTemplate,
  currentPath,
  backHref,
  shareUrl,
}: {
  mode: "draft" | "shared";
  workspaceId: string;
  websiteId: string;
  websiteName: string;
  theme: Record<string, unknown>;
  header: Record<string, unknown>;
  footer: Record<string, unknown>;
  resolved: ResolvedPreview;
  titleTemplate?: string;
  currentPath: string;
  backHref?: string;
  shareUrl?: string;
}) {
  const [device, setDevice] = useState<Device>("desktop");
  const [copied, setCopied] = useState(false);

  const theme = useMemo(() => withThemeDefaults(rawTheme), [rawTheme]);
  const header = useMemo(() => withGlobalHeaderDefaults(rawHeader as Partial<NavbarProps>), [rawHeader]);
  const footer = useMemo(() => withGlobalFooterDefaults(rawFooter as Partial<FooterProps>), [rawFooter]);

  useEffect(() => {
    const base = resolved.seoTitle || resolved.pageName;
    document.title = titleTemplate?.includes("%s") ? titleTemplate.replace("%s", base) : base;
  }, [resolved.seoTitle, resolved.pageName, titleTemplate]);

  const width = DEVICE_WIDTH[device];

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900">
        <span className="flex items-center gap-2 font-medium">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          {mode === "shared" ? "Shared preview — not the live site" : "Draft preview — not the live site"}
        </span>

        <div className="flex items-center gap-1 rounded-md border border-amber-300 bg-white/60 p-0.5">
          {(["desktop", "tablet", "mobile"] as Device[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={`rounded px-2 py-0.5 capitalize transition-colors ${
                device === d ? "bg-amber-500 text-white" : "hover:bg-amber-100"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <span className="flex items-center gap-3">
          {shareUrl && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  /* ignore */
                }
              }}
              className="font-medium underline hover:no-underline"
            >
              {copied ? "Link copied!" : "Copy shareable link"}
            </button>
          )}
          {backHref && (
            <Link href={backHref} className="font-medium underline hover:no-underline">
              Back to website
            </Link>
          )}
        </span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: themeCssVarsToStyleText(theme) }} />
      <link rel="stylesheet" href={googleFontsHref([theme.typography.headingFont, theme.typography.bodyFont])} />

      <div
        className={width ? "mx-auto my-4 overflow-hidden rounded-lg border border-border shadow-sm" : ""}
        style={width ? { width, maxWidth: "100%" } : undefined}
      >
        <EditorRouteProvider
          workspaceId={workspaceId}
          websiteId={websiteId}
          previewEntry={resolved.previewEntry}
          publicShare={mode === "shared"}
        >
          <GlobalComponentsProvider header={header} footer={footer} onHeaderChange={noop} onFooterChange={noop}>
            {resolved.isDynamicTemplate && !resolved.previewEntry && (
              <div className="mx-auto max-w-2xl px-4 pt-6 text-center text-sm text-muted-foreground">
                This is a dynamic template. Open it with an entry slug — e.g.{" "}
                <span className="font-mono">
                  {resolved.pageSlug === "/" ? "" : resolved.pageSlug}/your-entry-slug
                </span>
                .
              </div>
            )}
            <Render config={puckConfig} data={resolved.content} />
          </GlobalComponentsProvider>
        </EditorRouteProvider>
      </div>

      <p className="pb-6 text-center text-[11px] text-muted-foreground">
        {websiteName} · {currentPath}
      </p>
    </div>
  );
}
