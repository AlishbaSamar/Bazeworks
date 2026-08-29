import { apiClient } from "./api-client";

export type DeploymentStatus =
  | "QUEUED"
  | "BUILDING"
  | "DEPLOYING"
  | "READY"
  | "FAILED"
  | "CANCELLED";

export const DEPLOYMENT_STEPS: DeploymentStatus[] = [
  "QUEUED",
  "BUILDING",
  "DEPLOYING",
  "READY",
];

export const TERMINAL_STATUSES: DeploymentStatus[] = ["READY", "FAILED", "CANCELLED"];

export interface Deployment {
  id: string;
  status: DeploymentStatus;
  vercelDeploymentId: string | null;
  url: string | null;
  errorMessage: string | null;
  buildStartedAt: string | null;
  readyAt: string | null;
  createdAt: string;
  updatedAt: string;
  websiteId: string;
  publicationId: string;
  initiatedById: string | null;
  publication?: { id: string; note: string | null; createdAt: string };
}

function base(workspaceId: string, websiteId: string) {
  return `/workspaces/${workspaceId}/websites/${websiteId}/deployments`;
}

export const deploymentsApi = {
  list: (workspaceId: string, websiteId: string) =>
    apiClient.get<Deployment[]>(base(workspaceId, websiteId)),
  get: (workspaceId: string, websiteId: string, id: string) =>
    apiClient.get<Deployment>(`${base(workspaceId, websiteId)}/${id}`),
  logs: (workspaceId: string, websiteId: string, id: string) =>
    apiClient.get<{ lines: string[] }>(`${base(workspaceId, websiteId)}/${id}/logs`),
  deploy: (workspaceId: string, websiteId: string, publicationId?: string) =>
    apiClient.post<Deployment>(base(workspaceId, websiteId), { publicationId }),
  redeploy: (workspaceId: string, websiteId: string, id: string) =>
    apiClient.post<Deployment>(`${base(workspaceId, websiteId)}/${id}/redeploy`),
  cancel: (workspaceId: string, websiteId: string, id: string) =>
    apiClient.post<Deployment>(`${base(workspaceId, websiteId)}/${id}/cancel`),
};
