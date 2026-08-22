"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "@/components/ui/FormBanner";
import { ApiError } from "@/lib/api-client";

export function RenameWebsiteDialog({
  initialName,
  onClose,
  onRename,
}: {
  initialName: string;
  onClose: () => void;
  onRename: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onRename(name);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-foreground">Rename website</h2>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" noValidate>
          {error && <FormBanner variant="error">{error}</FormBanner>}

          <Input
            label="Website name"
            name="name"
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />

          <div className="flex justify-end gap-2">
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
