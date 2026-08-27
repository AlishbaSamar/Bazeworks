"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api-client";
import { collectionsApi, getEntryLabel, type CollectionEntry, type CollectionField } from "@/lib/collections";

interface RelationOption {
  id: string;
  label: string;
}

function isoToDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function isoToDateTimeInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EntryFormModal({
  workspaceId,
  websiteId,
  collectionId,
  fields,
  existingEntry,
  onClose,
  onSaved,
}: {
  workspaceId: string;
  websiteId: string;
  collectionId: string;
  fields: CollectionField[];
  existingEntry?: CollectionEntry;
  onClose: () => void;
  onSaved: (entry: CollectionEntry) => void;
}) {
  const isEditing = !!existingEntry;

  const [values, setValues] = useState<Record<string, unknown>>(existingEntry?.data ?? {});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [relationOptions, setRelationOptions] = useState<Record<string, RelationOption[]>>({});
  const [relationsLoading, setRelationsLoading] = useState(false);

  const relationFields = fields.filter((f) => f.type === "RELATION" && f.relatedCollectionId);

  useEffect(() => {
    if (relationFields.length === 0) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setRelationsLoading(true);
    });

    Promise.all(
      relationFields.map(async (field) => {
        const [target, page] = await Promise.all([
          collectionsApi.get(workspaceId, websiteId, field.relatedCollectionId as string),
          collectionsApi.listEntries(workspaceId, websiteId, field.relatedCollectionId as string, { limit: 100 }),
        ]);
        const options: RelationOption[] = page.entries.map((entry) => ({
          id: entry.id,
          label: getEntryLabel(target.fields, entry),
        }));
        return [field.id, options] as const;
      }),
    )
      .then((results) => {
        if (cancelled) return;
        setRelationOptions(Object.fromEntries(results));
      })
      .catch(() => {
        if (cancelled) return;
        setRelationOptions({});
      })
      .finally(() => {
        if (!cancelled) setRelationsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, websiteId]);

  function setValue(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMultiSelect(key: string, option: string) {
    setValues((prev) => {
      const current = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
      const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option];
      return { ...prev, [key]: next };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const missing = fields.filter((f) => {
      if (!f.required) return false;
      const value = values[f.key];
      return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
    });
    if (missing.length > 0) {
      setError(`${missing.map((f) => f.name).join(", ")} ${missing.length === 1 ? "is" : "are"} required.`);
      return;
    }

    setLoading(true);
    try {
      const entry = existingEntry
        ? await collectionsApi.updateEntry(workspaceId, websiteId, collectionId, existingEntry.id, values)
        : await collectionsApi.createEntry(workspaceId, websiteId, collectionId, values);
      onSaved(entry);
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
        className="animate-modal w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{isEditing ? "Edit entry" : "Add entry"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditing ? "Update the values for this entry." : "Fill in the fields for this new entry."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-foreground"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1" noValidate>
          {error && <FormBanner variant="error">{error}</FormBanner>}

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">This collection has no fields yet.</p>
          )}

          {fields.map((field) => {
            const value = values[field.key];

            if (field.type === "TEXT" || field.type === "URL" || field.type === "EMAIL") {
              return (
                <Input
                  key={field.id}
                  name={field.key}
                  label={field.name}
                  required={field.required}
                  value={typeof value === "string" ? value : ""}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  disabled={loading}
                  placeholder={field.type === "URL" ? "https://example.com" : field.type === "EMAIL" ? "name@example.com" : ""}
                />
              );
            }

            if (field.type === "IMAGE" || field.type === "FILE") {
              return (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <Input
                    name={field.key}
                    label={field.name}
                    required={field.required}
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    disabled={loading}
                    placeholder="https://example.com/file.jpg"
                  />
                  <p className="text-xs text-muted-foreground">Paste a link — file uploads aren&apos;t available yet.</p>
                </div>
              );
            }

            if (field.type === "TEXTAREA" || field.type === "RICH_TEXT") {
              return (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <label htmlFor={field.key} className="text-sm font-medium text-foreground">
                    {field.name}
                    {field.required && <span className="text-destructive"> *</span>}
                  </label>
                  <textarea
                    id={field.key}
                    name={field.key}
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    disabled={loading}
                    rows={field.type === "RICH_TEXT" ? 6 : 3}
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              );
            }

            if (field.type === "NUMBER") {
              return (
                <Input
                  key={field.id}
                  name={field.key}
                  type="number"
                  label={field.name}
                  required={field.required}
                  value={typeof value === "number" ? String(value) : typeof value === "string" ? value : ""}
                  onChange={(e) => setValue(field.key, e.target.value === "" ? "" : Number(e.target.value))}
                  disabled={loading}
                />
              );
            }

            if (field.type === "BOOLEAN") {
              return (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">{field.name}</span>
                  <div className="flex h-10 w-fit items-center gap-0.5 rounded-md border border-border bg-white p-1">
                    {[
                      { label: "No", value: false },
                      { label: "Yes", value: true },
                    ].map((opt) => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        disabled={loading}
                        onClick={() => setValue(field.key, opt.value)}
                        className={`h-full rounded px-4 text-xs font-medium transition-colors ${
                          (value ?? false) === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            if (field.type === "DATE" || field.type === "DATE_TIME") {
              const displayValue =
                typeof value === "string" && value
                  ? field.type === "DATE"
                    ? isoToDateInput(value)
                    : isoToDateTimeInput(value)
                  : "";
              return (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {field.name}
                    {field.required && <span className="text-destructive"> *</span>}
                  </span>
                  <input
                    name={field.key}
                    type={field.type === "DATE" ? "date" : "datetime-local"}
                    value={displayValue}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    disabled={loading}
                    className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              );
            }

            if (field.type === "SELECT") {
              return (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {field.name}
                    {field.required && <span className="text-destructive"> *</span>}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {field.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        disabled={loading}
                        onClick={() => setValue(field.key, option)}
                        className={`h-8 rounded-full border px-3 text-xs font-medium transition-colors ${
                          value === option
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-white text-muted-foreground hover:border-border-strong hover:text-foreground"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            if (field.type === "MULTI_SELECT") {
              const selected = Array.isArray(value) ? (value as string[]) : [];
              return (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {field.name}
                    {field.required && <span className="text-destructive"> *</span>}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {field.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        disabled={loading}
                        onClick={() => toggleMultiSelect(field.key, option)}
                        className={`h-8 rounded-full border px-3 text-xs font-medium transition-colors ${
                          selected.includes(option)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-white text-muted-foreground hover:border-border-strong hover:text-foreground"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            if (field.type === "RELATION") {
              const options = relationOptions[field.id] ?? [];
              return (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {field.name}
                    {field.required && <span className="text-destructive"> *</span>}
                  </span>
                  {relationsLoading ? (
                    <p className="text-xs text-muted-foreground">Loading options…</p>
                  ) : options.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No entries exist yet in the related collection.
                    </p>
                  ) : (
                    <select
                      name={field.key}
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => setValue(field.key, e.target.value)}
                      disabled={loading}
                      className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select…</option>
                      {options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            }

            return null;
          })}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="secondary" className="w-auto px-4" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="w-auto px-4" loading={loading}>
              {isEditing ? "Save changes" : "Add entry"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
