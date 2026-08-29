"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { ApiError } from "@/lib/api-client";
import { timeAgo } from "@/lib/format";
import {
  DEPLOYMENT_STEPS,
  TERMINAL_STATUSES,
  deploymentsApi,
  type Deployment,
  type DeploymentStatus,
} from "@/lib/deployments";

const STATUS_STYLE: Record<DeploymentStatus, string> = {
  QUEUED: "bg-surface-sunken text-muted-foreground border-border",
  BUILDING: "bg-amber-50 text-amber-700 border-amber-300",
  DEPLOYING: "bg-amber-50 text-amber-700 border-amber-300",
  READY: "bg-success-soft text-success border-success/20",
  FAILED: "bg-destructive-soft text-destructive border-destructive/20",
  CANCELLED: "bg-surface-sunken text-muted-foreground border-border",
};

function duration(d: Deployment): string | null {
  if (!d.buildStartedAt || !d.readyAt) return null;
  const ms = new Date(d.readyAt).getTime() - new Date(d.buildStartedAt).getTime();
  if (ms < 0) return null;
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function Stepper({ status }: { status: DeploymentStatus }) {
  if (status === "FAILED" || status === "CANCELLED") {
    return (
      <p className={`text-sm font-medium ${status === "FAILED" ? "text-destructive" : "text-muted-foreground"}`}>
        {status === "FAILED" ? "Deployment failed" : "Deployment cancelled"}
      </p>
    );
  }
  const currentIndex = DEPLOYMENT_STEPS.indexOf(status);
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {DEPLOYMENT_STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={`flex h-5 items-center gap-1.5 rounded-full border px-2 font-medium capitalize ${
                done
                  ? "border-success/30 bg-success-soft text-success"
                  : active
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-border bg-surface-sunken text-muted-foreground"
              }`}
            >
              {done ? "✓" : active && status !== "READY" ? "•" : ""} {step.toLowerCase()}
            </span>
            {i < DEPLOYMENT_STEPS.length - 1 && <span className="text-muted-foreground">→</span>}
          </li>
        );
      })}
    </ol>
  );
}

export function DeploymentPanel({
  workspaceId,
  websiteId,
  canDeploy,
  hasPublication,
  productionUrl,
  onProductionUrl,
}: {
  workspaceId: string;
  websiteId: string;
  canDeploy: boolean;
  hasPublication: boolean;
  productionUrl: string | null;
  onProductionUrl?: (url: string) => void;
}) {
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const latest = deployments?.[0] ?? null;
  const inFlight = latest ? !TERMINAL_STATUSES.includes(latest.status) : false;
  const liveUrl =
    productionUrl ?? deployments?.find((d) => d.status === "READY" && d.url)?.url ?? null;

  const load = useCallback(() => {
    deploymentsApi
      .list(workspaceId, websiteId)
      .then(setDeployments)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load deployments."));
  }, [workspaceId, websiteId]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll the active deployment + its logs while it's in flight.
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!latest || !inFlight) return;

    const tick = async () => {
      try {
        const [fresh, log] = await Promise.all([
          deploymentsApi.get(workspaceId, websiteId, latest.id),
          deploymentsApi.logs(workspaceId, websiteId, latest.id).catch(() => ({ lines: [] })),
        ]);
        setDeployments((prev) =>
          (prev ?? []).map((d) => (d.id === fresh.id ? { ...d, ...fresh } : d)),
        );
        setLogs(log.lines);
        if (fresh.status === "READY" && fresh.url) onProductionUrl?.(fresh.url);
        if (TERMINAL_STATUSES.includes(fresh.status) && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {
        /* keep polling */
      }
    };
    void tick();
    pollRef.current = setInterval(() => void tick(), 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // Restart the poll only when the active deployment or its in-flight state
    // changes — not on every list mutation the tick itself causes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.id, inFlight, workspaceId, websiteId, onProductionUrl]);

  async function run(fn: () => Promise<Deployment>) {
    setBusy(true);
    setError(null);
    try {
      const created = await fn();
      setDeployments((prev) => [created, ...(prev ?? [])]);
      setShowLogs(true);
      setLogs([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Deployment failed to start.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Deployment</p>
        <div className="flex gap-2">
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-white px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-border-strong hover:bg-background"
            >
              Open live site
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
            </a>
          )}
          {canDeploy && (
            <Button
              className="w-auto px-4"
              loading={busy || inFlight}
              disabled={!hasPublication || busy || inFlight}
              title={!hasPublication ? "Publish the website first" : undefined}
              onClick={() => run(() => deploymentsApi.deploy(workspaceId, websiteId))}
            >
              {inFlight ? "Deploying…" : "Deploy"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3">
          <FormBanner variant="error">{error}</FormBanner>
        </div>
      )}

      {!hasPublication && (
        <p className="mt-3 text-sm text-muted-foreground">Publish the website to enable deployment.</p>
      )}

      {latest && (
        <div className="mt-4 flex flex-col gap-3">
          <Stepper status={latest.status} />
          {latest.errorMessage && <p className="text-sm text-destructive">{latest.errorMessage}</p>}
          {(inFlight || logs.length > 0) && (
            <div>
              <button
                type="button"
                onClick={() => setShowLogs((v) => !v)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {showLogs ? "Hide" : "Show"} build logs
              </button>
              {showLogs && (
                <pre className="mt-1.5 max-h-56 overflow-auto rounded-md bg-foreground/95 p-3 text-xs leading-relaxed text-white/90">
                  {logs.length ? logs.join("\n") : "Waiting for build output…"}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">History</p>
        {deployments === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : deployments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deployments yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {deployments.map((d, i) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[d.status]}`}>
                  {d.status.toLowerCase()}
                </span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {d.publication?.note || "No note"}
                  {duration(d) && <span className="ml-2 text-xs">· {duration(d)}</span>}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:inline">{timeAgo(d.createdAt)}</span>
                {d.status === "READY" && d.url && (
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-foreground hover:underline">
                    Open
                  </a>
                )}
                {canDeploy && (
                  <button
                    type="button"
                    disabled={busy || inFlight}
                    onClick={() =>
                      run(() => deploymentsApi.redeploy(workspaceId, websiteId, d.id))
                    }
                    className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {i === 0 ? "Redeploy" : "Roll back to this"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
