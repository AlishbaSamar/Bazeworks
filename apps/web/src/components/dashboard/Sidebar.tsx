import { WorkspaceSwitcher } from "@/components/dashboard/WorkspaceSwitcher";
import {
  DashboardIcon,
  WebsitesIcon,
  TemplatesIcon,
  CollectionsIcon,
  MediaIcon,
  SettingsIcon,
} from "@/components/icons/DashboardNavIcons";
import type { Workspace } from "@/lib/workspaces";

const NAV_ITEMS = [
  { label: "Dashboard", icon: DashboardIcon, active: true },
  { label: "Websites", icon: WebsitesIcon, active: false },
  { label: "Templates", icon: TemplatesIcon, active: false },
  { label: "Collections", icon: CollectionsIcon, active: false },
  { label: "Media", icon: MediaIcon, active: false },
  { label: "Settings", icon: SettingsIcon, active: false },
] as const;

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
  return (
    <nav className="flex w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface p-4">
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          B
        </div>
        <span className="text-lg font-semibold text-foreground">Bazeworks</span>
      </div>

      <WorkspaceSwitcher
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelect={onWorkspaceSelect}
        onCreateNew={onCreateWorkspace}
      />

      <div className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              title={item.active ? undefined : "Coming soon"}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                item.active
                  ? "bg-background text-foreground"
                  : "cursor-not-allowed text-muted-foreground/60"
              }`}
            >
              <Icon />
              {item.label}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-background p-3.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Team Plan
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">0 / 3 Websites</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full w-0 rounded-full bg-primary" />
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-md px-1 py-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {userName.charAt(0).toUpperCase()}
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {userName}
        </span>
        <button
          type="button"
          onClick={onLogout}
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
      </div>
    </nav>
  );
}
