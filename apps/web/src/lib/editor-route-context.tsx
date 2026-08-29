"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { collectionsApi, type Collection, type CollectionField } from "./collections";

/** The collection entry a dynamic route resolved to, when the tree is being
 * rendered for a URL like /blog/hello-world. Dynamic components (CollectionItem,
 * RelatedPosts) fall back to this when their own entry prop is unset, so the
 * same page content renders the right entry per URL. `null` in the editor.
 *
 * In a public share (no session) `data` + `fields` are provided so
 * CollectionItem can render without an authenticated fetch. */
export interface PreviewEntryRef {
  collectionId: string;
  entryId: string;
  data?: Record<string, unknown>;
  fields?: CollectionField[];
}

interface EditorRouteContextValue {
  workspaceId: string;
  websiteId: string;
  /** All collections in this website — fetched once when the editor mounts, so
   * every dynamic-content component's config picker can list them instantly
   * without each one re-fetching independently. */
  collections: Collection[];
  previewEntry: PreviewEntryRef | null;
  /** True on the tokenised public preview route: dynamic list components have
   * no way to fetch collection data without a session, so they render a notice
   * instead. */
  publicShare: boolean;
}

const EditorRouteContext = createContext<EditorRouteContextValue | null>(null);

export function EditorRouteProvider({
  workspaceId,
  websiteId,
  previewEntry = null,
  publicShare = false,
  children,
}: {
  workspaceId: string;
  websiteId: string;
  previewEntry?: PreviewEntryRef | null;
  publicShare?: boolean;
  children: React.ReactNode;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    if (publicShare) return;
    let cancelled = false;
    collectionsApi
      .list(workspaceId, websiteId)
      .then((list) => {
        if (!cancelled) setCollections(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [workspaceId, websiteId, publicShare]);

  return (
    <EditorRouteContext.Provider
      value={{ workspaceId, websiteId, collections, previewEntry, publicShare }}
    >
      {children}
    </EditorRouteContext.Provider>
  );
}

export function useEditorRoute() {
  const ctx = useContext(EditorRouteContext);
  if (!ctx) {
    throw new Error("useEditorRoute must be used within EditorRouteProvider");
  }
  return ctx;
}
