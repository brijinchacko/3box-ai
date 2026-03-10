# 3BOX AI — Radical Simplification Plan

## Current State: 75 pages, 100+ API routes, 13 dashboard pages, 7-step onboarding
## Target State: Minimal agent platform — hire agents, assign tasks, get results

---

## Core Concept

The app should feel like hiring a team of AI workers:
1. **See your agents** — who's available, who's working
2. **Hire/activate an agent** — turn them on
3. **Give them a task** — configure what they should do
4. **See results** — what they accomplished
5. **Pipeline or manual** — auto-run the full team, or run each one individually

---

## Phase 1: Simplify Landing Page

**Current:** Complex multi-section page with conversational onboarding, scrolling review walls, agent orbit animations, Hindi translations, salary data, comparison sections, FAQ, resume previews

**New:** Clean single-purpose page

### New Landing Page Structure:
```
[Navbar: Logo | Get Started]

[Hero]
  "AI agents that find and apply for jobs — while you sleep."
  [Upload Resume] [Pick Target Role] [Start Free]

[3-Step How It Works]
  1. Upload your resume & set your target role
  2. Your AI agents search, tailor, and apply
  3. Wake up to interviews in your inbox

[Agent Team Preview]
  6 agent cards (Scout, Forge, Archer, Atlas, Sage, Sentinel)
  Each: avatar + name + one-line role

[Simple CTA]
  "Start free — 20 job applications, no credit card"

[Footer]
```

### Remove from landing:
- Conversational onboarding wizard (move to dashboard)
- Scrolling review walls
- Agent orbit animation
- Salary calculator
- Hindi translations
- Resume preview section
- Complex FAQ (keep 3-4 simple ones)
- PlacementCellBanner
- LiveApplicationCounter (fake data removed already)

### Files to modify:
- `src/app/LandingPageClient.tsx` — rewrite (currently 2000+ lines → target ~300)
- `src/components/layout/Navbar.tsx` — simplify nav items

---

## Phase 2: Simplify Onboarding

**Current:** 7-step wizard (resume → name → role → experience → status → education → skills → review) with agent config presets

**New:** 2-step quick start

### New Onboarding:
```
Step 1: Upload resume (optional) + enter target role
Step 2: Done → redirect to dashboard
```

- If resume uploaded → AI extracts name, skills, experience automatically
- If skipped → ask name + target role only
- Everything else is optional, configurable later in settings
- Remove agent scheduling from onboarding entirely

### Files to modify:
- `src/app/dashboard/onboarding/page.tsx` — rewrite to 2-step flow
- `src/app/get-started/` — redirect to dashboard/onboarding

---

## Phase 3: Simplify Dashboard Layout

**Current:** Sidebar with agent links + top bar (journey bar, token counter, automation mode, notifications) + complex main content

**New:** Clean minimal layout

### New Layout:
```
┌──────────────────────────────────────────────┐
│ [Logo]              [Settings] [Profile]     │
├────────┬─────────────────────────────────────┤
│        │                                     │
│ Cortex │  Main Content Area                  │
│ ────── │                                     │
│ Scout  │  (Agent workspace / Overview)       │
│ Forge  │                                     │
│ Archer │                                     │
│ Atlas  │                                     │
│ Sage   │                                     │
│Sentinel│                                     │
│        │                                     │
│ ────── │                                     │
│[Pipeln]│                                     │
│ ON/OFF │                                     │
└────────┴─────────────────────────────────────┘
```

### Remove from layout:
- CareerJourneyBar (progress tracker)
- GuidedWorkflow (step progress)
- TokenCounter from top bar (move to settings)
- NotificationCenter bell icon (activity shows in dashboard)
- AutomationModeSelector dropdown (replace with simple pipeline toggle)
- BackgroundTaskBanner

### Sidebar changes:
- Remove "Active Agents" / "Available to Hire" grouping
- Just list all 6 agents + Cortex
- Locked agents show lock icon, click → pricing
- Add pipeline toggle at bottom: "Pipeline: ON/OFF"

### Files to modify:
- `src/app/dashboard/layout.tsx` — rewrite sidebar and top bar
- Remove or archive: `CareerJourneyBar.tsx`, `GuidedWorkflow.tsx`, `TokenCounter.tsx`, `NotificationCenter.tsx`, `BackgroundTaskBanner.tsx`

---

## Phase 4: Redesign Dashboard Home

**Current:** Hero greeting + next step prompt + command center card + pipeline metrics + activity feed + personalized story + deploy scout action + 6 agent cards

**New:** Simple agent overview

### New Dashboard Home (`/dashboard`):
```
Good morning, [Name].

[Pipeline Status Bar]
  Pipeline: ON ● Scout runs every 12h | Forge on-demand | Archer auto-applies
  [Configure Pipeline]

[Your Agent Team — 6 cards in 2x3 grid]
  Each card:
  ┌─────────────────────────┐
  │ [Avatar] Scout          │
  │ Job Hunter              │
  │                         │
  │ Status: Found 12 jobs   │
  │ Last run: 2h ago        │
  │                         │
  │ [Run Now]               │
  └─────────────────────────┘

[Recent Activity — last 10 items]
  Scout found 12 matching jobs — 2h ago
  Forge optimized resume for "Sr. Engineer at Stripe" — 3h ago
  Archer sent 5 applications — 5h ago
```

### Remove:
- PersonalizedStory component
- Next step prompt cards
- Command center card
- Pipeline metrics grid (weeklyApps, scamBlocked etc.)
- "Deploy Scout" quick action
- "Hire Agents" button

