const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  TableOfContents,
} = require("docx");

// ─── Color palette ──────────────────────────────────────────────────────────
const BRAND_BLUE = "1459E1";
const BRAND_DARK = "142857";
const NEON_BLUE = "00D4FF";
const NEON_PURPLE = "A855F7";
const GRAY_60 = "666666";
const GRAY_40 = "999999";
const GRAY_BG = "F0F4FA";
const CODE_BG = "F5F5F5";
const HEADER_BG = "1459E1";
const WHITE = "FFFFFF";
const BLACK = "000000";

// ─── Borders ────────────────────────────────────────────────────────────────
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// ─── Helpers ────────────────────────────────────────────────────────────────
function p(text, opts = {}) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(new TextRun({ text, ...opts }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === "string") runs.push(new TextRun({ text: t }));
      else runs.push(new TextRun(t));
    });
  }
  return new Paragraph({
    children: runs,
    spacing: { after: opts.spacingAfter || 120 },
    ...(opts.alignment ? { alignment: opts.alignment } : {}),
    ...(opts.heading ? { heading: opts.heading } : {}),
    ...(opts.indent ? { indent: opts.indent } : {}),
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: BRAND_DARK })],
    spacing: { before: 360, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: BRAND_BLUE, space: 4 } },
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: BRAND_BLUE })],
    spacing: { before: 280, after: 160 },
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 22, font: "Arial", color: BRAND_DARK })],
    spacing: { before: 200, after: 120 },
  });
}

function bodyText(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, font: "Arial", color: "333333" })],
    spacing: { after: 120, line: 276 },
  });
}

function boldBodyText(label, text) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 20, font: "Arial", color: "333333" }),
      new TextRun({ text, size: 20, font: "Arial", color: "333333" }),
    ],
    spacing: { after: 120, line: 276 },
  });
}

function bullet(text, level = 0) {
  const children = [];
  if (typeof text === "string") {
    // Handle bold prefix like "**Text:** rest"
    const boldMatch = text.match(/^\*\*(.+?)\*\*\s*(.*)$/);
    if (boldMatch) {
      children.push(new TextRun({ text: boldMatch[1], bold: true, size: 20, font: "Arial", color: "333333" }));
      if (boldMatch[2]) children.push(new TextRun({ text: " " + boldMatch[2], size: 20, font: "Arial", color: "333333" }));
    } else {
      children.push(new TextRun({ text, size: 20, font: "Arial", color: "333333" }));
    }
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === "string") children.push(new TextRun({ text: t, size: 20, font: "Arial" }));
      else children.push(new TextRun({ ...t, size: t.size || 20, font: t.font || "Arial" }));
    });
  }
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children,
    spacing: { after: 60, line: 276 },
  });
}

function codeBlock(lines) {
  const arr = Array.isArray(lines) ? lines : lines.split("\n");
  return arr.map((line, i) =>
    new Paragraph({
      children: [new TextRun({ text: line || " ", font: "Courier New", size: 16, color: "333333" })],
      spacing: { after: 0 },
      shading: { type: ShadingType.CLEAR, fill: CODE_BG },
      indent: { left: 360 },
      ...(i === 0 ? { spacing: { before: 80, after: 0 } } : {}),
      ...(i === arr.length - 1 ? { spacing: { after: 120 } } : {}),
    })
  );
}

function makeTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        borders: cellBorders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({
          children: [new TextRun({ text: h, bold: true, size: 18, font: "Arial", color: WHITE })],
          spacing: { after: 0 },
        })],
      })
    ),
  });
  const dataRows = rows.map(row =>
    new TableRow({
      children: row.map((cell, i) =>
        new TableCell({
          borders: cellBorders,
          width: { size: colWidths[i], type: WidthType.DXA },
          margins: { top: 40, bottom: 40, left: 100, right: 100 },
          children: [new Paragraph({
            children: [new TextRun({ text: String(cell), size: 18, font: "Arial", color: "333333" })],
            spacing: { after: 0 },
          })],
        })
      ),
    })
  );
  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

function spacer(pts = 120) {
  return new Paragraph({ children: [], spacing: { after: pts } });
}

// ─── BUILD DOCUMENT ─────────────────────────────────────────────────────────
const children = [];

// ── TITLE PAGE ──────────────────────────────────────────────────────────────
children.push(spacer(600));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 120 },
  children: [new TextRun({ text: "3BOX AI", size: 72, bold: true, font: "Arial", color: BRAND_BLUE })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 40 },
  children: [new TextRun({ text: "Product Specification Document", size: 36, font: "Arial", color: BRAND_DARK })],
}));
children.push(spacer(200));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 60 },
  border: { top: { style: BorderStyle.SINGLE, size: 2, color: BRAND_BLUE, space: 8 }, bottom: { style: BorderStyle.SINGLE, size: 2, color: BRAND_BLUE, space: 8 } },
  children: [new TextRun({ text: "Full Career Operating System", size: 28, font: "Arial", color: NEON_PURPLE, italics: true })],
}));
children.push(spacer(300));

