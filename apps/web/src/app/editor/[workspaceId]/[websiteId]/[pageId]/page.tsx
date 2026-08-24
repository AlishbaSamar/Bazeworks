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
      {saveStatus === "saved" && (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-10.3a1 1 0 00-1.4-1.4L9 9.58 7.7 8.3a1 1 0 00-1.4 1.42l2 2a1 1 0 001.4 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Saved
        </span>
      )}
      {saveStatus === "error" && (
        <span className="text-xs font-medium text-destructive">Save failed</span>
      )}
      <Link
        href={`/dashboard/websites/${websiteId}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.56l3.72 3.72a.75.75 0 11-1.06 1.06l-5-5a.75.75 0 010-1.06l5-5a.75.75 0 111.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        Back to website
      </Link>
      <button
        type="button"
        onClick={() => onSave(appState.data)}
        disabled={saveStatus === "saving"}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saveStatus === "saving" && (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
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
