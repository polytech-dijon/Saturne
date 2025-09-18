import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signInSchema } from '@/lib/zod';
import { Role } from '@prisma/client';
import { User } from 'next-auth';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'ID', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        const parseResult = signInSchema.safeParse(credentials);
        if (!parseResult.success) throw new Error();
        const { username, password } = parseResult.data;
        const safeCompare = async (password: string, realHash?: string) => {
          const fakeHash =
            '$2a$12$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
          return bcrypt.compare(password, realHash ?? fakeHash);
        };
        const user = await prisma.user.findUnique({ where: { username } });
        const ok = await safeCompare(password, user?.passwordHash);
        if (!user || !ok) {
          console.debug('[Auth] Login failed');
          return null;
        }
        return { id: user.id, name: user.username, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token?.role) session.user.role = token.role as Role;
        const id = token?.sub ?? token?.id;
        if (id) (session.user as User).id = Number(id);
      }
      return session;
    },
    async authorized({ auth }) {
      return !!auth;
    },
  },
  logger: {
    error() {
    },
    warn() {
    },
    debug() {
    },
  },
  pages: {
    signIn: '/login',
  },
});
