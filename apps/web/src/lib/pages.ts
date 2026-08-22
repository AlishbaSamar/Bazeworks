import { apiClient } from "./api-client";
import type { Data } from "@puckeditor/core";

export interface PageWithContent {
  id: string;
  name: string;
  slug: string;
  content: Data;
  createdAt: string;
  updatedAt: string;
  websiteId: string;
}

export const pagesApi = {
  get: (workspaceId: string, websiteId: string, pageId: string) =>
    apiClient.get<PageWithContent>(
      `/workspaces/${workspaceId}/websites/${websiteId}/pages/${pageId}`,
    ),
  updateContent: (workspaceId: string, websiteId: string, pageId: string, content: Data) =>
    apiClient.patch<PageWithContent>(
      `/workspaces/${workspaceId}/websites/${websiteId}/pages/${pageId}`,
      { content },
    ),
};
