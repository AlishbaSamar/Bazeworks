"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { ApiError } from "@/lib/api-client";
import {
  publishingApi,
  type PublishStatus,
  type PublishValidation,
} from "@/lib/publishing";

export function PublishDialog({
  workspaceId,
  websiteId,
  status,
  onClose,
  onPublished,
}: {
  workspaceId: string;
  websiteId: string;
  status: PublishStatus;
  onClose: () => void;
  onPublished: (note: string | null) => void;
}) {
  const [validation, setValidation] = useState<PublishValidation | null>(null);
  const [note, setNote] = useState("");
  const [checking, setChecking] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    publishingApi
      .check(workspaceId, websiteId)
      .then((v) => {
        if (!cancelled) setValidation(v);
      })
      .catch(() => {
        if (!cancelled) setValidation({ errors: [], warnings: [] });
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, websiteId]);

  const blocked = (validation?.errors.length ?? 0) > 0;

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      await publishingApi.publish(workspaceId, websiteId, note.trim() || undefined);
      onPublished(note.trim() || null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Publishing failed. Please try again.");
      }
      setPublishing(false);
    }
  }

  return (
    <div
      className="animate-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={publishing ? undefined : onClose}
    >
      <div
        className="animate-modal flex max-h-[85vh] w-full max-w-md flex-col rounded-xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-lg font-semibold text-foreground">Review &amp; publish</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Creates an approved snapshot. Deploy it to make changes live.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
          {error && <FormBanner variant="error">{error}</FormBanner>}

          <section>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pending changes
            </p>
            {status.changedPages.length === 0 && !status.websiteChanged ? (
              <p className="mt-1 text-sm text-muted-foreground">
                No page or design changes since the last publish.
              </p>
            ) : (
              <ul className="mt-1.5 flex flex-col gap-1 text-sm text-foreground">
                {status.websiteChanged && <li>• Theme / navigation / settings</li>}
                {status.changedPages.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            )}
          </section>

          {checking ? (
            <p className="text-sm text-muted-foreground">Checking for problems…</p>
          ) : (
            <>
              {validation && validation.errors.length > 0 && (
                <section>
                  <p className="text-xs font-medium uppercase tracking-wide text-destructive">
                    Must fix before publishing
                  </p>
                  <ul className="mt-1.5 flex flex-col gap-1 text-sm text-destructive">
                    {validation.errors.map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                </section>
              )}
              {validation && validation.warnings.length > 0 && (
                <section>
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                    Warnings
                  </p>
                  <ul className="mt-1.5 flex flex-col gap-1 text-sm text-amber-700">
                    {validation.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="publish-note" className="text-sm font-medium text-foreground">
              Note <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="publish-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What changed in this release?"
              className="h-10 rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button type="button" variant="secondary" className="w-auto px-4" onClick={onClose} disabled={publishing}>
            Cancel
          </Button>
          <Button
            type="button"
            className="w-auto px-4"
            loading={publishing}
            disabled={checking || blocked}
            onClick={handlePublish}
          >
            {blocked ? "Fix errors first" : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
