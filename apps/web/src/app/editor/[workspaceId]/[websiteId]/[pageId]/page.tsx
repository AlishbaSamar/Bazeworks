"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Puck, usePuck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { useSession } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";
import { pagesApi, type PageWithContent } from "@/lib/pages";
import { puckConfig } from "@/lib/puck-config";

type SaveStatus = "idle" | "saving" | "saved" | "error";

function EditorHeaderActions({
  websiteId,
  saveStatus,
  onSave,
}: {
  websiteId: string;
  saveStatus: SaveStatus;
  onSave: (data: Data) => void;
}) {
  const { appState } = usePuck();

  return (
    <div className="flex items-center gap-3">
      {saveStatus === "saved" && <span className="text-xs text-success">Saved</span>}
      {saveStatus === "error" && <span className="text-xs text-destructive">Save failed</span>}
      <Link
        href={`/dashboard/websites/${websiteId}`}
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Back to website
      </Link>
      <button
        type="button"
        onClick={() => onSave(appState.data)}
        disabled={saveStatus === "saving"}
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saveStatus === "saving" ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        disabled
        title="Coming Day 11"
        className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-muted-foreground"
      >
        Publish
      </button>
    </div>
  );
}

export default function PageEditor() {
  const router = useRouter();
  const params = useParams<{ workspaceId: string; websiteId: string; pageId: string }>();
  const { data: session, isPending } = useSession();

  const [page, setPage] = useState<PageWithContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    pagesApi
      .get(params.workspaceId, params.websiteId, params.pageId)
      .then((data) => {
        if (!cancelled) setPage(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "This page doesn't exist in the current workspace."
            : "Couldn't load this page.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [session, params.workspaceId, params.websiteId, params.pageId]);

  async function handleSave(data: Data) {
    setSaveStatus("saving");
    try {
      await pagesApi.updateContent(params.workspaceId, params.websiteId, params.pageId, data);
      setSaveStatus("saved");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Link
          href={`/dashboard/websites/${params.websiteId}`}
          className="text-sm font-medium text-foreground hover:underline"
        >
          ← Back to website
        </Link>
      </div>
    );
  }

  if (isPending || !session || !page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading editor…</p>
      </div>
    );
  }

  return (
    <Puck
      config={puckConfig}
      data={page.content}
      headerTitle={page.name}
      headerPath={page.slug}
      height="100vh"
      overrides={{
        headerActions: () => (
          <EditorHeaderActions websiteId={params.websiteId} saveStatus={saveStatus} onSave={handleSave} />
        ),
      }}
    />
  );
}
