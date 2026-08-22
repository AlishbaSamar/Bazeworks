"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { CreateWorkspaceDialog } from "@/components/dashboard/CreateWorkspaceDialog";
import { authClient, useSession } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";
import {
  workspacesApi,
  getStoredActiveWorkspaceId,
  setStoredActiveWorkspaceId,
  type Workspace,
} from "@/lib/workspaces";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (!session) return;
    workspacesApi
      .list()
      .then((list) => {
        setWorkspaces(list);
        const stored = getStoredActiveWorkspaceId();
        const match = list.find((w) => w.id === stored);
        setActiveWorkspaceId((match ?? list[0])?.id ?? null);
      })
      .catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : "Couldn't load your workspaces.");
      });
  }, [session]);

  function handleWorkspaceCreated(workspace: Workspace) {
    setWorkspaces((prev) => [...(prev ?? []), workspace]);
    setActiveWorkspaceId(workspace.id);
    setStoredActiveWorkspaceId(workspace.id);
    setShowCreateDialog(false);
  }

  function handleWorkspaceSelect(workspace: Workspace) {
    setActiveWorkspaceId(workspace.id);
    setStoredActiveWorkspaceId(workspace.id);
  }

  if (isPending || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const { user } = session;
  const activeWorkspace = workspaces?.find((w) => w.id === activeWorkspaceId) ?? null;

  return (
    <div className="min-h-screen bg-background">
      {!user.emailVerified && (
        <div className="border-b border-border bg-surface px-6 py-3">
          <FormBanner variant="error">
            Your email isn&apos;t verified yet. Check your inbox for the verification link.
          </FormBanner>
        </div>
      )}

      {loadError && (
        <div className="border-b border-border bg-surface px-6 py-3">
          <FormBanner variant="error">{loadError}</FormBanner>
        </div>
      )}

      {workspaces === null ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-muted-foreground">Loading workspaces…</p>
        </div>
      ) : workspaces.length === 0 ? (
        <CreateWorkspaceDialog
          dismissable={false}
          onClose={() => {}}
          onCreated={handleWorkspaceCreated}
        />
      ) : (
        <div className="flex">
          {activeWorkspace && (
            <Sidebar
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onWorkspaceSelect={handleWorkspaceSelect}
              onCreateWorkspace={() => setShowCreateDialog(true)}
              userName={user.name}
              onLogout={async () => {
                await authClient.signOut();
                router.push("/login");
              }}
            />
          )}

          <main className="min-w-0 flex-1 px-8 py-8">
            <div className="mx-auto max-w-5xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">
                    {greeting()}, {user.name.split(" ")[0]} 👋
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeWorkspace
                      ? `Here's what's happening in ${activeWorkspace.name}.`
                      : "Select a workspace"}
                  </p>
                </div>
                <Button className="w-auto px-4" disabled title="Coming Day 3">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                  </svg>
                  Create Website
                </Button>
              </div>

              <div className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Websites
                </h2>

                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="search"
                    placeholder="Search websites…"
                    disabled
                    className="h-10 w-full max-w-xs rounded-md border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-background"
                  />
                  <select
                    disabled
                    className="h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:bg-background"
                  >
                    <option>All Status</option>
                  </select>
                </div>

                <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
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
                  <p className="mt-4 text-sm font-medium text-foreground">No websites yet</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Website creation lands here on Day 3 — you&apos;ll be able to start from a blank
                    site or a template.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {showCreateDialog && (
        <CreateWorkspaceDialog
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleWorkspaceCreated}
        />
      )}
    </div>
  );
}
