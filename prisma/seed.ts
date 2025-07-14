import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
  console.error('Missing environment variables: ADMIN_USERNAME, ADMIN_PASSWORD');
  process.exit(1);
}

await prisma.user.upsert({
  where: { username: process.env.ADMIN_USERNAME },
  update: {},
  create: {
    username: process.env.ADMIN_USERNAME,
    passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12),
    role: Role.ADMIN,
  },
});
console.log('Admin account seeded.');