const metaInfo = [
  ["Version", "1.6.0"],
  ["Date", "March 2026"],
  ["Company", "OFORO AI"],
  ["URL", "https://3box.ai"],
];
metaInfo.forEach(([label, value]) => {
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [
      new TextRun({ text: label + ": ", bold: true, size: 22, font: "Arial", color: GRAY_60 }),
      new TextRun({ text: value, size: 22, font: "Arial", color: "333333" }),
    ],
  }));
});

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── TABLE OF CONTENTS ───────────────────────────────────────────────────────
children.push(new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: "Arial", color: BRAND_DARK })],
  spacing: { after: 200 },
}));
children.push(new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 1: PRODUCT OVERVIEW ─────────────────────────────────────────────
children.push(heading1("1. Product Overview"));

children.push(heading2("1.1 Mission"));
children.push(bodyText("3BOX AI is a full Career Operating System that automates the entire job search lifecycle \u2014 from discovering opportunities to sending applications, optimizing resumes, preparing for interviews, and tracking career growth. It uses a team of six specialized AI agents coordinated by a central intelligence called Cortex."));

children.push(heading2("1.2 Core Value Proposition"));
children.push(bullet([{ text: "Automated Job Discovery: ", bold: true }, "Scans 6+ job platforms simultaneously"]));
children.push(bullet([{ text: "ATS-Optimized Resumes: ", bold: true }, "AI-tailored resumes for each application"]));
children.push(bullet([{ text: "Auto-Apply Pipeline: ", bold: true }, "End-to-end application sending (portal + cold email)"]));
children.push(bullet([{ text: "Interview Preparation: ", bold: true }, "Company-specific question generation and practice"]));
children.push(bullet([{ text: "Skill Gap Analysis: ", bold: true }, "Personalized learning paths based on market trends"]));
children.push(bullet([{ text: "Quality Assurance: ", bold: true }, "Pre-submission review to prevent errors and spam"]));

children.push(heading2("1.3 Target Users"));
children.push(bullet("Active job seekers"));
children.push(bullet("Career changers"));
children.push(bullet("Fresh graduates"));
children.push(bullet("Professionals seeking upward mobility"));
children.push(bullet("Students entering the workforce"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 2: TECHNICAL ARCHITECTURE ───────────────────────────────────────
children.push(heading1("2. Technical Architecture"));

children.push(heading2("2.1 System Architecture"));
children.push(bodyText("3BOX AI is a monolithic Next.js 14 application with modular architecture designed for future service extraction."));
children.push(...codeBlock([
  "Client Layer:    Next.js App Router + React 18 + Framer Motion + Zustand + Radix UI",
  "API Layer:       Next.js Route Handlers (REST) + NextAuth JWT Sessions + Zod Validation",
  "Service Layer:   AI Service (OpenRouter) | Agent Orchestrator | Resume Engine | Email Service",
  "Data Layer:      PostgreSQL (Prisma ORM) | Redis (BullMQ Queues + Caching) | Cloudinary",
]));

children.push(heading2("2.2 AI Integration Architecture"));
children.push(bodyText("Request flow: User Request \u2192 API Route \u2192 Rate Limiter \u2192 PII Redactor \u2192 Model Router \u2192 OpenRouter API"));
children.push(spacer(80));
children.push(heading3("Model Tiers (mapped to plan)"));
children.push(makeTable(
  ["Plan", "AI Model", "Tier"],
  [
    ["BASIC (Free)", "Arcee Trinity", "Free"],
    ["STARTER", "GPT-4o Mini", "Standard"],
    ["PRO", "DeepSeek Chat", "Reasoning"],
    ["ULTRA", "Claude Sonnet", "Premium"],
  ],
  [2400, 3600, 3360]
));
children.push(spacer(80));
children.push(bullet("Automatic fallback cascade if preferred model fails"));
children.push(bullet("PII redaction applied before logging any AI interactions"));
children.push(bullet("Demo mode simulation with full mock responses for all features"));
children.push(bullet("OFORO internal emails (@oforo.ai, @oforoai.com) automatically receive ULTRA access with unlimited credits"));

children.push(heading2("2.3 Request Flow"));
children.push(...codeBlock([
  "Browser \u2192 Next.js Middleware (geo cookie + referral tracking)",
  "       \u2192 App Router (page or API route)",
  "       \u2192 NextAuth session validation (for protected routes)",
  "       \u2192 Zod schema validation (for API inputs)",
  "       \u2192 Business logic / AI service call",
  "       \u2192 Prisma ORM \u2192 PostgreSQL",
  "       \u2192 JSON response",
]));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 3: TECHNOLOGY STACK ─────────────────────────────────────────────
children.push(heading1("3. Technology Stack"));

children.push(heading2("3.1 Core Framework"));
children.push(makeTable(
  ["Component", "Technology", "Version"],
  [
    ["Framework", "Next.js (App Router)", "14.2.x"],
    ["Runtime", "React", "18.3.x"],
    ["Language", "TypeScript", "5.4.x"],
    ["ORM", "Prisma Client", "5.14.x"],
    ["Database", "PostgreSQL", "\u2014"],
    ["Cache/Queue", "Redis (ioredis + BullMQ)", "5.10.x / 5.70.x"],
  ],
  [2400, 4200, 2760]
));

children.push(heading2("3.2 Frontend"));
children.push(makeTable(
  ["Library", "Purpose"],
  [
    ["Framer Motion 11.2", "Page transitions, animations"],
    ["Radix UI", "Accessible primitives (dialog, dropdown, select, tabs, toast, etc.)"],
    ["Tailwind CSS 3.4", "Utility-first styling"],
    ["Recharts 2.12", "Dashboard charts and analytics"],
    ["Lucide React", "Icon system"],
    ["Zustand 4.5", "Client-side state management"],
    ["class-variance-authority", "Component variant styling"],
    ["tailwind-merge + clsx", "Class name utilities"],
  ],
  [3600, 5760]
));

children.push(heading2("3.3 Backend Services"));
children.push(makeTable(
  ["Library", "Purpose"],
  [
    ["NextAuth 4.24", "Authentication (Google OAuth + credentials)"],
    ["Stripe 15.x", "Payment processing, subscriptions, webhooks"],
    ["Resend 6.9", "Transactional email delivery"],
    ["Cloudinary 2.9", "Image/avatar upload and CDN"],
    ["BullMQ 5.70", "Job queues for async agent operations"],
    ["ioredis 5.10", "Redis client for caching and queue backend"],
    ["bcryptjs", "Password hashing"],
    ["nanoid", "Unique ID generation"],
  ],
  [3600, 5760]
));

children.push(heading2("3.4 Document Processing"));
children.push(makeTable(
  ["Library", "Purpose"],
  [
    ["@react-pdf/renderer 3.4", "PDF resume generation (client-side)"],
    ["pdf-parse 2.4", "PDF resume parsing/text extraction"],
    ["mammoth 1.11", "DOCX resume parsing"],
    ["imapflow 1.2", "IMAP email reading (for reply tracking)"],
  ],
  [3600, 5760]
));

children.push(heading2("3.5 Validation & Utilities"));
children.push(makeTable(
  ["Library", "Purpose"],
  [
    ["Zod 3.23", "Runtime schema validation"],
    ["date-fns 3.6", "Date formatting and manipulation"],
    ["react-hot-toast", "Toast notifications"],
  ],
  [3600, 5760]
));

children.push(heading2("3.6 Design System"));
children.push(heading3("Color Palette"));
children.push(bullet([{ text: "Brand: ", bold: true }, "Blue spectrum (#eef7ff to #142857)"]));
children.push(bullet([{ text: "Neon accents: ", bold: true }, "Blue (#00d4ff), Purple (#a855f7), Green (#00ff88), Pink (#ff0080), Orange (#ff6b00)"]));
children.push(bullet([{ text: "Surfaces: ", bold: true }, "Dark mode only \u2014 #0a0a0f (base) through #2d2d50"]));
children.push(heading3("Typography"));
children.push(bullet([{ text: "Sans: ", bold: true }, "Inter, system-ui"]));
children.push(bullet([{ text: "Display: ", bold: true }, "Cal Sans, Inter"]));
children.push(bullet([{ text: "Mono: ", bold: true }, "JetBrains Mono"]));
children.push(heading3("Animations"));
children.push(bodyText("glow, float, pulse-slow, slide-up, slide-down, fade-in, gradient (all defined in Tailwind config)"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 4: AI AGENT SYSTEM ──────────────────────────────────────────────
children.push(heading1("4. AI Agent System"));

children.push(heading2("4.1 Cortex \u2014 The Coordinator"));
children.push(bodyText("Cortex is the central intelligence that orchestrates all six specialist agents."));
children.push(bullet([{ text: "Role: ", bold: true }, "\"The Ninja Who Never Sleeps\""]));
children.push(bullet([{ text: "Function: ", bold: true }, "Coordinates agent sequencing, manages pipeline state, handles credit tracking"]));
children.push(bullet([{ text: "Colors: ", bold: true }, "Blue (#00d4ff) to Purple (#a855f7) gradient"]));

children.push(heading2("4.2 Agent Definitions"));

// Scout
children.push(heading3("Agent Scout \u2014 Job Hunter"));
children.push(bullet([{ text: "ID: ", bold: true }, "scout | Min Plan: STARTER"]));
children.push(bullet([{ text: "File: ", bold: true }, "src/lib/agents/scout.ts"]));
children.push(bullet([{ text: "Capabilities: ", bold: true }, "Multi-source job scanning, match scoring, smart filtering, exclusion rules"]));
children.push(bullet([{ text: "Platforms: ", bold: true }, "Naukri, LinkedIn, Indeed, Google Jobs, Glassdoor, company pages (6+ sources)"]));
children.push(bullet([{ text: "Token Cost: ", bold: true }, "2 tokens per platform (6 platforms = 12 tokens per full scan)"]));
children.push(heading3("Scout Key Functions"));
children.push(bullet([{ text: "runScout() ", bold: true }, "\u2014 Core discovery: calls discoverJobs(), applies match scoring, filters scams, deduplicates"]));
children.push(bullet([{ text: "persistScoutJobs() ", bold: true }, "\u2014 Saves discovered jobs to ScoutJob table with deduplication keys"]));
children.push(bullet([{ text: "runIndependentScout() ", bold: true }, "\u2014 Standalone version for cron scheduling"]));

// Forge
children.push(heading3("Agent Forge \u2014 Resume Optimizer"));
children.push(bullet([{ text: "ID: ", bold: true }, "forge | Min Plan: STARTER"]));
children.push(bullet([{ text: "File: ", bold: true }, "src/lib/agents/forge.ts"]));
children.push(bullet([{ text: "Capabilities: ", bold: true }, "ATS keyword optimization, job-specific variants, score analysis, section enhancement"]));
children.push(bullet([{ text: "Operating Modes: ", bold: true }, "on_demand, per_job, base_only"]));
children.push(bullet([{ text: "Token Costs: ", bold: true }, "Generate: 3, Enhance: 2, Analyze: 2, Auto-generate: 5, Per-job rewrite: 2"]));
children.push(heading3("Forge Key Functions"));
children.push(bullet([{ text: "analyzeResumeForJob() ", bold: true }, "\u2014 AI-powered analysis producing ATS score (0-100), keyword gaps, suggestions"]));
children.push(bullet([{ text: "generateOptimizedResume() ", bold: true }, "\u2014 Creates full job-specific resume variant (never adds skills candidate lacks)"]));
children.push(bullet([{ text: "verifyResumeReadiness() ", bold: true }, "\u2014 Two-phase verification: Phase 1 local checks (zero AI cost); Phase 2 ATS scoring"]));
children.push(bullet([{ text: "runIndependentForge() ", bold: true }, "\u2014 Standalone cron mode"]));

// Archer
children.push(heading3("Agent Archer \u2014 Application Agent"));
children.push(bullet([{ text: "ID: ", bold: true }, "archer | Min Plan: PRO"]));
children.push(bullet([{ text: "File: ", bold: true }, "src/lib/agents/archer.ts"]));
children.push(bullet([{ text: "Capabilities: ", bold: true }, "AI cover letters, portal applications, cold email outreach, application tracking"]));
children.push(bullet([{ text: "Application Channels: ", bold: true }, "ATS API (highest) \u2192 Cold Email \u2192 Portal Queue (fallback)"]));
children.push(bullet([{ text: "ATS Types: ", bold: true }, "Greenhouse, Lever, Workday, generic"]));
children.push(bullet([{ text: "Token Costs: ", bold: true }, "Cover letter: 2, Application send: 1"]));
children.push(heading3("Archer Key Functions"));
children.push(bullet([{ text: "applyToJob() ", bold: true }, "\u2014 Single job application with multi-channel routing"]));
children.push(bullet([{ text: "applyToJobsBatch() ", bold: true }, "\u2014 Batch mode for 100+ applications/day with parallel processing"]));
children.push(bullet([{ text: "determineApplicationStrategy() ", bold: true }, "\u2014 Quality scoring: Priority (80+), Standard (60-79), Skip (<60)"]));
children.push(heading3("Cover Letter Tiering"));
children.push(bullet([{ text: "priority ", bold: true }, "(matchScore >= 80): Full AI-powered, personalized"]));
children.push(bullet([{ text: "standard ", bold: true }, "(matchScore 60-79): Template skeleton + AI fill-in"]));
children.push(bullet([{ text: "quick ", bold: true }, "(matchScore < 60): Instant template, no AI call"]));
children.push(heading3("Human Behavior Simulation"));
children.push(bullet("Application delays: 10-30s base (normal), 30-180s (stealth mode)"));
children.push(bullet("Rate limits: 15/hour, 100/day, 5/company/day"));
children.push(bullet("Optimal timing: Tue-Thu 9-11 AM in target timezone"));
children.push(bullet("Cover letter uniquification: Deterministic phrase substitutions using job ID as seed"));

// Atlas
children.push(heading3("Agent Atlas \u2014 Interview Coach"));
children.push(bullet([{ text: "ID: ", bold: true }, "atlas | Min Plan: PRO"]));
children.push(bullet([{ text: "File: ", bold: true }, "src/lib/agents/atlas.ts"]));
children.push(bullet([{ text: "Capabilities: ", bold: true }, "Company-specific questions, practice scenarios, JD analysis, feedback loops"]));
children.push(bullet([{ text: "Key Function: ", bold: true }, "prepareInterview() \u2014 Generates company insights, 5 technical + 5 behavioral + 3 role-specific questions, 4 tips"]));

// Sage
children.push(heading3("Agent Sage \u2014 Skill Trainer"));
children.push(bullet([{ text: "ID: ", bold: true }, "sage | Min Plan: ULTRA"]));
children.push(bullet([{ text: "File: ", bold: true }, "src/lib/agents/sage.ts"]));
children.push(bullet([{ text: "Capabilities: ", bold: true }, "Skill gap analysis, learning recommendations, growth tracking, market trend analysis"]));
children.push(bullet([{ text: "Key Functions: ", bold: true }, "analyzeSkillGaps(), generateApplicationBasedGapAnalysis()"]));

// Sentinel
children.push(heading3("Agent Sentinel \u2014 Quality Reviewer"));
children.push(bullet([{ text: "ID: ", bold: true }, "sentinel | Min Plan: ULTRA"]));
children.push(bullet([{ text: "File: ", bold: true }, "src/lib/agents/sentinel.ts"]));
children.push(bullet([{ text: "Capabilities: ", bold: true }, "Quality scoring, fabrication detection, relevance check, spam prevention"]));
children.push(bullet([{ text: "Key Functions: ", bold: true }, "reviewApplication() (scam check + AI review), verifyJobAlignment() (batch alignment)"]));

children.push(heading2("4.3 Automation Modes"));
children.push(makeTable(
  ["Mode", "Label", "Description"],
  [
    ["copilot", "Manual / You Decide", "User assigns tasks one-by-one. Full control over every action."],
    ["autopilot", "Co-Pilot / Recommended", "Agents work proactively but ask for approval before every action."],
    ["full-agent", "Autopilot / Fully Autonomous", "Agents handle everything end-to-end with zero intervention."],
  ],
  [2000, 3000, 4360]
));

children.push(heading2("4.4 Agent Pipeline Flow"));
children.push(...codeBlock([
  "Scout (discover jobs) \u2192 Forge (optimize resume per job) \u2192 Archer (send applications)",
  "                                                              |",
  "                             Atlas (interview prep) \u2190\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
  "                             Sage (skill gaps) \u2190\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
  "                             Sentinel (quality review) \u2190\u2500\u2500\u2500\u2500\u2518",
]));
children.push(heading3("ScoutJob Status Progression"));
children.push(...codeBlock([
  "NEW \u2192 FORGE_PENDING \u2192 FORGE_READY \u2192 READY \u2192 APPLYING \u2192 APPLIED",
  "                                        \u2514\u2192 SKIPPED",
  "                                        \u2514\u2192 EXPIRED (30-day TTL)",
]));

children.push(heading2("4.5 Agent Access by Plan"));
children.push(makeTable(
  ["Plan", "Agents Available", "Count"],
  [
    ["BASIC", "None", "0"],
    ["STARTER", "Scout, Forge", "2"],
    ["PRO", "Scout, Forge, Archer, Atlas", "4"],
    ["ULTRA", "All 6 agents", "6"],
  ],
  [2000, 5360, 2000]
));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 5: DATABASE SCHEMA ──────────────────────────────────────────────
children.push(heading1("5. Database Schema"));

children.push(heading2("5.1 Enums"));
children.push(makeTable(
  ["Enum", "Values"],
  [
    ["PlanTier", "BASIC, STARTER, PRO, ULTRA"],
    ["SubscriptionStatus", "ACTIVE, PAST_DUE, CANCELED, TRIALING, INCOMPLETE"],
    ["ReferralStatus", "PENDING, ACTIVATED, REWARDED, EXPIRED"],
    ["EmailType", "WELCOME, OTP_LOGIN, OTP_SIGNUP, EMAIL_VERIFIED, ONBOARDING_DAY2/5/7, UPGRADE_NUDGE, CREDIT_LOW, WEEKLY_DIGEST, REFERRAL_INVITE, PASSWORD_RESET, SUBSCRIPTION_CONFIRM/CANCELED, PAYMENT_FAILED, ACCOUNT_ACTIVITY"],
    ["PostStatus", "DRAFT, PUBLISHED, ARCHIVED"],
    ["AssessmentStatus", "IN_PROGRESS, COMPLETED, EXPIRED"],
    ["ApplicationStatus", "QUEUED, APPLIED, EMAILED, VIEWED, INTERVIEW, OFFER, REJECTED, WITHDRAWN"],
    ["ScoutJobStatus", "NEW, FORGE_PENDING, FORGE_READY, READY, APPLYING, APPLIED, SKIPPED, EXPIRED"],
  ],
  [3000, 6360]
));

children.push(heading2("5.2 Models Summary"));

const modelGroups = [
  {
    title: "Authentication & Users",
    models: [
      ["Account", "OAuth provider accounts", "provider, providerAccountId, access_token"],
      ["Session", "Active user sessions", "sessionToken, expires"],
      ["VerificationToken", "Email verification tokens", "identifier, token, expires"],
      ["OtpToken", "OTP codes for login/signup/reset", "email, code, type, attempts, used"],
      ["User", "Core user record", "email, plan, stripeCustomerId, aiCreditsUsed, aiCreditsLimit, dailyAppsUsed"],
    ],
  },
  {
    title: "Billing & Subscriptions",
    models: [
      ["Subscription", "Stripe subscription tracking", "stripeSubId, plan, interval, status"],
      ["CreditPurchase", "One-time token credit purchases", "credits, amountPaid, stripePaymentId"],
      ["Coupon", "Reusable discount/upgrade codes", "code, plan, maxUses, durationDays"],
      ["CouponRedemption", "Tracks per-user coupon usage", "couponId, userId"],
    ],
  },
  {
    title: "Career Data",
    models: [
      ["CareerTwin", "Persistent user career model", "skillSnapshot, interests, workStyle, targetRoles"],
      ["Assessment", "Skill assessments", "targetRole, questions, answers, skillScores"],
      ["CareerPlan", "Career roadmap", "targetRole, timeline, milestones, projects"],
      ["LearningPath", "Personalized learning modules", "targetRole, modules, progress, adaptive"],
    ],
  },
  {
    title: "Resume & Applications",
    models: [
      ["Resume", "User resumes", "title, template, content (JSON), atsScore"],
      ["ResumeVariant", "Per-job tailored resume copies", "jobTitle, company, content, atsScore"],
      ["JobApplication", "Application tracking", "jobTitle, company, status, applicationMethod"],
      ["FollowUp", "Post-application follow-ups", "scheduledDate, type, status"],
    ],
  },
  {
    title: "Agent System",
    models: [
      ["AutoApplyConfig", "Per-user agent configuration", "automationMode, scoutEnabled/Interval, forgeEnabled/Interval"],
      ["AutoApplyRun", "Agent execution logs", "agentType, jobsFound, jobsApplied, creditsUsed"],
      ["AgentActivity", "Granular agent action log", "agent, action, summary, creditsUsed"],
      ["ScoutJob", "Persistent discovered job store", "title, company, jobUrl, dedupeKey, matchScore, status"],
    ],
  },
];

modelGroups.forEach(group => {
  children.push(heading3(group.title));
  children.push(makeTable(
    ["Model", "Purpose", "Key Fields"],
    group.models,
    [2200, 3400, 3760]
  ));
});

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 6: AUTH ─────────────────────────────────────────────────────────
children.push(heading1("6. Authentication & Authorization"));

children.push(heading2("6.1 Auth Providers"));
children.push(bullet([{ text: "Google OAuth 2.0 ", bold: true }, "\u2014 Primary social login"]));
children.push(bullet([{ text: "LinkedIn OAuth ", bold: true }, "\u2014 Secondary social login (openid profile email scopes)"]));
children.push(bullet([{ text: "Credential-based (Email + Password) ", bold: true }, "\u2014 With bcryptjs (12 salt rounds)"]));
children.push(bullet([{ text: "OTP (One-Time Password) ", bold: true }, "\u2014 6-digit codes for login, signup, and password reset"]));

children.push(heading2("6.2 Session Management"));
children.push(bullet("NextAuth v4 with Prisma adapter"));
children.push(bullet("JWT sessions (not database sessions for performance)"));
children.push(bullet("Session includes: id, email, name, image, plan, onboardingDone"));

children.push(heading2("6.3 OTP System"));
children.push(bullet("OTP codes stored in OtpToken model"));
children.push(bullet("Types: login, signup, reset"));
children.push(bullet("6-digit codes, 10-minute expiry"));
children.push(bullet([{ text: "Rate limiting: ", bold: true }, "Max 3 OTPs per email per 10 minutes"]));
children.push(bullet([{ text: "Brute-force protection: ", bold: true }, "Max 5 incorrect verification attempts per code"]));
children.push(bullet("Previous unused OTPs invalidated when new one is generated"));
children.push(bullet([{ text: "Email enumeration prevention: ", bold: true }, "Login/forgot-password always returns success"]));

children.push(heading2("6.4 Registration Flow"));
children.push(bodyText("9-step registration process:"));
children.push(bullet("1. Input validated with Zod (name, email, password min 8 chars, optional referral code)"));
children.push(bullet("2. Duplicate email check (409 if exists)"));
children.push(bullet("3. OFORO internal users auto-upgraded to ULTRA with unlimited credits"));
children.push(bullet("4. Student emails (.edu, .ac.* domains) flagged for discount eligibility"));
children.push(bullet("5. Unique referral code generated per user"));
children.push(bullet("6. CareerTwin record created (persistent career profile)"));
children.push(bullet("7. Referral tracking processed if ref code provided"));
children.push(bullet("8. Auto-subscribe to newsletter"));
children.push(bullet("9. Welcome email sent (non-blocking, with audit trail)"));

children.push(heading2("6.5 Route Protection"));
children.push(bullet([{ text: "Middleware: ", bold: true }, "Lightweight \u2014 only sets geo cookie and referral tracking cookie"]));
children.push(bullet([{ text: "Dashboard: ", bold: true }, "Handled at page/API level via getServerSession() checks"]));
children.push(bullet([{ text: "API: ", bold: true }, "Each API route validates session independently"]));
children.push(bullet([{ text: "Admin: ", bold: true }, "Additional isOforoInternal flag check"]));
children.push(bullet([{ text: "Cron: ", bold: true }, "Protected by CRON_SECRET bearer token"]));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 7: BILLING ─────────────────────────────────────────────────────
children.push(heading1("7. Subscription & Billing"));

children.push(heading2("7.1 Plan Tiers"));
children.push(makeTable(
  ["Plan", "Price", "Agents", "Monthly Tokens", "Key Features"],
  [
    ["BASIC", "Free", "0", "15", "Demo access, free tools, 1 Scout run + 1 resume"],
    ["STARTER", "$12/mo", "2", "200", "Scout + Forge, ~15 Scout runs or mix"],
    ["PRO", "$29/mo", "4", "600", "Heavy usage, auto-apply"],
    ["ULTRA", "$59/mo", "6", "2000", "Power users, all agents"],
  ],
  [1400, 1400, 1200, 1800, 3560]
));

children.push(heading2("7.2 Stripe Integration"));
children.push(bullet([{ text: "Checkout: ", bold: true }, "POST /api/stripe/checkout creates Stripe Checkout Session"]));
children.push(bullet([{ text: "Customer Portal: ", bold: true }, "POST /api/stripe/portal redirects to billing portal"]));
children.push(bullet([{ text: "Webhooks: ", bold: true }, "POST /api/stripe/webhook handles events:"]));
children.push(bullet("checkout.session.completed \u2014 Provision plan", 1));
children.push(bullet("customer.subscription.updated \u2014 Plan changes", 1));
children.push(bullet("customer.subscription.deleted \u2014 Downgrade to BASIC", 1));
children.push(bullet("invoice.payment_succeeded \u2014 Reset monthly token credits", 1));
children.push(bullet("invoice.payment_failed \u2014 Handle failed payment", 1));

children.push(heading2("7.3 Coupon System"));
children.push(bullet("Admin-created coupons with codes"));
children.push(bullet("Plan-specific (upgrades to specified tier)"));
children.push(bullet("Usage limits (maxUses), optional duration (durationDays), expiry dates"));

children.push(heading2("7.4 Credit Packs (One-Time Purchases)"));
children.push(makeTable(
  ["Pack", "Credits", "Price (USD)"],
  [
    ["pack_100", "100", "$5.00"],
    ["pack_500", "500", "$15.00"],
    ["pack_1000", "1,000", "$25.00"],
  ],
  [3000, 3180, 3180]
));

children.push(heading2("7.5 Unlimited Daily Application Purchase"));
children.push(bodyText("One-time purchase ($149 base) permanently removes the 30/day application cap. Sets hasUnlimitedDaily: true on the User model. Regional pricing overrides available."));

children.push(heading2("7.6 Regional Pricing"));
children.push(bodyText("Supports 11 regions with local currency pricing: India (INR), US (USD), UK (GBP), Canada (CAD), UAE (AED), Singapore (SGD), Australia (AUD), Netherlands (EUR), Philippines (PHP), Africa, and DEFAULT."));
children.push(bodyText("Example: India STARTER is \u20B9249/mo vs $12/mo USD in the US."));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 8: TOKEN ECONOMY ────────────────────────────────────────────────
children.push(heading1("8. Token Economy"));

children.push(heading2("8.1 Monthly Token Allocations"));
children.push(makeTable(
  ["Plan", "Tokens/Month"],
  [
    ["BASIC", "15"],
    ["STARTER", "200"],
    ["PRO", "600"],
    ["ULTRA", "2000"],
  ],
  [4680, 4680]
));

children.push(heading2("8.2 Token Costs Per Operation"));
children.push(makeTable(
  ["Operation", "Cost", "Description"],
  [
    ["Scout Search", "2/platform", "6 platforms = 12 tokens per full scan"],
    ["Resume Generation", "3", "AI-powered full resume"],
    ["Resume Enhancement", "2", "Section optimization"],
    ["Resume Analysis", "2", "ATS score analysis"],
    ["Auto-Generate from Profile", "5", "Resume + cover letter from onboarding"],
    ["Per-Job Rewrite", "2", "ATS-tailored variant per job"],
    ["Cover Letter", "2", "Per job application"],
    ["Application Send", "1", "Portal or email"],
    ["Interview Prep", "2", "Company-specific questions"],
    ["Interview Evaluation", "1", "Answer feedback"],
    ["Skill Gap Analysis", "2", "Learning recommendations"],
    ["Application Review", "1", "Quality check"],
    ["Career Plan", "3", "Full roadmap generation"],
    ["AI Insights", "1", "Dashboard analytics"],
  ],
  [3200, 1800, 4360]
));

children.push(heading2("8.3 Daily Application Cap"));
children.push(bullet([{ text: "Default: ", bold: true }, "30 applications per day for all users"]));
children.push(bullet([{ text: "Reset: ", bold: true }, "Lazy reset at midnight UTC"]));
children.push(bullet([{ text: "Unlimited: ", bold: true }, "Available as purchasable add-on (hasUnlimitedDaily flag)"]));

children.push(heading2("8.4 Token Warning System"));
children.push(bullet([{ text: "No warning: ", bold: true }, "Estimated usage < 80% of plan limit"]));
children.push(bullet([{ text: "Amber warning: ", bold: true }, "Estimated usage 80-100% of plan limit"]));
children.push(bullet([{ text: "Red warning: ", bold: true }, "Estimated usage > 100% (\"This may exceed your monthly quota\")"]));
children.push(bullet([{ text: "Credits depleted banner: ", bold: true }, "When remaining = 0, agents auto-pause"]));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 9: PUBLIC PAGES ─────────────────────────────────────────────────
children.push(heading1("9. Public Pages & Marketing"));

children.push(heading2("9.1 Core Public Pages"));
children.push(makeTable(
  ["Route", "Purpose"],
  [
    ["/", "Landing page with hero, features, agent showcase"],
    ["/about", "Company information"],
    ["/pricing", "Plan comparison and checkout"],
    ["/signup", "User registration"],
    ["/login", "User login"],
    ["/get-started", "Free viral auto-apply landing page"],
    ["/contact", "Contact form"],
    ["/careers", "Company careers page"],
  ],
  [3000, 6360]
));

children.push(heading2("9.2 Content Pages"));
children.push(makeTable(
  ["Route", "Purpose"],
  [
    ["/blog", "Blog listing page"],
    ["/blog/[slug]", "Individual blog posts"],
    ["/changelog", "Product changelog"],
    ["/agents", "Agent showcase landing page"],
    ["/agents/[slug]", "Individual agent detail pages"],
    ["/case-studies", "Customer case studies"],
  ],
  [3000, 6360]
));

children.push(heading2("9.3 Comparison Pages"));
children.push(makeTable(
  ["Route", "Compares Against"],
  [
    ["/compare", "Comparison overview"],
    ["/compare/all", "All competitors"],
    ["/compare/jobscan", "Jobscan"],
    ["/compare/lazyapply", "LazyApply"],
    ["/compare/rezi", "Rezi"],
    ["/compare/teal", "Teal"],
    ["/compare/sonara", "Sonara"],
  ],
  [3600, 5760]
));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 10: DASHBOARD ───────────────────────────────────────────────────
children.push(heading1("10. Dashboard Features"));

const dashboardFeatures = [
  { h: "10.1 Dashboard Home (/dashboard)", items: [
    "Personalized greeting with time-of-day awareness",
    "Next step prompt (contextual suggestion)",
    "Command Center quick-access card linking to /dashboard/agents",
    "Metrics grid: Match Score, Applications, Interviews, Active Jobs",
    "Agent activity feed and quick action buttons",
  ]},
  { h: "10.2 Onboarding Wizard (/dashboard/onboarding)", items: [
    "6-step wizard: Resume upload \u2192 Location/goals \u2192 Experience \u2192 Education \u2192 Skills \u2192 Meet Your Agents",
    "Step 6 includes agent enable toggles, schedule preset selector (Aggressive/Balanced/Relaxed), token estimate",
  ]},
  { h: "10.3 Job Discovery (/dashboard/jobs)", items: [
    "Scout agent results display with job cards (match score, company, location, salary)",
    "Filter and sort capabilities",
    "Collapsible Scout Schedule Settings panel",
  ]},
  { h: "10.4 Resume Management (/dashboard/resume)", items: [
    "Resume editor with multiple templates, ATS score display, resume variants",
    "Cover letter management, PDF export via @react-pdf/renderer",
    "Collapsible Forge Schedule Settings panel",
  ]},
  { h: "10.5 Applications (/dashboard/applications)", items: [
    "Application tracker: Queued \u2192 Applied \u2192 Viewed \u2192 Interview \u2192 Offer/Rejected/Withdrawn",
    "Application method tracking, follow-up scheduling",
    "Collapsible Archer Schedule Settings panel",
  ]},
  { h: "10.6 Agent Command Center (/dashboard/agents)", items: [
    "Cortex overview with lore/story",
    "Automation mode selector, independent agent scheduling panels",
    "Agent activity timeline, pipeline statistics, run history",
  ]},
];

dashboardFeatures.forEach(f => {
  children.push(heading2(f.h));
  f.items.forEach(item => children.push(bullet(item)));
});

children.push(heading2("10.7 \u2013 10.13 Additional Dashboard Pages"));
children.push(bullet([{ text: "Interview Prep ", bold: true }, "(/dashboard/interview) \u2014 Company-specific question generation and practice"]));
children.push(bullet([{ text: "Career Plan ", bold: true }, "(/dashboard/career-plan) \u2014 AI-generated roadmap with milestones"]));
children.push(bullet([{ text: "Learning Path ", bold: true }, "(/dashboard/learning) \u2014 Skill gap analysis and course recommendations"]));
children.push(bullet([{ text: "Skills Assessment ", bold: true }, "(/dashboard/assessment) \u2014 Technical assessment generation"]));
children.push(bullet([{ text: "Quality Review ", bold: true }, "(/dashboard/quality) \u2014 Application quality checks"]));
children.push(bullet([{ text: "Portfolio ", bold: true }, "(/dashboard/portfolio) \u2014 Public portfolio builder at /p/[username]"]));
children.push(bullet([{ text: "Settings ", bold: true }, "(/dashboard/settings) \u2014 Profile, password, account deletion, GDPR export"]));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 11: FREE TOOLS ──────────────────────────────────────────────────
children.push(heading1("11. Free Tools Suite"));

children.push(heading2("11.1 Available Tools"));
children.push(bodyText("All tools are publicly accessible without authentication:"));
children.push(makeTable(
  ["Tool", "Route", "Purpose"],
  [
    ["ATS Checker", "/tools/ats-checker", "Check resume ATS compatibility"],
    ["Resume Builder", "/tools/resume-builder", "Build a resume from scratch"],
    ["Salary Estimator", "/tools/salary-estimator", "Estimate salary for role/location"],
    ["Cover Letter Generator", "/tools/cover-letter-generator", "Generate a cover letter"],
    ["Resume Generator", "/tools/resume-generator", "AI-powered resume creation"],
    ["Resume Score", "/tools/resume-score", "Score resume quality"],
    ["Resume Summary Generator", "/tools/resume-summary-generator", "Generate professional summary"],
    ["Interview Question Prep", "/tools/interview-question-prep", "Practice interview questions"],
    ["JD Analyzer", "/tools/job-description-analyzer", "Analyze JD requirements"],
    ["Cold Email Generator", "/tools/cold-email-generator", "Generate cold outreach emails"],
    ["Elevator Pitch", "/tools/elevator-pitch-generator", "Create elevator pitch"],
    ["LinkedIn Headline", "/tools/linkedin-headline-generator", "Optimize LinkedIn headline"],
    ["LinkedIn Post", "/tools/linkedin-post-generator", "Generate LinkedIn posts"],
    ["LinkedIn Hashtag", "/tools/linkedin-hashtag-generator", "Suggest LinkedIn hashtags"],
    ["LinkedIn Recommendation", "/tools/linkedin-recommendation-generator", "Write recommendations"],
    ["Skills Gap Finder", "/tools/skills-gap-finder", "Identify skill gaps"],
    ["Thank You Email", "/tools/thank-you-email-generator", "Post-interview thank you"],
  ],
  [2800, 3800, 2760]
));

children.push(heading2("11.2 Tool Architecture"));
children.push(bullet("Each tool has a page component at /tools/[tool-name]/page.tsx"));
children.push(bullet("Each tool has a corresponding API route at /api/tools/[tool-name]/route.ts"));
children.push(bullet("Tools use the same AI model infrastructure as the main application"));
children.push(bullet("No authentication required \u2014 lead generation funnel to signup"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 12: API REFERENCE ───────────────────────────────────────────────
children.push(heading1("12. API Reference"));

const apiGroups = [
  { title: "12.1 Authentication APIs", endpoints: [
    ["POST", "/api/auth/[...nextauth]", "NextAuth handlers (Google + Credentials)"],
    ["POST", "/api/auth/register", "Email/password registration"],
    ["POST", "/api/auth/forgot-password", "Initiate password reset"],
    ["POST", "/api/auth/reset-password", "Complete password reset"],
    ["POST", "/api/auth/otp/send", "Send OTP code"],
    ["POST", "/api/auth/otp/verify", "Verify OTP code"],
  ]},
  { title: "12.2 AI APIs", endpoints: [
    ["POST", "/api/ai/assessment", "Generate skill assessment"],
    ["POST", "/api/ai/career-plan", "Generate career plan"],
    ["POST", "/api/ai/chat", "General AI chat"],
    ["POST", "/api/ai/cover-letter", "Generate cover letter"],
    ["POST", "/api/ai/dashboard-insights", "Dashboard AI insights"],
    ["POST", "/api/ai/interview", "Generate interview questions"],
    ["POST", "/api/ai/resume/enhance", "Enhance resume section"],
    ["POST", "/api/ai/resume/generate", "Generate full resume"],
  ]},
  { title: "12.3 Agent APIs", endpoints: [
    ["GET", "/api/agents/activity", "Agent activity feed"],
    ["GET/PUT", "/api/agents/config", "Get/update agent configuration"],
    ["GET", "/api/agents/cron", "Cron endpoint (hourly)"],
    ["POST", "/api/agents/run", "Start manual agent run"],
    ["POST", "/api/agents/scout/discover", "Manual Scout job discovery"],
    ["GET", "/api/agents/scout/jobs", "Get discovered jobs"],
    ["GET", "/api/agents/skill-gaps", "Skill gap analysis"],
  ]},
  { title: "12.4 User APIs", endpoints: [
    ["GET/PUT", "/api/user/profile", "Get/update user profile"],
    ["GET/PUT", "/api/user/settings", "Get/update user settings"],
    ["POST", "/api/user/onboarding", "Complete onboarding"],
    ["POST", "/api/user/change-password", "Change password"],
    ["DELETE", "/api/user/delete-account", "Delete user account"],
    ["GET", "/api/user/export-data", "GDPR data export"],
  ]},
  { title: "12.5 Billing APIs", endpoints: [
    ["POST", "/api/stripe/checkout", "Create checkout session"],
    ["POST", "/api/stripe/portal", "Create billing portal session"],
    ["POST", "/api/stripe/webhook", "Stripe webhook handler"],
    ["POST", "/api/coupon/redeem", "Redeem coupon code"],
  ]},
];

apiGroups.forEach(group => {
  children.push(heading2(group.title));
  children.push(makeTable(
    ["Method", "Endpoint", "Description"],
    group.endpoints,
    [1400, 4200, 3760]
  ));
});

children.push(heading2("12.6 Tool APIs (16 endpoints)"));
children.push(bodyText("All follow pattern: POST /api/tools/[tool-name]"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 13: ADMIN ───────────────────────────────────────────────────────
children.push(heading1("13. Admin System"));

children.push(heading2("13.1 Admin Routes"));
children.push(makeTable(
  ["Route", "Purpose"],
  [
    ["/admin", "Admin dashboard overview"],
    ["/admin/users", "User management"],
    ["/admin/monitoring", "System monitoring"],
    ["/admin/coupons", "Coupon management"],
    ["/admin/email", "Email campaigns and logs"],
    ["/admin/marketing", "Marketing dashboard (phases, tasks, KPIs)"],
    ["/admin/support/tickets", "Support ticket management"],
    ["/admin/content/blog", "Blog post management"],
    ["/admin/content/changelog", "Changelog management"],
  ],
  [3600, 5760]
));

children.push(heading2("13.2 Access Control"));
children.push(bodyText("Admin pages require isOforoInternal: true on the user record. This flag is set directly in the database \u2014 there is no self-service admin registration."));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 14: AGENT SCHEDULING ────────────────────────────────────────────
children.push(heading1("14. Independent Agent Scheduling"));

children.push(heading2("14.1 Architecture"));
children.push(bodyText("Each of the three operational agents (Scout, Forge, Archer) runs on its own configurable schedule, independent of the others. Scheduling is driven by an external cron job that hits GET /api/agents/cron every hour."));

children.push(heading2("14.2 Interval Options"));
children.push(makeTable(
  ["Interval", "Label"],
  [
    ["1", "Every hour"],
    ["2", "Every 2 hours"],
    ["4", "Every 4 hours"],
    ["6", "Every 6 hours"],
    ["12", "Every 12 hours"],
    ["24", "Once daily"],
  ],
  [4680, 4680]
));

children.push(heading2("14.3 Cron Logic"));
children.push(bullet("1. Verify CRON_SECRET bearer token"));
children.push(bullet("2. Run ScoutJob TTL cleanup (expire jobs older than 30 days)"));
children.push(bullet("3. Fetch all AutoApplyConfig records with any agent enabled"));
children.push(bullet("4. For each user:"));
children.push(bullet("Check credit depletion \u2192 skip if depleted (log once per day)", 1));
children.push(bullet("For each enabled agent, check shouldRunAgent(lastRunAt, interval, now)", 1));
children.push(bullet("Verify plan-level access via isAgentAvailable(agentId, plan)", 1));
children.push(bullet("For Archer: additionally check daily application cap", 1));
children.push(bullet("Dispatch agent and update lastRunAt timestamp", 1));

children.push(heading2("14.4 AgentConfigPanel Component"));
children.push(bodyText("Reusable React component (src/components/dashboard/AgentConfigPanel.tsx) with two variants: inline (Command Center) and collapsible (individual pages)."));
children.push(bullet("Enable/disable toggle, interval dropdown selector"));
children.push(bullet("Agent-specific controls (Forge mode, Archer max per run)"));
children.push(bullet("Token cost estimate display, token warning levels (amber/red)"));
children.push(bullet("Credits depleted banner with upgrade link"));
children.push(bullet("Last run / next run indicators"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 15: EMAIL ───────────────────────────────────────────────────────
children.push(heading1("15. Email & Notification System"));

children.push(heading2("15.1 Email Types (16)"));
children.push(makeTable(
  ["Type", "Trigger"],
  [
    ["WELCOME", "New user registration"],
    ["OTP_LOGIN", "Login OTP request"],
    ["OTP_SIGNUP", "Signup OTP request"],
    ["EMAIL_VERIFIED", "Email verification complete"],
    ["ONBOARDING_DAY2/5/7", "Drip campaign nudges"],
    ["UPGRADE_NUDGE", "Upgrade suggestion"],
    ["CREDIT_LOW", "Token credits running low"],
    ["WEEKLY_DIGEST", "Weekly activity summary"],
    ["REFERRAL_INVITE", "Referral invitation"],
    ["PASSWORD_RESET", "Password reset link"],
    ["SUBSCRIPTION_CONFIRM", "Subscription activated"],
    ["SUBSCRIPTION_CANCELED", "Subscription cancelled"],
    ["PAYMENT_FAILED", "Payment failure notification"],
    ["ACCOUNT_ACTIVITY", "Account security alerts"],
  ],
  [3600, 5760]
));

children.push(heading2("15.2 Email Delivery"));
children.push(bullet([{ text: "Provider: ", bold: true }, "Resend (v6.9)"]));
children.push(bullet([{ text: "Tracking: ", bold: true }, "All emails logged in EmailLog model with status and messageId"]));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 16: SECURITY ────────────────────────────────────────────────────
children.push(heading1("16. Security & Compliance"));

children.push(heading2("16.1 HTTP Security Headers"));
children.push(bullet("X-Frame-Options: DENY \u2014 Clickjacking prevention"));
children.push(bullet("X-Content-Type-Options: nosniff \u2014 MIME-type sniffing prevention"));
children.push(bullet("Referrer-Policy: strict-origin-when-cross-origin"));
children.push(bullet("Permissions-Policy: camera=(), microphone=(), geolocation()"));

children.push(heading2("16.2 Data Protection"));
children.push(bullet("GDPR data export endpoint (/api/user/export-data)"));
children.push(bullet("Account deletion capability (/api/user/delete-account)"));
children.push(bullet("Cascade deletes on user removal"));
children.push(bullet("PII redaction before AI model logging"));

children.push(heading2("16.3 Anti-Fraud & Anti-Abuse"));
children.push(bullet([{ text: "Scam Job Detector: ", bold: true }, "12-rule scoring system (0-100)"]));
children.push(bullet("Critical signals (40 pts): Payment demands, resume harvesting", 1));
children.push(bullet("Major signals: Free email domains, MLM indicators, unrealistic salaries", 1));
children.push(bullet("Verdicts: safe (< 25), suspicious (25-49), likely_scam (50+)", 1));
children.push(bullet([{ text: "Free tool tracking: ", bold: true }, "Dual-layer verification (HttpOnly cookies + client counts)"]));
children.push(bullet([{ text: "Daily application cap: ", bold: true }, "Hard limit of 30/day to prevent spam"]));
children.push(bullet([{ text: "Credit alerts: ", bold: true }, "Low-credit emails at 3 and 1 remaining (deduplicated)"]));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 17: SEO ─────────────────────────────────────────────────────────
children.push(heading1("17. SEO & Analytics"));
children.push(bullet("Dynamic sitemap at /sitemap.xml covering all public pages, blog posts, agent pages, tools, comparison pages"));
children.push(bullet("PageView model tracks: path, referrer, user agent, country, device, browser, OS, duration"));
children.push(bullet("Event tracking: POST /api/analytics/track for custom events"));
children.push(bullet("Referral tracking via ?ref= or ?utm_source= params stored in cookies (30-day TTL)"));

// ── SECTION 18: DEPLOYMENT ──────────────────────────────────────────────────
children.push(heading1("18. Deployment & Infrastructure"));

children.push(heading2("18.1 VPS Deployment"));
children.push(bullet([{ text: "Server: ", bold: true }, "VPS at 72.62.230.223"]));
children.push(bullet([{ text: "Process Manager: ", bold: true }, "PM2"]));
children.push(bullet([{ text: "Port: ", bold: true }, "3003"]));
children.push(bullet([{ text: "Git Remote: ", bold: true }, "3box (NOT origin)"]));

children.push(heading2("18.2 Environment Variables"));
children.push(makeTable(
  ["Variable", "Purpose"],
  [
    ["DATABASE_URL", "PostgreSQL connection string"],
    ["NEXTAUTH_SECRET", "NextAuth JWT signing secret"],
    ["NEXTAUTH_URL", "Application URL"],
    ["GOOGLE_CLIENT_ID/SECRET", "Google OAuth credentials"],
    ["STRIPE_SECRET_KEY", "Stripe API secret key"],
    ["STRIPE_WEBHOOK_SECRET", "Stripe webhook signing secret"],
    ["OPENROUTER_API_KEY", "OpenRouter AI API key"],
    ["RESEND_API_KEY", "Resend email API key"],
    ["CLOUDINARY_*", "Cloudinary cloud name, API key, secret"],
    ["REDIS_URL", "Redis connection string"],
    ["CRON_SECRET", "Cron endpoint authentication"],
  ],
  [4000, 5360]
));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 19: THIRD-PARTY INTEGRATIONS ────────────────────────────────────
children.push(heading1("19. Third-Party Integrations"));

children.push(heading2("19.1 AI / LLM"));
children.push(bullet([{ text: "OpenRouter API ", bold: true }, "\u2014 Multi-model AI gateway with automatic fallback cascade"]));
children.push(bullet("Free tier: Arcee Trinity | Standard: GPT-4o Mini | Reasoning: DeepSeek Chat | Premium: Claude Sonnet"));

children.push(heading2("19.2 Payment Processing"));
children.push(bullet([{ text: "Stripe ", bold: true }, "\u2014 Subscriptions, checkout, billing portal, webhooks"]));

children.push(heading2("19.3 Email & Communication"));
children.push(bullet([{ text: "Resend ", bold: true }, "\u2014 Transactional emails"]));
children.push(bullet([{ text: "IMAP (imapflow) ", bold: true }, "\u2014 Email reading for reply tracking"]));

children.push(heading2("19.4 Job Search APIs"));
children.push(bullet([{ text: "Adzuna ", bold: true }, "(src/lib/jobs/adzuna.ts) \u2014 Job search API"]));
children.push(bullet([{ text: "SerpAPI ", bold: true }, "(src/lib/jobs/serpapi.ts) \u2014 Google Jobs integration"]));
children.push(bullet([{ text: "Multi-source discovery ", bold: true }, "(src/lib/jobs/discovery.ts) \u2014 Aggregates all sources"]));

children.push(heading2("19.5 ATS Integrations"));
children.push(bullet([{ text: "Greenhouse: ", bold: true }, "Direct API submission (src/lib/ats/greenhouse.ts)"]));
children.push(bullet([{ text: "Lever: ", bold: true }, "Direct API submission (src/lib/ats/lever.ts)"]));
children.push(bullet([{ text: "Workday: ", bold: true }, "Detected but uses portal queue (no direct API)"]));

children.push(heading2("19.6 Email Finder"));
children.push(bullet([{ text: "Hunter.io API ", bold: true }, "\u2014 Finds verified HR/recruiter emails for cold outreach"]));
children.push(bullet("Returns email address and confidence score (0-100), rate limited in batches of 3"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 20: PIPELINE ORCHESTRATOR ───────────────────────────────────────
children.push(heading1("20. Pipeline Orchestrator"));

children.push(heading2("20.1 Overview"));
children.push(bodyText("The orchestrator (src/lib/agents/orchestrator.ts, ~900 lines) runs the full pipeline via runAgentPipeline(). It coordinates all 6 agents in a defined sequence."));

children.push(heading2("20.2 Pipeline Steps"));
children.push(heading3("Step 1: Scout (STARTER+)"));
children.push(bullet("Try reusing recent Scout results (< 24h old)"));
children.push(bullet("If none, auto-trigger fresh Scout run"));
children.push(bullet("Write discovered jobs to shared context"));

children.push(heading3("Step 2: Forge + Quality Gate (STARTER+)"));
children.push(bullet("For top 5 jobs: ATS analysis, optional per-job resume variants"));
children.push(bullet("Quality gate: scam detection + quality scoring per job"));
children.push(bullet("Resume Readiness Verification: Hard block if name/email missing; soft warning otherwise"));

children.push(heading3("Step 3: Sentinel + Archer (PRO+)"));
children.push(bullet("Sentinel batch JD-resume alignment check (ULTRA)"));
children.push(bullet("Quality gate filter + alignment filter (40% threshold)"));
children.push(bullet("Daily cap check (30/day, trimmed if near limit)"));
children.push(bullet("Batch apply to approved jobs (multi-channel, parallel)"));
children.push(bullet("Networking suggestions for applied companies"));

children.push(heading3("Step 4: Atlas (PRO+)"));
children.push(bullet("For top 3 applied jobs: generate interview questions"));

children.push(heading3("Step 5: Sage (ULTRA)"));
children.push(bullet("Identify skill gaps against target role + job descriptions"));

children.push(heading2("20.3 Automation Mode Behavior"));
children.push(makeTable(
  ["Mode", "Scout", "Forge", "Sentinel", "Archer", "Atlas", "Sage"],
  [
    ["Manual", "Auto", "Suggest", "\u2014", "\u2014", "\u2014", "\u2014"],
    ["Co-Pilot", "Auto", "Auto", "Auto", "Approved only", "Suggest", "Suggest"],
    ["Autopilot", "Auto", "Auto", "Auto", "Full auto", "Auto", "Auto"],
  ],
  [1300, 1100, 1100, 1300, 1400, 1100, 1060]
));

children.push(heading2("20.4 Inter-Agent Context"));
children.push(bodyText("The AgentContext (src/lib/agents/context.ts) is a shared state object passed between agents during a pipeline run. The getAgentHandoff() function provides structured data summaries for 16 defined handoff paths."));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ── SECTION 21: SUPPORTING SYSTEMS ──────────────────────────────────────────
children.push(heading1("21. Supporting Systems"));

children.push(heading2("21.1 Scam Detection"));
children.push(bullet([{ text: "Module: ", bold: true }, "src/lib/jobs/scamDetector"]));
children.push(bullet("Used by Scout (pre-filter) and Sentinel (pre-flight check)"));
children.push(bullet("Produces scam score and verdict: likely_scam / suspicious / clean"));

children.push(heading2("21.2 ATS Router"));
children.push(bullet([{ text: "Module: ", bold: true }, "src/lib/ats/router"]));
children.push(bullet("Routes applications: ATS API \u2192 Cold Email \u2192 Portal Queue"));

children.push(heading2("21.3 Quality Scoring"));
children.push(bullet([{ text: "Module: ", bold: true }, "src/lib/jobs/qualityScore"]));
children.push(bullet("Composite score from: match score, ATS score, scam score, URL availability, job age"));
children.push(bullet("Recommendations: apply_now / optimize_first / skip / review"));

children.push(heading2("21.4 Free Auto-Apply Burst"));
children.push(bullet([{ text: "Purpose: ", bold: true }, "Viral marketing feature \u2014 free auto-apply for non-registered users"]));
children.push(bullet([{ text: "Flow: ", bold: true }, "Upload resume \u2192 Select role/location \u2192 Scout scans \u2192 Archer applies"]));
children.push(bullet("Models: FreeAutoApplyBurst (per-user), ViralCounter (global counter)"));
children.push(bullet("Agents allowed in burst: Scout + Archer only (bypasses plan checks)"));

children.push(heading2("21.5 Career Twin"));
children.push(bullet("Persistent AI-driven user career profile (CareerTwin model)"));
children.push(bullet("Stores: skill snapshot, interests, work style, target roles"));
children.push(bullet("Metrics: market readiness (0-1), hire probability (0-1)"));
children.push(bullet("Updated automatically as user interacts with agents"));

children.push(heading2("21.6 Public Portfolio System"));
children.push(bullet("Users can create public portfolios at /p/[username]"));
children.push(bullet("Customizable: title, bio, projects, skills, theme"));
children.push(bullet("Toggle visibility with isPublic flag"));

// ── STATISTICS FOOTER ───────────────────────────────────────────────────────
children.push(spacer(200));
children.push(new Paragraph({
  border: { top: { style: BorderStyle.SINGLE, size: 2, color: BRAND_BLUE, space: 8 } },
  spacing: { before: 200, after: 120 },
  children: [new TextRun({ text: "Total Statistics", bold: true, size: 24, font: "Arial", color: BRAND_DARK })],
}));

const stats = [
  ["Page Routes", "80+"],
  ["API Endpoints", "107+"],
  ["Database Models", "30"],
  ["Database Enums", "8"],
  ["AI Agents", "6 + Cortex coordinator"],
  ["Free Tools", "18"],
  ["Custom Hooks", "7"],
  ["Component Directories", "15"],
  ["lib/ Modules", "63 files in 17 subdirectories"],
];
stats.forEach(([label, value]) => {
  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [
      new TextRun({ text: label + ": ", bold: true, size: 20, font: "Arial", color: "333333" }),
      new TextRun({ text: value, size: 20, font: "Arial", color: BRAND_BLUE }),
    ],
  }));
});

children.push(spacer(200));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 0 },
  children: [new TextRun({ text: "Document generated March 2026. Reflects 3BOX AI v1.6.0.", italics: true, size: 18, font: "Arial", color: GRAY_40 })],
}));

// ─── ASSEMBLE DOCUMENT ──────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 20 } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: BRAND_DARK },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: BRAND_BLUE },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: BRAND_DARK },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
          {
            level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC", space: 4 } },
          children: [
            new TextRun({ text: "3BOX AI ", bold: true, size: 16, font: "Arial", color: BRAND_BLUE }),
            new TextRun({ text: "| Product Specification v1.6.0", size: 16, font: "Arial", color: GRAY_40 }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC", space: 4 } },
          children: [
            new TextRun({ text: "OFORO AI \u2022 Confidential \u2022 Page ", size: 16, font: "Arial", color: GRAY_40 }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: GRAY_40 }),
          ],
        })],
      }),
    },
    children,
  }],
});

// ─── OUTPUT ─────────────────────────────────────────────────────────────────
const outPath = "/Users/brijinchacko/Applications/3BOX/3BOX AI/docs/3BOX_AI_SPEC.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log("Created:", outPath);
  console.log("Size:", (buffer.length / 1024).toFixed(1), "KB");
});
