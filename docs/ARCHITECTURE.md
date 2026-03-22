# 3BOX AI — Architecture Document

## System Overview

3BOX AI is built as a monolithic Next.js application with a modular architecture designed for future service extraction. The system follows a layered architecture pattern.

```
┌─────────────────────────────────────────────────────┐
│                    Client Layer                       │
│  Next.js App Router + React + Framer Motion          │
│  Zustand State Management                             │
├─────────────────────────────────────────────────────┤
│                    API Layer                           │
│  Next.js Route Handlers (REST)                        │
│  Auth Middleware (NextAuth JWT)                        │
│  Rate Limiting (Redis)                                │
├─────────────────────────────────────────────────────┤
│                   Service Layer                       │
│  AI Service (OpenRouter abstraction)                  │
│  Assessment Engine                                    │
│  Career Planner                                       │
│  Resume Generator                                     │
│  Job Matcher                                          │
│  Automation Agent                                     │
├─────────────────────────────────────────────────────┤
│                    Data Layer                          │
│  PostgreSQL (Prisma ORM)                              │
│  Redis (caching + queues)                             │
│  S3 (file storage)                                    │
└─────────────────────────────────────────────────────┘
```

## AI Integration Architecture

```
User Request → API Route → Rate Limiter → PII Redactor → Model Router → OpenRouter API
                                                              │
                                                    ┌────────┴────────┐
                                                    │   Model Tier     │
                                                    │  Free → Pro →    │
                                                    │    Premium       │
                                                    └─────────────────┘
```

### Model Abstraction Layer
- **Free tier models:** Llama 3.1 8B (via OpenRouter free endpoints)
- **Pro tier models:** Llama 3.1 70B
- **Premium tier models:** Claude Sonnet
- Automatic fallback: if preferred model fails, cascade to next tier
- PII redaction applied before logging any AI interactions

## Authentication Flow

```
Signup/Login → NextAuth → JWT Token → Protected Routes
       │
       ├── Email/Password (bcrypt)
       └── Google OAuth
              │
              └── OFORO Domain Check → Auto-MAX upgrade
```

## Subscription Gating

```
Route Access → Check JWT → Extract Plan → Apply Limits
                               │
                    ┌──────────┴──────────────┐
                    │ FREE: limited access     │
                    │ PRO: full features        │
                    │ MAX: everything + auto  │
                    │ OFORO: auto-MAX         │
                    └─────────────────────────┘
```

## Data Models

### Career Twin (Core Innovation)
The Career Twin is a persistent user model that evolves over time:
- Stores skill snapshots, interests, work style preferences
- Tracks market readiness (0-100) and hire probability (0-1)
- Updated after every assessment, project completion, or reassessment
- Used for personalized recommendations across all features

### Proof-of-Skill Engine
```
Assessment → Skill Gaps → Projects → Evidence → AI Scoring → Verified Badge
```

## Queue Architecture (Ultra Automation)

```
Job Application Queue (BullMQ):
  User Config → Job Discovery → Resume Tailoring → Application → Audit Log
       │              │               │                │            │
       └── Caps ──────┴── Exclusions──┴── Compliance──┴── Trail────┘
```

## Security Layers

1. **Transport:** TLS 1.3 everywhere
2. **Auth:** JWT with short expiry, bcrypt passwords, optional 2FA
3. **Headers:** X-Frame-Options, CSP, HSTS
4. **Data:** AES-256 encryption at rest, PII redaction in logs
5. **Rate Limiting:** Per-user, per-endpoint with Redis
6. **Audit:** Complete action logging for all write operations
7. **Isolation:** Row-level security in PostgreSQL

## Extensibility Points

The architecture supports future additions:
- **B2B Dashboard:** Feature-flagged employer views
- **White-Label:** Theme + branding customization layer
- **Marketplace:** Plugin architecture for courses and mentors
- **Mobile:** API-first design supports React Native client
- **Blockchain Credentials:** Verification framework ready for integration
