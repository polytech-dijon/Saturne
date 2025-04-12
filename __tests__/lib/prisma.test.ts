import requireActual = jest.requireActual;

const env = process.env;

beforeEach(() => {
  process.env = { ...env };
});

afterEach(() => {
  process.env = env;
});

it('should reuse the same PrismaClient instance when imported multiple times in development', async () => {
  (process.env.NODE_ENV as any) = 'development';
  const prismaFirst = requireActual('@/lib/prisma').default;
  const prismaSecond = requireActual('@/lib/prisma').default;

  expect(prismaFirst).toBe(prismaSecond);
});
