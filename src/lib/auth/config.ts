/**
 * NextAuth configuration
 * Supports Email/Password + OTP + Google OAuth with OFORO internal detection
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
    // Only include Google provider when credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    CredentialsProvider({
      id: 'credentials',
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

        if (!user) return null;

        // Check if this is an OTP-verified login (password starts with "otp:")
        if (credentials.password.startsWith('otp:')) {
          const otpCode = credentials.password.slice(4);
          // Verify there's a recently used OTP for this email (accept both login and signup types)
          const recentOtp = await prisma.otpToken.findFirst({
            where: {
              email: credentials.email,
              type: { in: ['login', 'signup'] },
              code: otpCode,
              used: true,
              createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // within last 5 min
            },
            orderBy: { createdAt: 'desc' },
          });

          if (recentOtp) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            };
          }
          return null;
        }

        // Standard password login
        if (!user.hashedPassword) return null;

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
      }
      // Always refresh plan/credits from DB so coupon upgrades, Stripe changes, etc. take effect immediately
      if (token.id) {
        const prisma = getPrisma();
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (dbUser) {
          token.plan = dbUser.plan;
          token.isOforoInternal = dbUser.isOforoInternal;
          token.onboardingDone = dbUser.onboardingDone;
          token.referralCode = dbUser.referralCode;
          token.stripeCustomerId = dbUser.stripeCustomerId;
          token.aiCreditsUsed = dbUser.aiCreditsUsed;
          token.aiCreditsLimit = dbUser.aiCreditsLimit;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).plan = token.plan;
        (session.user as any).isOforoInternal = token.isOforoInternal;
        (session.user as any).onboardingDone = token.onboardingDone;
        (session.user as any).referralCode = token.referralCode;
        (session.user as any).stripeCustomerId = token.stripeCustomerId;
        (session.user as any).aiCreditsUsed = token.aiCreditsUsed;
        (session.user as any).aiCreditsLimit = token.aiCreditsLimit;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (user.email && isOforoDomain(user.email)) {
        const prisma = getPrisma();
        await prisma.user.update({
          where: { email: user.email },
          data: { isOforoInternal: true, plan: 'ULTRA', aiCreditsLimit: -1 },
        }).catch(() => {}); // user might not exist yet
      }
      return true;
    },
  },
};
