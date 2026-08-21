import { apiClient } from "./api-client";

export type WorkspaceRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
}

export const workspacesApi = {
  list: () => apiClient.get<Workspace[]>("/workspaces"),
  create: (name: string) => apiClient.post<Workspace>("/workspaces", { name }),
};

const ACTIVE_WORKSPACE_KEY = "bazeworks:activeWorkspaceId";

export function getStoredActiveWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_WORKSPACE_KEY);
}

export function setStoredActiveWorkspaceId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
}
