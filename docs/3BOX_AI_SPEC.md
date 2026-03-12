	# 3BOX AI — Product Specification Document

**Version:** 1.6.0
**Date:** March 2026
**Product:** 3BOX AI — Full Career Operating System
**Company:** OFORO AI
**URL:** https://3box.ai

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Technology Stack](#3-technology-stack)
4. [AI Agent System](#4-ai-agent-system)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Subscription & Billing](#7-subscription--billing)
8. [Token Economy](#8-token-economy)
9. [Public Pages & Marketing](#9-public-pages--marketing)
10. [Dashboard Features](#10-dashboard-features)
11. [Free Tools Suite](#11-free-tools-suite)
12. [API Reference](#12-api-reference)
13. [Admin System](#13-admin-system)
14. [Independent Agent Scheduling](#14-independent-agent-scheduling)
15. [Email & Notification System](#15-email--notification-system)
16. [Security & Compliance](#16-security--compliance)
17. [SEO & Analytics](#17-seo--analytics)
18. [Deployment & Infrastructure](#18-deployment--infrastructure)
19. [Third-Party Integrations](#19-third-party-integrations)
20. [Pipeline Orchestrator](#20-pipeline-orchestrator)
21. [Supporting Systems](#21-supporting-systems)

---

## 1. Product Overview

### 1.1 Mission
3BOX AI is a full Career Operating System that automates the entire job search lifecycle — from discovering opportunities to sending applications, optimizing resumes, preparing for interviews, and tracking career growth. It uses a team of six specialized AI agents coordinated by a central intelligence called Cortex.

### 1.2 Core Value Proposition
- **Automated Job Discovery:** Scans 6+ job platforms simultaneously
- **ATS-Optimized Resumes:** AI-tailored resumes for each application
- **Auto-Apply Pipeline:** End-to-end application sending (portal + cold email)
- **Interview Preparation:** Company-specific question generation and practice
- **Skill Gap Analysis:** Personalized learning paths based on market trends
- **Quality Assurance:** Pre-submission review to prevent errors and spam

### 1.3 Target Users
- Active job seekers
- Career changers
- Fresh graduates
- Professionals seeking upward mobility
- Students entering the workforce

---

## 2. Technical Architecture

### 2.1 System Architecture
3BOX AI is a monolithic Next.js 14 application with modular architecture designed for future service extraction.

```
┌───────────────────────────────────────────────────┐
│                   Client Layer                      │
│  Next.js App Router + React 18 + Framer Motion     │
│  Zustand State + Radix UI Primitives               │
├───────────────────────────────────────────────────┤
│                   API Layer                          │
│  Next.js Route Handlers (REST)                      │
│  NextAuth JWT Sessions                              │
│  Zod Request Validation                             │
├───────────────────────────────────────────────────┤
│                 Service Layer                        │
│  AI Service (OpenRouter)  │  Agent Orchestrator     │
│  Resume Engine            │  Job Matcher            │
│  Application Sender       │  Email Service          │
├───────────────────────────────────────────────────┤
│                  Data Layer                          │
│  PostgreSQL (Prisma ORM)                            │
│  Redis (BullMQ Queues + Caching)                    │
│  Cloudinary (Image Storage)                         │
└───────────────────────────────────────────────────┘
```

### 2.2 AI Integration Architecture
```
User Request → API Route → Rate Limiter → PII Redactor → Model Router → OpenRouter API
                                                               │
                                                     ┌────────┴────────┐
                                                     │   Model Tier     │
                                                     │  Free → Pro →    │
                                                     │    Premium       │
                                                     └─────────────────┘
```

**Model Tiers (mapped to plan):**

| Plan | AI Model | Tier |
|------|----------|------|
| BASIC (Free) | Arcee Trinity | Free |
| STARTER | GPT-4o Mini | Standard |
| PRO | DeepSeek Chat | Reasoning |
| ULTRA | Claude Sonnet | Premium |

- Automatic fallback cascade if preferred model fails
- PII redaction applied before logging any AI interactions
- Demo mode simulation with full mock responses for all features
- OFORO internal emails (`@oforo.ai`, `@oforoai.com`) automatically receive ULTRA access with unlimited credits

### 2.3 Request Flow
```
Browser → Next.js Middleware (geo cookie + referral tracking)
       → App Router (page or API route)
       → NextAuth session validation (for protected routes)
       → Zod schema validation (for API inputs)
       → Business logic / AI service call
       → Prisma ORM → PostgreSQL
       → JSON response
```

---

## 3. Technology Stack

### 3.1 Core Framework
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.x |
| Runtime | React | 18.3.x |
| Language | TypeScript | 5.4.x |
| ORM | Prisma Client | 5.14.x |
| Database | PostgreSQL | — |
| Cache/Queue | Redis (ioredis + BullMQ) | 5.10.x / 5.70.x |

### 3.2 Frontend
| Library | Purpose |
|---------|---------|
| Framer Motion 11.2 | Page transitions, animations |
| Radix UI | Accessible primitives (dialog, dropdown, select, tabs, toast, etc.) |
| Tailwind CSS 3.4 | Utility-first styling |
| Recharts 2.12 | Dashboard charts and analytics |
| Lucide React | Icon system |
| Zustand 4.5 | Client-side state management |
| class-variance-authority | Component variant styling |
| tailwind-merge + clsx | Class name utilities |

### 3.3 Backend Services
| Library | Purpose |
|---------|---------|
| NextAuth 4.24 | Authentication (Google OAuth + credentials) |
| Stripe 15.x | Payment processing, subscriptions, webhooks |
| Resend 6.9 | Transactional email delivery |
| Cloudinary 2.9 | Image/avatar upload and CDN |
| BullMQ 5.70 | Job queues for async agent operations |
| ioredis 5.10 | Redis client for caching and queue backend |
| bcryptjs | Password hashing |
| nanoid | Unique ID generation |

### 3.4 Document Processing
| Library | Purpose |
|---------|---------|
| @react-pdf/renderer 3.4 | PDF resume generation (client-side) |
| pdf-parse 2.4 | PDF resume parsing/text extraction |
| mammoth 1.11 | DOCX resume parsing |
| imapflow 1.2 | IMAP email reading (for reply tracking) |

### 3.5 Validation & Utilities
| Library | Purpose |
|---------|---------|
| Zod 3.23 | Runtime schema validation |
| date-fns 3.6 | Date formatting and manipulation |
| react-hot-toast | Toast notifications |

### 3.6 Design System
**Color Palette:**
- **Brand:** Blue spectrum (#eef7ff to #142857)
- **Neon accents:** Blue (#00d4ff), Purple (#a855f7), Green (#00ff88), Pink (#ff0080), Orange (#ff6b00)
- **Surfaces:** Dark mode only — #0a0a0f (base) through #2d2d50

**Typography:**
- Sans: Inter, system-ui
- Display: Cal Sans, Inter
- Mono: JetBrains Mono

**Animations:** glow, float, pulse-slow, slide-up, slide-down, fade-in, gradient (all defined in Tailwind config)

---

## 4. AI Agent System

### 4.1 Cortex — The Coordinator
Cortex is the central intelligence that orchestrates all six specialist agents.

- **Role:** "The Ninja Who Never Sleeps"
- **Function:** Coordinates agent sequencing, manages pipeline state, handles credit tracking
- **Colors:** Blue (#00d4ff) to Purple (#a855f7) gradient

### 4.2 Agent Definitions

#### Agent Scout — Job Hunter
- **ID:** `scout`
- **Min Plan:** STARTER
- **File:** `src/lib/agents/scout.ts`
- **Capabilities:** Multi-source job scanning, match scoring, smart filtering, exclusion rules
- **Platforms:** Naukri, LinkedIn, Indeed, Google Jobs, Glassdoor, company pages (6+ sources)
- **Linked Page:** `/dashboard/jobs`
- **Token Cost:** 2 tokens per platform (6 platforms = 12 tokens per full scan)
- **Key Functions:**
  - `runScout()` — Core discovery: calls `discoverJobs()`, applies match scoring with `minMatchScore`, filters scams via `filterScamJobs()`, deduplicates results
  - `persistScoutJobs()` — Saves discovered jobs to `ScoutJob` table with deduplication keys
  - `runIndependentScout()` — Standalone version for cron scheduling; creates run record, discovers, persists, deducts tokens, updates `scoutLastRunAt`
- **Features:** Scam detection (borderline scams with score < 70 included if result count low), deduplication via `computeDedupeKey()` (normalized company + title + URL domain), burst mode (skips credit checks, limits to 20 results)

#### Agent Forge — Resume Optimizer
- **ID:** `forge`
- **Min Plan:** STARTER
- **File:** `src/lib/agents/forge.ts`
- **Capabilities:** ATS keyword optimization, job-specific variants, score analysis, section enhancement
- **Operating Modes:**
  - `on_demand` — Generate resume on explicit request
  - `per_job` — Auto-create tailored variant per discovered job
  - `base_only` — Generate base resume from profile only
- **Linked Page:** `/dashboard/resume`
- **Token Costs:** Generate: 3, Enhance: 2, Analyze: 2, Auto-generate: 5, Per-job rewrite: 2
- **Key Functions:**
  - `analyzeResumeForJob()` — AI-powered analysis producing ATS score (0-100), keyword gaps, suggestions, optimized summary/bullets
  - `generateOptimizedResume()` — Creates full job-specific resume variant. Safety rule: never adds skills the candidate does not possess
  - `verifyResumeReadiness()` — Two-phase verification: Phase 1 (zero AI cost) local completeness checks; Phase 2 (1 AI call) ATS scoring + skill coverage analysis. Hard block only on missing name/email
  - `quickATSScore()` — Simple keyword overlap ratio between resume text and JD words (zero AI cost)
  - `generateResumeFromProfile()` — Generates initial resume + cover letter + LinkedIn optimization (headline, bio, skills) from onboarding profile
  - `runIndependentForge()` — Standalone cron mode: per_job creates ResumeVariants; base_only verifies readiness; on_demand is no-op from cron

#### Agent Archer — Application Agent
- **ID:** `archer`
- **Min Plan:** PRO
- **File:** `src/lib/agents/archer.ts`
- **Capabilities:** AI cover letters, portal applications, cold email outreach, application tracking
- **Application Channels (priority order):**
  1. **ATS API** (highest success) — Direct submission to Greenhouse/Lever via their APIs
  2. **Cold Email** — Verified email via Hunter.io to HR/recruiter
  3. **Portal Queue** — URL queued for user to manually apply (fallback)
- **ATS Types Supported:** Greenhouse, Lever, Workday, generic
- **Linked Page:** `/dashboard/applications`
- **Token Costs:** Cover letter: 2, Application send: 1
- **Key Functions:**
  - `applyToJob()` — Single job application with multi-channel routing, rate limit check, cover letter generation
  - `applyToJobsBatch()` — Batch mode for 100+ applications/day: parallel email lookup → channel routing → parallel cover letter generation (5 concurrent) → parallel submission (5 concurrent)
  - `determineApplicationStrategy()` — Quality scoring: Priority (80+), Standard (60-79), Skip (<60)
  - `runIndependentArcher()` — Standalone cron mode reading from ScoutJob table (status READY/FORGE_READY/NEW)
- **Cover Letter Tiering** (via `coverLetterBatch.ts`):
  - `priority` (matchScore >= 80): Full AI-powered, personalized
  - `standard` (matchScore 60-79): Template skeleton + AI fill-in
  - `quick` (matchScore < 60): Instant template, no AI call
  - 12-hour in-memory cache, auto-uniquification via `humanBehavior.ts`
- **Human Behavior Simulation** (via `humanBehavior.ts`):
  - Application delays: 10-30s base (normal), 30-180s (stealth mode), random pauses
  - Rate limits: 15/hour, 100/day (in-memory), 5/company/day
  - Optimal timing: Tue-Thu 9-11 AM in target timezone
  - Cover letter uniquification: Deterministic phrase substitutions using job ID as seed

#### Agent Atlas — Interview Coach
- **ID:** `atlas`
- **Min Plan:** PRO
- **File:** `src/lib/agents/atlas.ts`
- **Capabilities:** Company-specific questions, practice scenarios, JD analysis, feedback loops
- **Linked Page:** `/dashboard/interview`
- **Token Costs:** Interview prep: 2, Interview evaluate: 1
- **Key Function:** `prepareInterview()` — Generates company insights (2-3 sentence overview), 5 technical questions, 5 behavioral/STAR questions, 3 role-specific JD questions, and 4 company-specific interview tips

#### Agent Sage — Skill Trainer
- **ID:** `sage`
- **Min Plan:** ULTRA
- **File:** `src/lib/agents/sage.ts`
- **Capabilities:** Skill gap analysis, learning recommendations, growth tracking, market trend analysis
- **Linked Page:** `/dashboard/learning`
- **Token Cost:** Skill gap analysis: 2
- **Key Functions:**
  - `analyzeSkillGaps()` — Compares candidate skills against target role and recent JDs. Produces: gaps (critical/important/nice-to-have), learning recommendations (courses/projects/certifications with time estimates), strength areas, readiness score (0-100)
  - `generateApplicationBasedGapAnalysis()` — Analyzes actual application history. E.g., "Applied to 50 PLC Engineer jobs, lacking Siemens TIA Portal (required in 42/50)." Groups by normalized job category, projects match rate improvement

#### Agent Sentinel — Quality Reviewer
- **ID:** `sentinel`
- **Min Plan:** ULTRA
- **File:** `src/lib/agents/sentinel.ts`
- **Capabilities:** Quality scoring, fabrication detection, relevance check, spam prevention
- **Linked Page:** `/dashboard/quality`
- **Token Cost:** Application review: 1
- **Key Functions:**
  - `reviewApplication()` — Pre-flight scam check (zero AI cost) via `detectScamSignals()`. If likely scam, auto-reject. Otherwise AI review for: fabricated claims, generic language, profile-job mismatch, professional tone, company-specific relevance, spam signals. Quality score 0-100
  - `verifyJobAlignment()` — Batch JD-resume alignment check. Processes in batches of 3 per AI call. Returns per-job alignment score, matched/missing skills, experience match strength. Approve/reject against threshold (default 40%)

### 4.3 Automation Modes
Users can set their preferred level of agent autonomy:

| Mode | Label | Description |
|------|-------|-------------|
| `copilot` | Manual / You Decide | User assigns tasks one-by-one. Full control over every action. |
| `autopilot` | Co-Pilot / Recommended | Agents work proactively but ask for approval before every action. |
| `full-agent` | Autopilot / Fully Autonomous | Agents handle everything end-to-end with zero intervention. |

### 4.4 Agent Pipeline Flow
```
Scout (discover jobs) → Forge (optimize resume per job) → Archer (send applications)
                                                               │
                              Atlas (interview prep) ←─────────┘
                              Sage (skill gaps) ←──────────────┘
                              Sentinel (quality review) ←──────┘
```

**ScoutJob Status Progression:**
```
NEW → FORGE_PENDING → FORGE_READY → READY → APPLYING → APPLIED
                                         └→ SKIPPED
                                         └→ EXPIRED (30-day TTL)
```

### 4.5 Agent Access by Plan

| Plan | Agents Available | Count |
|------|-----------------|-------|
| BASIC | None | 0 |
| STARTER | Scout, Forge | 2 |
| PRO | Scout, Forge, Archer, Atlas | 4 |
| ULTRA | All 6 agents | 6 |

---

## 5. Database Schema

### 5.1 Enums

| Enum | Values |
|------|--------|
| `PlanTier` | BASIC, STARTER, PRO, ULTRA |
| `SubscriptionStatus` | ACTIVE, PAST_DUE, CANCELED, TRIALING, INCOMPLETE |
| `ReferralStatus` | PENDING, ACTIVATED, REWARDED, EXPIRED |
| `EmailType` | WELCOME, OTP_LOGIN, OTP_SIGNUP, EMAIL_VERIFIED, ONBOARDING_DAY2, ONBOARDING_DAY5, ONBOARDING_DAY7, UPGRADE_NUDGE, CREDIT_LOW, WEEKLY_DIGEST, REFERRAL_INVITE, PASSWORD_RESET, SUBSCRIPTION_CONFIRM, SUBSCRIPTION_CANCELED, PAYMENT_FAILED, ACCOUNT_ACTIVITY |
| `PostStatus` | DRAFT, PUBLISHED, ARCHIVED |
| `AssessmentStatus` | IN_PROGRESS, COMPLETED, EXPIRED |
| `ApplicationStatus` | QUEUED, APPLIED, EMAILED, VIEWED, INTERVIEW, OFFER, REJECTED, WITHDRAWN |
| `ScoutJobStatus` | NEW, FORGE_PENDING, FORGE_READY, READY, APPLYING, APPLIED, SKIPPED, EXPIRED |

### 5.2 Models Summary

#### Authentication & Users
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Account` | OAuth provider accounts | provider, providerAccountId, access_token |
| `Session` | Active user sessions | sessionToken, expires |
| `VerificationToken` | Email verification tokens | identifier, token, expires |
| `OtpToken` | OTP codes for login/signup/reset | email, code, type, attempts, used |
| `User` | Core user record | email, plan, stripeCustomerId, aiCreditsUsed, aiCreditsLimit, dailyAppsUsed, onboardingDone, referralCode |

#### Billing & Subscriptions
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Subscription` | Stripe subscription tracking | stripeSubId, plan, interval, status, currentPeriodStart/End |
| `CreditPurchase` | One-time token credit purchases | credits, amountPaid, stripePaymentId |
| `Coupon` | Reusable discount/upgrade codes | code, plan, maxUses, durationDays |
| `CouponRedemption` | Tracks per-user coupon usage | couponId, userId |

#### Referral System
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Referral` | User-to-user referrals | referrerId, referredId, status, rewardType (pro_month or credits_100) |

#### Career Data
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `CareerTwin` | Persistent user career model | skillSnapshot, interests, workStyle, targetRoles, marketReadiness, hireProb |
| `Assessment` | Skill assessments | targetRole, questions, answers, skillScores, aiAnalysis |
| `CareerPlan` | Career roadmap | targetRole, timeline, milestones, projects |
| `LearningPath` | Personalized learning modules | targetRole, modules, progress, adaptive |

#### Resume & Applications
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Resume` | User resumes | title, template, content (JSON), atsScore, approvalStatus, coverLetter |
| `ResumeVariant` | Per-job tailored resume copies | jobTitle, company, content, atsScore |
| `JobApplication` | Application tracking | jobTitle, company, status, applicationMethod, atsType, emailSentTo, coverLetter |
| `FollowUp` | Post-application follow-ups | scheduledDate, type (follow_up_1/2, thank_you), status |

#### Agent System
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `AutoApplyConfig` | Per-user agent configuration | automationMode, scoutEnabled/Interval, forgeEnabled/Interval/Mode, archerEnabled/Interval/MaxPerRun |
| `AutoApplyRun` | Agent execution logs | agentType, jobsFound, jobsApplied, creditsUsed, summary |
| `AgentActivity` | Granular agent action log | agent, action, summary, creditsUsed |
| `ScoutJob` | Persistent discovered job store | title, company, jobUrl, dedupeKey, matchScore, status |

#### Content & Marketing
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `BlogPost` | Blog articles | slug, title, content, category, status, views |
| `Changelog` | Product changelog entries | title, content, category, version |
| `ContentCalendar` | Editorial calendar | title, targetKeyword, status, scheduledDate |
| `MarketingPhase` | Marketing campaign phases | name, status, progress, tasks |
| `MarketingTask` | Individual marketing tasks | category, status, priority |
| `MarketingKPI` | KPI tracking | name, target, current, period |

#### Support & Communication
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `SupportTicket` | User support tickets | subject, category, priority, status |
| `TicketMessage` | Ticket conversation messages | senderId, senderRole, content |
| `EmailLog` | Transactional email log | type, subject, status |
| `NewsletterSubscriber` | Newsletter subscriptions | email, active, source |
| `NewsletterCampaign` | Bulk email campaigns | subject, status, sentCount |

#### Analytics & Misc
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Portfolio` | Public user portfolios | slug, projects, skills, theme, isPublic |
| `PageView` | Page analytics | path, referrer, country, device, duration |
| `AuditLog` | Security audit trail | action, details, ipAddress |
| `CoachSettings` | AI coach personalization | name, personality, avatarUrl |
| `FreeAutoApplyBurst` | Free viral auto-apply feature | email, resumeText, targetRole, jobsApplied |
| `ViralCounter` | Global application counter | totalApplied, todayApplied |

---

## 6. Authentication & Authorization

### 6.1 Auth Providers
- **Google OAuth 2.0** — Primary social login (conditional on `GOOGLE_CLIENT_ID`)
- **LinkedIn OAuth** — Secondary social login (conditional on `LINKEDIN_CLIENT_ID`), uses `openid profile email` scopes
- **Credential-based (Email + Password)** — With bcryptjs password hashing (12 salt rounds)
- **OTP (One-Time Password)** — 6-digit codes for login, signup, and password reset flows

### 6.2 Session Management
- **NextAuth v4** with Prisma adapter
- **JWT sessions** (not database sessions for performance)
- Session includes: `id`, `email`, `name`, `image`, `plan`, `onboardingDone`

### 6.3 OTP System
- OTP codes stored in `OtpToken` model
- Types: `login`, `signup`, `reset`
- 6-digit codes, 10-minute expiry
- **Rate limiting:** Max 3 OTPs per email per 10 minutes
- **Brute-force protection:** Max 5 incorrect verification attempts per code
- Previous unused OTPs invalidated when new one is generated
- **Email enumeration prevention:** Login/forgot-password always returns success regardless of whether email exists
- Delivered via Resend email service

### 6.4 Registration Flow
1. Input validated with Zod (name, email, password min 8 chars, optional referral code)
2. Duplicate email check (409 if exists)
3. **OFORO internal users** (`@oforo.ai`, `@oforoai.com`) auto-upgraded to ULTRA with unlimited credits
4. **Student emails** (`.edu`, `.ac.*` domains) flagged for discount eligibility
5. Unique referral code generated per user
6. CareerTwin record created (persistent career profile)
7. Referral tracking processed if `ref` code provided
8. Auto-subscribe to newsletter
9. Welcome email sent (non-blocking, with audit trail)

### 6.5 Route Protection
- **Middleware:** Lightweight — only sets geo cookie (`3box-region`) and referral tracking cookie (`3box_ref_source`)
- **Dashboard protection:** Handled at the page/API level via `getServerSession()` checks
- **API protection:** Each API route validates session independently
- **Admin routes:** Additional `isOforoInternal` flag check on user record
- **Cron routes:** Protected by `CRON_SECRET` bearer token

### 6.6 Middleware Details
The middleware runs on all page routes (excludes `/api/*`, `/_next/*`, static assets) and performs:
1. Geo-detection via Cloudflare/Vercel headers → sets `3box-region` cookie
2. Referral source tracking from `?ref=` or `?utm_source=` params → sets `3box_ref_source` cookie
3. Does NOT block or redirect any requests

---

## 7. Subscription & Billing

### 7.1 Plan Tiers

| Plan | Price | Agents | Monthly Tokens | Key Features |
|------|-------|--------|---------------|--------------|
| BASIC | Free | 0 | 15 | Demo access, free tools, 1 Scout run + 1 resume |
| STARTER | $12/mo | 2 (Scout, Forge) | 200 | ~15 Scout runs or mix of operations |
| PRO | $29/mo | 4 (+Archer, Atlas) | 600 | Heavy usage, auto-apply |
| ULTRA | $59/mo | 6 (all) | 2000 | Power users, all agents |

### 7.2 Stripe Integration
- **Checkout:** `POST /api/stripe/checkout` creates Stripe Checkout Session
- **Customer Portal:** `POST /api/stripe/portal` redirects to Stripe billing portal
- **Webhooks:** `POST /api/stripe/webhook` handles:
  - `checkout.session.completed` — Provision plan
  - `customer.subscription.updated` — Plan changes
  - `customer.subscription.deleted` — Downgrade to BASIC
  - `invoice.payment_succeeded` — Reset monthly token credits
  - `invoice.payment_failed` — Handle failed payment

### 7.3 Coupon System
- Admin-created coupons with codes
- Plan-specific (upgrades to specified tier)
- Usage limits (maxUses)
- Optional duration (durationDays) or permanent
- Expiry dates
- Redeemed via `POST /api/coupon/redeem`

### 7.4 Credit Packs (One-Time Purchases)

| Pack | Credits | Price (USD) |
|------|---------|-------------|
| pack_100 | 100 | $5.00 |
| pack_500 | 500 | $15.00 |
| pack_1000 | 1,000 | $25.00 |

Stored in `CreditPurchase` model, linked to Stripe payment ID.

### 7.5 Unlimited Daily Application Purchase
- One-time purchase ($149 base) permanently removes the 30/day application cap
- Sets `hasUnlimitedDaily: true` on the User model
- Regional pricing overrides available

### 7.6 Regional Pricing
Supports 11 regions with local currency pricing: India (INR), US (USD), UK (GBP), Canada (CAD), UAE (AED), Singapore (SGD), Australia (AUD), Netherlands (EUR), Philippines (PHP), Africa, and DEFAULT. Each region has custom pricing for all plans, credit packs, and student discount percentages.

Example: India STARTER is ₹249/mo vs $12/mo USD in the US.

---

## 8. Token Economy

### 8.1 Monthly Token Allocations

| Plan | Tokens/Month |
|------|-------------|
| BASIC | 15 |
| STARTER | 200 |
| PRO | 600 |
| ULTRA | 2000 |

### 8.2 Token Costs Per Operation

| Operation | Cost | Description |
|-----------|------|-------------|
| Scout Search | 2/platform | 6 platforms = 12 tokens per full scan |
| Resume Generation | 3 | AI-powered full resume |
| Resume Enhancement | 2 | Section optimization |
| Resume Analysis | 2 | ATS score analysis |
| Auto-Generate from Profile | 5 | Resume + cover letter from onboarding |
| Per-Job Rewrite | 2 | ATS-tailored variant per job |
| Cover Letter | 2 | Per job application |
| Application Send | 1 | Portal or email |
| Interview Prep | 2 | Company-specific questions |
| Interview Evaluation | 1 | Answer feedback |
| Skill Gap Analysis | 2 | Learning recommendations |
| Application Review | 1 | Quality check |
| Career Plan | 3 | Full roadmap generation |
| AI Insights | 1 | Dashboard analytics |

### 8.3 Daily Application Cap
- **Default:** 30 applications per day for all users
- **Reset:** Lazy reset at midnight UTC
- **Unlimited:** Available as purchasable add-on (`hasUnlimitedDaily` flag)
- **Functions:** `checkDailyCap()`, `consumeDailySlot()`, `getDailyCapStatus()`

### 8.4 Token Utility Functions
- `estimateScoutCost(platformCount)` — Calculate Scout run cost
- `canAfford(used, limit, cost)` — Check if operation is affordable
- `tokensRemaining(used, limit)` — Remaining tokens (handles legacy unlimited)
- `tokenUsagePercent(used, limit)` — Usage percentage (0-100)

### 8.5 Token Warning System
Token warnings displayed in AgentConfigPanel based on estimated monthly usage:
- **No warning:** Estimated usage < 80% of plan limit
- **Amber warning:** Estimated usage 80-100% of plan limit
- **Red warning:** Estimated usage > 100% of plan limit ("This may exceed your monthly quota")
- **Credits depleted banner:** When remaining = 0, agents auto-pause

---

## 9. Public Pages & Marketing

### 9.1 Core Public Pages
| Route | Purpose |
|-------|---------|
| `/` | Landing page with hero, features, agent showcase |
| `/about` | Company information |
| `/pricing` | Plan comparison and checkout |
| `/signup` | User registration |
| `/login` | User login |
| `/get-started` | Free viral auto-apply landing page |
| `/contact` | Contact form |
| `/careers` | Company careers page |
| `/press` | Press kit |
| `/status` | System status page |

### 9.2 Content Pages
| Route | Purpose |
|-------|---------|
| `/blog` | Blog listing page |
| `/blog/[slug]` | Individual blog posts |
| `/changelog` | Product changelog |
| `/agents` | Agent showcase landing page |
| `/agents/[slug]` | Individual agent detail pages |
| `/case-studies` | Customer case studies |

### 9.3 Legal & Compliance
| Route | Purpose |
|-------|---------|
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/security` | Security practices |
| `/gdpr` | GDPR compliance |

### 9.4 Help & Support
| Route | Purpose |
|-------|---------|
| `/help` | Help center |
| `/help/tickets/new` | New support ticket |
| `/help/tickets/[id]` | View ticket |

### 9.5 Comparison Pages
| Route | Compares Against |
|-------|-----------------|
| `/compare` | Comparison overview |
| `/compare/all` | Compare all competitors |
| `/compare/jobscan` | Jobscan |
| `/compare/kickresume` | Kickresume |
| `/compare/lazyapply` | LazyApply |
| `/compare/rezi` | Rezi |
| `/compare/resumeworded` | ResumeWorded |
| `/compare/sonara` | Sonara |
| `/compare/teal` | Teal |

### 9.6 Resume Landing Pages
| Route | Target Audience |
|-------|----------------|
| `/resume/software-engineer` | Software engineers |
| `/resume/data-scientist` | Data scientists |
| `/resume/nurse` | Nurses |
| `/resume/teacher` | Teachers |
| `/resume/career-changer` | Career changers |

### 9.7 Public Profiles
| Route | Purpose |
|-------|---------|
| `/p/[username]` | Public portfolio page |

---

## 10. Dashboard Features

### 10.1 Dashboard Home (`/dashboard`)
- Personalized greeting with time-of-day awareness
- Next step prompt (contextual suggestion)
- **Command Center quick-access card** — Link to `/dashboard/agents`
- Metrics grid: Match Score, Applications, Interviews, Active Jobs
- Agent activity feed
- Quick action buttons

### 10.2 Onboarding Wizard (`/dashboard/onboarding`)
6-step wizard that collects user profile data:

| Step | Content |
|------|---------|
| 1 | Resume upload (PDF/DOCX parsing) or skip |
| 2 | Location, career goals, target roles |
| 3 | Experience level, job preferences |
| 4 | Education level |
| 5 | Skills selection |
| 6 | **Meet Your AI Agents** — Agent cards, agent enable toggles (Scout/Forge/Archer), schedule preset selector (Aggressive/Balanced/Relaxed), token usage estimate |

**Schedule Presets:**
| Preset | Scout | Forge | Archer | Description |
|--------|-------|-------|--------|-------------|
| Aggressive | 2h | 4h | 4h | Search every 2h, apply fast |
| Balanced | 12h | 12h | 12h | Search twice daily, steady pace |
| Relaxed | 24h | 24h | 24h | Daily search, minimal tokens |

### 10.3 Job Discovery (`/dashboard/jobs`)
- Scout agent results display
- Job cards with match score, company, location, salary
- Filter and sort capabilities
- **Collapsible Scout Schedule Settings panel** — Enable/disable, interval selection, token cost estimate

### 10.4 Resume Management (`/dashboard/resume`)
- Resume editor with multiple templates
- ATS score display
- Resume variants per job
- Cover letter management
- PDF export via `@react-pdf/renderer`
- **Collapsible Forge Schedule Settings panel** — Enable/disable, interval, mode selection (On Demand/Base Only/Per Job)

### 10.5 Applications (`/dashboard/applications`)
- Application tracker with status pipeline
- Status: Queued → Applied → Viewed → Interview → Offer/Rejected/Withdrawn
- Application method tracking (ATS, cold email, portal, manual)
- Follow-up scheduling
- **Collapsible Archer Schedule Settings panel** — Enable/disable, interval, max per run

### 10.6 Agent Command Center (`/dashboard/agents`)
- Cortex overview with lore/story
- Automation mode selector (Manual/Co-Pilot/Autopilot)
- **Independent Agent Scheduling** section with inline config panels for Scout, Forge, Archer
- Agent activity timeline
- Pipeline statistics
- Run history with details

### 10.7 Interview Prep (`/dashboard/interview`)
- Company-specific question generation
- Practice mode with AI evaluation
- Feedback and scoring

### 10.8 Career Plan (`/dashboard/career-plan`)
- AI-generated career roadmap
- Timeline with milestones
- Project suggestions
- Progress tracking

### 10.9 Learning Path (`/dashboard/learning`)
- Skill gap analysis based on target roles
- Personalized course recommendations
- Adaptive learning modules
- Growth tracking

### 10.10 Skills Assessment (`/dashboard/assessment`)
- Technical assessment generation
- AI-evaluated answers
- Skill scoring

### 10.11 Quality Review (`/dashboard/quality`)
- Application quality checks
- Fabrication detection results
- Approval/rejection workflow

### 10.12 Portfolio (`/dashboard/portfolio`)
- Public portfolio builder
- Project showcase
- Customizable themes (dark/light)
- Public URL: `/p/[username]`

### 10.13 Settings (`/dashboard/settings`)
- Profile management
- Password change
- Account deletion
- Data export (GDPR)
- Coach personalization (name, personality, avatar)

---

## 11. Free Tools Suite

### 11.1 Available Tools (16)
All tools are publicly accessible without authentication:

| Tool | Route | Purpose |
|------|-------|---------|
| ATS Checker | `/tools/ats-checker` | Check resume ATS compatibility |
| Resume Builder | `/tools/resume-builder` | Build a resume from scratch |
| Salary Estimator | `/tools/salary-estimator` | Estimate salary for a role/location |
| Cover Letter Generator | `/tools/cover-letter-generator` | Generate a cover letter |
| Resume Generator | `/tools/resume-generator` | AI-powered resume creation |
| Resume Score | `/tools/resume-score` | Score resume quality |
| Resume Summary Generator | `/tools/resume-summary-generator` | Generate professional summary |
| Interview Question Prep | `/tools/interview-question-prep` | Practice interview questions |
| Job Description Analyzer | `/tools/job-description-analyzer` | Analyze JD requirements |
| Cold Email Generator | `/tools/cold-email-generator` | Generate cold outreach emails |
| Elevator Pitch Generator | `/tools/elevator-pitch-generator` | Create elevator pitch |
| LinkedIn Headline Generator | `/tools/linkedin-headline-generator` | Optimize LinkedIn headline |
| LinkedIn Post Generator | `/tools/linkedin-post-generator` | Generate LinkedIn posts |
| LinkedIn Hashtag Generator | `/tools/linkedin-hashtag-generator` | Suggest LinkedIn hashtags |
| LinkedIn Recommendation Generator | `/tools/linkedin-recommendation-generator` | Write recommendations |
| Skills Gap Finder | `/tools/skills-gap-finder` | Identify skill gaps |
| Thank You Email Generator | `/tools/thank-you-email-generator` | Post-interview thank you |

### 11.2 Tool Architecture
- Each tool has a page component at `/tools/[tool-name]/page.tsx`
- Each tool has a corresponding API route at `/api/tools/[tool-name]/route.ts`
- Tools use the same AI model infrastructure as the main application
- No authentication required — lead generation funnel to signup

---

## 12. API Reference

### 12.1 Authentication APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth handlers (Google + Credentials) |
| POST | `/api/auth/register` | Email/password registration |
| POST | `/api/auth/forgot-password` | Initiate password reset |
| POST | `/api/auth/reset-password` | Complete password reset |
| POST | `/api/auth/otp/send` | Send OTP code |
| POST | `/api/auth/otp/verify` | Verify OTP code |
| GET | `/api/auth/providers` | List available auth providers |

### 12.2 AI APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/assessment` | Generate skill assessment |
| POST | `/api/ai/career-plan` | Generate career plan |
| POST | `/api/ai/chat` | General AI chat |
| POST | `/api/ai/cover-letter` | Generate cover letter |
| POST | `/api/ai/dashboard-insights` | Generate dashboard AI insights |
| POST | `/api/ai/interview` | Generate interview questions |
| POST | `/api/ai/learning-path` | Generate learning path |
| POST | `/api/ai/onboarding-chat` | Onboarding conversational flow |
| POST | `/api/ai/resume/enhance` | Enhance resume section |
| POST | `/api/ai/resume/generate` | Generate full resume |

### 12.3 Agent APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents/activity` | Get agent activity feed |
| GET/PUT | `/api/agents/config` | Get/update agent configuration |
| GET | `/api/agents/cron` | Cron endpoint (hourly, CRON_SECRET protected) |
| GET | `/api/agents/pipeline-stats` | Get pipeline statistics |
| POST | `/api/agents/run` | Start a manual agent run |
| GET | `/api/agents/run/[id]` | Get specific run details |
| POST | `/api/agents/scout/discover` | Manual Scout job discovery |
| GET | `/api/agents/scout/jobs` | Get discovered jobs |
| POST | `/api/agents/scout/apply` | Apply to a Scout job |
| GET | `/api/agents/skill-gaps` | Get skill gap analysis |
| GET | `/api/agents/status` | Get agent statuses |

### 12.4 Forge APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/forge/approve` | Approve a Forge-generated resume |
| POST | `/api/forge/auto-generate` | Auto-generate resume from profile |
| POST | `/api/forge/linkedin-suggest` | LinkedIn optimization suggestions |
| POST | `/api/forge/per-job-rewrite` | Rewrite resume for specific job |
| GET | `/api/forge/status` | Get Forge processing status |

### 12.5 User APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/user/profile` | Get/update user profile |
| GET/PUT | `/api/user/settings` | Get/update user settings |
| POST | `/api/user/onboarding` | Complete onboarding |
| GET/POST | `/api/user/assessment` | User assessment data |
| POST | `/api/user/change-password` | Change password |
| DELETE | `/api/user/delete-account` | Delete user account |
| GET | `/api/user/export-data` | GDPR data export |
| GET/PUT | `/api/user/coach-settings` | AI coach personalization |
| GET/POST | `/api/user/story` | User career story |

### 12.6 Application & Job APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/applications` | Application CRUD |
| POST | `/api/jobs/search` | Job search |
| GET/POST | `/api/resume/export` | Resume PDF export |
| POST | `/api/resume/parse` | Resume file parsing |

### 12.7 Billing APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stripe/checkout` | Create checkout session |
| POST | `/api/stripe/portal` | Create billing portal session |
| POST | `/api/stripe/webhook` | Stripe webhook handler |
| POST | `/api/coupon/redeem` | Redeem coupon code |

### 12.8 Tool APIs (16 endpoints)
All follow pattern: `POST /api/tools/[tool-name]`
- `/api/tools/ats-checker`
- `/api/tools/resume-builder`
- `/api/tools/salary-estimator`
- `/api/tools/cover-letter-generator`
- `/api/tools/resume-generator`
- `/api/tools/resume-score`
- `/api/tools/resume-summary-generator`
- `/api/tools/interview-question-prep`
- `/api/tools/job-description-analyzer`
- `/api/tools/cold-email-generator`
- `/api/tools/elevator-pitch-generator`
- `/api/tools/linkedin-headline-generator`
- `/api/tools/linkedin-post-generator`
- `/api/tools/linkedin-hashtag-generator`
- `/api/tools/linkedin-recommendation-generator`
- `/api/tools/skills-gap-finder`
- `/api/tools/thank-you-email-generator`

### 12.9 Other APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/geo` | Geo-detection fallback |
| GET | `/api/blog` | Blog posts listing |
| GET | `/api/changelog` | Changelog entries |
| POST | `/api/newsletter` | Newsletter subscription |
| GET | `/api/referral` | Referral system |
| POST | `/api/support/request` | Support request |
| GET/POST | `/api/tickets` | Support ticket CRUD |
| POST | `/api/upload/avatar` | Avatar upload to Cloudinary |
| POST | `/api/analytics/track` | Analytics event tracking |
| GET/POST | `/api/portfolio` | Portfolio CRUD |
| POST | `/api/free-burst/start` | Start free auto-apply burst |
| GET | `/api/free-burst/status/[id]` | Check burst status |

---

## 13. Admin System

### 13.1 Admin Routes
| Route | Purpose |
|-------|---------|
| `/admin` | Admin dashboard overview |
| `/admin/users` | User management |
| `/admin/monitoring` | System monitoring |
| `/admin/coupons` | Coupon management |
| `/admin/email` | Email campaigns and logs |
| `/admin/marketing` | Marketing dashboard (phases, tasks, KPIs, content calendar) |
| `/admin/support/tickets` | Support ticket management |
| `/admin/content/blog` | Blog post management |
| `/admin/content/changelog` | Changelog management |

### 13.2 Admin API Endpoints
- `/api/admin/users` — User CRUD and management
- `/api/admin/monitoring` — System health metrics
- `/api/admin/coupons` — Coupon CRUD
- `/api/admin/email/send` — Send emails
- `/api/admin/marketing/*` — Marketing phases, tasks, KPIs, content calendar
- `/api/admin/support/*` — Ticket management
- `/api/admin/blog/*` — Blog CRUD
- `/api/admin/changelog/*` — Changelog CRUD
- `/api/admin/stats` — Platform statistics

### 13.3 Access Control
Admin pages require `isOforoInternal: true` on the user record. This flag is set directly in the database — there is no self-service admin registration.

---

## 14. Independent Agent Scheduling

### 14.1 Architecture
Each of the three operational agents (Scout, Forge, Archer) runs on its own configurable schedule, independent of the others. Scheduling is driven by an external cron job that hits `GET /api/agents/cron` every hour.

### 14.2 Configuration Model (AutoApplyConfig)
Per-agent fields:
- `scoutEnabled` / `scoutInterval` (hours) / `scoutLastRunAt`
- `forgeEnabled` / `forgeInterval` (hours) / `forgeLastRunAt` / `forgeMode`
- `archerEnabled` / `archerInterval` (hours) / `archerLastRunAt` / `archerMaxPerRun`

### 14.3 Interval Options
| Interval | Label |
|----------|-------|
| 1 | Every hour |
| 2 | Every 2 hours |
| 4 | Every 4 hours |
| 6 | Every 6 hours |
| 12 | Every 12 hours |
| 24 | Once daily |

### 14.4 Cron Logic
1. Verify `CRON_SECRET` bearer token
2. Run ScoutJob TTL cleanup (expire jobs older than 30 days)
3. Fetch all `AutoApplyConfig` records with any agent enabled
4. For each user:
   a. Check credit depletion → skip if depleted (log `credits_depleted` activity once per day)
   b. For each enabled agent, check `shouldRunAgent(lastRunAt, interval, now)`
   c. Verify plan-level access via `isAgentAvailable(agentId, plan)`
   d. For Archer: additionally check daily application cap
   e. Dispatch agent: `runIndependentScout()`, `runIndependentForge()`, or `runIndependentArcher()`
   f. Update `lastRunAt` timestamp

### 14.5 Token Cost Estimation
```typescript
function estimateMonthlyTokens(agentId, intervalHours, opts):
  runsPerMonth = floor(720 / intervalHours)  // 720h = 30 days
  costPerRun:
    scout: 12  (6 platforms * 2 tokens)
    forge: opts.forgeMode === 'per_job' ? 20 : 5
    archer: (2 + 1) * opts.archerMaxPerRun  // (cover_letter + send) * maxPerRun
  return ceil(runsPerMonth * costPerRun)
```

### 14.6 AgentConfigPanel Component
Reusable React component (`src/components/dashboard/AgentConfigPanel.tsx`) with two variants:
- **`inline`** — For the Command Center page (always visible)
- **`collapsible`** — For individual agent pages (starts collapsed with toggle button)

Features:
- Enable/disable toggle
- Interval dropdown selector
- Agent-specific controls (Forge mode, Archer max per run)
- Token cost estimate display ("~X tokens/month")
- Token warning levels (amber/red)
- Credits depleted banner with upgrade link
- Last run / next run indicators

---

## 15. Email & Notification System

### 15.1 Email Types (16)
| Type | Trigger |
|------|---------|
| WELCOME | New user registration |
| OTP_LOGIN | Login OTP request |
| OTP_SIGNUP | Signup OTP request |
| EMAIL_VERIFIED | Email verification complete |
| ONBOARDING_DAY2 | 2 days after signup (nudge) |
| ONBOARDING_DAY5 | 5 days after signup (nudge) |
| ONBOARDING_DAY7 | 7 days after signup (nudge) |
| UPGRADE_NUDGE | Upgrade suggestion |
| CREDIT_LOW | Token credits running low |
| WEEKLY_DIGEST | Weekly activity summary |
| REFERRAL_INVITE | Referral invitation |
| PASSWORD_RESET | Password reset link |
| SUBSCRIPTION_CONFIRM | Subscription activated |
| SUBSCRIPTION_CANCELED | Subscription cancelled |
| PAYMENT_FAILED | Payment failure notification |
| ACCOUNT_ACTIVITY | Account security alerts |

### 15.2 Email Delivery
- **Provider:** Resend (v6.9)
- **Tracking:** All emails logged in `EmailLog` model with status (sent/failed/bounced) and messageId

### 15.3 Newsletter System
- `NewsletterSubscriber` model tracks subscriptions
- `NewsletterCampaign` model manages bulk sends
- Sources: website, signup, blog

---

## 16. Security & Compliance

### 16.1 HTTP Security Headers
Applied to all routes via `next.config.js`:
- `X-Frame-Options: DENY` — Clickjacking prevention
- `X-Content-Type-Options: nosniff` — MIME-type sniffing prevention
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation()` — Feature restrictions

### 16.2 Authentication Security
- Passwords hashed with bcryptjs
- OTP codes with attempt limits and expiry
- JWT sessions with configurable expiry
- CRON_SECRET for cron endpoint protection

### 16.3 Data Protection
- GDPR data export endpoint (`/api/user/export-data`)
- Account deletion capability (`/api/user/delete-account`)
- Cascade deletes on user removal (all related data)
- PII redaction before AI model logging
- GDPR compliance page at `/gdpr`

### 16.4 Image Security
Allowed remote image domains (next.config.js):
- `lh3.googleusercontent.com` (Google avatars)
- `avatars.githubusercontent.com` (GitHub avatars)
- `*.amazonaws.com` (S3 storage)
- `res.cloudinary.com` (Cloudinary uploads)

### 16.5 Audit Logging
- `AuditLog` model tracks user actions
- Records: action, details (JSON), IP address, timestamp
- Used for security monitoring and compliance

### 16.6 Anti-Fraud & Anti-Abuse
- **Scam Job Detector** (`src/lib/jobs/scamDetector.ts`): 12-rule scoring system (0-100)
  - Critical signals (40 pts): Payment demands, resume harvesting
  - Major signals: Free email domains in postings, MLM indicators, unrealistic salaries
  - Minor signals: Excessive capitalization, WhatsApp numbers, urgency language
  - Verdicts: `safe` (< 25), `suspicious` (25-49), `likely_scam` (50+)
- **Free tool usage tracking**: Dual-layer verification — HttpOnly cookies + client-reported counts, takes the higher value to prevent tampering
- **Daily application cap**: Hard limit of 30/day to prevent spam applications
- **Credit alerts**: Low-credit emails at 3 and 1 remaining (deduplicated — one alert per threshold per day)

### 16.7 Bot Management
`robots.txt` configuration:
- **Allowed:** All crawlers on public pages
- **Blocked:** Bytespider (ByteDance crawler)
- **Disallowed paths:** `/api/`, `/dashboard/`, `/admin/`, `/_next/`

---

## 17. SEO & Analytics

### 17.1 Sitemap
Dynamic sitemap at `/sitemap.xml` includes:
- All public pages (/, /about, /pricing, /signup, /login, etc.)
- Blog posts (dynamic from database)
- Agent pages (/agents, /agents/scout, /agents/forge, etc.)
- Tool pages (all 16 tools)
- Comparison pages
- Resume landing pages
- Legal pages

### 17.2 Analytics
- **PageView model:** Tracks path, referrer, user agent, country, city, device, browser, OS, session, duration
- **Event tracking:** `POST /api/analytics/track` for custom events
- **PostHog-ready:** Event system designed for PostHog integration

### 17.3 Referral Tracking
- Query parameters: `?ref=` or `?utm_source=`
- Stored in `3box_ref_source` cookie (30-day TTL)
- Supported sources: whatsapp, twitter, linkedin, share, custom

---

## 18. Deployment & Infrastructure

### 18.1 VPS Deployment
- **Server:** VPS at `72.62.230.223`
- **Process Manager:** PM2
- **Port:** 3003
- **Git Remote:** `3box` (NOT `origin`)

### 18.2 Build System
```bash
npm run build    # Next.js production build
npm run start    # Start production server
npm run dev      # Development server
npm run lint     # ESLint
```

### 18.3 Database Management
```bash
npm run db:push      # Push schema changes
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

### 18.4 Environment Variables (Required)
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth JWT signing secret |
| `NEXTAUTH_URL` | Application URL |
| `NEXT_PUBLIC_APP_URL` | Public application URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key |
| `OPENROUTER_API_KEY` | OpenRouter AI API key |
| `RESEND_API_KEY` | Resend email API key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `REDIS_URL` | Redis connection string |
| `CRON_SECRET` | Cron endpoint authentication |

---

## 19. Third-Party Integrations

### 19.1 AI / LLM
- **OpenRouter API** — Multi-model AI gateway
  - Free tier: Arcee Trinity (BASIC plan)
  - Standard tier: GPT-4o Mini (STARTER plan)
  - Reasoning tier: DeepSeek Chat (PRO plan)
  - Premium tier: Claude Sonnet (ULTRA plan)
  - Automatic model fallback cascade
  - Plan-to-model mapping for 12 distinct AI features

### 19.2 Payment Processing
- **Stripe** — Subscriptions, checkout, billing portal, webhooks
  - @stripe/stripe-js (client SDK)
  - stripe (server SDK)

### 19.3 Email
- **Resend** — Transactional emails (OTP, welcome, notifications)
- **IMAP (imapflow)** — Email reading for reply tracking

### 19.4 Storage
- **Cloudinary** — Image upload, avatar storage, CDN delivery
- **PostgreSQL** — Primary data store via Prisma ORM

### 19.5 Background Jobs
- **BullMQ** — Job queue for async agent operations
- **ioredis** — Redis client for queue backend and caching

### 19.6 Document Processing
- **@react-pdf/renderer** — Client-side PDF generation for resumes
- **pdf-parse** — Server-side PDF text extraction
- **mammoth** — DOCX to text conversion

### 19.7 Job Search APIs
- **Adzuna** (`src/lib/jobs/adzuna.ts`) — Job search API integration
- **SerpAPI** (`src/lib/jobs/serpapi.ts`) — Google Jobs integration
- **Multi-source discovery** (`src/lib/jobs/discovery.ts`) — Aggregates results from all sources

### 19.8 Job Platforms (Scout Sources)
Scout agent discovers jobs from:
1. LinkedIn
2. Indeed
3. Naukri
4. Google Jobs (via SerpAPI)
5. Glassdoor
6. Direct company career pages
7. Adzuna

### 19.9 Salary Data
- **Salary Aggregator** (`src/lib/salary/aggregator.ts`) — Multi-source salary aggregation
- **Salary Benchmarks** (`src/lib/salary/salaryBenchmarks.ts`) — Role-based salary benchmarks
- **Cost of Living** (`src/lib/salary/costOfLiving.ts`) — Regional cost of living adjustments

### 19.10 Regional Pricing
- **Geo Context** (`src/lib/geo/`) — React context for geo data, country detection, regional pricing multipliers
- Pricing adjusted based on user's detected country (via Cloudflare/Vercel headers or `/api/geo` fallback)

```
src/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── (public pages)       # Landing, about, pricing, blog, agents, tools, etc.
│   ├── dashboard/
│   │   ├── layout.tsx       # Dashboard layout (sidebar, auth-protected)
│   │   ├── page.tsx         # Dashboard home
│   │   ├── agents/          # Command Center
│   │   ├── applications/    # Application tracker
│   │   ├── assessment/      # Skills assessment
│   │   ├── career-plan/     # Career planning
│   │   ├── interview/       # Interview prep
│   │   ├── jobs/            # Job discovery (Scout)
│   │   ├── learning/        # Learning paths
│   │   ├── onboarding/      # Onboarding wizard
│   │   ├── portfolio/       # Portfolio builder
│   │   ├── quality/         # Quality review
│   │   ├── resume/          # Resume management (Forge)
│   │   └── settings/        # User settings
│   ├── admin/
│   │   ├── layout.tsx       # Admin layout
│   │   └── ...              # Admin pages
│   ├── compare/
│   │   └── layout.tsx       # Comparison pages layout
│   ├── resume/
│   │   └── layout.tsx       # Resume SEO pages layout
│   └── api/                 # 107+ API routes
├── components/              # 15 subdirectories
│   ├── ai-coach/            # Floating AI coach (Cortex) widget
│   ├── analytics/           # Analytics tracking components
│   ├── brand/               # Brand/logo components
│   ├── dashboard/           # Dashboard components (AgentConfigPanel, StatusBadge, etc.)
│   ├── forge/               # Forge agent UI components
│   ├── gdpr/                # GDPR consent components
│   ├── geo/                 # Regional pricing display
│   ├── landing/             # Landing page sections (chapters, orbital layout, testimonials)
│   ├── layout/              # Navbar, Footer, Sidebar
│   ├── providers/           # React context providers
│   ├── resume/              # Resume builder/editor components
│   ├── seo/                 # SEO meta/structured data
│   ├── tools/               # Free tool page components
│   └── ui/                  # Shared UI primitives (Radix-based)
├── hooks/                   # 7 custom hooks
│   ├── useAgentStatus.ts    # Agent status polling
│   ├── useLiveAgentStatus.ts # Real-time agent status
│   ├── useScoutStatus.ts    # Scout agent status
│   ├── useForgeStatus.ts    # Forge agent status
│   ├── useTokens.ts         # AI credit/token management
│   ├── useToolSubmit.ts     # Free tool form submission handler
│   └── useVisitorName.ts    # Anonymous visitor name
├── store/                   # Zustand state management
│   ├── useStore.ts          # Main store
│   └── useNotificationStore.ts # Notification state
├── lib/
│   ├── agents/              # 14 files
│   │   ├── registry.ts      # Agent definitions (6 agents + Cortex)
│   │   ├── orchestrator.ts  # Pipeline orchestration (~900 lines)
│   │   ├── context.ts       # Inter-agent shared context + handoffs
│   │   ├── permissions.ts   # Plan-based access control
│   │   ├── configUtils.ts   # Scheduling utilities + presets
│   │   ├── scout.ts         # Scout agent logic
│   │   ├── forge.ts         # Forge agent logic
│   │   ├── archer.ts        # Archer agent logic
│   │   ├── atlas.ts         # Atlas agent logic
│   │   ├── sage.ts          # Sage agent logic
│   │   ├── sentinel.ts      # Sentinel agent logic
│   │   ├── humanBehavior.ts # Human-like timing simulation
│   │   ├── coverLetterBatch.ts # Batch cover letter tiering
│   │   ├── networkSuggester.ts # Post-application networking
│   │   └── agentContent.ts  # Agent marketing content
│   ├── ai/
│   │   ├── openrouter.ts    # 4-tier model routing, PII redaction, fallback
│   │   └── context.ts       # User context builder for AI
│   ├── ats/                 # ATS integrations
│   │   ├── router.ts        # Channel routing logic
│   │   ├── greenhouse.ts    # Greenhouse API
│   │   └── lever.ts         # Lever API
│   ├── auth/
│   │   └── config.ts        # NextAuth config (Google, LinkedIn, Credentials+OTP)
│   ├── db/
│   │   └── prisma.ts        # Prisma client singleton
│   ├── email/
│   │   ├── index.ts         # Email sending via Resend
│   │   ├── newsletter.ts    # Newsletter operations
│   │   ├── emailFinder.ts   # Hunter.io email discovery
│   │   └── imap.ts          # IMAP email reading
│   ├── geo/                 # Regional pricing + geo detection
│   ├── jobs/
│   │   ├── discovery.ts     # Multi-source job discovery
│   │   ├── matcher.ts       # Job-candidate matching
│   │   ├── scamDetector.ts  # 12-rule scam detection (zero AI cost)
│   │   ├── qualityScore.ts  # Composite quality scoring
│   │   ├── adzuna.ts        # Adzuna API integration
│   │   └── serpapi.ts       # SerpAPI (Google Jobs) integration
│   ├── queue/               # BullMQ job queues
│   ├── salary/              # Salary aggregation + benchmarks
│   ├── seo/                 # SEO keywords + metadata
│   ├── stripe/              # Stripe integration
│   ├── tokens/
│   │   ├── pricing.ts       # Token costs and plan limits
│   │   └── dailyCap.ts      # Daily application cap
│   ├── tools/               # Free tool configuration
│   ├── usage/               # Free tool usage tracking
│   └── validation/          # Gibberish/spam text detection
├── types/
│   ├── index.ts             # Shared TypeScript types
│   └── next-auth.d.ts       # NextAuth session augmentation
└── middleware.ts             # Geo + referral tracking

scripts/
├── create-test-coupon.ts    # Create test coupons
├── generate-brand-pngs.mjs  # Generate brand assets
└── setup-stripe.ts          # Stripe product/price setup
```

## 20. Pipeline Orchestrator

### 20.1 Overview
The orchestrator (`src/lib/agents/orchestrator.ts`, ~900 lines) runs the full pipeline via `runAgentPipeline()`. It coordinates all 6 agents in a defined sequence.

### 20.2 Pipeline Steps

```
Step 1: Scout discovers jobs (STARTER+)
  ├── Try reusing recent Scout results (< 24h old)
  ├── If none, auto-trigger fresh Scout run
  └── Write discovered jobs to shared context

Step 2: Forge optimizes resume + Quality Gate (STARTER+)
  ├── For top 5 jobs: ATS analysis, optional per-job resume variants
  ├── Quality gate: scam detection + quality scoring per job
  └── Step 2.5: Resume Readiness Verification
      ├── Hard block if name/email missing
      └── Soft warning for other issues (proceed with caution)

Step 3: Sentinel + Archer application (PRO+)
  ├── Step 3.0: Sentinel batch JD-resume alignment check (ULTRA)
  ├── Quality gate filter (skip jobs with quality "skip")
  ├── Alignment filter (skip jobs below 40% alignment)
  ├── Per-job Sentinel quality review (ULTRA)
  ├── Autopilot category check (only apply to matching role categories)
  ├── Daily cap check (30/day, trimmed if near limit)
  ├── Batch apply to approved jobs (multi-channel, parallel)
  └── Step 3b: Networking suggestions for applied companies

Step 4: Atlas interview prep (PRO+)
  └── For top 3 applied jobs: generate interview questions

Step 5: Sage skill gap analysis (ULTRA)
  └── Identify skill gaps against target role + job descriptions
```

### 20.3 Automation Mode Behavior in Pipeline

| Mode | Scout | Forge | Sentinel | Archer | Atlas | Sage |
|------|-------|-------|----------|--------|-------|------|
| Manual (copilot) | Auto | Suggestions only | — | — | — | — |
| Co-Pilot (autopilot) | Auto | Auto | Auto | Only approved role categories | Suggestions | Suggestions |
| Autopilot (full-agent) | Auto | Auto | Auto | Full auto | Auto | Auto |

The `shouldAutoRun()` function controls which agents execute automatically based on the mode.

### 20.4 Inter-Agent Context
The `AgentContext` (`src/lib/agents/context.ts`) is a shared state object passed between agents during a pipeline run:
- Discovered jobs, optimized resumes, review results, applications sent
- Interview preps, skill gaps, networking suggestions
- Scam filter count, quality scores, resume readiness report, job alignments
- Timestamped activity log

The `getAgentHandoff()` function provides structured data summaries for 16 defined handoff paths (e.g., scout→forge, forge→sentinel, archer→atlas, sage→scout). Each handoff extracts the relevant subset of context data that the receiving agent needs.

---

## 21. Supporting Systems

### 21.1 Scam Detection
- **Module:** `src/lib/jobs/scamDetector`
- Used by Scout (pre-filter) and Sentinel (pre-flight check)
- Produces scam score and verdict: `likely_scam` / `suspicious` / `clean`
- Scam indicators: missing company info, unrealistic salary, vague descriptions, known scam patterns

### 21.2 ATS Router
- **Module:** `src/lib/ats/router`
- Routes applications to optimal channel based on URL detection
- Channels (priority): ATS API → Cold Email → Portal Queue

### 21.3 ATS Integrations
- **Greenhouse:** `src/lib/ats/greenhouse` — Direct API submission
- **Lever:** `src/lib/ats/lever` — Direct API submission
- **Workday:** Detected but uses portal queue (no direct API)
- **Generic:** Fallback URL-based detection

### 21.4 Email Finder
- **Module:** `src/lib/email/emailFinder`
- **Provider:** Hunter.io API
- Finds verified HR/recruiter emails for cold outreach
- Returns email address and confidence score (0-100)
- Rate limited: batches of 3 for Hunter.io API limits

### 21.5 Quality Scoring
- **Module:** `src/lib/jobs/qualityScore`
- Composite score from: match score, ATS score, scam score, URL availability, job age
- Recommendations: `apply_now` / `optimize_first` / `skip` / `review`

### 21.6 Free Auto-Apply Burst
- **Purpose:** Viral marketing feature — free auto-apply for non-registered users
- **Flow:** Upload resume → Select role/location → Scout scans → Archer applies
- **Models:** `FreeAutoApplyBurst` (per-user burst), `ViralCounter` (global counter)
- **Referral tracking:** WhatsApp, Twitter, LinkedIn, direct
- **Agents allowed in burst:** Scout + Archer only (bypasses plan checks)

### 21.7 Career Twin
- **Model:** `CareerTwin`
- Persistent AI-driven user career profile
- Stores: skill snapshot, interests, work style, target roles
- Metrics: market readiness (0-1), hire probability (0-1)
- Updated automatically as user interacts with agents

### 21.8 Public Portfolio System
- Users can create public portfolios at `/p/[username]`
- Customizable: title, bio, projects, skills, theme
- Toggle visibility with `isPublic` flag

---

*Document generated March 2026. Reflects 3BOX AI v1.6.0.*

---

**Total Statistics:**
- **Page Routes:** 80+
- **API Endpoints:** 107+
- **Database Models:** 30
- **Database Enums:** 8
- **AI Agents:** 6 + Cortex coordinator
- **Free Tools:** 18
- **Custom Hooks:** 7
- **Component Directories:** 15
- **lib/ Modules:** 63 files in 17 subdirectories
