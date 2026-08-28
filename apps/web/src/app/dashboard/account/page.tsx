"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "@/components/ui/FormBanner";
import { authClient, useSession } from "@/lib/auth-client";

const PASSWORD_COMPLEXITY = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/;

export default function AccountPage() {
  const { data: session, isPending } = useSession();

  const [name, setName] = useState("");
  const [profileState, setProfileState] = useState<
    { type: "idle" | "saving" } | { type: "error" | "success"; message: string }
  >({ type: "idle" });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOthers, setRevokeOthers] = useState(true);
  const [pwState, setPwState] = useState<
    { type: "idle" | "saving" } | { type: "error" | "success"; message: string }
  >({ type: "idle" });

  const hydratedName = useRef(false);
  useEffect(() => {
    if (hydratedName.current || !session?.user.name) return;
    hydratedName.current = true;
    queueMicrotask(() => setName(session.user.name));
  }, [session?.user.name]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileState({ type: "saving" });
    const { error } = await authClient.updateUser({ name: name.trim() });
    if (error) {
      setProfileState({ type: "error", message: error.message ?? "Couldn't save your profile." });
    } else {
      setProfileState({ type: "success", message: "Profile updated." });
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwState({ type: "error", message: "The new passwords don't match." });
      return;
    }
    if (!PASSWORD_COMPLEXITY.test(newPassword)) {
      setPwState({
        type: "error",
        message:
          "Use at least 8 characters with an uppercase letter, a lowercase letter and a number.",
      });
      return;
    }
    setPwState({ type: "saving" });
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: revokeOthers,
    });
    if (error) {
      setPwState({
        type: "error",
        message: error.message ?? "Couldn't change your password.",
      });
    } else {
      setPwState({ type: "success", message: "Password changed." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  if (isPending || !session) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your name and password.
        </p>
      </header>

      <form onSubmit={handleProfileSave} className="rounded-xl border border-border bg-surface p-5">
        <p className="mb-4 text-sm font-medium text-foreground">Profile</p>
        {profileState.type === "error" && (
          <div className="mb-3">
            <FormBanner variant="error">{profileState.message}</FormBanner>
          </div>
        )}
        {profileState.type === "success" && (
          <div className="mb-3">
            <FormBanner variant="success">{profileState.message}</FormBanner>
          </div>
        )}
        <div className="flex flex-col gap-4">
          <Input
            label="Full name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input label="Email" name="email" value={session.user.email} disabled readOnly />
          <div>
            <Button type="submit" loading={profileState.type === "saving"} className="w-auto px-4">
              Save profile
            </Button>
          </div>
        </div>
      </form>

      <form
        onSubmit={handlePasswordChange}
        className="rounded-xl border border-border bg-surface p-5"
      >
        <p className="mb-4 text-sm font-medium text-foreground">Change password</p>
        {pwState.type === "error" && (
          <div className="mb-3">
            <FormBanner variant="error">{pwState.message}</FormBanner>
          </div>
        )}
        {pwState.type === "success" && (
          <div className="mb-3">
            <FormBanner variant="success">{pwState.message}</FormBanner>
          </div>
        )}
        <div className="flex flex-col gap-4">
          <Input
            label="Current password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={revokeOthers}
              onChange={(e) => setRevokeOthers(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Sign out other devices
          </label>
          <div>
            <Button type="submit" loading={pwState.type === "saving"} className="w-auto px-4">
              Change password
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
