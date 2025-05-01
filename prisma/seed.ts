import { PrismaClient, Prisma, Role, PosterStatus } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import assert from 'assert';

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    login: 'admin',
    passwordHash: '$2a$10$JnrXUTVtqEMQpKgUgTolPOd8z31kDsQyPY31ZCbWl5pP4oFGThLVS', // password: admin123
    role: Role.ADMIN,
  },
  {
    login: 'editor',
    passwordHash: '$2a$10$EIfXCMA.yBEZyYlTwQRwNuxtPRF0gCIvR5X61ZbGjYA7Dm/NEXMyW', // password: editor123
    role: Role.EDITOR,
  },
];

const getFileInfo = (filepath: string) => {
  const stats = fs.statSync(filepath);
  const fileSizeInBytes = stats.size;
  const extension = path.extname(filepath).toLowerCase();

  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
  };

  const fileType = mimeTypes[extension] || 'application/octet-stream';

  return {
    filePath: filepath,
    fileSize: fileSizeInBytes,
    fileType,
  };
};

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
    console.log('Start seeding...');

    const createdUsers = [];
    for (const u of userData) {
      const user = await prisma.user.upsert({
        where: { login: u.login },
        update: {},
        create: u,
      });
      console.log(`Created user with id: ${user.id} and login: ${user.login}`);
      createdUsers.push(user);
    }

    const adminUser = createdUsers.find(user => user.role === Role.ADMIN);
    const editorUser = createdUsers.find(user => user.role === Role.EDITOR);
    assert(adminUser && editorUser, 'Required users not found');

    const assetDir = path.join(__dirname, 'seed-assets');
    const assetFiles = ['img_1.png', 'img_2.png', 'img_3.png', 'img_4.png'];

    // Define poster configurations with appropriate scheduling and deletion
    const posterConfigs = [
      {
        status: PosterStatus.PUBLISHED,
        scheduledAt: daysAgo(7), // Published a week ago
        deleteAt: null, // No deletion date
        creator: adminUser,
        displayDuration: 10,
      },
      {
        status: PosterStatus.SCHEDULED,
        scheduledAt: daysFromNow(3), // Will be published in 3 days
        deleteAt: daysFromNow(10), // Will be deleted 10 days from now
        creator: editorUser,
        displayDuration: 20,
      },
      {
        status: PosterStatus.DRAFT,
        scheduledAt: null, // No schedule date
        deleteAt: null, // No deletion date
        creator: adminUser,
        displayDuration: 15,
      },
      {
        status: PosterStatus.ARCHIVED,
        scheduledAt: daysAgo(30), // Was published 30 days ago
        deleteAt: daysAgo(7), // Was deleted 7 days ago
        creator: editorUser,
        displayDuration: 30,
      },
    ];

    for (const [index, file] of assetFiles.entries()) {
      const assetPath = path.join(assetDir, file);
      const fileInfo = getFileInfo(assetPath);
      const config = posterConfigs[index];

      const poster = await prisma.poster.create({
        data: {
          title: `Sample Poster ${index + 1}`,
          description: `Description for sample poster ${index + 1} by ${config.creator.login}`,
          filePath: fileInfo.filePath,
          fileSize: fileInfo.fileSize,
          fileType: fileInfo.fileType,
          displayDuration: config.displayDuration,
          status: config.status,
          scheduledAt: config.scheduledAt,
          deleteAt: config.deleteAt,
          createdBy: config.creator.id,
        },
      });

      console.log(`Created poster with id: ${poster.id}, title: ${poster.title}, status: ${poster.status} by ${config.creator.login}`);
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
