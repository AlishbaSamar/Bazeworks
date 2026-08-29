import { signPreviewToken, verifyPreviewToken } from './preview-token';

describe('preview share token', () => {
  const OLD = process.env.BETTER_AUTH_SECRET;
  beforeAll(() => {
    process.env.BETTER_AUTH_SECRET = 'test-secret';
  });
  afterAll(() => {
    process.env.BETTER_AUTH_SECRET = OLD;
  });

  it('round-trips a website id', () => {
    const token = signPreviewToken('w1', 3600);
    expect(verifyPreviewToken(token)).toEqual({ websiteId: 'w1' });
  });

  it('rejects an expired token', () => {
    const token = signPreviewToken('w1', -1);
    expect(verifyPreviewToken(token)).toBeNull();
  });

  it('rejects a tampered signature', () => {
    const token = signPreviewToken('w1', 3600);
    const [payload] = token.split('.');
    expect(verifyPreviewToken(`${payload}.AAAA`)).toBeNull();
  });

  it('rejects a token signed with a different secret', () => {
    const token = signPreviewToken('w1', 3600);
    process.env.BETTER_AUTH_SECRET = 'someone-elses-secret';
    expect(verifyPreviewToken(token)).toBeNull();
    process.env.BETTER_AUTH_SECRET = 'test-secret';
  });

  it('rejects malformed input', () => {
    expect(verifyPreviewToken('not-a-token')).toBeNull();
    expect(verifyPreviewToken('')).toBeNull();
  });
});
