import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { hashKey } from '../api-keys/api-keys.service';
import type { PrismaService } from '../prisma/prisma.service';

function ctx(headers: Record<string, string>) {
  const req: Record<string, unknown> = {
    header: (name: string) => headers[name.toLowerCase()],
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext & { __req: typeof req };
}

describe('ApiKeyGuard', () => {
  let prisma: { apiKey: { findFirst: jest.Mock; update: jest.Mock } };
  let guard: ApiKeyGuard;

  beforeEach(() => {
    prisma = {
      apiKey: {
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    guard = new ApiKeyGuard(prisma as unknown as PrismaService);
  });

  it('rejects a request with no key', async () => {
    await expect(guard.canActivate(ctx({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an unknown / revoked key', async () => {
    prisma.apiKey.findFirst.mockResolvedValue(null);
    await expect(
      guard.canActivate(ctx({ 'x-api-key': 'bzw_nope' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    // findFirst is scoped to non-revoked keys
    expect(prisma.apiKey.findFirst).toHaveBeenCalledWith({
      where: { hashedKey: hashKey('bzw_nope'), revokedAt: null },
    });
  });

  it('accepts a valid bearer key and attaches its websiteId', async () => {
    prisma.apiKey.findFirst.mockResolvedValue({
      id: 'k1',
      websiteId: 'w1',
      lastUsedAt: null,
    });
    const context = ctx({ authorization: 'Bearer bzw_good' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.apiWebsiteId).toBe('w1');
  });
});
