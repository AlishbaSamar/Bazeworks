import { apiClient } from "./api-client";

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  isOfficial: boolean;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
}

export const templatesApi = {
  list: () => apiClient.get<Template[]>("/templates"),
};
