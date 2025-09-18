import { DefaultSession, DefaultUser } from 'next-auth';
import type { Role } from '@prisma/client';

declare module 'next-auth' {
  interface User extends DefaultUser {
    id: number;
    name: string;
    role: Role;
  }

  interface Session extends DefaultSession {
    user: User;
  }
}
