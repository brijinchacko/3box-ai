/**
 * NextAuth configuration
 * Supports Email/Password + OTP + Google OAuth with OFORO internal detection
 */
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { isOforoDomain } from '@/lib/utils';

// Lazy import prisma to avoid build issues
const getPrisma = () => require('@/lib/db/prisma').prisma;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(getPrisma()),
  session: { strategy: 'jwt' },
  // debug: true — disabled; was flooding /api/auth/_log and hitting rate limits
  pages: {
    signIn: '/login',
    newUser: '/dashboard',
    error: '/login',
  },
  // Use standard cookie names (no __Secure-/__Host- prefixes)
  // This fixes auth behind reverse proxies where the browser may not trust prefixed cookies
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    // Only include Google provider when credentials are configured
    // Request gmail.send scope so we can send job application emails from user's own address
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
          authorization: {
            params: {
              scope: 'openid email profile https://www.googleapis.com/auth/gmail.send',
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        })]
      : []),
    // Only include LinkedIn provider when credentials are configured
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
      ? [LinkedInProvider({
          clientId: process.env.LINKEDIN_CLIENT_ID,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
          authorization: {
            params: {
              scope: 'openid profile email',
            },
          },
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
      // Refresh plan/credits from DB — wrapped in try/catch so DB connection
      // errors don't prevent session token creation (which blocks sign-in)
      if (token.id) {
        try {
          const prisma = getPrisma();
          const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
          if (dbUser) {
            token.plan = dbUser.plan;
            token.isOforoInternal = dbUser.isOforoInternal;
            token.onboardingDone = dbUser.onboardingDone;
            token.referralCode = dbUser.referralCode;
            token.stripeCustomerId = dbUser.stripeCustomerId;
          }
        } catch (err) {
          console.error('[NextAuth] jwt callback DB error:', err);
          // Keep existing token data if DB fails — session still works
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
      }
      return session;
    },
    async signIn({ user, account }) {
      const prisma = getPrisma();

      if (user.email && isOforoDomain(user.email)) {
        await prisma.user.update({
          where: { email: user.email },
          data: { isOforoInternal: true, plan: 'MAX' },
        }).catch(() => {}); // user might not exist yet
      }

      // Auto-connect Gmail when signing in with Google (if we got tokens with gmail.send scope)
      if (
        account?.provider === 'google' &&
        account.access_token &&
        account.refresh_token &&
        user.id &&
        user.email
      ) {
        try {
          const { encrypt } = require('@/lib/email/oauth/encryption');
          const encryptedAccess = encrypt(account.access_token);
          const encryptedRefresh = encrypt(account.refresh_token);
          const tokenExpiry = account.expires_at
            ? new Date(account.expires_at * 1000)
            : new Date(Date.now() + 3600 * 1000);

          await prisma.userEmailConnection.upsert({
            where: {
              userId_provider_email: {
                userId: user.id,
                provider: 'gmail',
                email: user.email,
              },
            },
            create: {
              userId: user.id,
              provider: 'gmail',
              email: user.email,
              accessToken: encryptedAccess,
              refreshToken: encryptedRefresh,
              tokenExpiry,
              scopes: 'https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/userinfo.email',
              isActive: true,
              isPrimary: true,
            },
            update: {
              accessToken: encryptedAccess,
              refreshToken: encryptedRefresh,
              tokenExpiry,
              isActive: true,
            },
          });
          console.log(`[NextAuth] Auto-connected Gmail for ${user.email}`);
        } catch (err) {
          console.error('[NextAuth] Auto-connect Gmail error:', err);
          // Non-fatal — sign-in still succeeds
        }
      }

      return true;
    },
  },
};
