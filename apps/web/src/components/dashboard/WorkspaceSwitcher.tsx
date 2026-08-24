"use client";

import { useEffect, useRef, useState } from "react";
import type { Workspace } from "@/lib/workspaces";

const ROLE_LABEL: Record<Workspace["role"], string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspace,
  onSelect,
  onCreateNew,
}: {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  onSelect: (workspace: Workspace) => void;
  onCreateNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-white px-3 py-2 text-left shadow-sm transition-all hover:border-border-strong hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
          {activeWorkspace.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{activeWorkspace.name}</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABEL[activeWorkspace.role]}</p>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="animate-menu absolute left-0 right-0 top-full z-20 mt-1.5 rounded-lg border border-border bg-surface py-1 shadow-lg">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              type="button"
              onClick={() => {
                onSelect(workspace);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-sunken ${
                workspace.id === activeWorkspace.id ? "bg-surface-sunken" : ""
              }`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-semibold text-primary-foreground">
                {workspace.name.charAt(0).toUpperCase()}
              </div>
              <span className="min-w-0 flex-1 truncate text-foreground">{workspace.name}</span>
              <span className="text-xs text-muted-foreground">{ROLE_LABEL[workspace.role]}</span>
              {workspace.id === activeWorkspace.id && (
                <svg className="h-4 w-4 shrink-0 text-foreground" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.6 3.6 6.7-6.7a1 1 0 011.4 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}

          <div className="my-1 h-px bg-border" />

          <button
            type="button"
            onClick={() => {
              onCreateNew();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-sunken"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
            New workspace
          </button>
        </div>
      )}
    </div>
  );
}
