import 'next-auth';

export type PlanTier = 'FREE' | 'PRO' | 'MAX';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan?: PlanTier;
      isOforoInternal?: boolean;
      onboardingDone?: boolean;
      referralCode?: string | null;
      stripeCustomerId?: string | null;
    };
  }

  interface User {
    id: string;
    plan?: PlanTier;
    isOforoInternal?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    plan?: PlanTier;
    isOforoInternal?: boolean;
    onboardingDone?: boolean;
    referralCode?: string | null;
    stripeCustomerId?: string | null;
  }
}
