import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Deployment, DeploymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VercelService, type VercelReadyState } from './vercel.service';

export const TERMINAL: DeploymentStatus[] = ['READY', 'FAILED', 'CANCELLED'];

export function mapState(state: VercelReadyState): DeploymentStatus {
  switch (state) {
    case 'QUEUED':
      return 'QUEUED';
    case 'INITIALIZING':
    case 'BUILDING':
      return 'BUILDING';
    case 'READY':
      return 'READY';
    case 'CANCELED':
      return 'CANCELLED';
    case 'ERROR':
    default:
      return 'FAILED';
  }
}

@Injectable()
export class DeploymentsService {
  private readonly logger = new Logger(DeploymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vercel: VercelService,
  ) {}

  // ---- create ------------------------------------------------------------

  async deploy(
    workspaceId: string,
    websiteId: string,
    userId: string,
    publicationId?: string,
  ) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);

    const publication = publicationId
      ? await this.prisma.publication.findFirst({
          where: { id: publicationId, websiteId },
        })
      : await this.prisma.publication.findFirst({
          where: { websiteId },
          orderBy: { createdAt: 'desc' },
        });

    if (!publication) {
      throw new BadRequestException(
        'Publish the website before deploying — there is no approved snapshot yet.',
      );
    }

    // Point the public site at this snapshot (this is also how rollback works).
    await this.prisma.website.update({
      where: { id: websiteId },
      data: { livePublicationId: publication.id },
    });

    const deployment = await this.prisma.deployment.create({
      data: {
        websiteId,
        publicationId: publication.id,
        initiatedById: userId,
        status: 'QUEUED',
      },
    });

    if (!this.vercel.configured) {
      return this.prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: 'FAILED',
          errorMessage:
            'Deployment is not configured on the server (missing Vercel credentials).',
        },
      });
    }

    try {
      await this.vercel.triggerDeployHook();
      // Give Vercel a moment to register the deployment, then attach its id.
      await new Promise((r) => setTimeout(r, 2500));
      const vd = await this.vercel.latestDeployment(
        deployment.createdAt.getTime(),
      );
      return this.prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: vd ? mapState(vd.readyState) : 'BUILDING',
          vercelDeploymentId: vd?.id ?? null,
          url: vd?.url ? `https://${vd.url}` : null,
          buildStartedAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error(`Deploy trigger failed: ${String(err)}`);
      return this.prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: 'FAILED',
          errorMessage:
            'Could not start the deployment. The deployment service may be unavailable — try again.',
        },
      });
    }
  }

  async redeploy(
    workspaceId: string,
    websiteId: string,
    deploymentId: string,
    userId: string,
  ) {
    const existing = await this.requireDeployment(
      workspaceId,
      websiteId,
      deploymentId,
    );
    return this.deploy(workspaceId, websiteId, userId, existing.publicationId);
  }

  // ---- read + refresh ------------------------------------------------------

  async list(workspaceId: string, websiteId: string, userId: string) {
    await this.requireMembership(workspaceId, userId);
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);

    const deployments = await this.prisma.deployment.findMany({
      where: { websiteId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        publication: { select: { id: true, note: true, createdAt: true } },
      },
    });

    // Opportunistically refresh the newest in-flight one so the list reflects
    // reality without a separate poll.
    const inFlight = deployments.find((d) => !TERMINAL.includes(d.status));
    if (inFlight) {
      const refreshed = await this.refresh(inFlight);
      return deployments.map((d) =>
        d.id === refreshed.id ? { ...d, ...refreshed } : d,
      );
    }
    return deployments;
  }

  async getOne(
    workspaceId: string,
    websiteId: string,
    deploymentId: string,
    userId: string,
  ) {
    await this.requireMembership(workspaceId, userId);
    const deployment = await this.requireDeployment(
      workspaceId,
      websiteId,
      deploymentId,
    );
    return this.refresh(deployment);
  }

  async logs(
    workspaceId: string,
    websiteId: string,
    deploymentId: string,
    userId: string,
  ) {
    await this.requireMembership(workspaceId, userId);
    const deployment = await this.requireDeployment(
      workspaceId,
      websiteId,
      deploymentId,
    );
    if (!deployment.vercelDeploymentId || !this.vercel.configured) {
      return { lines: [] as string[] };
    }
    try {
      return {
        lines: await this.vercel.getEvents(deployment.vercelDeploymentId),
      };
    } catch {
      return { lines: ['Build logs are not available for this deployment.'] };
    }
  }

  async cancel(workspaceId: string, websiteId: string, deploymentId: string) {
    const deployment = await this.requireDeployment(
      workspaceId,
      websiteId,
      deploymentId,
    );
    if (TERMINAL.includes(deployment.status)) return deployment;
    if (deployment.vercelDeploymentId && this.vercel.configured) {
      try {
        await this.vercel.cancelDeployment(deployment.vercelDeploymentId);
      } catch (err) {
        this.logger.warn(`Vercel cancel failed: ${String(err)}`);
      }
    }
    return this.prisma.deployment.update({
      where: { id: deployment.id },
      data: { status: 'CANCELLED' },
    });
  }

  private async refresh(deployment: Deployment): Promise<Deployment> {
    if (TERMINAL.includes(deployment.status) || !this.vercel.configured) {
      return deployment;
    }
    try {
      let vercelId = deployment.vercelDeploymentId;
      if (!vercelId) {
        const vd = await this.vercel.latestDeployment(
          deployment.createdAt.getTime(),
        );
        vercelId = vd?.id ?? null;
        if (!vercelId) return deployment;
      }
      const vd = await this.vercel.getDeployment(vercelId);
      const status = mapState(vd.readyState);
      const data: Partial<Deployment> = {
        status,
        vercelDeploymentId: vercelId,
      };
      if (vd.url) data.url = `https://${vd.url}`;
      if (status === 'READY') data.readyAt = new Date();
      if (status === 'FAILED' && !deployment.errorMessage) {
        data.errorMessage = 'The Vercel build failed. Check the build logs.';
      }

      const updated = await this.prisma.deployment.update({
        where: { id: deployment.id },
        data,
      });

      if (status === 'READY' && updated.url) {
        await this.prisma.website.update({
          where: { id: deployment.websiteId },
          data: { productionUrl: updated.url, status: 'LIVE' },
        });
      }
      return updated;
    } catch (err) {
      this.logger.warn(`Deployment refresh failed: ${String(err)}`);
      return deployment;
    }
  }

  // ---- guards ------------------------------------------------------------

  private async requireMembership(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }
    return membership;
  }

  private async requireWebsiteInWorkspace(
    workspaceId: string,
    websiteId: string,
  ) {
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
    });
    if (!website || website.workspaceId !== workspaceId) {
      throw new NotFoundException('Website not found');
    }
    return website;
  }

  private async requireDeployment(
    workspaceId: string,
    websiteId: string,
    deploymentId: string,
  ) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
    });
    if (!deployment || deployment.websiteId !== websiteId) {
      throw new NotFoundException('Deployment not found');
    }
    return deployment;
  }
}
