"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "@/components/ui/FormBanner";
import { ApiError } from "@/lib/api-client";
import { workspacesApi, type Workspace } from "@/lib/workspaces";

export function CreateWorkspaceDialog({
  onClose,
  onCreated,
  dismissable = true,
}: {
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
  dismissable?: boolean;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const workspace = await workspacesApi.create(name);
      onCreated(workspace);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="animate-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={dismissable ? onClose : undefined}
    >
      <div
        className="animate-modal w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Create a workspace</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspaces keep a client&apos;s or team&apos;s websites, content, and members together.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" noValidate>
          {error && <FormBanner variant="error">{error}</FormBanner>}

          <Input
            label="Workspace name"
            name="name"
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            placeholder="Acme Agency"
          />

          <div className="flex justify-end gap-2">
            {dismissable && (
              <Button type="button" variant="secondary" className="w-auto px-4" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" className="w-auto px-4" loading={loading}>
              Create workspace
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
