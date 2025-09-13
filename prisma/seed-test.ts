import { PrismaClient, Prisma, Role, PosterStatus } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import assert from 'assert';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';

if (process.env.NODE_ENV === 'production') {
  console.error('This seeding is disabled in production environment');
  process.exit(1);
}

const prisma = new PrismaClient();

if (!process.env.UPLOAD_ROOT) throw new Error('UPLOAD_ROOT env var is not set');
const ROOT = process.env.UPLOAD_ROOT;

const userData: Prisma.UserCreateInput[] = [
  {
    username: process.env.TEST_ADMIN_USERNAME as string,
    passwordHash: bcrypt.hashSync(process.env.TEST_ADMIN_PASSWORD as string, 12),
    role: Role.ADMIN,
  },
  {
    username: process.env.TEST_EDITOR_USERNAME as string,
    passwordHash: bcrypt.hashSync(process.env.TEST_EDITOR_PASSWORD as string, 12),
    role: Role.EDITOR,
  },
];

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

async function main() {
  try {
    console.log('Start cleaning...');
    await prisma.$transaction([
      prisma.poster?.deleteMany?.(),
      prisma.user.deleteMany(),
    ]);

    console.log('Start seeding...');

    const createdUsers = [];
    for (const u of userData) {
      const user = await prisma.user.upsert({
        where: { username: u.username },
        update: {},
        create: u,
      });
      console.log(`Created user with id: ${user.id} and login: ${user.username}`);
      createdUsers.push(user);
    }

    const adminUser = createdUsers.find(user => user.role === Role.ADMIN);
    const editorUser = createdUsers.find(user => user.role === Role.EDITOR);
    assert(adminUser && editorUser, 'Required users not found');

    const assetDir = path.join(__dirname, 'seed-assets');
    const assetFiles = ['img_1.png', 'img_2.png', 'img_3.png', 'img_4.png'];

    const posterConfigs = [
      {
        status: PosterStatus.READY,           // will be "PUBLISHED" in UI (derived dates)
        scheduledAt: daysAgo(7),
        deleteAt: null,
        creator: adminUser,
        displayDuration: 10,
      },
      {
        status: PosterStatus.READY,           // "SCHEDULED" in UI
        scheduledAt: daysFromNow(3),
        deleteAt: daysFromNow(10),
        creator: editorUser,
        displayDuration: 20,
      },
      {
        status: PosterStatus.DRAFT,
        scheduledAt: null,
        deleteAt: null,
        creator: adminUser,
        displayDuration: 15,
      },
      {
        status: PosterStatus.READY,           // "EXPIRED" in UI
        scheduledAt: daysAgo(30),
        deleteAt: daysAgo(7),
        creator: editorUser,
        displayDuration: 30,
      },
    ];

    for (const [index, file] of assetFiles.entries()) {
      const assetPath = path.join(assetDir, file);
      const config = posterConfigs[index];

      // Read file buffer and infer mime type
      const assetPathAbs = assetPath;
      const fileBuffer = fs.readFileSync(assetPathAbs);
      const fileName = path.basename(assetPathAbs);
      const ext = path.extname(fileName).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.bmp': 'image/bmp',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.webm': 'video/webm',
      };
      const fileMime = mimeMap[ext] || 'application/octet-stream';
      await mkdir(ROOT, { recursive: true });

      const extOut = path.extname(fileName) || '';
      const key = `${randomUUID()}${extOut}`;
      const absOut = path.join(ROOT, key);
      await writeFile(absOut, fileBuffer, { flag: 'wx' });

      const poster = await prisma.poster.create({
        data: {
          title: `Sample Poster ${index + 1}`,
          description: `Description for sample poster ${index + 1} by ${config.creator.username}`,
          displayDuration: config.displayDuration,
          status: config.status,
          createdBy: config.creator.id,

          filePath: path.relative(ROOT, absOut),
          fileMime: fileMime,
          fileSize: fileBuffer.length,
          fileName: fileName,

          scheduledAt: config.scheduledAt ?? null,
          deleteAt: config.deleteAt ?? null,
        },
      });

      console.log(`Created poster #${poster.id} "${poster.title}" (status=${poster.status}) by ${config.creator.username}`);
    }

    console.log('Seeding finished.');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
