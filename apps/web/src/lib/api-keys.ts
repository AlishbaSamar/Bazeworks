import { apiClient } from "./api-client";

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  websiteId: string;
  createdById: string | null;
}

/** Returned only from create() — the full secret is shown exactly once. */
export interface ApiKeyWithSecret extends ApiKey {
  key: string;
}

function base(workspaceId: string, websiteId: string) {
  return `/workspaces/${workspaceId}/websites/${websiteId}/api-keys`;
}

export const apiKeysApi = {
  list: (workspaceId: string, websiteId: string) =>
    apiClient.get<ApiKey[]>(base(workspaceId, websiteId)),
  create: (workspaceId: string, websiteId: string, name: string) =>
    apiClient.post<ApiKeyWithSecret>(base(workspaceId, websiteId), { name }),
  revoke: (workspaceId: string, websiteId: string, keyId: string) =>
    apiClient.delete<{ id: string }>(`${base(workspaceId, websiteId)}/${keyId}`),
};
