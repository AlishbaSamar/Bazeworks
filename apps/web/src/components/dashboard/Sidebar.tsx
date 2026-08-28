"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkspaceSwitcher } from "@/components/dashboard/WorkspaceSwitcher";
import {
  DashboardIcon,
  TemplatesIcon,
  MembersIcon,
  MediaIcon,
  SettingsIcon,
} from "@/components/icons/DashboardNavIcons";
import type { Workspace } from "@/lib/workspaces";

interface NavItem {
  label: string;
  icon: React.ComponentType;
  href?: string;
  match?: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: DashboardIcon,
    href: "/dashboard",
    match: (p) => p === "/dashboard" || p.startsWith("/dashboard/websites"),
  },
  {
    label: "Templates",
    icon: TemplatesIcon,
    href: "/dashboard/templates",
    match: (p) => p.startsWith("/dashboard/templates"),
  },
  {
    label: "Members",
    icon: MembersIcon,
    href: "/dashboard/members",
    match: (p) => p.startsWith("/dashboard/members"),
  },
  { label: "Media", icon: MediaIcon },
  { label: "Settings", icon: SettingsIcon },
];

export function Sidebar({
  workspaces,
  activeWorkspace,
  onWorkspaceSelect,
  onCreateWorkspace,
  userName,
  onLogout,
}: {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  onWorkspaceSelect: (workspace: Workspace) => void;
  onCreateWorkspace: () => void;
  userName: string;
  onLogout: () => void;
}) {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface p-4">
      <Link href="/dashboard" className="flex items-center gap-2 px-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          B
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">Bazeworks</span>
      </Link>

      <WorkspaceSwitcher
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelect={onWorkspaceSelect}
        onCreateNew={onCreateWorkspace}
      />

      <div className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.href ? (item.match?.(pathname) ?? pathname === item.href) : false;
          const base =
            "flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

          if (!item.href) {
            return (
              <div
                key={item.label}
                title="Coming soon"
                className={`${base} cursor-not-allowed text-muted-foreground/70`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon />
                  {item.label}
                </span>
                <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`${base} ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-surface-sunken hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon />
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-surface-sunken p-3.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {activeWorkspace.name}
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {activeWorkspace.memberCount ?? 1}{" "}
          {(activeWorkspace.memberCount ?? 1) === 1 ? "member" : "members"}
        </p>
      </div>

      <Link
        href="/dashboard/account"
        className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-surface-sunken"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {userName.charAt(0).toUpperCase()}
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {userName}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onLogout();
          }}
          title="Log out"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m9 0l-3-3m3 3l-3 3"
            />
          </svg>
        </button>
      </Link>
    </nav>
  );
}
