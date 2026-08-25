import { apiClient } from "./api-client";
import type { Theme } from "./theme";
import type { PageStatus } from "./pages";

export type WebsiteStatus = "DRAFT" | "LIVE";

export interface WebsitePage {
  id: string;
  name: string;
  slug: string;
  status: PageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Website {
  id: string;
  name: string;
  slug: string;
  status: WebsiteStatus;
  theme: Partial<Theme>;
  globalHeader: Record<string, unknown>;
  globalFooter: Record<string, unknown>;
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
  updateGlobalHeader: (workspaceId: string, websiteId: string, props: object) =>
    apiClient.patch<Website>(`/workspaces/${workspaceId}/websites/${websiteId}/global-header`, { props }),
  updateGlobalFooter: (workspaceId: string, websiteId: string, props: object) =>
    apiClient.patch<Website>(`/workspaces/${workspaceId}/websites/${websiteId}/global-footer`, { props }),
  duplicate: (workspaceId: string, websiteId: string) =>
    apiClient.post<Website>(`/workspaces/${workspaceId}/websites/${websiteId}/duplicate`),
  archive: (workspaceId: string, websiteId: string) =>
    apiClient.post<Website>(`/workspaces/${workspaceId}/websites/${websiteId}/archive`),
  remove: (workspaceId: string, websiteId: string) =>
    apiClient.delete<{ id: string }>(`/workspaces/${workspaceId}/websites/${websiteId}`),
};
