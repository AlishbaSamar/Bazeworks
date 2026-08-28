"use client";

import { useEffect, useMemo, useState } from "react";
import { templatesApi, type Template } from "@/lib/templates";
import { ApiError } from "@/lib/api-client";
import { FormBanner } from "@/components/ui/FormBanner";

export function TemplateGallery({
  onSelect,
  disabled,
  workspaceId,
}: {
  onSelect: (template: Template) => void;
  disabled?: boolean;
  workspaceId?: string;
}) {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    templatesApi
      .list(workspaceId)
      .then(setTemplates)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Couldn't load templates.");
      });
  }, [workspaceId]);

  const categories = useMemo(() => {
    if (!templates) return ["All"];
    return ["All", ...Array.from(new Set(templates.map((t) => t.category)))];
  }, [templates]);

  const filtered = useMemo(() => {
    if (!templates) return [];
    return templates.filter((t) => {
      const matchesCategory = category === "All" || t.category === category;
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, search, category]);

  if (error) return <FormBanner variant="error">{error}</FormBanner>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-xs">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.58 3.58a.75.75 0 11-1.06 1.06l-3.58-3.58A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-white pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`h-10 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white text-muted-foreground hover:border-border-strong hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {templates === null ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading templates…</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No templates match your search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((template) => (
            <button
              key={template.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(template)}
              className="group flex flex-col items-start gap-3 overflow-hidden rounded-xl border border-border bg-surface text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              <div className="flex h-24 w-full items-center justify-center bg-surface-sunken bg-dot-grid">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-foreground shadow-sm ring-1 ring-border transition-transform duration-150 group-hover:scale-105">
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
                    <path strokeLinecap="round" d="M3.5 9.5h17M9.5 9.5V20.5" />
                  </svg>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 px-4 pb-4">
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">{template.name}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {!template.isOfficial && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Custom
                      </span>
                    )}
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {template.category}
                    </span>
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {template.pageCount} {template.pageCount === 1 ? "page" : "pages"}
                  {template.collectionCount > 0 &&
                    ` · ${template.collectionCount} ${
                      template.collectionCount === 1 ? "collection" : "collections"
                    }`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
