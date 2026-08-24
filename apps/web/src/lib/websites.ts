import { apiClient } from "./api-client";
import type { Theme } from "./theme";

export type WebsiteStatus = "DRAFT" | "LIVE";

export interface WebsitePage {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Website {
  id: string;
  name: string;
  slug: string;
  status: WebsiteStatus;
  theme: Partial<Theme>;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  ownerId: string;
  pageCount: number;
  owner?: { name: string };
}

export interface WebsiteOverview extends Omit<Website, "pageCount"> {
  pages: WebsitePage[];
  owner: { name: string };
}

export const websitesApi = {
  list: (workspaceId: string) =>
    apiClient.get<Website[]>(`/workspaces/${workspaceId}/websites`),
  get: (workspaceId: string, websiteId: string) =>
    apiClient.get<WebsiteOverview>(`/workspaces/${workspaceId}/websites/${websiteId}`),
  create: (workspaceId: string, data: { name: string; templateId?: string }) =>
    apiClient.post<Website>(`/workspaces/${workspaceId}/websites`, data),
  rename: (workspaceId: string, websiteId: string, name: string) =>
    apiClient.patch<Website>(`/workspaces/${workspaceId}/websites/${websiteId}`, { name }),
  updateTheme: (workspaceId: string, websiteId: string, theme: Theme) =>
    apiClient.patch<Website>(`/workspaces/${workspaceId}/websites/${websiteId}/theme`, theme),
  duplicate: (workspaceId: string, websiteId: string) =>
    apiClient.post<Website>(`/workspaces/${workspaceId}/websites/${websiteId}/duplicate`),
  archive: (workspaceId: string, websiteId: string) =>
    apiClient.post<Website>(`/workspaces/${workspaceId}/websites/${websiteId}/archive`),
  remove: (workspaceId: string, websiteId: string) =>
    apiClient.delete<{ id: string }>(`/workspaces/${workspaceId}/websites/${websiteId}`),
};
