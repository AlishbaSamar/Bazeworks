"use client";

import { useEffect, useState } from "react";
import type { Config } from "@puckeditor/core";
import { useEditorRoute } from "../editor-route-context";
import {
  collectionsApi,
  getEntryImage,
  getEntryLabel,
  type CollectionEntry,
  type CollectionField,
} from "../collections";
import { entryField, multiEntryField, sourceField, type EntryPickerValue, type MultiEntryPickerValue } from "./dynamic-fields";
import { SITE, bodyStyle, headingStyle, spacing } from "./site-styles";

const SORT_OPTIONS = [
  { label: "Newest first", value: "desc" },
  { label: "Oldest first", value: "asc" },
];

const YES_NO_OPTIONS = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];

// ---- Shared data-fetching + presentation, used by every component below ----

function useEntries(
  collectionId: string,
  opts: { limit?: number; order?: "asc" | "desc"; publishedOnly?: boolean },
) {
  const { workspaceId, websiteId } = useEditorRoute();
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [fields, setFields] = useState<CollectionField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collectionId) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) {
          setEntries([]);
          setFields([]);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    Promise.all([
      collectionsApi.get(workspaceId, websiteId, collectionId),
      collectionsApi.listEntries(workspaceId, websiteId, collectionId, {
        limit: opts.limit,
        order: opts.order,
        status: opts.publishedOnly ? "PUBLISHED" : undefined,
      }),
    ])
      .then(([collection, page]) => {
        if (cancelled) return;
        setFields(collection.fields);
        setEntries(page.entries);
      })
      .catch(() => {
        if (!cancelled) {
          setFields([]);
          setEntries([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, websiteId, collectionId, opts.limit, opts.order, opts.publishedOnly]);

  return { entries, fields, loading };
}

function useSingleEntry(collectionId: string, entryId: string) {
  const { workspaceId, websiteId } = useEditorRoute();
  const [entry, setEntry] = useState<CollectionEntry | null>(null);
  const [fields, setFields] = useState<CollectionField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collectionId || !entryId) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) {
          setEntry(null);
          setFields([]);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    Promise.all([
      collectionsApi.get(workspaceId, websiteId, collectionId),
      collectionsApi.getEntry(workspaceId, websiteId, collectionId, entryId),
    ])
      .then(([collection, fetchedEntry]) => {
        if (cancelled) return;
        setFields(collection.fields);
        setEntry(fetchedEntry);
      })
      .catch(() => {
        if (!cancelled) {
          setEntry(null);
          setFields([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, websiteId, collectionId, entryId]);

  return { entry, fields, loading };
}

/** First RICH_TEXT/TEXTAREA field with a value — used as the "body" on a detail view. */
function getEntryBody(fields: CollectionField[], entry: CollectionEntry): string | null {
  const hasValue = (f: CollectionField) => typeof entry.data[f.key] === "string" && entry.data[f.key];
  // Prefer an actual RICH_TEXT field over a TEXTAREA (usually an excerpt/summary,
  // not the main content) when a collection has both.
  const bodyField = fields.find((f) => f.type === "RICH_TEXT" && hasValue(f)) ?? fields.find((f) => f.type === "TEXTAREA" && hasValue(f));
  return bodyField ? String(entry.data[bodyField.key]) : null;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{ borderColor: SITE.border, borderRadius: SITE.radius, ...bodyStyle, opacity: 0.6 }}
      className="flex items-center justify-center border border-dashed p-8 text-center text-sm"
    >
      {message}
    </div>
  );
}

function EntryCard({ fields, entry }: { fields: CollectionField[]; entry: CollectionEntry }) {
  const label = getEntryLabel(fields, entry);
  const image = getEntryImage(fields, entry);
  return (
    <div style={{ borderColor: SITE.border, borderRadius: SITE.radius }} className="overflow-hidden border">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={label} className="h-40 w-full object-cover" />
      ) : (
        <div style={{ background: SITE.background, opacity: 0.6, ...bodyStyle }} className="flex h-40 w-full items-center justify-center text-xs">
          No image
        </div>
      )}
      <div className="p-4">
        <p style={{ ...headingStyle, fontSize: "1rem" }}>{label}</p>
      </div>
    </div>
  );
}

function CardGrid({
  heading,
  loading,
  entries,
  fields,
  emptyMessage,
}: {
  heading?: string;
  loading: boolean;
  entries: CollectionEntry[];
  fields: CollectionField[];
  emptyMessage: string;
}) {
  return (
    <div style={{ paddingBlock: spacing(8) }}>
      {heading && (
        <h2 style={{ ...headingStyle, fontSize: "1.875rem" }} className="mb-6">
          {heading}
        </h2>
      )}
      {loading ? (
        <p style={{ ...bodyStyle, opacity: 0.6 }} className="text-sm">
          Loading…
        </p>
      ) : entries.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} fields={fields} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Collection List ----

export interface CollectionListProps {
  source: string;
  heading: string;
  limit: number;
  order: "asc" | "desc";
  publishedOnly: boolean;
}

function CollectionListRender({ source, heading, limit, order, publishedOnly }: CollectionListProps) {
  const { entries, fields, loading } = useEntries(source, { limit, order, publishedOnly });
  if (!source) return <EmptyState message="Choose a collection in the properties panel." />;
  return <CardGrid heading={heading} loading={loading} entries={entries} fields={fields} emptyMessage="No entries in this collection yet." />;
}

// ---- Recent Posts (Collection List, pinned to newest-first) ----

export interface RecentPostsProps {
  source: string;
  heading: string;
  limit: number;
}

function RecentPostsRender({ source, heading, limit }: RecentPostsProps) {
  const { entries, fields, loading } = useEntries(source, { limit, order: "desc", publishedOnly: true });
  if (!source) return <EmptyState message="Choose a collection in the properties panel." />;
  return <CardGrid heading={heading} loading={loading} entries={entries} fields={fields} emptyMessage="No published entries yet." />;
}

// ---- Related Posts ----

export interface RelatedPostsProps {
  source: string;
  heading: string;
  limit: number;
  excludeEntry: EntryPickerValue;
}

function RelatedPostsRender({ source, heading, limit, excludeEntry }: RelatedPostsProps) {
  // Fetch one extra so excluding the "preview against" entry still leaves `limit` cards.
  const { entries, fields, loading } = useEntries(source, { limit: limit + 1, order: "desc", publishedOnly: true });
  const { previewEntry } = useEditorRoute();
  if (!source) return <EmptyState message="Choose a collection in the properties panel." />;
  // On a resolved dynamic route the current entry is what we exclude; the
  // editor's "preview against" pick is only a stand-in for that.
  const excludeId = previewEntry?.entryId || excludeEntry?.entryId;
  const filtered = entries.filter((e) => e.id !== excludeId).slice(0, limit);
  return <CardGrid heading={heading} loading={loading} entries={filtered} fields={fields} emptyMessage="No other entries to relate yet." />;
}

// ---- Featured Content ----

export interface FeaturedContentProps {
  heading: string;
  entries: MultiEntryPickerValue;
}

function FeaturedContentRender({ heading, entries: picked }: FeaturedContentProps) {
  const { entries, fields, loading } = useEntries(picked?.collectionId ?? "", {});
  const ids = picked?.entryIds ?? [];
  if (!picked?.collectionId) return <EmptyState message="Pick a collection and entries in the properties panel." />;
  const ordered = ids.map((id) => entries.find((e) => e.id === id)).filter((e): e is CollectionEntry => !!e);
  return <CardGrid heading={heading} loading={loading} entries={ordered} fields={fields} emptyMessage="Pick some entries to feature." />;
}

// ---- Collection Item ----
// The primary use is as the main content block on a dynamic detail page
// (Day 11's preview will feed it the resolved entry); the "preview entry"
// picked here is what the editor shows meanwhile.

export interface CollectionItemProps {
  entry: EntryPickerValue;
}

function CollectionItemRender({ entry: picked }: CollectionItemProps) {
  const { previewEntry } = useEditorRoute();
  // A resolved dynamic route (/blog/[slug]) supplies the real entry; the
  // editor falls back to the "preview entry" picked in the properties panel.
  const collectionId = previewEntry?.collectionId || picked?.collectionId || "";
  const entryId = previewEntry?.entryId || picked?.entryId || "";
  const { entry, fields, loading } = useSingleEntry(collectionId, entryId);
  if (!collectionId || !entryId) {
    return <EmptyState message="Pick an entry to preview in the properties panel." />;
  }
  if (loading) {
    return (
      <p style={{ ...bodyStyle, opacity: 0.6 }} className="text-sm">
        Loading…
      </p>
    );
  }
  if (!entry) return <EmptyState message="That entry couldn't be found." />;

  const label = getEntryLabel(fields, entry);
  const image = getEntryImage(fields, entry);
  const body = getEntryBody(fields, entry);

  return (
    <article style={{ paddingBlock: spacing(8) }} className="mx-auto max-w-2xl">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={label} style={{ borderRadius: SITE.radius }} className="mb-6 h-72 w-full object-cover" />
      )}
      <h1 style={{ ...headingStyle, fontSize: "2.25rem" }}>{label}</h1>
      {body && (
        <div style={{ ...bodyStyle, opacity: 0.85 }} className="mt-4 whitespace-pre-line">
          {body}
        </div>
      )}
    </article>
  );
}

export type DynamicComponents = {
  CollectionList: CollectionListProps;
  CollectionItem: CollectionItemProps;
  RecentPosts: RecentPostsProps;
  RelatedPosts: RelatedPostsProps;
  FeaturedContent: FeaturedContentProps;
};

export const dynamicFieldTabs = {
  CollectionList: { content: ["source", "heading"], style: ["limit", "order", "publishedOnly"] },
  CollectionItem: { content: ["entry"] },
  RecentPosts: { content: ["source", "heading"], style: ["limit"] },
  RelatedPosts: { content: ["source", "heading", "excludeEntry"], style: ["limit"] },
  FeaturedContent: { content: ["heading", "entries"] },
};

export const dynamicComponents: Config<DynamicComponents>["components"] = {
  CollectionList: {
    label: "Collection List",
    defaultProps: { source: "", heading: "Latest posts", limit: 6, order: "desc", publishedOnly: true },
    fields: {
      source: sourceField,
      heading: { type: "text", label: "Heading" },
      limit: { type: "number", label: "Item limit", min: 1, max: 24 },
      order: { type: "select", label: "Sort", options: SORT_OPTIONS },
      publishedOnly: { type: "radio", label: "Published only", options: YES_NO_OPTIONS },
    },
    render: (props) => <CollectionListRender {...props} />,
  },
  CollectionItem: {
    label: "Collection Item",
    defaultProps: { entry: { collectionId: "", entryId: "" } },
    fields: {
      entry: entryField,
    },
    render: (props) => <CollectionItemRender {...props} />,
  },
  RecentPosts: {
    label: "Recent Posts",
    defaultProps: { source: "", heading: "Recent Posts", limit: 3 },
    fields: {
      source: sourceField,
      heading: { type: "text", label: "Heading" },
      limit: { type: "number", label: "Item limit", min: 1, max: 12 },
    },
    render: (props) => <RecentPostsRender {...props} />,
  },
  RelatedPosts: {
    label: "Related Posts",
    defaultProps: { source: "", heading: "Related Posts", limit: 3, excludeEntry: { collectionId: "", entryId: "" } },
    fields: {
      source: sourceField,
      heading: { type: "text", label: "Heading" },
      limit: { type: "number", label: "Item limit", min: 1, max: 12 },
      excludeEntry: { ...entryField, label: "Preview against entry" },
    },
    render: (props) => <RelatedPostsRender {...props} />,
  },
  FeaturedContent: {
    label: "Featured Content",
    defaultProps: { heading: "Featured", entries: { collectionId: "", entryIds: [] } },
    fields: {
      heading: { type: "text", label: "Heading" },
      entries: multiEntryField,
    },
    render: (props) => <FeaturedContentRender {...props} />,
  },
};
