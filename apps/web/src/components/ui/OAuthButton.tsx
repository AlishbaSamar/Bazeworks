"use client";

import { authClient } from "@/lib/auth-client";

export function OAuthButton({
  provider,
  icon,
  label,
}: {
  provider: "google" | "github";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        authClient.signIn.social({
          provider,
          callbackURL: `${window.location.origin}/dashboard`,
        })
      }
      className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-border bg-white text-sm font-medium text-foreground shadow-sm transition-all duration-150 hover:border-border-strong hover:bg-surface-sunken hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
    >
      {icon}
      {label}
    </button>
  );
}
