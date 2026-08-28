import { apiClient } from "./api-client";
import type { WorkspaceRole } from "./workspaces";

export const ASSIGNABLE_ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
  OWNER: "Full control over the workspace, members, websites and settings.",
  ADMIN: "Manage members, websites, content and operational settings.",
  EDITOR: "Create and edit pages and content across the workspace.",
  VIEWER: "View workspace resources without making changes.",
};

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  createdAt: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
}

export const membersApi = {
  list: (workspaceId: string) =>
    apiClient.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),
  add: (workspaceId: string, email: string, role: AssignableRole) =>
    apiClient.post<WorkspaceMember>(`/workspaces/${workspaceId}/members`, { email, role }),
  updateRole: (workspaceId: string, memberId: string, role: AssignableRole) =>
    apiClient.patch<WorkspaceMember>(
      `/workspaces/${workspaceId}/members/${memberId}`,
      { role },
    ),
  remove: (workspaceId: string, memberId: string) =>
    apiClient.delete<{ id: string }>(`/workspaces/${workspaceId}/members/${memberId}`),
};
