import type { Config } from 'jest';
import nextJest from 'next/jest';

process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '<rootDir>/src/lib/mock-prisma.ts'],
  testEnvironment: 'jsdom',
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: [
    '/src/lib/mock-prisma.ts',
    '/src/lib/utils.ts',
    '/src/components/ui/',
  ],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
};

export default createJestConfig(customJestConfig);
