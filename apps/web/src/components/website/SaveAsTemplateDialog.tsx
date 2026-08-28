"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "@/components/ui/FormBanner";
import { ApiError } from "@/lib/api-client";
import { templatesApi } from "@/lib/templates";

export function SaveAsTemplateDialog({
  workspaceId,
  websiteId,
  defaultName,
  onClose,
  onSaved,
}: {
  workspaceId: string;
  websiteId: string;
  defaultName: string;
  onClose: () => void;
  onSaved: (templateName: string) => void;
}) {
  const [name, setName] = useState(`${defaultName} template`);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Custom");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const template = await templatesApi.saveFromWebsite(workspaceId, websiteId, {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
      });
      onSaved(template.name);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save this template.");
      setSaving(false);
    }
  }

  return (
    <div
      className="animate-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={saving ? undefined : onClose}
    >
      <form
        onSubmit={handleSave}
        className="animate-modal w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-foreground">Save as template</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Snapshots this website&apos;s pages, design, collections and sample entries into a
          reusable template for this workspace.
        </p>

        {error && (
          <div className="mt-4">
            <FormBanner variant="error">{error}</FormBanner>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-4">
          <Input label="Template name" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Description"
            name="description"
            placeholder="Optional"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input label="Category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" className="w-auto px-4" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto px-4" loading={saving}>
            Save template
          </Button>
        </div>
      </form>
    </div>
  );
}
