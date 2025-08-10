/* eslint-disable @typescript-eslint/no-explicit-any */
import { Role, User } from '@prisma/client';

jest.mock('next-auth', () => {
  const NextAuth = jest.fn((config: never) => ({
    handlers: { GET: jest.fn(), POST: jest.fn() },
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    __config: config,
  }));
  return { __esModule: true, default: NextAuth };
});

jest.mock('next-auth/providers/credentials', () => {
  const Credentials = jest.fn((opts: never) => ({ id: 'credentials', __opts: opts }));
  return { __esModule: true, default: Credentials };
});

const compareMock = jest.fn();
const hashMock = jest.fn().mockResolvedValue('FAKEHASH');
jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: { compare: compareMock, hash: hashMock },
}));

const safeParseMock = jest.fn((x: any) => ({ success: true, data: x }));
jest.mock('@/lib/zod', () => ({
  __esModule: true,
  signInSchema: { safeParse: safeParseMock },
}));

class UsernameError extends Error {
}

class PasswordError extends Error {
}

jest.mock('@/lib/errors', () => ({
  __esModule: true,
  UsernameError,
  PasswordError,
}));

jest.mock('@prisma/client', () => ({
  __esModule: true,
  Role: { ADMIN: 'ADMIN', USER: 'USER' },
}));

import NextAuth from 'next-auth';
import { prismaMock } from '@/../__mocks__/prisma';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const exportsUnderTest = require('@/auth');
const cfg = (NextAuth as jest.Mock).mock.calls[0]?.[0];
if (!cfg) throw new Error('NextAuth was not called by src/auth.ts. Check the import path and mocks.');

// Helper to access the credential authorize directly from config
const getAuthorizeFromCfg = () => {
  const cred = (cfg.providers || []).find((p: any) => p?.id === 'credentials');
  if (!cred) throw new Error('Credentials provider not found in config');
  return cred.__opts.authorize as (c: any) => Promise<any>;
};

describe('src/auth.ts (NextAuth config)', () => {
  // Silence noisy auth debug logs
  beforeAll(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {
    });
  });

  it('exposes handlers/auth/signIn/signOut from NextAuth result', () => {
    // With clearMocks enabled globally, we don't assert call counts. We assert shapes instead.
    expect(exportsUnderTest).toHaveProperty('handlers');
    expect(exportsUnderTest).toHaveProperty('auth');
    expect(exportsUnderTest).toHaveProperty('signIn');
    expect(exportsUnderTest).toHaveProperty('signOut');
    expect(exportsUnderTest.handlers).toHaveProperty('GET');
    expect(exportsUnderTest.handlers).toHaveProperty('POST');

    // Config object must be present
    expect(cfg).toBeTruthy();
  });

  it('sets base flags and pages', () => {
    expect(cfg.trustHost).toBe(true);
    expect(cfg.session).toMatchObject({ strategy: 'jwt' });
    expect(cfg.pages).toMatchObject({ signIn: '/login' });
  });

  it('registers a Credentials provider with expected shape', () => {
    const cred = (cfg.providers || []).find((p: any) => p?.id === 'credentials');
    expect(cred).toBeTruthy();
    const credOpts = cred.__opts;

    expect(credOpts).toHaveProperty('name', 'Credentials');
    expect(credOpts).toHaveProperty('credentials');
    expect(credOpts.credentials).toHaveProperty('username');
    expect(credOpts.credentials.username).toMatchObject({ label: 'ID', type: 'text' });
    expect(typeof credOpts.authorize).toBe('function');
  });
});

describe('Credentials.authorize', () => {
  // Silence noisy auth debug logs
  beforeAll(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {
    });
  });

  beforeEach(() => {
    compareMock.mockReset();
    hashMock.mockClear();
    safeParseMock.mockReset();
    safeParseMock.mockImplementation((x: any) => ({ success: true, data: x }));
  });

  it('returns a user object when username exists and password matches', async () => {
    const authorize = getAuthorizeFromCfg();

    const user: User = {
      id: 1,
      username: 'alice',
      passwordHash: 'hash',
      role: Role.EDITOR,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(user);
    compareMock.mockResolvedValue(true);

    const result = await authorize({ username: 'alice', password: 'secret' });

    expect(compareMock).toHaveBeenCalled();
    expect(result).toEqual({ id: 1, name: 'alice', role: Role.EDITOR });
  });

  it('throws UsernameError when zod fails on username', async () => {
    safeParseMock.mockReturnValueOnce({
      success: false,
      error: { issues: [{ path: ['username'], message: 'bad user' }] },
    } as any);
    const authorize = getAuthorizeFromCfg();
    await expect(authorize({ username: '', password: 'x' })).rejects.toBeInstanceOf(UsernameError);
  });

  it('throws PasswordError when zod fails on password', async () => {
    safeParseMock.mockReturnValueOnce({
      success: false,
      error: { issues: [{ path: ['password'], message: 'bad pass' }] },
    } as any);
    const authorize = getAuthorizeFromCfg();
    await expect(authorize({ username: 'a', password: '' })).rejects.toBeInstanceOf(PasswordError);
  });

  it('throws when zod validation fails (no field issue)', async () => {
    safeParseMock.mockReturnValueOnce({ success: false, error: { issues: [] } } as any);
    const authorize = getAuthorizeFromCfg();
    await expect(authorize({ username: '', password: '' })).rejects.toThrow();
  });

  it('returns null when user is missing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    compareMock.mockResolvedValue(false);
    const authorize = getAuthorizeFromCfg();
    await expect(authorize({ username: 'bob', password: 'nope' })).resolves.toBeNull();
  });

  it('returns null when password does not match', async () => {
    const user: User = {
      id: 2,
      username: 'bob',
      passwordHash: 'hashed',
      role: Role.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.user.findUnique.mockResolvedValueOnce(user);
    compareMock.mockResolvedValue(false);
    const authorize = getAuthorizeFromCfg();
    await expect(authorize({ username: 'bob', password: 'wrong' })).resolves.toBeNull();
  });
});

describe('callbacks', () => {
  it('jwt attaches role when user present and preserves existing token otherwise', async () => {
    const t1 = await cfg.callbacks.jwt({ token: {}, user: { role: 'ADMIN' } });
    expect((t1 as any).role).toBe('ADMIN');

    const t2 = await cfg.callbacks.jwt({ token: { role: 'USER' }, user: undefined });
    expect(t2).toEqual({ role: 'USER' });
  });

  it('session copies role from token into session.user', async () => {
    const sessionIn: any = { user: { name: 'A' } };
    const out = await cfg.callbacks.session({ session: sessionIn, token: { role: 'ADMIN' } });
    expect(out.user.role).toBe('ADMIN');
  });

  it('authorized returns true only when auth exists', async () => {
    expect(await cfg.callbacks.authorized?.({ auth: { user: { id: '1' } } })).toBe(true);
    expect(await cfg.callbacks.authorized?.({ auth: null })).toBe(false);
  });
});

it('exposes a silent logger (no throw)', () => {
  const { logger } = cfg;
  expect(() => logger?.error?.('x')).not.toThrow();
  expect(() => logger?.warn?.('y')).not.toThrow();
  expect(() => logger?.debug?.('z')).not.toThrow();
});
