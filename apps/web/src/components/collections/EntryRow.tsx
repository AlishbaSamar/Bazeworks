"use client";

import { useEffect, useRef, useState } from "react";
import { getEntryLabel, type CollectionEntry, type CollectionField, type EntryStatus } from "@/lib/collections";
import { timeAgo } from "@/lib/format";

const STATUS_LABEL: Record<EntryStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
};

const STATUS_CLASSES: Record<EntryStatus, string> = {
  DRAFT: "bg-surface-sunken text-muted-foreground border-border",
  PUBLISHED: "bg-success-soft text-success border-success/20",
};

function summarize(fields: CollectionField[], entry: CollectionEntry, excludeKey?: string): string {
  const parts: string[] = [];
  for (const field of fields) {
    if (field.key === excludeKey) continue;
    const value = entry.data[field.key];
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      parts.push(`${field.name}: ${value.join(", ")}`);
    } else if (typeof value === "object") {
      continue;
    } else {
      parts.push(`${field.name}: ${value}`);
    }
    if (parts.length === 2) break;
  }
  return parts.join(" · ");
}

export function EntryRow({
  entry,
  fields,
  canManage,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  entry: CollectionEntry;
  fields: CollectionField[];
  canManage: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const label = getEntryLabel(fields, entry);
  const summary = summarize(fields, entry, label);

  return (
    <div
      className="group flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 text-sm transition-colors hover:border-border-strong hover:bg-surface-sunken"
    >
      <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 flex-col items-start text-left">
        <span className="truncate font-medium text-foreground">{label}</span>
        {summary && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{summary}</span>}
      </button>

      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[entry.status]}`}>
        {STATUS_LABEL[entry.status]}
      </span>

      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">Updated {timeAgo(entry.updatedAt)}</span>

      {canManage && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            aria-label="Entry actions"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5A1.5 1.5 0 1110 11.5a1.5 1.5 0 010-3zM10 14A1.5 1.5 0 1110 17a1.5 1.5 0 010-3z" />
            </svg>
          </button>

          {menuOpen && (
            <div className="animate-menu absolute right-0 top-full z-10 mt-1.5 w-36 rounded-lg border border-border bg-surface py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-sunken"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onToggleStatus();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-sunken"
              >
                {entry.status === "PUBLISHED" ? "Unpublish" : "Publish"}
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive-soft"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
