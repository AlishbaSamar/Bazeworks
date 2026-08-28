"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "@/components/ui/FormBanner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ApiError } from "@/lib/api-client";
import { useWorkspaceContext } from "@/lib/workspace-context";
import {
  ASSIGNABLE_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  membersApi,
  type AssignableRole,
  type WorkspaceMember,
} from "@/lib/members";

export default function MembersPage() {
  const { activeWorkspace } = useWorkspaceContext();
  const canManage = activeWorkspace.role === "OWNER" || activeWorkspace.role === "ADMIN";

  const [members, setMembers] = useState<WorkspaceMember[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>("EDITOR");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const [removing, setRemoving] = useState<WorkspaceMember | null>(null);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setMembers(null);
      setLoadError(null);
    });
    membersApi
      .list(activeWorkspace.id)
      .then((list) => {
        if (!cancelled) setMembers(list);
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(err instanceof ApiError ? err.message : "Couldn't load members.");
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  const sorted = useMemo(
    () =>
      members
        ? [...members].sort((a, b) => {
            const order = { OWNER: 0, ADMIN: 1, EDITOR: 2, VIEWER: 3 };
            return order[a.role] - order[b.role] || a.name.localeCompare(b.name);
          })
        : null,
    [members],
  );

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteNotice(null);
    setInviting(true);
    try {
      const member = await membersApi.add(activeWorkspace.id, email.trim(), role);
      setMembers((prev) => [...(prev ?? []), member]);
      setEmail("");
      setInviteNotice(`${member.name} was added as ${ROLE_LABELS[member.role]}.`);
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : "Couldn't add that member.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(member: WorkspaceMember, next: AssignableRole) {
    setRowBusyId(member.id);
    try {
      const updated = await membersApi.updateRole(activeWorkspace.id, member.id, next);
      setMembers((prev) =>
        (prev ?? []).map((m) => (m.id === member.id ? { ...m, role: updated.role } : m)),
      );
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Couldn't change that role.");
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleRemove() {
    if (!removing) return;
    setRowBusyId(removing.id);
    try {
      await membersApi.remove(activeWorkspace.id, removing.id);
      setMembers((prev) => (prev ?? []).filter((m) => m.id !== removing.id));
      setRemoving(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Couldn't remove that member.");
      throw err;
    } finally {
      setRowBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          People with access to <span className="font-medium text-foreground">{activeWorkspace.name}</span>.
          {!canManage && " Only owners and admins can change membership."}
        </p>
      </header>

      {loadError && <FormBanner variant="error">{loadError}</FormBanner>}

      {canManage && (
        <form
          onSubmit={handleInvite}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <p className="mb-3 text-sm font-medium text-foreground">Add a member</p>
          {inviteError && (
            <div className="mb-3">
              <FormBanner variant="error">{inviteError}</FormBanner>
            </div>
          )}
          {inviteNotice && (
            <div className="mb-3">
              <FormBanner variant="success">{inviteNotice}</FormBanner>
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Work email"
                name="email"
                type="email"
                required
                placeholder="teammate@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="role" className="text-sm font-medium text-foreground">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as AssignableRole)}
                className="h-11 rounded-md border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" loading={inviting} className="w-auto px-4">
              Add member
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {ROLE_DESCRIPTIONS[role]} They must already have a Bazeworks account.
          </p>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {sorted === null ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Loading members…</p>
        ) : sorted.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>

                {canManage && member.role !== "OWNER" ? (
                  <select
                    aria-label={`Role for ${member.name}`}
                    value={member.role}
                    disabled={rowBusyId === member.id}
                    onChange={(e) =>
                      handleRoleChange(member, e.target.value as AssignableRole)
                    }
                    className="h-9 rounded-md border border-border bg-white px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-full bg-surface-sunken px-2 py-1 text-xs font-medium text-muted-foreground">
                    {ROLE_LABELS[member.role]}
                  </span>
                )}

                {canManage && member.role !== "OWNER" && (
                  <button
                    type="button"
                    onClick={() => setRemoving(member)}
                    disabled={rowBusyId === member.id}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive disabled:opacity-50"
                    title={`Remove ${member.name}`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.177-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {removing && (
        <ConfirmDialog
          title={`Remove ${removing.name}?`}
          message={`${removing.name} will immediately lose access to this workspace and everything in it.`}
          confirmLabel="Remove member"
          danger
          onConfirm={handleRemove}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  );
}
