"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RenameCollectionDialog } from "@/components/collections/RenameCollectionDialog";
import { AddFieldModal } from "@/components/collections/AddFieldModal";
import { FieldRow } from "@/components/collections/FieldRow";
import { ApiError } from "@/lib/api-client";
import {
  collectionsApi,
  type Collection,
  type CollectionField,
  type CollectionWithFields,
} from "@/lib/collections";
import { useWorkspaceContext } from "@/lib/workspace-context";

export default function CollectionFieldsPage() {
  const params = useParams<{ websiteId: string; collectionId: string }>();
  const { activeWorkspace } = useWorkspaceContext();

  const [collection, setCollection] = useState<CollectionWithFields | null>(null);
  const [otherCollections, setOtherCollections] = useState<Collection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [renaming, setRenaming] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState<CollectionField | null>(null);
  const [deletingField, setDeletingField] = useState<CollectionField | null>(null);

  const canManage = activeWorkspace.role !== "VIEWER";

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      collectionsApi.get(activeWorkspace.id, params.websiteId, params.collectionId),
      collectionsApi.list(activeWorkspace.id, params.websiteId),
    ])
      .then(([collectionData, allCollections]) => {
        if (cancelled) return;
        setCollection(collectionData);
        setOtherCollections(allCollections.filter((c) => c.id !== params.collectionId));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "This collection doesn't exist in this website."
            : "Couldn't load this collection.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, params.websiteId, params.collectionId]);

  async function handleRename(name: string) {
    const updated = await collectionsApi.rename(activeWorkspace.id, params.websiteId, params.collectionId, name);
    setCollection((prev) => (prev ? { ...prev, ...updated } : prev));
    setRenaming(false);
  }

  function handleFieldSaved(field: CollectionField) {
    setCollection((prev) => {
      if (!prev) return prev;
      const exists = prev.fields.some((f) => f.id === field.id);
      return {
        ...prev,
        fields: exists ? prev.fields.map((f) => (f.id === field.id ? field : f)) : [...prev.fields, field],
      };
    });
    setShowAddField(false);
    setEditingField(null);
  }

  async function handleDeleteField() {
    if (!deletingField) return;
    await collectionsApi.removeField(activeWorkspace.id, params.websiteId, params.collectionId, deletingField.id);
    setCollection((prev) => (prev ? { ...prev, fields: prev.fields.filter((f) => f.id !== deletingField.id) } : prev));
    setDeletingField(null);
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <FormBanner variant="error">{error}</FormBanner>
        <Link
          href={`/dashboard/websites/${params.websiteId}/collections`}
          className="text-sm font-medium text-foreground hover:underline"
        >
          ← Back to collections
        </Link>
      </div>
    );
  }

  if (!collection) {
    return <p className="text-sm text-muted-foreground">Loading collection…</p>;
  }

  return (
    <div>
      <Link
        href={`/dashboard/websites/${params.websiteId}/collections`}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.56l3.72 3.72a.75.75 0 11-1.06 1.06l-5-5a.75.75 0 010-1.06l5-5a.75.75 0 111.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        Back to collections
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{collection.name}</h1>
            {canManage && (
              <button
                type="button"
                onClick={() => setRenaming(true)}
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Rename
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">/{collection.slug}</p>
        </div>
        {canManage && (
          <Button className="w-auto px-4" onClick={() => setShowAddField(true)}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
            Add Field
          </Button>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Fields ({collection.fields.length})
        </p>

        {collection.fields.length === 0 ? (
          <div className="mt-3 flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong py-14 text-center">
            <p className="text-sm font-medium text-foreground">No fields yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add fields to define the shape of entries in this collection — like title, cover image, or author.
            </p>
            {canManage && (
              <Button className="mt-5 w-auto px-4" onClick={() => setShowAddField(true)}>
                Add Field
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {collection.fields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                canManage={canManage}
                onEdit={() => setEditingField(field)}
                onDelete={() => setDeletingField(field)}
              />
            ))}
          </div>
        )}
      </div>

      {renaming && (
        <RenameCollectionDialog initialName={collection.name} onClose={() => setRenaming(false)} onRename={handleRename} />
      )}

      {showAddField && (
        <AddFieldModal
          workspaceId={activeWorkspace.id}
          websiteId={params.websiteId}
          collectionId={params.collectionId}
          otherCollections={otherCollections}
          onClose={() => setShowAddField(false)}
          onSaved={handleFieldSaved}
        />
      )}

      {editingField && (
        <AddFieldModal
          workspaceId={activeWorkspace.id}
          websiteId={params.websiteId}
          collectionId={params.collectionId}
          otherCollections={otherCollections}
          existingField={editingField}
          onClose={() => setEditingField(null)}
          onSaved={handleFieldSaved}
        />
      )}

      {deletingField && (
        <ConfirmDialog
          title="Delete field?"
          message={`"${deletingField.name}" will be permanently removed from this collection.`}
          confirmLabel="Delete"
          danger
          onClose={() => setDeletingField(null)}
          onConfirm={handleDeleteField}
        />
      )}
    </div>
  );
}
