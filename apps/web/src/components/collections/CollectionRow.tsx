"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Collection } from "@/lib/collections";
import { timeAgo } from "@/lib/format";

export function CollectionRow({
  collection,
  href,
  canManage,
  canDelete,
  onRename,
  onDelete,
}: {
  collection: Collection;
  href: string;
  canManage: boolean;
  canDelete: boolean;
  onRename: () => void;
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
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <ellipse cx="12" cy="6" rx="8" ry="3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground">{collection.name}</span>
          <span className="block truncate text-xs text-muted-foreground">/{collection.slug}</span>
        </span>
      </Link>

      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
        {collection.fieldCount} field{collection.fieldCount === 1 ? "" : "s"}
      </span>
      <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
        {collection.entryCount} entries
      </span>
      <span className="hidden shrink-0 text-xs text-muted-foreground lg:inline">
        Updated {timeAgo(collection.updatedAt)}
      </span>

      {canManage && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            aria-label="Collection actions"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5A1.5 1.5 0 1110 11.5a1.5 1.5 0 010-3zM10 14A1.5 1.5 0 1110 17a1.5 1.5 0 010-3z" />
            </svg>
          </button>

          {menuOpen && (
            <div className="animate-menu absolute right-0 top-full z-10 mt-1.5 w-44 rounded-lg border border-border bg-surface py-1 shadow-lg">
              <Link
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-sunken"
              >
                Manage fields
              </Link>
              <Link
                href={`${href}/entries`}
                onClick={() => setMenuOpen(false)}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-sunken"
              >
                View entries
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onRename();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-sunken"
              >
                Rename
              </button>
              {canDelete && (
                <>
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
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
