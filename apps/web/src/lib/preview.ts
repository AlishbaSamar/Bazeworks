import { apiClient } from "./api-client";
import type { Data } from "@puckeditor/core";
import type { CollectionField } from "./collections";
import type { PageSeo } from "./pages";

export interface PublicPreviewResponse {
  website: {
    id: string;
    name: string;
    theme: Record<string, unknown>;
    globalHeader: Record<string, unknown>;
    globalFooter: Record<string, unknown>;
    seo: { titleTemplate?: string } & Record<string, unknown>;
    logoUrl: string | null;
    faviconUrl: string | null;
  };
  page: {
    id: string;
    name: string;
    slug: string;
    content: Data;
    seo: PageSeo | null;
    isDynamic: boolean;
  };
  entry: {
    id: string;
    collectionId: string;
    data: Record<string, unknown>;
    status: "DRAFT" | "PUBLISHED";
  } | null;
  collectionFields?: CollectionField[];
}

export const publicPreviewApi = {
  resolve: (token: string, path: string) =>
    apiClient.get<PublicPreviewResponse>(
      `/public/preview/resolve?token=${encodeURIComponent(token)}&path=${encodeURIComponent(path)}`,
    ),
};
