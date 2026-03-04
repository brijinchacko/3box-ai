import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan?: string;
      isOforoInternal?: boolean;
      onboardingDone?: boolean;
      referralCode?: string | null;
      stripeCustomerId?: string | null;
      aiCreditsUsed?: number;
      aiCreditsLimit?: number;
    };
  }

  interface User {
    id: string;
    plan?: string;
    isOforoInternal?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    plan?: string;
    isOforoInternal?: boolean;
    onboardingDone?: boolean;
    referralCode?: string | null;
    stripeCustomerId?: string | null;
    aiCreditsUsed?: number;
    aiCreditsLimit?: number;
  }
}
