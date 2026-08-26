"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "@/components/ui/FormBanner";
import { ApiError } from "@/lib/api-client";
import { collectionsApi, type Collection } from "@/lib/collections";

export function CreateCollectionModal({
  workspaceId,
  websiteId,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  websiteId: string;
  onClose: () => void;
  onCreated: (collection: Collection) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const collection = await collectionsApi.create(workspaceId, websiteId, name);
      onCreated(collection);
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
        className="animate-modal w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <ellipse cx="12" cy="6" rx="8" ry="3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Create collection</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A collection holds structured entries, like blog posts or team members.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" noValidate>
          {error && <FormBanner variant="error">{error}</FormBanner>}

          <Input
            label="Collection name"
            name="name"
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            placeholder="Blog Posts"
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" className="w-auto px-4" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="w-auto px-4" loading={loading}>
              Create collection
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
