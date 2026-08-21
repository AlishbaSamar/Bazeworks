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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={dismissable ? onClose : undefined}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
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
