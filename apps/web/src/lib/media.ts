import { apiClient } from "./api-client";

export type AssetKind = "IMAGE" | "VIDEO" | "DOCUMENT";

export interface Asset {
  id: string;
  kind: AssetKind;
  provider: string;
  externalId: string;
  url: string;
  filename: string;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  websiteId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetsPage {
  assets: Asset[];
  nextCursor: string | null;
}

interface SignedUpload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

export const ACCEPTED_MIME =
  "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,video/mp4,video/webm,video/quicktime,application/pdf";

const SIZE_LIMIT_MB: Record<AssetKind, number> = { IMAGE: 10, VIDEO: 200, DOCUMENT: 25 };

export function kindForMime(mime: string): AssetKind | null {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime === "application/pdf") return "DOCUMENT";
  return null;
}

function base(workspaceId: string, websiteId: string) {
  return `/workspaces/${workspaceId}/websites/${websiteId}/media`;
}

export const mediaApi = {
  list: (
    workspaceId: string,
    websiteId: string,
    params?: { kind?: AssetKind; q?: string; cursor?: string; limit?: number },
  ) => {
    const s = new URLSearchParams();
    if (params?.kind) s.set("kind", params.kind);
    if (params?.q) s.set("q", params.q);
    if (params?.cursor) s.set("cursor", params.cursor);
    if (params?.limit) s.set("limit", String(params.limit));
    const qs = s.toString();
    return apiClient.get<AssetsPage>(`${base(workspaceId, websiteId)}${qs ? `?${qs}` : ""}`);
  },
  updateAlt: (workspaceId: string, websiteId: string, assetId: string, alt: string) =>
    apiClient.patch<Asset>(`${base(workspaceId, websiteId)}/${assetId}`, { alt }),
  remove: (workspaceId: string, websiteId: string, assetId: string) =>
    apiClient.delete<{ id: string }>(`${base(workspaceId, websiteId)}/${assetId}`),
};

/**
 * Full upload flow: ask the API to sign a Cloudinary upload, POST the file
 * straight to Cloudinary (keeps large files off our server), then persist the
 * resulting asset record. Rejects unsupported types / oversize before upload.
 */
export async function uploadAsset(
  workspaceId: string,
  websiteId: string,
  file: File,
): Promise<Asset> {
  const kind = kindForMime(file.type);
  if (!kind) {
    throw new Error(`"${file.type || file.name}" isn't a supported file type.`);
  }
  if (file.size > SIZE_LIMIT_MB[kind] * 1024 * 1024) {
    throw new Error(
      `"${file.name}" is too large — the limit for ${kind.toLowerCase()}s is ${SIZE_LIMIT_MB[kind]} MB.`,
    );
  }

  const signed = await apiClient.post<SignedUpload>(
    `${base(workspaceId, websiteId)}/sign`,
  );

  const resourceType = kind === "IMAGE" ? "image" : kind === "VIDEO" ? "video" : "raw";
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("signature", signed.signature);
  form.append("folder", signed.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/${resourceType}/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) {
    throw new Error("Upload to storage failed. Please try again.");
  }
  const uploaded = (await res.json()) as {
    public_id: string;
    secure_url: string;
    bytes: number;
    width?: number;
    height?: number;
  };

  return apiClient.post<Asset>(base(workspaceId, websiteId), {
    externalId: uploaded.public_id,
    url: uploaded.secure_url,
    filename: file.name,
    mimeType: file.type,
    bytes: uploaded.bytes ?? file.size,
    width: uploaded.width,
    height: uploaded.height,
  });
}
