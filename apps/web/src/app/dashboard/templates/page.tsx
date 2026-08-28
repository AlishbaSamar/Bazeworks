"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ApiError } from "@/lib/api-client";
import { useWorkspaceContext } from "@/lib/workspace-context";
import { templatesApi, type Template } from "@/lib/templates";
import { websitesApi } from "@/lib/websites";

export default function TemplatesPage() {
  const router = useRouter();
  const { activeWorkspace } = useWorkspaceContext();
  const canManage = activeWorkspace.role === "OWNER" || activeWorkspace.role === "ADMIN";
  const canCreate = activeWorkspace.role !== "VIEWER";

  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Template | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setTemplates(null);
    });
    templatesApi
      .list(activeWorkspace.id)
      .then((list) => {
        if (!cancelled) setTemplates(list);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Couldn't load templates.");
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  const { official, custom } = useMemo(() => {
    const list = templates ?? [];
    return {
      official: list.filter((t) => t.isOfficial),
      custom: list.filter((t) => !t.isOfficial),
    };
  }, [templates]);

  async function handleUse(template: Template) {
    setBusyId(template.id);
    setError(null);
    try {
      const website = await websitesApi.create(activeWorkspace.id, {
        name: template.name,
        templateId: template.id,
      });
      router.push(`/dashboard/websites/${website.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create a website from that template.");
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      await templatesApi.remove(activeWorkspace.id, deleting.id);
      setTemplates((prev) => (prev ?? []).filter((t) => t.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete that template.");
      throw err;
    } finally {
      setBusyId(null);
    }
  }

  function Card({ template }: { template: Template }) {
    return (
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex h-24 w-full items-center justify-center bg-surface-sunken bg-dot-grid">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-foreground shadow-sm ring-1 ring-border">
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
              <path strokeLinecap="round" d="M3.5 9.5h17M9.5 9.5V20.5" />
            </svg>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{template.name}</span>
            <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {template.category}
            </span>
          </div>
          <p className="flex-1 text-sm text-muted-foreground">{template.description}</p>
          <p className="text-xs font-medium text-muted-foreground">
            {template.pageCount} {template.pageCount === 1 ? "page" : "pages"}
            {template.collectionCount > 0 &&
              ` · ${template.collectionCount} ${
                template.collectionCount === 1 ? "collection" : "collections"
              }`}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Button
              className="w-auto flex-1 px-3 py-1.5 text-xs"
              loading={busyId === template.id}
              disabled={!canCreate || busyId !== null}
              onClick={() => handleUse(template)}
            >
              Use template
            </Button>
            {!template.isOfficial && canManage && (
              <button
                type="button"
                onClick={() => setDeleting(template)}
                disabled={busyId !== null}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive disabled:opacity-50"
                title="Delete template"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.177-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start a new website from an official template or one your workspace has saved.
        </p>
      </header>

      {error && <FormBanner variant="error">{error}</FormBanner>}

      {templates === null ? (
        <p className="text-sm text-muted-foreground">Loading templates…</p>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-medium text-foreground">Official templates</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {official.map((t) => (
                <Card key={t.id} template={t} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-foreground">Your workspace templates</h2>
            {custom.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted-foreground">
                None yet. Open a website and choose <span className="font-medium text-foreground">Save as template</span> to add one.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {custom.map((t) => (
                  <Card key={t.id} template={t} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.name}"?`}
          message="This template will be removed from your workspace. Websites already created from it are not affected."
          confirmLabel="Delete template"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
