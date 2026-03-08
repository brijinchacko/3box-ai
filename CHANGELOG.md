# Changelog

All notable changes to jobTED AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.6.0] - 2026-03-07

### Added
- **Plan Gating Fix** — Restored proper `isAgentAvailable()` logic that was bypassed during testing. Agents are now correctly locked based on user plan tier: BASIC (0 agents), STARTER (Scout + Forge), PRO (+ Archer + Atlas), ULTRA (all 6).
- **Scam Detection Engine** — Rule-based `scamDetector.ts` with 12 detection rules (zero AI cost): vague company names, urgency language, payment demands, resume harvesting, free email domains, salary mismatches, MLM signals, missing descriptions, excessive caps, WhatsApp numbers. Verdicts: safe / suspicious / likely_scam.
- **Application Quality Scoring** — `qualityScore.ts` with weighted scoring (jobFit 30%, resumeOptimization 20%, companyReachability 15%, competitionLevel 15%, scamRisk 20%). Recommendations: apply_now / optimize_first / review / skip.
- **Per-Job Resume Tailoring** — Forge now generates optimized resume variants for each job: rewrites summary, reorders skills (most relevant first), enhances experience bullets. Validates against original profile to prevent fabrication.
- **Smart Application Strategy** — Archer now classifies applications as priority/standard/skip based on quality scores. Priority jobs get personalized cover letters + networking suggestions. Standard jobs get template approach.
- **Human Behavior Timing Layer** — `humanBehavior.ts` with rate limiting (10/hr, 30/day, 5/company), random delays (30-180s), optimal sending windows (Tue-Thu 9-11AM), and cover letter variation to avoid template detection.
- **Application-Based Skill Gap Analysis** — Sage analyzes actual application history to show: "You applied for 50 PLC jobs. You lack: Siemens TIA Portal (42/50), SCADA (38/50). Current match: 32%. With skills: ~78%."
- **Networking Suggestions** — Post-application networking engine generates LinkedIn connection messages, alumni outreach strategies, and industry meetup recommendations for applied companies.
- **Pipeline Quality Gate** — Orchestrator now scores jobs between Forge and Archer stages. Only `apply_now` jobs proceed to Archer automatically. Low-quality and scam jobs are filtered out.
- **Dashboard Quality Metrics** — New pipeline performance cards on Cortex dashboard: weekly applications, scam jobs blocked, average quality score, interview callbacks.
- **Learning Page Application Insights** — Skill gap cards per job category showing applied count, missing skills with frequency, current vs projected match rates.
- **ResumeVariant Model** — Prisma model for storing per-job tailored resume variants with ATS scores.
- **FollowUp Model** — Prisma model for scheduling post-application follow-ups (5 days after send).
- **Pipeline Stats API** — `/api/agents/pipeline-stats` endpoint for dashboard quality metrics.
- **Skill Gaps API** — `/api/agents/skill-gaps` endpoint for application-based gap analysis.

### Changed
- **Agent minPlan Values** — Fixed 4 agents with incorrect tier assignments: Archer (STARTER → PRO), Atlas (STARTER → PRO), Sage (STARTER → ULTRA), Sentinel (STARTER → ULTRA).
- **Sentinel Agent** — Now performs pre-flight scam check (zero AI cost) before AI quality review. Auto-rejects likely_scam jobs with detailed signals.
- **Scout Agent** — Integrated scam filtering after job discovery. Scam jobs are filtered before reaching downstream agents.
- **Matcher Scoring** — Added scam penalty: suspicious jobs get -15 score, likely_scam get -30 score.
- **Orchestrator Pipeline** — Enhanced with quality gate, per-job resume optimization, networking suggestions, and expanded context tracking (scamJobsFiltered, qualityScores, networkingSuggestions).
- **Agent Context** — Added `scamJobsFiltered`, `qualityScores`, and `networkingSuggestions` fields to shared pipeline context.

### Fixed
- **Plan Gating** — `isAgentAvailable()` was returning `true` for all agents regardless of plan. Now properly compares user plan tier against agent minPlan requirement.

---

## [1.5.0] - 2026-03-07

### Added
- **Cortex Dashboard Navigation** — Cortex AI coach can now navigate between dashboard pages via chat commands (e.g., "open my resume", "go to jobs"). Supports both instant client-side detection and server-side AI-driven navigation.
- **Agent Status System** — Real-time status badges (Working / Idle / Sleeping) for all agents across the sidebar and agent page headers.
- **Agent Activity Log** — Collapsible activity timeline on every agent page showing recent actions with color-coded badges, expandable details, and stagger animations.
- **Personalized Career Story** — AI-generated narrative on the dashboard home that summarizes the user's career journey, skills, and trajectory.
- **User Menu** — Proper upward-opening dropdown menu at sidebar bottom with profile, settings, billing, referral, help, changelog, and logout options.
- **Sentinel Quality Page** — New `/dashboard/quality` page for the Sentinel agent with quality review dashboard, recent reviews, and approval stats.
- **Plan Feature Breakdown** — Billing tab in Settings now shows a detailed list of features included in the user's current plan.

