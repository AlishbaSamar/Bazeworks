"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EntryFormModal } from "@/components/collections/EntryFormModal";
import { EntryRow } from "@/components/collections/EntryRow";
import { ApiError } from "@/lib/api-client";
import { collectionsApi, getEntryLabel, type CollectionEntry, type CollectionWithFields } from "@/lib/collections";
import { useWorkspaceContext } from "@/lib/workspace-context";

const PAGE_SIZE = 25;

export default function CollectionEntriesPage() {
  const params = useParams<{ websiteId: string; collectionId: string }>();
  const { activeWorkspace } = useWorkspaceContext();

  const [collection, setCollection] = useState<CollectionWithFields | null>(null);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined]);
  const [pageIndex, setPageIndex] = useState(0);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [sort, setSort] = useState<"newest" | "oldest" | "recently-updated">("newest");

  const sortParams =
    sort === "oldest"
      ? { sort: "createdAt" as const, order: "asc" as const }
      : sort === "recently-updated"
        ? { sort: "updatedAt" as const, order: "desc" as const }
        : { sort: "createdAt" as const, order: "desc" as const };

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CollectionEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<CollectionEntry | null>(null);

  const canManage = activeWorkspace.role !== "VIEWER";

  useEffect(() => {
    let cancelled = false;
    collectionsApi
      .get(activeWorkspace.id, params.websiteId, params.collectionId)
      .then((data) => {
        if (!cancelled) setCollection(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setCollectionError(
          err instanceof ApiError && err.status === 404
            ? "This collection doesn't exist in this website."
            : "Couldn't load this collection.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, params.websiteId, params.collectionId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQ(searchInput.trim());
      setCursorHistory([undefined]);
      setPageIndex(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Changing a filter or the sort invalidates the cursor stack — restart at page 1.
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setCursorHistory([undefined]);
      setPageIndex(0);
    });
    return () => {
      cancelled = true;
    };
  }, [statusFilter, sort]);

  const currentCursor = cursorHistory[pageIndex];

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setEntriesLoading(true);
        setEntriesError(null);
      }
    });
    collectionsApi
      .listEntries(activeWorkspace.id, params.websiteId, params.collectionId, {
        cursor: currentCursor,
        limit: PAGE_SIZE,
        q: debouncedQ || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        ...sortParams,
      })
      .then((page) => {
        if (cancelled) return;
        setEntries(page.entries);
        setNextCursor(page.nextCursor);
      })
      .catch(() => {
        if (cancelled) return;
        setEntriesError("Couldn't load entries.");
      })
      .finally(() => {
        if (!cancelled) setEntriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeWorkspace.id,
    params.websiteId,
    params.collectionId,
    currentCursor,
    debouncedQ,
    statusFilter,
    sort,
  ]);

  // Re-fetches whichever page is currently on screen from the server, so the
  // 25-item limit and nextCursor stay correct after a create/edit/delete —
  // splicing the change into local state directly would let the list grow
  // past the page size and would leave nextCursor stale.
  async function refetchCurrentPage() {
    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const page = await collectionsApi.listEntries(activeWorkspace.id, params.websiteId, params.collectionId, {
        cursor: currentCursor,
        limit: PAGE_SIZE,
        q: debouncedQ || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        ...sortParams,
      });
      if (page.entries.length === 0 && pageIndex > 0) {
        // this page emptied out (e.g. its only entry was just deleted) — step back
        setPageIndex((i) => Math.max(0, i - 1));
        return;
      }
      setEntries(page.entries);
      setNextCursor(page.nextCursor);
    } catch {
      setEntriesError("Couldn't load entries.");
    } finally {
      setEntriesLoading(false);
    }
  }

  async function handleToggleStatus(entry: CollectionEntry) {
    const nextStatus = entry.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await collectionsApi.updateEntryStatus(activeWorkspace.id, params.websiteId, params.collectionId, entry.id, nextStatus);
    await refetchCurrentPage();
  }

  function goNext() {
    if (!nextCursor) return;
    setCursorHistory((prev) => {
      const updated = [...prev];
      updated[pageIndex + 1] = nextCursor;
      return updated;
    });
    setPageIndex((i) => i + 1);
  }

  function goPrev() {
    setPageIndex((i) => Math.max(0, i - 1));
  }

  function handleEntrySaved() {
    setShowAddEntry(false);
    setEditingEntry(null);
    void refetchCurrentPage();
  }

  async function handleDeleteEntry() {
    if (!deletingEntry) return;
    await collectionsApi.removeEntry(activeWorkspace.id, params.websiteId, params.collectionId, deletingEntry.id);
    setDeletingEntry(null);
    await refetchCurrentPage();
  }

  if (collectionError) {
    return (
      <div className="flex flex-col gap-4">
        <FormBanner variant="error">{collectionError}</FormBanner>
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
        href={`/dashboard/websites/${params.websiteId}/collections/${params.collectionId}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.56l3.72 3.72a.75.75 0 11-1.06 1.06l-5-5a.75.75 0 010-1.06l5-5a.75.75 0 111.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        Back to fields
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{collection.name} entries</h1>
          <p className="mt-1 text-sm text-muted-foreground">/{collection.slug}</p>
        </div>
        {canManage && collection.fields.length > 0 && (
          <Button className="w-auto px-4" onClick={() => setShowAddEntry(true)}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
            Add Entry
          </Button>
        )}
      </div>

      {collection.fields.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface py-14 text-center">
          <p className="text-sm font-medium text-foreground">This collection has no fields yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Add at least one field before creating entries.</p>
          <Link href={`/dashboard/websites/${params.websiteId}/collections/${params.collectionId}`} className="mt-5">
            <Button className="w-auto px-4">Go to field builder</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Entries</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search…"
                className="h-9 w-full max-w-xs rounded-md border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="h-9 rounded-md border border-border bg-white px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
              <select
                aria-label="Sort entries"
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="h-9 rounded-md border border-border bg-white px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="recently-updated">Recently updated</option>
              </select>
            </div>
          </div>

          {entriesError && (
            <div className="mt-3">
              <FormBanner variant="error">{entriesError}</FormBanner>
            </div>
          )}

          {entriesLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading entries…</p>
          ) : entries.length === 0 ? (
            <div className="mt-3 flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong py-14 text-center">
              <p className="text-sm font-medium text-foreground">
                {debouncedQ || statusFilter !== "ALL"
                  ? "No entries match your filters"
                  : "No entries yet"}
              </p>
              {!debouncedQ && statusFilter === "ALL" && (
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Add your first entry to start filling this collection with content.
                </p>
              )}
              {canManage && !debouncedQ && statusFilter === "ALL" && (
                <Button className="mt-5 w-auto px-4" onClick={() => setShowAddEntry(true)}>
                  Add Entry
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mt-3 flex flex-col gap-2">
                {entries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    fields={collection.fields}
                    canManage={canManage}
                    onEdit={() => setEditingEntry(entry)}
                    onToggleStatus={() => handleToggleStatus(entry)}
                    onDelete={() => setDeletingEntry(entry)}
                  />
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Button type="button" variant="secondary" className="w-auto px-4" onClick={goPrev} disabled={pageIndex === 0}>
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">Page {pageIndex + 1}</span>
                <Button type="button" variant="secondary" className="w-auto px-4" onClick={goNext} disabled={!nextCursor}>
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {showAddEntry && (
        <EntryFormModal
          workspaceId={activeWorkspace.id}
          websiteId={params.websiteId}
          collectionId={params.collectionId}
          fields={collection.fields}
          onClose={() => setShowAddEntry(false)}
          onSaved={handleEntrySaved}
        />
      )}

      {editingEntry && (
        <EntryFormModal
          workspaceId={activeWorkspace.id}
          websiteId={params.websiteId}
          collectionId={params.collectionId}
          fields={collection.fields}
          existingEntry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={handleEntrySaved}
        />
      )}

      {deletingEntry && (
        <ConfirmDialog
          title="Delete entry?"
          message={`"${getEntryLabel(collection.fields, deletingEntry)}" will be permanently removed.`}
          confirmLabel="Delete"
          danger
          onClose={() => setDeletingEntry(null)}
          onConfirm={handleDeleteEntry}
        />
      )}
    </div>
  );
}
