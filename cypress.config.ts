import { defineConfig } from 'cypress';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export type TestUsers = {
  admin: {
    username: string;
    password: string;
  },
  editor: {
    username: string;
    password: string;
  }
};

function toHostDbUrl(urlFromEnv?: string) {
  console.log('Seeding database with the url:', process.env.DATABASE_URL);
  if (!urlFromEnv) return undefined;
  try {
    const u = new URL(urlFromEnv);
    if (u.hostname === 'postgres' || u.hostname === 'db') {
      u.hostname = 'localhost';
    }
    return u.toString();
  } catch {
    return urlFromEnv;
  }
}

function isRunningInDocker() {
  return (
    fs.existsSync('/.dockerenv') ||
    process.env.CYPRESS_IN_DOCKER === '1' ||
    process.env.CI === 'true'
  );
}

function dbUrlForSeed() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  return isRunningInDocker() ? raw : toHostDbUrl(raw);
}

export default defineConfig({
  video: false,
  screenshotOnRunFailure: false,
  e2e: {
    baseUrl: process.env.CYPRESS_baseUrl || 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{ts,js}',
    supportFile: 'cypress/support/e2e.ts',
    defaultCommandTimeout: 10000,
    retries: { runMode: 2, openMode: 0 },

    setupNodeEvents(on, config) {
      on('task', {
        async 'db:seed'(): Promise<TestUsers> {
          const rand = (n: number) =>
            crypto.randomBytes(n).toString('base64url').slice(0, n);

          const admin = {
            username: `test_admin_${rand(6)}`,
            password: rand(12),
          };
          const editor = {
            username: `test_editor_${rand(6)}`,
            password: rand(12),
          };

          const envForDb = {
            ...process.env,
            TEST_ADMIN_USERNAME: admin.username,
            TEST_ADMIN_PASSWORD: admin.password,
            TEST_EDITOR_USERNAME: editor.username,
            TEST_EDITOR_PASSWORD: editor.password,
            DATABASE_URL: dbUrlForSeed(),
          };

          spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
            stdio: 'inherit',
            env: envForDb,
          });
          const seedPath = path.resolve(__dirname, './prisma/seed-test.ts');
          const result = spawnSync(
            'npx',
            ['tsx', seedPath],
            {
              stdio: 'inherit',
              env: envForDb,
            },
          );

          if (result.status !== 0) {
            throw new Error(`Seed script failed with code ${result.status}`);
          }

          return { admin, editor };
        },
      });

      return config;
    },
  },
});
