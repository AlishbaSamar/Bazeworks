"use client";

import { useEffect, useMemo, useState } from "react";
import { templatesApi, type Template } from "@/lib/templates";
import { ApiError } from "@/lib/api-client";
import { FormBanner } from "@/components/ui/FormBanner";

export function TemplateGallery({
  onSelect,
  disabled,
}: {
  onSelect: (template: Template) => void;
  disabled?: boolean;
}) {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    templatesApi
      .list()
      .then(setTemplates)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Couldn't load templates.");
      });
  }, []);

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
        <input
          type="search"
          placeholder="Search templates…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full max-w-xs rounded-md border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
              className="flex flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{template.name}</span>
                <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {template.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
              <p className="text-xs text-muted-foreground">{template.pageCount} pages</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
