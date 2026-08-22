"use client";

import { createContext, useContext } from "react";
import type { Workspace } from "./workspaces";

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  setActiveWorkspace: (workspace: Workspace) => void;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspaceContext must be used within the dashboard layout");
  }
  return ctx;
}
