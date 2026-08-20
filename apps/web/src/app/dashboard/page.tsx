"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { authClient, useSession } from "@/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  if (isPending || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const { user } = session;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            B
          </div>
          <span className="text-lg font-semibold text-foreground">Bazeworks</span>
        </div>
        <Button
          variant="secondary"
          className="w-auto px-4"
          onClick={async () => {
            await authClient.signOut();
            router.push("/login");
          }}
        >
          Log out
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground">
          Good to see you, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>

        {!user.emailVerified && (
          <div className="mt-6">
            <FormBanner variant="error">
              Your email isn&apos;t verified yet. Check the API server console for the
              stubbed verification link.
            </FormBanner>
          </div>
        )}

        <div className="mt-8 rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Workspaces and websites land on Day 2–3. This page confirms auth end-to-end.
          </p>
        </div>
      </main>
    </div>
  );
}
