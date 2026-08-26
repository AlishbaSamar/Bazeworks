"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CreateCollectionModal } from "@/components/collections/CreateCollectionModal";
import { RenameCollectionDialog } from "@/components/collections/RenameCollectionDialog";
import { CollectionRow } from "@/components/collections/CollectionRow";
import { ApiError } from "@/lib/api-client";
import { collectionsApi, type Collection } from "@/lib/collections";
import { websitesApi, type WebsiteOverview } from "@/lib/websites";
import { useWorkspaceContext } from "@/lib/workspace-context";

export default function CollectionsPage() {
  const params = useParams<{ websiteId: string }>();
  const { activeWorkspace } = useWorkspaceContext();

  const [website, setWebsite] = useState<WebsiteOverview | null>(null);
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [renaming, setRenaming] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState<Collection | null>(null);

  const canManage = activeWorkspace.role !== "VIEWER";
  const canDelete = activeWorkspace.role === "OWNER" || activeWorkspace.role === "ADMIN";

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      websitesApi.get(activeWorkspace.id, params.websiteId),
      collectionsApi.list(activeWorkspace.id, params.websiteId),
    ])
      .then(([websiteData, collectionsData]) => {
        if (cancelled) return;
        setWebsite(websiteData);
        setCollections(collectionsData);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "This website doesn't exist in the current workspace."
            : "Couldn't load collections.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, params.websiteId]);

  function handleCreated(collection: Collection) {
    setShowCreate(false);
    setCollections((prev) => (prev ? [...prev, collection] : [collection]));
  }

  async function handleRename(name: string) {
    if (!renaming) return;
    const updated = await collectionsApi.rename(activeWorkspace.id, params.websiteId, renaming.id, name);
    setCollections((prev) => prev?.map((c) => (c.id === renaming.id ? { ...c, ...updated } : c)) ?? null);
    setRenaming(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    await collectionsApi.remove(activeWorkspace.id, params.websiteId, deleting.id);
    setCollections((prev) => prev?.filter((c) => c.id !== deleting.id) ?? null);
    setDeleting(null);
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <FormBanner variant="error">{error}</FormBanner>
        <Link href="/dashboard" className="text-sm font-medium text-foreground hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (!website || !collections) {
    return <p className="text-sm text-muted-foreground">Loading collections…</p>;
  }

  return (
    <div>
      <Link
        href={`/dashboard/websites/${website.id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.56l3.72 3.72a.75.75 0 11-1.06 1.06l-5-5a.75.75 0 010-1.06l5-5a.75.75 0 111.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        Back to {website.name}
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Collections</h1>
          <p className="mt-1 text-sm text-muted-foreground">Structured content for {website.name}.</p>
        </div>
        {canManage && (
          <Button className="w-auto px-4" onClick={() => setShowCreate(true)}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
            Create Collection
          </Button>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5 shadow-sm">
        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken">
              <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <ellipse cx="12" cy="6" rx="8" ry="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">No collections yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create a collection to hold structured content like blog posts, team members, or testimonials.
            </p>
            {canManage && (
              <Button className="mt-5 w-auto px-4" onClick={() => setShowCreate(true)}>
                Create Collection
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {collections.map((collection) => (
              <CollectionRow
                key={collection.id}
                collection={collection}
                href={`/dashboard/websites/${website.id}/collections/${collection.id}`}
                canManage={canManage}
                canDelete={canDelete}
                onRename={() => setRenaming(collection)}
                onDelete={() => setDeleting(collection)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCollectionModal
          workspaceId={activeWorkspace.id}
          websiteId={website.id}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {renaming && (
        <RenameCollectionDialog
          initialName={renaming.name}
          onClose={() => setRenaming(null)}
          onRename={handleRename}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete collection?"
          message={`"${deleting.name}" and all its fields will be permanently deleted. This can't be undone.`}
          confirmLabel="Delete"
          danger
          onClose={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
