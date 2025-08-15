import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
  console.error('Missing environment variables: ADMIN_USERNAME, ADMIN_PASSWORD');
  process.exit(1);
}

if (process.env.ADMIN_USERNAME === 'admin' || process.env.ADMIN_PASSWORD === 'password') {
  console.error('Admin username and password cannot be the default "admin" or "password"');
  process.exit(1);
}

async function main() {
  await prisma.user.upsert({
    where: { username: process.env.ADMIN_USERNAME },
    update: {},
    create: {
      username: process.env.ADMIN_USERNAME as string,
      passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD as string, 12),
      role: Role.ADMIN,
    },
  });
  console.log('Admin account seeded.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
