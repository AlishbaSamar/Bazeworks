"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Puck, usePuck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { useSession } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";
import { pagesApi, type PageWithContent } from "@/lib/pages";
import { websitesApi } from "@/lib/websites";
import { puckConfig } from "@/lib/puck-config";
import { SearchableDrawer, TabbedFields } from "@/lib/puck-overrides";
import { DEFAULT_THEME, googleFontsHref, themeCssVarsToStyleText, withThemeDefaults, type Theme } from "@/lib/theme";
import { THEME_PLUGINS, ThemeEditProvider } from "@/lib/theme-panel";
import {
  GlobalComponentsProvider,
  HEADER_FOOTER_PLUGINS,
  withGlobalFooterDefaults,
  withGlobalHeaderDefaults,
} from "@/lib/global-components-panel";
import type { NavbarProps, FooterProps } from "@/lib/puck-components/sections";

const THEME_STYLE_TAG_ID = "bazeworks-site-theme-vars";
const THEME_FONT_LINK_ID = "bazeworks-site-theme-fonts";
const EDITOR_PLUGINS = [...THEME_PLUGINS, ...HEADER_FOOTER_PLUGINS];

type SaveStatus = "idle" | "saving" | "saved" | "error";

function EditorHeaderActions({
  websiteId,
  saveStatus,
  onSave,
}: {
  websiteId: string;
  saveStatus: SaveStatus;
  onSave: (data: Data) => void;
}) {
  const { appState } = usePuck();

  return (
    <div className="flex items-center gap-3">
      {saveStatus === "saved" && (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-10.3a1 1 0 00-1.4-1.4L9 9.58 7.7 8.3a1 1 0 00-1.4 1.42l2 2a1 1 0 001.4 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Saved
        </span>
      )}
      {saveStatus === "error" && (
        <span className="text-xs font-medium text-destructive">Save failed</span>
      )}
      <Link
        href={`/dashboard/websites/${websiteId}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.56l3.72 3.72a.75.75 0 11-1.06 1.06l-5-5a.75.75 0 010-1.06l5-5a.75.75 0 111.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        Back to website
      </Link>
      <button
        type="button"
        onClick={() => onSave(appState.data)}
        disabled={saveStatus === "saving"}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saveStatus === "saving" && (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {saveStatus === "saving" ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        disabled
        title="Coming Day 11"
        className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-muted-foreground"
      >
        Publish
      </button>
    </div>
  );
}

export default function PageEditor() {
  const router = useRouter();
  const params = useParams<{ workspaceId: string; websiteId: string; pageId: string }>();
  const { data: session, isPending } = useSession();

  const [page, setPage] = useState<PageWithContent | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [header, setHeader] = useState<NavbarProps | null>(null);
  const [footer, setFooter] = useState<FooterProps | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const themeSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const footerSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const themeLoadedFromServer = useRef(false);
  const globalComponentsLoadedFromServer = useRef(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    pagesApi
      .get(params.workspaceId, params.websiteId, params.pageId)
      .then((data) => {
        if (!cancelled) setPage(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "This page doesn't exist in the current workspace."
            : "Couldn't load this page.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [session, params.workspaceId, params.websiteId, params.pageId]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    websitesApi
      .get(params.workspaceId, params.websiteId)
      .then((website) => {
        if (cancelled) return;
        themeLoadedFromServer.current = true;
        globalComponentsLoadedFromServer.current = true;
        setTheme(withThemeDefaults(website.theme));
        setHeader(withGlobalHeaderDefaults(website.globalHeader as Partial<NavbarProps>));
        setFooter(withGlobalFooterDefaults(website.globalFooter as Partial<FooterProps>));
      })
      .catch(() => {
        if (cancelled) return;
        themeLoadedFromServer.current = true;
        globalComponentsLoadedFromServer.current = true;
        setTheme(DEFAULT_THEME);
        setHeader(withGlobalHeaderDefaults(null));
        setFooter(withGlobalFooterDefaults(null));
      });
    return () => {
      cancelled = true;
    };
  }, [session, params.workspaceId, params.websiteId]);

  // Create the theme <style>/<link> tags once and tear them down only on
  // unmount — Puck syncs host <style>/<link> tags into its canvas iframe,
  // so every Layout/Section component (which reads var(--site-*)) updates
  // live as their content is updated below, without a destroy/recreate
  // cycle on every keystroke in the theme panel.
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.id = THEME_STYLE_TAG_ID;
    document.head.appendChild(styleTag);

    const linkTag = document.createElement("link");
    linkTag.id = THEME_FONT_LINK_ID;
    linkTag.rel = "stylesheet";
    document.head.appendChild(linkTag);

    return () => {
      styleTag.remove();
      linkTag.remove();
    };
  }, []);

  useEffect(() => {
    if (!theme) return;
    const styleTag = document.getElementById(THEME_STYLE_TAG_ID);
    if (styleTag) styleTag.textContent = themeCssVarsToStyleText(theme);
  }, [theme]);

  // Fonts are user-selectable at runtime, so load them via the Google Fonts
  // CSS2 API rather than next/font (which only knows fonts picked at build
  // time). Deliberately scoped to just the two font fields — re-fetching
  // the stylesheet on every unrelated color edit would be wasteful.
  useEffect(() => {
    if (!theme) return;
    const linkTag = document.getElementById(THEME_FONT_LINK_ID) as HTMLLinkElement | null;
    if (linkTag) linkTag.href = googleFontsHref([theme.typography.headingFont, theme.typography.bodyFont]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme?.typography.headingFont, theme?.typography.bodyFont]);

  // Auto-save theme edits (debounced) — website-level settings persist
  // immediately elsewhere in the app (e.g. rename), unlike page content
  // which waits for an explicit Save.
  useEffect(() => {
    if (!theme || !themeLoadedFromServer.current) return;
    if (themeSaveTimeoutRef.current) clearTimeout(themeSaveTimeoutRef.current);
    themeSaveTimeoutRef.current = setTimeout(() => {
      websitesApi.updateTheme(params.workspaceId, params.websiteId, theme).catch(() => {});
    }, 600);
    return () => {
      if (themeSaveTimeoutRef.current) clearTimeout(themeSaveTimeoutRef.current);
    };
  }, [theme, params.workspaceId, params.websiteId]);

  // Auto-save global header/footer edits (debounced), same pattern as theme.
  useEffect(() => {
    if (!header || !globalComponentsLoadedFromServer.current) return;
    if (headerSaveTimeoutRef.current) clearTimeout(headerSaveTimeoutRef.current);
    headerSaveTimeoutRef.current = setTimeout(() => {
      websitesApi.updateGlobalHeader(params.workspaceId, params.websiteId, header).catch(() => {});
    }, 600);
    return () => {
      if (headerSaveTimeoutRef.current) clearTimeout(headerSaveTimeoutRef.current);
    };
  }, [header, params.workspaceId, params.websiteId]);

  useEffect(() => {
    if (!footer || !globalComponentsLoadedFromServer.current) return;
    if (footerSaveTimeoutRef.current) clearTimeout(footerSaveTimeoutRef.current);
    footerSaveTimeoutRef.current = setTimeout(() => {
      websitesApi.updateGlobalFooter(params.workspaceId, params.websiteId, footer).catch(() => {});
    }, 600);
    return () => {
      if (footerSaveTimeoutRef.current) clearTimeout(footerSaveTimeoutRef.current);
    };
  }, [footer, params.workspaceId, params.websiteId]);

  async function handleSave(data: Data) {
    setSaveStatus("saving");
    try {
      await pagesApi.updateContent(params.workspaceId, params.websiteId, params.pageId, data);
      setSaveStatus("saved");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Link
          href={`/dashboard/websites/${params.websiteId}`}
          className="text-sm font-medium text-foreground hover:underline"
        >
          ← Back to website
        </Link>
      </div>
    );
  }

  if (isPending || !session || !page || !theme || !header || !footer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading editor…</p>
      </div>
    );
  }

  return (
    <ThemeEditProvider theme={theme} onChange={setTheme}>
      <GlobalComponentsProvider header={header} footer={footer} onHeaderChange={setHeader} onFooterChange={setFooter}>
        <Puck
          config={puckConfig}
          data={page.content}
          headerTitle={page.name}
          headerPath={page.slug}
          height="100vh"
          plugins={EDITOR_PLUGINS}
          overrides={{
            headerActions: () => (
              <EditorHeaderActions websiteId={params.websiteId} saveStatus={saveStatus} onSave={handleSave} />
            ),
            drawer: SearchableDrawer,
            fields: TabbedFields,
          }}
        />
      </GlobalComponentsProvider>
    </ThemeEditProvider>
  );
}
