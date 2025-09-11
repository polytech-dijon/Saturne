/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

jest.mock(
  '@/auth',
  () => {
    const auth = jest.fn();
    return { auth };
  },
  { virtual: true },
);

describe('src/middleware.ts', () => {
  let middleware: (req: any) => Promise<any>;
  let config: { matcher: string[] };
  let fakeAuth: jest.Mock;

  beforeAll(async () => {
    fakeAuth = (await import('@/auth')).auth as jest.Mock;
    const mod = await import('@/middleware');
    middleware = mod.middleware;
    config = mod.config;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards the request to auth and returns its result', async () => {
    const req = { url: '/dashboard' };
    const sentinel = { ok: true, foo: 'bar' };
    fakeAuth.mockResolvedValueOnce(sentinel as never);

    const result = await middleware(req);

    expect(fakeAuth).toHaveBeenCalledTimes(1);
    expect(fakeAuth).toHaveBeenCalledWith(req);
    expect(result).toBe(sentinel);
  });

  it('exports the exact matcher config', () => {
    expect(config).toEqual({
      matcher: ['/((?!api|_next/static|_next/image|favicon.ico|$).*)'],
    });
  });
});
