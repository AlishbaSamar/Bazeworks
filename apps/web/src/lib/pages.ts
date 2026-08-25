import { apiClient } from "./api-client";
import type { Data } from "@puckeditor/core";

export type PageStatus = "DRAFT" | "PUBLISHED";

export const PAGE_TYPES = ["blank", "home", "about", "services", "pricing", "contact", "blog"] as const;
export type PageType = (typeof PAGE_TYPES)[number];

export interface Page {
  id: string;
  name: string;
  slug: string;
  status: PageStatus;
  createdAt: string;
  updatedAt: string;
  websiteId: string;
}

export interface PageWithContent extends Page {
  content: Data;
}

export const pagesApi = {
  get: (workspaceId: string, websiteId: string, pageId: string) =>
    apiClient.get<PageWithContent>(
      `/workspaces/${workspaceId}/websites/${websiteId}/pages/${pageId}`,
    ),
  create: (workspaceId: string, websiteId: string, data: { name: string; pageType?: PageType }) =>
    apiClient.post<Page>(`/workspaces/${workspaceId}/websites/${websiteId}/pages`, data),
  updateContent: (workspaceId: string, websiteId: string, pageId: string, content: Data) =>
    apiClient.patch<PageWithContent>(
      `/workspaces/${workspaceId}/websites/${websiteId}/pages/${pageId}`,
      { content },
    ),
  rename: (workspaceId: string, websiteId: string, pageId: string, data: { name?: string; slug?: string }) =>
    apiClient.patch<Page>(
      `/workspaces/${workspaceId}/websites/${websiteId}/pages/${pageId}/rename`,
      data,
    ),
  updateStatus: (workspaceId: string, websiteId: string, pageId: string, status: PageStatus) =>
    apiClient.patch<Page>(
      `/workspaces/${workspaceId}/websites/${websiteId}/pages/${pageId}/status`,
      { status },
    ),
  duplicate: (workspaceId: string, websiteId: string, pageId: string) =>
    apiClient.post<Page>(`/workspaces/${workspaceId}/websites/${websiteId}/pages/${pageId}/duplicate`),
  remove: (workspaceId: string, websiteId: string, pageId: string) =>
    apiClient.delete<{ id: string }>(`/workspaces/${workspaceId}/websites/${websiteId}/pages/${pageId}`),
};
