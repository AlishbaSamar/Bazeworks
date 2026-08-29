import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type VercelReadyState =
  'QUEUED' | 'INITIALIZING' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';

export interface VercelDeployment {
  id: string;
  url: string | null;
  readyState: VercelReadyState;
  createdAt: number;
}

/**
 * Minimal Vercel REST client — trigger a build via the project's deploy hook,
 * then poll deployment state / events / cancel via the API. Everything is
 * best-effort: a Vercel outage must surface as a failed deployment, never a
 * 500 on our side (PRD §9.4).
 */
@Injectable()
export class VercelService {
  private readonly logger = new Logger(VercelService.name);

  constructor(private readonly config: ConfigService) {}

  get configured(): boolean {
    return Boolean(
      this.config.get('VERCEL_TOKEN') &&
      (this.config.get('VERCEL_DEPLOY_HOOK_URL') ||
        this.config.get('VERCEL_PROJECT_ID')),
    );
  }

  private token() {
    return this.config.get<string>('VERCEL_TOKEN') ?? '';
  }

  private teamQuery() {
    const team = this.config.get<string>('VERCEL_TEAM_ID');
    return team ? `?teamId=${team}` : '';
  }

  private teamQueryAmp() {
    const team = this.config.get<string>('VERCEL_TEAM_ID');
    return team ? `&teamId=${team}` : '';
  }

  private async api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`https://api.vercel.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token()}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `Vercel API ${res.status} on ${path}: ${body.slice(0, 300)}`,
      );
    }
    return (await res.json()) as T;
  }

  /** Fires the project's deploy hook. Hooks don't return a deployment id, so
   * the caller resolves it afterwards via {@link latestDeployment}. */
  async triggerDeployHook(): Promise<void> {
    const hook = this.config.get<string>('VERCEL_DEPLOY_HOOK_URL');
    if (!hook) throw new Error('VERCEL_DEPLOY_HOOK_URL is not set');
    const res = await fetch(hook, { method: 'POST' });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Deploy hook ${res.status}: ${body.slice(0, 300)}`);
    }
  }

  /** Newest deployment for the configured project, optionally only those
   * created at/after `sinceMs` (used to pick up the one the hook just made). */
  async latestDeployment(sinceMs?: number): Promise<VercelDeployment | null> {
    const projectId = this.config.get<string>('VERCEL_PROJECT_ID');
    const projectQ = projectId ? `&projectId=${projectId}` : '';
    const data = await this.api<{
      deployments: {
        uid: string;
        url: string;
        state?: VercelReadyState;
        readyState?: VercelReadyState;
        created: number;
      }[];
    }>(`/v6/deployments?limit=10${projectQ}${this.teamQueryAmp()}`);

    const mapped = data.deployments
      .map((d) => ({
        id: d.uid,
        url: d.url ?? null,
        readyState: d.readyState ?? d.state ?? 'QUEUED',
        createdAt: d.created,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    if (sinceMs) {
      const fresh = mapped.find((d) => d.createdAt >= sinceMs - 5000);
      return fresh ?? mapped[0] ?? null;
    }
    return mapped[0] ?? null;
  }

  async getDeployment(id: string): Promise<VercelDeployment> {
    const d = await this.api<{
      id: string;
      url?: string;
      readyState?: VercelReadyState;
      state?: VercelReadyState;
      createdAt?: number;
      alias?: string[];
    }>(`/v13/deployments/${id}${this.teamQuery()}`);
    return {
      id: d.id,
      url: d.alias?.[0] ?? d.url ?? null,
      readyState: d.readyState ?? d.state ?? 'QUEUED',
      createdAt: d.createdAt ?? Date.now(),
    };
  }

  async getEvents(id: string): Promise<string[]> {
    const events = await this.api<
      {
        type: string;
        payload?: { text?: string };
        text?: string;
        created?: number;
      }[]
    >(`/v3/deployments/${id}/events${this.teamQuery()}`);
    return events
      .map((e) => e.payload?.text ?? e.text ?? '')
      .filter((line): line is string => Boolean(line));
  }

  async cancelDeployment(id: string): Promise<void> {
    await this.api(`/v12/deployments/${id}/cancel${this.teamQuery()}`, {
      method: 'PATCH',
    });
  }
}
