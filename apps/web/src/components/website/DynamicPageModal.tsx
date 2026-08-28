"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { ApiError } from "@/lib/api-client";
import { collectionsApi, type Collection, type CollectionField } from "@/lib/collections";
import type { DynamicBindingInput, Page } from "@/lib/pages";

export function DynamicPageModal({
  workspaceId,
  websiteId,
  page,
  onClose,
  onSave,
}: {
  workspaceId: string;
  websiteId: string;
  page: Page;
  onClose: () => void;
  onSave: (input: DynamicBindingInput) => Promise<void>;
}) {
  const [enabled, setEnabled] = useState(page.isDynamic);
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [collectionId, setCollectionId] = useState(page.dynamicCollectionId ?? "");
  const [fields, setFields] = useState<CollectionField[] | null>(null);
  const [slugField, setSlugField] = useState(page.dynamicSlugField ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    collectionsApi.list(workspaceId, websiteId).then((list) => {
      if (cancelled) return;
      setCollections(list);
      if (!collectionId && list.length > 0) setCollectionId(list[0].id);
    });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, websiteId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!collectionId) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) setFields(null);
      });
      return () => {
        cancelled = true;
      };
    }
    let cancelled = false;
    collectionsApi.get(workspaceId, websiteId, collectionId).then((collection) => {
      if (cancelled) return;
      setFields(collection.fields);
      // Default to a field literally called "slug" if one exists, else the first text-ish field.
      const hasCurrentField = collection.fields.some((f) => f.key === slugField);
      if (!hasCurrentField) {
        const bySlugKey = collection.fields.find((f) => f.key === "slug");
        const firstText = collection.fields.find((f) => f.type === "TEXT");
        setSlugField(bySlugKey?.key ?? firstText?.key ?? "");
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, websiteId, collectionId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (enabled && (!collectionId || !slugField)) {
      setError("Choose a collection and a slug field.");
      return;
    }

    setLoading(true);
    try {
      await onSave(enabled ? { isDynamic: true, collectionId, slugField } : { isDynamic: false });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="animate-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="animate-modal w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-foreground">Dynamic page</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn this page into a template that renders one entry per URL, like{" "}
          <span className="font-mono text-xs">{page.slug}/[slug]</span>.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" noValidate>
          {error && <FormBanner variant="error">{error}</FormBanner>}

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Bind to a collection</span>
            <div className="flex h-10 w-fit items-center gap-0.5 rounded-md border border-border bg-white p-1">
              {[
                { label: "Off", value: false },
                { label: "On", value: true },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={loading}
                  onClick={() => setEnabled(opt.value)}
                  className={`h-full rounded px-4 text-xs font-medium transition-colors ${
                    enabled === opt.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {enabled && (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Collection</span>
                {collections === null ? (
                  <p className="text-xs text-muted-foreground">Loading collections…</p>
                ) : collections.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Create a collection first.</p>
                ) : (
                  <select
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    disabled={loading}
                    className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Slug field</span>
                <p className="text-xs text-muted-foreground">
                  Which field&apos;s value should appear in the URL for each entry.
                </p>
                {fields === null ? (
                  <p className="text-xs text-muted-foreground">Loading fields…</p>
                ) : fields.length === 0 ? (
                  <p className="text-xs text-muted-foreground">This collection has no fields yet.</p>
                ) : (
                  <select
                    value={slugField}
                    onChange={(e) => setSlugField(e.target.value)}
                    disabled={loading}
                    className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {fields.map((f) => (
                      <option key={f.id} value={f.key}>
                        {f.name} ({f.key})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="secondary" className="w-auto px-4" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="w-auto px-4" loading={loading}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
