"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { collectionsApi, type Collection } from "./collections";

interface EditorRouteContextValue {
  workspaceId: string;
  websiteId: string;
  /** All collections in this website — fetched once when the editor mounts, so
   * every dynamic-content component's config picker can list them instantly
   * without each one re-fetching independently. */
  collections: Collection[];
}

const EditorRouteContext = createContext<EditorRouteContextValue | null>(null);

export function EditorRouteProvider({
  workspaceId,
  websiteId,
  children,
}: {
  workspaceId: string;
  websiteId: string;
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
    <EditorRouteContext.Provider value={{ workspaceId, websiteId, collections }}>
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
