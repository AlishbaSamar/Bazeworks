"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
import { WorkspaceContext } from "@/lib/workspace-context";

export default function DashboardLayout({ children }: { children: ReactNode }) {
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
              {activeWorkspace && (
                <WorkspaceContext.Provider
                  value={{ workspaces, activeWorkspace, setActiveWorkspace: handleWorkspaceSelect }}
                >
                  {children}
                </WorkspaceContext.Provider>
              )}
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
