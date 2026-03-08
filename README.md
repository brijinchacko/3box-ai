# jobTED AI — Your AI Career Operating System

> An [OFORO AI](https://oforo.ai) Product

jobTED AI is a full-stack, AI-powered career platform that takes users from **skill assessment → personalized career plan → adaptive learning → resume + portfolio → verified credentials → job matching → automated applications**.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env
# → Fill in your API keys (see Environment Variables below)

# 3. Set up database
npx prisma generate
npx prisma db push

# 4. Seed demo data
npx tsx prisma/seed.ts

# 5. Start development server
npm run dev
# → Open http://localhost:3000
```

**Demo credentials:**
- User: `demo@jobted.ai` / `demo123456`
- OFORO Admin: `admin@oforo.ai` / `demo123456` (auto-ULTRA access)

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── pricing/           # Pricing page
│   ├── about/             # About page
│   ├── security/          # Security/Privacy/Terms
│   ├── login/             # Auth: Login
│   ├── signup/            # Auth: Signup
│   ├── forgot-password/   # Auth: Password reset
│   ├── dashboard/         # Protected dashboard
│   │   ├── page.tsx       # Dashboard home (Career Twin overview)
│   │   ├── assessment/    # Skill assessment flow
│   │   ├── career-plan/   # Visual roadmap + milestones
│   │   ├── learning/      # Adaptive learning path
│   │   ├── resume/        # Resume builder + PDF export
│   │   ├── portfolio/     # Portfolio builder
│   │   ├── jobs/          # Job matching + auto-apply
│   │   └── settings/      # Profile, billing, coach, privacy
│   └── api/               # API routes
│       ├── auth/          # NextAuth + registration
│       ├── ai/            # AI endpoints (chat, assessment)
│       └── resume/        # Resume export
├── components/            # Reusable components
│   ├── layout/            # Navbar, Footer
│   ├── ai-coach/          # Floating AI coach
│   └── ui/                # Shared UI components
├── lib/                   # Core libraries
│   ├── ai/                # OpenRouter integration layer
│   ├── auth/              # NextAuth config
│   ├── db/                # Prisma client
│   └── utils.ts           # Utilities + plan limits
├── store/                 # Zustand state management
├── types/                 # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + Framer Motion |
| State | Zustand |
| Auth | NextAuth.js (Credentials + Google OAuth) |
| Database | PostgreSQL + Prisma ORM |
| AI | OpenRouter (model abstraction layer) |
| Payments | Stripe (subscription billing) |
| Queue | BullMQ + Redis |
| PDF | @react-pdf/renderer (server-side) |
| Storage | S3-compatible |
| Observability | Pino logging |

## Key Features

### Uniqueness Multipliers
1. **Proof-of-Skill Engine** — Projects become verifiable evidence with AI scoring
2. **Career Twin** — Persistent AI model that improves over time
3. **Market Readiness Score** — Real-time employability scoring
4. **Hire Probability Forecasting** — Know your chances before applying
5. **Role Simulator** — Explore alternate career paths
6. **Verified Credentials Framework** — Ready for blockchain verification

### Plan Tiers
| Feature | Basic (Free) | Pro ($19/mo) | Ultra ($49/mo) |
|---------|-------------|-------------|----------------|
| Assessments | 2 | Unlimited | Unlimited |
| AI Credits | 50/mo | 500/mo | Unlimited |
| Resumes | 1 | Unlimited | Unlimited |
| Career Plan | Basic | Full + Timeline | Full + Advanced |
| Job Matching | — | ✓ | ✓ |
| Auto-Apply | — | — | ✓ |
| Interview Prep | — | ✓ | ✓ |
| Priority AI | — | — | ✓ |

### OFORO Internal Access
Users with `@oforo.ai` or `@oforoai.com` email domains automatically receive full ULTRA access via allowlist logic.

## Environment Variables

See `.env.example` for all required variables. At minimum you need:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Random secret for JWT signing
- `OPENROUTER_API_KEY` — For AI features (optional; demo mode without)

## Revenue Streams

1. **B2C Subscriptions** — Basic/Pro/Ultra tiers
2. **B2B Employer Dashboard** — Feature-flagged for enterprise
3. **University Licensing** — White-label option
4. **Course Marketplace** — Affiliate tracking
5. **Mentor Marketplace** — Commission-based
6. **Paid Add-ons** — Interview packs, resume review, certification attempts

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment guide.

**Quick deploy to Vercel:**
```bash
npm i -g vercel
vercel --prod
```

## License

Proprietary — OFORO AI © 2026. All rights reserved.
