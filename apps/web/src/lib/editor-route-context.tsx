"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { collectionsApi, type Collection } from "./collections";

/** The collection entry a dynamic route resolved to, when the tree is being
 * rendered for a URL like /blog/hello-world. Dynamic components (CollectionItem,
 * RelatedPosts) fall back to this when their own entry prop is unset, so the
 * same page content renders the right entry per URL. `null` in the editor. */
export interface PreviewEntryRef {
  collectionId: string;
  entryId: string;
}

interface EditorRouteContextValue {
  workspaceId: string;
  websiteId: string;
  /** All collections in this website — fetched once when the editor mounts, so
   * every dynamic-content component's config picker can list them instantly
   * without each one re-fetching independently. */
  collections: Collection[];
  previewEntry: PreviewEntryRef | null;
}

const EditorRouteContext = createContext<EditorRouteContextValue | null>(null);

export function EditorRouteProvider({
  workspaceId,
  websiteId,
  previewEntry = null,
  children,
}: {
  workspaceId: string;
  websiteId: string;
  previewEntry?: PreviewEntryRef | null;
  children: React.ReactNode;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
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
  }, [workspaceId, websiteId]);

  return (
    <EditorRouteContext.Provider
      value={{ workspaceId, websiteId, collections, previewEntry }}
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