### Changed
- **Sidebar Restructure** — Active/hired agents displayed at top of sidebar; sleeping/non-purchased agents pinned to bottom just above user profile.
- **FloatingCoach (Cortex)** — Moved from dashboard-only to global (root layout) so Cortex appears on all pages. Auth-aware: adapts greetings and quick actions for public vs dashboard contexts.
- **Billing Prices** — Corrected plan prices in Settings billing tab to match actual pricing (Starter $12/mo, Pro $29/mo, Ultra $59/mo).
- **Coach Settings** — Removed editable coach name field; name is now hardcoded to "Cortex". Personality selector remains.

### Removed
- **Keyboard Shortcuts** menu item from User Menu (not yet implemented).
- **Coach Name Input** from Settings AI Coach tab.

### Fixed
- **Sentinel 404** — Fixed Sentinel agent `linkedPage` in registry pointing to non-existent route. Now correctly links to `/dashboard/quality`.

---

## [1.4.0] - 2026-03-06

### Added
- **Orbital Agent Layout** — Chapter Two assembly with 6 agents orbiting around Cortex in a circular layout with hover-wake animations and tooltips.
- **Agent Avatar System** — Unique gradient-based avatars for each AI agent (Scout, Forge, Archer, Atlas, Sage, Sentinel) with sleeping/pulse states.
- **Cortex Avatar** — Central AI brain avatar with animated pulse ring and gradient styling.
- **Journey Timeline** — Chapter Four career journey visualization with milestone markers and progress indicators.
- **Scrolling Review Wall** — Infinite-scroll testimonial wall with frosted glass cards and stagger animations.
- **Dashboard Agent Cards** — 6-card grid with agent status, roles, and direct navigation to each agent page.

### Changed
- **Website Redesign** — Full storytelling landing page with chapters, orbital layouts, and cinematic transitions.
- **Dashboard Hero Header** — Centered layout with greeting, agent count, Run All button, and Hire Agents CTA.

### Fixed
- **Orbital Centering** — Resolved Framer Motion transform conflicts with CSS transforms using flexbox centering wrappers.
- **Agent Tooltip Opacity** — Fixed tooltip inheriting parent opacity on sleeping agents using named Tailwind groups.
- **Cortex Orbit Position** — Centered Cortex in orbital layout using absolute positioning with transform translate.

---

## [1.3.0] - 2026-03-05

### Added
- **AI Coach (Cortex)** — Floating chat widget with personality customization, quick actions, and context-aware responses.
- **Regional Pricing** — Geo-based pricing for 10+ regions including India, UK, Canada, UAE, Singapore, Australia, Netherlands, Philippines, and Africa.
- **Student Discounts** — Regional student discount rates (35-60% off) with .edu email verification.
- **Credit Packs** — One-time purchase AI credit bundles (100, 500, 1000 credits) with regional pricing.
- **Coupon System** — Coupon code redemption for plan upgrades in Settings billing tab.
- **Referral Program** — Invite friends system with unique referral links, stats tracking, and reward tiers.

### Changed
- **Pricing Page** — Team bundle naming (Starter Duo, Job Hunter Pack, Full Squad) with feature comparisons.

---

## [1.2.0] - 2026-03-04

### Added
- **Onboarding Flow** — Multi-step onboarding wizard collecting career profile, skills, experience, and goals.
- **Career Twin (Skill Snapshot)** — AI-generated skill assessment stored per user with target role mapping.
- **Agent Registry** — Centralized agent definitions with IDs, roles, colors, avatars, plan requirements, and linked pages.
- **Agent Permissions** — Plan-gated agent access system with tier hierarchy (BASIC < STARTER < PRO < ULTRA).

---

## [1.1.0] - 2026-03-03

### Added
- **Authentication** — NextAuth.js integration with Google OAuth and credentials provider.
- **Dashboard Layout** — Sidebar navigation with agent links, mobile responsive drawer, and plan badges.
- **Settings Page** — Tabbed settings with Profile, Billing, Referral, AI Coach, Notifications, and Privacy sections.
- **Stripe Integration** — Subscription billing with monthly/yearly plans, billing portal, and webhook handling.

---

## [1.0.0] - 2026-03-02

### Added
- Initial release of jobTED AI — Full Career Operating System by OFORO AI.
- Next.js 14 App Router with TypeScript and Tailwind CSS.
- Prisma ORM with database schema for users, sessions, skills, and career data.
- SEO optimization with structured data, meta tags, and sitemap generation.
- Landing page with hero section, features overview, and pricing comparison.
