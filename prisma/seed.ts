import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    name: 'Alice',
    email: 'alice@prisma.io',
  },
  {
    name: 'Bob',
    email: 'bob@prisma.io',
  },
];

async function main() {
  try {
    console.log('Start seeding...');

    for (const u of userData) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: u,
      });
      console.log(`Created user with id: ${user.id}`);
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
