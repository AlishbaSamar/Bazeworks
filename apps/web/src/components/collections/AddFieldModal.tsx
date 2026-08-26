"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api-client";
import {
  collectionsApi,
  FIELD_TYPES,
  FIELD_TYPE_META,
  type CollectionField,
  type Collection,
  type FieldInput,
  type FieldType,
} from "@/lib/collections";

const CHOICE_TYPES: FieldType[] = ["SELECT", "MULTI_SELECT"];

export function AddFieldModal({
  workspaceId,
  websiteId,
  collectionId,
  otherCollections,
  existingField,
  onClose,
  onSaved,
}: {
  workspaceId: string;
  websiteId: string;
  collectionId: string;
  otherCollections: Collection[];
  existingField?: CollectionField;
  onClose: () => void;
  onSaved: (field: CollectionField) => void;
}) {
  const isEditing = !!existingField;

  const [type, setType] = useState<FieldType>(existingField?.type ?? "TEXT");
  const [name, setName] = useState(existingField?.name ?? "");
  const [required, setRequired] = useState(existingField?.required ?? false);
  const [options, setOptions] = useState<string[]>(existingField?.options ?? []);
  const [relatedCollectionId, setRelatedCollectionId] = useState(
    existingField?.relatedCollectionId ?? otherCollections[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (CHOICE_TYPES.includes(type) && options.filter((o) => o.trim()).length === 0) {
      setError("Add at least one option.");
      return;
    }
    if (type === "RELATION" && !relatedCollectionId) {
      setError("Choose which collection this field relates to.");
      return;
    }

    const input: FieldInput = {
      name,
      type,
      required,
      ...(CHOICE_TYPES.includes(type) && { options: options.map((o) => o.trim()).filter(Boolean) }),
      ...(type === "RELATION" && { relatedCollectionId }),
    };

    setLoading(true);
    try {
      const field = existingField
        ? await collectionsApi.updateField(workspaceId, websiteId, collectionId, existingField.id, input)
        : await collectionsApi.createField(workspaceId, websiteId, collectionId, input);
      onSaved(field);
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
            <h2 className="text-lg font-semibold text-foreground">{isEditing ? "Edit field" : "Add field"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditing ? "Update this field's configuration." : "Choose a type, then configure the field."}
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

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Field type</span>
            <div className="flex flex-wrap gap-1.5">
              {FIELD_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  disabled={loading}
                  className={`h-8 rounded-full border px-3 text-xs font-medium transition-colors ${
                    type === t
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-white text-muted-foreground hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  {FIELD_TYPE_META[t].label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{FIELD_TYPE_META[type].description}</p>
          </div>

          <Input
            label="Field name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            placeholder="Cover Image"
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Required</span>
            <div className="flex h-10 w-fit items-center gap-0.5 rounded-md border border-border bg-white p-1">
              {[
                { label: "No", value: false },
                { label: "Yes", value: true },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={loading}
                  onClick={() => setRequired(opt.value)}
                  className={`h-full rounded px-4 text-xs font-medium transition-colors ${
                    required === opt.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {CHOICE_TYPES.includes(type) && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Options</span>
              <div className="flex flex-col gap-2">
                {options.map((option, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={option}
                      onChange={(e) => updateOption(i, e.target.value)}
                      disabled={loading}
                      className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder={`Option ${i + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      disabled={loading}
                      aria-label="Remove option"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setOptions((prev) => [...prev, ""])}
                  disabled={loading}
                  className="inline-flex h-9 w-fit items-center gap-1.5 rounded-md border border-dashed border-border-strong px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                  </svg>
                  Add option
                </button>
              </div>
            </div>
          )}

          {type === "RELATION" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Related collection</span>
              {otherCollections.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Create another collection first — a relation field needs somewhere to point to.
                </p>
              ) : (
                <select
                  value={relatedCollectionId}
                  onChange={(e) => setRelatedCollectionId(e.target.value)}
                  disabled={loading}
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {otherCollections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="secondary" className="w-auto px-4" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-auto px-4"
              loading={loading}
              disabled={type === "RELATION" && otherCollections.length === 0}
            >
              {isEditing ? "Save changes" : "Add field"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
