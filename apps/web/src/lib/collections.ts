import { apiClient } from "./api-client";

export const FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "RICH_TEXT",
  "NUMBER",
  "BOOLEAN",
  "DATE",
  "DATE_TIME",
  "IMAGE",
  "FILE",
  "URL",
  "EMAIL",
  "SELECT",
  "MULTI_SELECT",
  "RELATION",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_META: Record<FieldType, { label: string; description: string }> = {
  TEXT: { label: "Text", description: "A single line of text" },
  TEXTAREA: { label: "Textarea", description: "A few lines of plain text" },
  RICH_TEXT: { label: "Rich text", description: "Formatted text with headings, links, lists" },
  NUMBER: { label: "Number", description: "An integer or decimal value" },
  BOOLEAN: { label: "Boolean", description: "A true/false toggle" },
  DATE: { label: "Date", description: "A calendar date" },
  DATE_TIME: { label: "Date & time", description: "A date with a specific time" },
  IMAGE: { label: "Image", description: "A single image" },
  FILE: { label: "File", description: "Any uploaded file" },
  URL: { label: "URL", description: "A web address" },
  EMAIL: { label: "Email", description: "An email address" },
  SELECT: { label: "Select", description: "One choice from a fixed list" },
  MULTI_SELECT: { label: "Multi-select", description: "Multiple choices from a fixed list" },
  RELATION: { label: "Relation", description: "A link to an entry in another collection" },
};

export interface CollectionField {
  id: string;
  name: string;
  key: string;
  type: FieldType;
  required: boolean;
  options: string[];
  order: number;
  relatedCollectionId: string | null;
  relatedCollection?: { id: string; name: string } | null;
  collectionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  websiteId: string;
  fieldCount: number;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionWithFields {
  id: string;
  name: string;
  slug: string;
  websiteId: string;
  createdAt: string;
  updatedAt: string;
  fields: CollectionField[];
}

export interface FieldInput {
  name: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  relatedCollectionId?: string;
}

export interface CollectionEntry {
  id: string;
  collectionId: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EntriesPage {
  entries: CollectionEntry[];
  nextCursor: string | null;
}

export interface ListEntriesParams {
  cursor?: string;
  limit?: number;
  q?: string;
}

const TEXT_LIKE_FIELD_TYPES: FieldType[] = ["TEXT", "TEXTAREA", "RICH_TEXT", "EMAIL", "URL"];

export function getEntryLabel(fields: CollectionField[], entry: CollectionEntry): string {
  const textField = fields.find(
    (f) => TEXT_LIKE_FIELD_TYPES.includes(f.type) && typeof entry.data[f.key] === "string" && entry.data[f.key],
  );
  if (textField) return String(entry.data[textField.key]);

  const anyField = fields.find((f) => {
    const value = entry.data[f.key];
    return value !== undefined && value !== null && typeof value !== "object";
  });
  if (anyField) return String(entry.data[anyField.key]);

  return "Untitled entry";
}

function base(workspaceId: string, websiteId: string) {
  return `/workspaces/${workspaceId}/websites/${websiteId}/collections`;
}

export const collectionsApi = {
  list: (workspaceId: string, websiteId: string) =>
    apiClient.get<Collection[]>(base(workspaceId, websiteId)),
  get: (workspaceId: string, websiteId: string, collectionId: string) =>
    apiClient.get<CollectionWithFields>(`${base(workspaceId, websiteId)}/${collectionId}`),
  create: (workspaceId: string, websiteId: string, name: string) =>
    apiClient.post<Collection>(base(workspaceId, websiteId), { name }),
  rename: (workspaceId: string, websiteId: string, collectionId: string, name: string) =>
    apiClient.patch<Collection>(`${base(workspaceId, websiteId)}/${collectionId}`, { name }),
  remove: (workspaceId: string, websiteId: string, collectionId: string) =>
    apiClient.delete<{ id: string }>(`${base(workspaceId, websiteId)}/${collectionId}`),
  createField: (workspaceId: string, websiteId: string, collectionId: string, input: FieldInput) =>
    apiClient.post<CollectionField>(`${base(workspaceId, websiteId)}/${collectionId}/fields`, input),
  updateField: (
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    fieldId: string,
    input: Partial<FieldInput>,
  ) =>
    apiClient.patch<CollectionField>(
      `${base(workspaceId, websiteId)}/${collectionId}/fields/${fieldId}`,
      input,
    ),
  removeField: (workspaceId: string, websiteId: string, collectionId: string, fieldId: string) =>
    apiClient.delete<{ id: string }>(`${base(workspaceId, websiteId)}/${collectionId}/fields/${fieldId}`),
  listEntries: (
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    params?: ListEntriesParams,
  ) => {
    const search = new URLSearchParams();
    if (params?.cursor) search.set("cursor", params.cursor);
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.q) search.set("q", params.q);
    const qs = search.toString();
    return apiClient.get<EntriesPage>(
      `${base(workspaceId, websiteId)}/${collectionId}/entries${qs ? `?${qs}` : ""}`,
    );
  },
  getEntry: (workspaceId: string, websiteId: string, collectionId: string, entryId: string) =>
    apiClient.get<CollectionEntry>(`${base(workspaceId, websiteId)}/${collectionId}/entries/${entryId}`),
  createEntry: (
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    data: Record<string, unknown>,
  ) =>
    apiClient.post<CollectionEntry>(`${base(workspaceId, websiteId)}/${collectionId}/entries`, { data }),
  updateEntry: (
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    entryId: string,
    data: Record<string, unknown>,
  ) =>
    apiClient.patch<CollectionEntry>(
      `${base(workspaceId, websiteId)}/${collectionId}/entries/${entryId}`,
      { data },
    ),
  removeEntry: (workspaceId: string, websiteId: string, collectionId: string, entryId: string) =>
    apiClient.delete<{ id: string }>(`${base(workspaceId, websiteId)}/${collectionId}/entries/${entryId}`),
};
