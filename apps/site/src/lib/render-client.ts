import type { Data } from "@puckeditor/core";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:4000/api";

export interface RenderResponse {
  website: {
    name: string;
    theme: Record<string, unknown>;
    globalHeader: Record<string, unknown>;
    globalFooter: Record<string, unknown>;
    seo: { titleTemplate?: string; description?: string; ogImage?: string } & Record<string, unknown>;
    logoUrl: string | null;
    faviconUrl: string | null;
  };
  page: {
    name: string;
    slug: string;
    content: Data;
    seo:
      | {
          title?: string;
          description?: string;
          canonicalUrl?: string;
          robots?: string;
          ogTitle?: string;
          ogDescription?: string;
          ogImage?: string;
        }
      | null;
    isDynamic: boolean;
  };
  entry: {
    id: string;
    collectionId: string;
    data: Record<string, unknown>;
    status: string;
  } | null;
  collectionFields: {
    id: string;
    name: string;
    key: string;
    type: string;
    required: boolean;
    options: string[];
    order: number;
    relatedCollectionId: string | null;
    collectionId: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

export class RenderError extends Error {
  constructor(public status: number) {
    super(`Render API ${status}`);
  }
}

export async function fetchRender(
  websiteId: string,
  path: string,
): Promise<RenderResponse> {
  const res = await fetch(
    `${API_URL}/public/render/${websiteId}/resolve?path=${encodeURIComponent(path)}`,
    { next: { revalidate: 30 } },
  );
  if (!res.ok) throw new RenderError(res.status);
  return (await res.json()) as RenderResponse;
}