### Files to modify:
- `src/app/dashboard/page.tsx` — rewrite
- Remove: `PersonalizedStory.tsx`

---

## Phase 5: Consolidate Dashboard Pages

**Current 13 pages → New 7 pages:**

| Current | New | Change |
|---------|-----|--------|
| `/dashboard` | `/dashboard` | Simplified overview |
| `/dashboard/onboarding` | `/dashboard/onboarding` | 2-step quickstart |
| `/dashboard/jobs` | `/dashboard/scout` | Scout workspace |
| `/dashboard/resume` | `/dashboard/forge` | Forge workspace |
| `/dashboard/applications` | `/dashboard/archer` | Archer workspace |
| `/dashboard/interview` | `/dashboard/atlas` | Atlas workspace |
| `/dashboard/assessment` | Merge into Sage | — |
| `/dashboard/career-plan` | Merge into dashboard overview | — |
| `/dashboard/learning` | `/dashboard/sage` | Sage workspace |
| `/dashboard/quality` | `/dashboard/sentinel` | Sentinel workspace |
| `/dashboard/portfolio` | Move to settings | — |
| `/dashboard/agents` | Remove (agents managed from their own pages) | — |
| `/dashboard/settings` | `/dashboard/settings` | Keep, add profile/resume/pipeline config |

### Each Agent Workspace Pattern:
```
[Agent Header: Avatar + Name + Role + Status]

[Configuration Panel — collapsible]
  Agent-specific settings
  (Scout: target roles, locations, platforms)
  (Forge: resume template, optimization level)
  (Archer: max applications, channels)

[Action Area]
  [Run Agent] button
  Current task status / progress

[Results Area]
  Agent output (jobs found, resume optimized, applications sent, etc.)
  Paginated, sortable
```

### Files to create/modify:
- `src/app/dashboard/scout/page.tsx` — move from `/jobs`
- `src/app/dashboard/forge/page.tsx` — move from `/resume`
- `src/app/dashboard/archer/page.tsx` — move from `/applications`
- `src/app/dashboard/atlas/page.tsx` — move from `/interview`
- `src/app/dashboard/sage/page.tsx` — merge assessment + learning
- `src/app/dashboard/sentinel/page.tsx` — move from `/quality`

---

## Phase 6: Pipeline Control (Simple Toggle)

**Current:** 3 automation modes (Copilot/Autopilot/Full-Agent) with complex mode selector

**New:** Simple ON/OFF pipeline toggle

### Pipeline ON:
- Scout runs on schedule (configurable interval)
- Forge auto-optimizes resume for found jobs
- Sentinel auto-reviews quality
- Archer auto-applies to approved jobs
- User configures: interval, max apps per run, min match score

### Pipeline OFF:
- Each agent runs manually via "Run Now" button
- User triggers Scout → reviews results → triggers Forge → etc.
- Full control, step by step

### Configuration (in Settings or Pipeline config page):
```
Pipeline Mode: [ON] / [OFF]

When ON:
  Scout searches every: [12h ▼]
  Min match score: [60% ▼]
  Max applications per run: [10 ▼]
  Auto-apply channels: [✓ Job portals] [✓ Cold email]
```

### Files to modify:
- `src/components/dashboard/AutomationModeSelector.tsx` — replace with PipelineToggle
- `src/lib/agents/orchestrator.ts` — simplify to on/off mode

---

## Phase 7: Simplify Navigation & Marketing Pages

### Keep (accessible but not prominent):
- `/pricing` — keep as-is
- `/login`, `/signup` — keep as-is
- `/tools/*` — keep all 17 tools (SEO value), just remove from main nav
- `/blog/*` — keep (SEO value)
- `/help` — keep
- `/agents` — redirect to `/dashboard`
- `/about`, `/contact`, `/privacy`, `/terms`, `/security` — keep

### Remove from navbar:
- Tools dropdown
- Agents link
- Blog link
- Keep only: Logo | Pricing | Get Started | Login

### Files to modify:
- `src/components/layout/Navbar.tsx` — simplify
- `src/components/layout/Footer.tsx` — keep links but simplify

---

## Implementation Order

### Sprint 1 (Landing + Onboarding): ~2 sessions
1. Rewrite `LandingPageClient.tsx` — minimal hero + 3-step + agents + CTA
2. Rewrite `onboarding/page.tsx` — 2-step quickstart
3. Simplify `Navbar.tsx`

### Sprint 2 (Dashboard Layout + Home): ~2 sessions
4. Rewrite `dashboard/layout.tsx` — minimal sidebar + clean top bar
5. Rewrite `dashboard/page.tsx` — agent grid + activity feed
6. Add pipeline toggle component

### Sprint 3 (Agent Workspaces): ~3 sessions
7. Create Scout workspace (`/dashboard/scout`)
8. Create Forge workspace (`/dashboard/forge`)
9. Create Archer workspace (`/dashboard/archer`)
10. Create Atlas workspace (`/dashboard/atlas`)
11. Create Sage workspace (`/dashboard/sage`)
12. Create Sentinel workspace (`/dashboard/sentinel`)

### Sprint 4 (Polish + Cleanup): ~1 session
13. Remove unused components and pages
14. Update redirects (old routes → new routes)
15. Final testing and deployment

---

## Design Principles

1. **One screen, one purpose** — each page does one thing
2. **Agent-first** — the agents are the product, not the features
3. **Show, don't explain** — results speak louder than descriptions
4. **Progressive disclosure** — show basics first, details on demand
5. **No dead ends** — every screen has a clear next action
6. **Minimal chrome** — less UI, more content
