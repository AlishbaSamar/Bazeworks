import { apiClient } from "./api-client";

export interface PublishValidation {
  errors: string[];
  warnings: string[];
}

export interface PublicationSummary {
  id: string;
  createdAt: string;
  note: string | null;
  createdById: string | null;
}

export interface PublishStatus {
  lastPublishedAt: string | null;
  hasPendingChanges: boolean;
  websiteChanged: boolean;
  changedPages: string[];
  publishedPageCount: number;
  lastPublication: PublicationSummary | null;
}

export interface PublishResult {
  publication: PublicationSummary;
  validation: PublishValidation;
}

function base(workspaceId: string, websiteId: string) {
  return `/workspaces/${workspaceId}/websites/${websiteId}`;
}

export const publishingApi = {
  status: (workspaceId: string, websiteId: string) =>
    apiClient.get<PublishStatus>(`${base(workspaceId, websiteId)}/publish/status`),
  check: (workspaceId: string, websiteId: string) =>
    apiClient.get<PublishValidation>(`${base(workspaceId, websiteId)}/publish/check`),
  publish: (workspaceId: string, websiteId: string, note?: string) =>
    apiClient.post<PublishResult>(`${base(workspaceId, websiteId)}/publish`, { note }),
  history: (workspaceId: string, websiteId: string) =>
    apiClient.get<PublicationSummary[]>(`${base(workspaceId, websiteId)}/publications`),
  createPreviewLink: (workspaceId: string, websiteId: string) =>
    apiClient.post<{ token: string; url: string; expiresAt: string }>(
      `${base(workspaceId, websiteId)}/preview-link`,
    ),
};
