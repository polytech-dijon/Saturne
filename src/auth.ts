import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signInSchema } from '@/lib/zod';
import { PasswordError, UsernameError } from '@/lib/errors';

export const { handlers, signIn, signOut, auth } = NextAuth({
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
        if (!parseResult.success) {
          const issues = parseResult.error.issues;
          const usernameIssues = issues.filter(issue => issue.path[0] === 'username');
          const passwordIssues = issues.filter(issue => issue.path[0] === 'password');

          if (usernameIssues.length > 0) throw new UsernameError(`${usernameIssues.map(i => i.message).join(', ')}`);
          if (passwordIssues.length > 0) throw new PasswordError(`${passwordIssues.map(i => i.message).join(', ')}`);
          throw new Error();
        }
        const { username, password } = parseResult.data;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        return ok ? { id: user.id, name: user.username, role: user.role } : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (token?.role) session.user.role = token.role as string;
      return session;
    },
    async authorized({ auth }) {
      return !!auth;
    },
  },
  pages: {
    signIn: '/login',
  },
});
