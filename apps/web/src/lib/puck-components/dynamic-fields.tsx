"use client";

import { useEffect, useState } from "react";
import type { CustomField } from "@puckeditor/core";
import { useEditorRoute } from "../editor-route-context";
import { collectionsApi, getEntryLabel, type CollectionEntry, type CollectionField } from "../collections";

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-border bg-white px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

// ---- Collection picker: value is just a collectionId string ----

function SourcePickerInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { collections } = useEditorRoute();
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
      <option value="">Select a collection…</option>
      {collections.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

export const sourceField: CustomField<string> = {
  type: "custom",
  label: "Collection",
  render: ({ value, onChange }) => <SourcePickerInput value={value} onChange={onChange} />,
};

// ---- Entry picker: cascading collection -> entry select, stored together
// as one value so this field never needs to read another field's value
// (Puck's custom fields only ever see their own value/onChange). ----

export interface EntryPickerValue {
  collectionId: string;
  entryId: string;
}

function useCollectionEntries(collectionId: string) {
  const { workspaceId, websiteId } = useEditorRoute();
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [fields, setFields] = useState<CollectionField[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!collectionId) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) {
          setEntries([]);
          setFields([]);
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
      collectionsApi.listEntries(workspaceId, websiteId, collectionId, { limit: 100 }),
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
  }, [workspaceId, websiteId, collectionId]);

  return { entries, fields, loading };
}

function EntryPickerInput({
  value,
  onChange,
}: {
  value: EntryPickerValue | undefined;
  onChange: (v: EntryPickerValue) => void;
}) {
  const { collections } = useEditorRoute();
  const collectionId = value?.collectionId ?? "";
  const entryId = value?.entryId ?? "";
  const { entries, fields, loading } = useCollectionEntries(collectionId);

  return (
    <div className="flex flex-col gap-2">
      <select
        value={collectionId}
        onChange={(e) => onChange({ collectionId: e.target.value, entryId: "" })}
        className={SELECT_CLASS}
      >
        <option value="">Select a collection…</option>
        {collections.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {collectionId &&
        (loading ? (
          <p className="text-xs text-muted-foreground">Loading entries…</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No entries in this collection yet.</p>
        ) : (
          <select
            value={entryId}
            onChange={(e) => onChange({ collectionId, entryId: e.target.value })}
            className={SELECT_CLASS}
          >
            <option value="">Select an entry…</option>
            {entries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {getEntryLabel(fields, entry)}
              </option>
            ))}
          </select>
        ))}
    </div>
  );
}

export const entryField: CustomField<EntryPickerValue> = {
  type: "custom",
  label: "Entry",
  render: ({ value, onChange }) => <EntryPickerInput value={value} onChange={onChange} />,
};

// ---- Multi-entry picker: collection + a checklist of entries, used by
// Featured Content to hand-pick and order a specific set of entries. ----

export interface MultiEntryPickerValue {
  collectionId: string;
  entryIds: string[];
}

function MultiEntryPickerInput({
  value,
  onChange,
}: {
  value: MultiEntryPickerValue | undefined;
  onChange: (v: MultiEntryPickerValue) => void;
}) {
  const { collections } = useEditorRoute();
  const collectionId = value?.collectionId ?? "";
  const entryIds = value?.entryIds ?? [];
  const { entries, fields, loading } = useCollectionEntries(collectionId);

  function toggle(id: string) {
    const next = entryIds.includes(id) ? entryIds.filter((existing) => existing !== id) : [...entryIds, id];
    onChange({ collectionId, entryIds: next });
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        value={collectionId}
        onChange={(e) => onChange({ collectionId: e.target.value, entryIds: [] })}
        className={SELECT_CLASS}
      >
        <option value="">Select a collection…</option>
        {collections.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {collectionId &&
        (loading ? (
          <p className="text-xs text-muted-foreground">Loading entries…</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No entries in this collection yet.</p>
        ) : (
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-border p-2">
            {entries.map((entry) => (
              <label key={entry.id} className="flex items-center gap-2 text-xs text-foreground">
                <input type="checkbox" checked={entryIds.includes(entry.id)} onChange={() => toggle(entry.id)} />
                <span className="truncate">{getEntryLabel(fields, entry)}</span>
              </label>
            ))}
          </div>
        ))}
    </div>
  );
}

export const multiEntryField: CustomField<MultiEntryPickerValue> = {
  type: "custom",
  label: "Featured entries",
  render: ({ value, onChange }) => <MultiEntryPickerInput value={value} onChange={onChange} />,
};
