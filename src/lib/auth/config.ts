/**
 * NextAuth configuration
 * Supports Email/Password + Google OAuth with OFORO internal detection
 */
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { isOforoDomain } from '@/lib/utils';

// Lazy import prisma to avoid build issues
const getPrisma = () => require('@/lib/db/prisma').prisma;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(getPrisma()),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    newUser: '/dashboard',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const prisma = getPrisma();
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) return null;

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        const prisma = getPrisma();
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser) {
          token.plan = dbUser.plan;
          token.isOforoInternal = dbUser.isOforoInternal;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).plan = token.plan;
        (session.user as any).isOforoInternal = token.isOforoInternal;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (user.email && isOforoDomain(user.email)) {
        const prisma = getPrisma();
        await prisma.user.update({
          where: { email: user.email },
          data: { isOforoInternal: true, plan: 'ULTRA' },
        }).catch(() => {}); // user might not exist yet
      }
      return true;
    },
  },
};
