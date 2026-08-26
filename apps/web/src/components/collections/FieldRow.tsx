"use client";

import { useEffect, useRef, useState } from "react";
import { FIELD_TYPE_META, type CollectionField } from "@/lib/collections";

export function FieldRow({
  field,
  canManage,
  onEdit,
  onDelete,
}: {
  field: CollectionField;
  canManage: boolean;
  onEdit: () => void;
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

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 text-sm transition-colors hover:border-border-strong hover:bg-surface-sunken">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-foreground">{field.name}</span>
          {field.required && (
            <span className="shrink-0 rounded-full border border-border bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Required
            </span>
          )}
        </div>
        <span className="block truncate font-mono text-xs text-muted-foreground">
          {field.key}
          {field.type === "RELATION" && field.relatedCollection && (
            <> · relates to {field.relatedCollection.name}</>
          )}
          {(field.type === "SELECT" || field.type === "MULTI_SELECT") && field.options.length > 0 && (
            <> · {field.options.length} option{field.options.length === 1 ? "" : "s"}</>
          )}
        </span>
      </div>

      <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {FIELD_TYPE_META[field.type].label}
      </span>

      {canManage && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            aria-label="Field actions"
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
