"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { WebsiteCard } from "@/components/dashboard/WebsiteCard";
import { CreateWebsiteModal } from "@/components/dashboard/CreateWebsiteModal";
import { RenameWebsiteDialog } from "@/components/dashboard/RenameWebsiteDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSession } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";
import { websitesApi, type Website, type WebsiteStatus } from "@/lib/websites";
import { useWorkspaceContext } from "@/lib/workspace-context";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

type StatusFilter = "ALL" | WebsiteStatus;

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { activeWorkspace } = useWorkspaceContext();

  const [websites, setWebsites] = useState<Website[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renamingWebsite, setRenamingWebsite] = useState<Website | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    { type: "archive" | "delete"; website: Website } | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    websitesApi
      .list(activeWorkspace.id)
      .then((list) => {
        if (!cancelled) setWebsites(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : "Couldn't load your websites.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  const filtered = useMemo(() => {
    if (!websites) return [];
    return websites.filter((w) => {
      const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || w.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [websites, search, statusFilter]);

  const canManage = activeWorkspace.role !== "VIEWER";
  const canDelete = activeWorkspace.role === "OWNER" || activeWorkspace.role === "ADMIN";

  function handleCreated(website: Website) {
    setShowCreateModal(false);
    router.push(`/dashboard/websites/${website.id}`);
  }

  async function handleRename(website: Website, name: string) {
    const updated = await websitesApi.rename(activeWorkspace.id, website.id, name);
    setWebsites((prev) => prev?.map((w) => (w.id === website.id ? { ...w, ...updated } : w)) ?? null);
    setRenamingWebsite(null);
  }

  async function handleDuplicate(website: Website) {
    const copy = await websitesApi.duplicate(activeWorkspace.id, website.id);
    setWebsites((prev) => (prev ? [copy, ...prev] : [copy]));
  }

  async function handleConfirmedAction() {
    if (!confirmAction) return;
    const { type, website } = confirmAction;
    if (type === "archive") {
      await websitesApi.archive(activeWorkspace.id, website.id);
    } else {
      await websitesApi.remove(activeWorkspace.id, website.id);
    }
    setWebsites((prev) => prev?.filter((w) => w.id !== website.id) ?? null);
    setConfirmAction(null);
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {greeting()}, {session?.user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening in {activeWorkspace.name}.
          </p>
        </div>
        {canManage && (
          <Button className="w-auto px-4" onClick={() => setShowCreateModal(true)}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
            Create Website
          </Button>
        )}
      </div>

      <div className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Websites{websites && websites.length > 0 ? ` (${websites.length})` : ""}
          </h2>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.58 3.58a.75.75 0 11-1.06 1.06l-3.58-3.58A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="search"
                placeholder="Search websites…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-white pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-56"
              />
            </div>
            <div className="flex h-10 items-center gap-0.5 rounded-md border border-border bg-white p-1">
              {(["ALL", "DRAFT", "LIVE"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`h-full rounded px-3 text-xs font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {status === "ALL" ? "All" : status === "DRAFT" ? "Draft" : "Live"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loadError && (
          <div className="mt-4">
            <FormBanner variant="error">{loadError}</FormBanner>
          </div>
        )}

        {websites === null ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">Loading websites…</p>
        ) : filtered.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken">
              <svg
                className="h-6 w-6 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75h-4.5A.75.75 0 013 21V9.75z"
                />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              {websites.length === 0 ? "No websites yet" : "No websites match your search"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {websites.length === 0
                ? "Create your first website to get started — start from a blank site or a template."
                : "Try a different search term or status filter."}
            </p>
            {websites.length === 0 && canManage && (
              <Button className="mt-5 w-auto px-4" onClick={() => setShowCreateModal(true)}>
                Create Website
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((website) => (
              <WebsiteCard
                key={website.id}
                website={website}
                canManage={canManage}
                canDelete={canDelete}
                onRename={() => setRenamingWebsite(website)}
                onDuplicate={() => handleDuplicate(website)}
                onArchive={() => setConfirmAction({ type: "archive", website })}
                onDelete={() => setConfirmAction({ type: "delete", website })}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateWebsiteModal
          workspaceId={activeWorkspace.id}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}

      {renamingWebsite && (
        <RenameWebsiteDialog
          initialName={renamingWebsite.name}
          onClose={() => setRenamingWebsite(null)}
          onRename={(name) => handleRename(renamingWebsite, name)}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.type === "archive" ? "Archive website?" : "Delete website?"}
          message={
            confirmAction.type === "archive"
              ? `"${confirmAction.website.name}" will be archived and hidden from your website list.`
              : `"${confirmAction.website.name}" and all its pages will be permanently deleted. This can't be undone.`
          }
          confirmLabel={confirmAction.type === "archive" ? "Archive" : "Delete"}
          danger={confirmAction.type === "delete"}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmedAction}
        />
      )}
    </>
  );
}
