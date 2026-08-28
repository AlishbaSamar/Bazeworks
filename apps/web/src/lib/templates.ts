import { apiClient } from "./api-client";

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  kind: "SITE" | "PAGE";
  isOfficial: boolean;
  workspaceId: string | null;
  pageCount: number;
  collectionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveAsTemplateInput {
  name: string;
  description?: string;
  category?: string;
}

export const templatesApi = {
  /** Official templates, plus the workspace's own when a workspaceId is given. */
  list: (workspaceId?: string) =>
    apiClient.get<Template[]>(
      workspaceId ? `/templates?workspaceId=${workspaceId}` : "/templates",
    ),
  saveFromWebsite: (workspaceId: string, websiteId: string, input: SaveAsTemplateInput) =>
    apiClient.post<Template>(
      `/workspaces/${workspaceId}/templates/from-website/${websiteId}`,
      input,
    ),
  remove: (workspaceId: string, templateId: string) =>
    apiClient.delete<{ id: string }>(`/workspaces/${workspaceId}/templates/${templateId}`),
};
