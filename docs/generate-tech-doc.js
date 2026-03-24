const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak
} = require('docx');

// ── Helpers ──
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const hdrBorders = { top: border, bottom: border, left: border, right: border };

function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        children: headers.map((h, i) =>
          new TableCell({
            borders: hdrBorders,
            width: { size: colWidths[i], type: WidthType.DXA },
            shading: { fill: "1B2A4A", type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })],
          })
        ),
      }),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, ci) =>
            new TableCell({
              borders,
              width: { size: colWidths[ci], type: WidthType.DXA },
              shading: ri % 2 === 0 ? { fill: "F5F7FA", type: ShadingType.CLEAR } : undefined,
              margins: { top: 40, bottom: 40, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: String(cell), font: "Arial", size: 18 })] })],
            })
          ),
        })
      ),
    ],
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text, bold: true, font: "Arial", size: 32, color: "1B2A4A" })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 }, children: [new TextRun({ text, bold: true, font: "Arial", size: 26, color: "2E5090" })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 120 }, children: [new TextRun({ text, bold: true, font: "Arial", size: 22, color: "3A6EA5" })] });
}
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, font: "Arial", size: 20, ...opts })] });
}
function bullet(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 20, ...opts })],
  });
}
function boldBullet(label, desc) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: label, font: "Arial", size: 20, bold: true }),
      new TextRun({ text: " " + desc, font: "Arial", size: 20 }),
    ],
  });
}
function statusBullet(label, status, desc) {
  const color = status === "SECURE" ? "22C55E" : status.includes("CRITICAL") ? "EF4444" : status.includes("HIGH") ? "F59E0B" : "3B82F6";
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: label + ": ", font: "Arial", size: 20, bold: true }),
      new TextRun({ text: status, font: "Arial", size: 20, bold: true, color }),
      new TextRun({ text: " - " + desc, font: "Arial", size: 20 }),
    ],
  });
}

// ── Build Document ──
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: "1B2A4A" }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: "2E5090" }, paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, font: "Arial", color: "3A6EA5" }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    // ═══ COVER PAGE ═══
    {
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children: [
        new Paragraph({ spacing: { before: 3000 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "3BOX AI", font: "Arial", size: 72, bold: true, color: "1B2A4A" })] }),
        new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Complete Technical Documentation & Security Audit", font: "Arial", size: 28, color: "2E5090" })] }),
        new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC", space: 8 } }, children: [] }),
        new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Architecture | Database | AI Models | Security Analysis", font: "Arial", size: 22, color: "666666" })] }),
        new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Version 1.0  |  March 23, 2026", font: "Arial", size: 20, color: "999999" })] }),
        new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CONFIDENTIAL", font: "Arial", size: 24, bold: true, color: "EF4444" })] }),
      ],
    },
    // ═══ TOC ═══
    {
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "3BOX AI Technical Documentation", font: "Arial", size: 16, color: "999999", italics: true })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", font: "Arial", size: 16, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "999999" }), new TextRun({ text: "  |  CONFIDENTIAL", font: "Arial", size: 16, color: "999999" })] })] }) },
      children: [
        h1("Table of Contents"),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ═══ SECTION 1: EXECUTIVE SUMMARY ═══
        h1("1. Executive Summary"),
        p("3BOX AI is a comprehensive AI-powered career operating system built on Next.js 14 (App Router). It features 6 specialized AI agents, 170+ API endpoints, 80+ pages, resume optimization, automated job applications, interview coaching, skill assessments, and career planning."),
        p("The platform serves Free, Pro ($29/mo), and Max ($59/mo) tiers with Claude Sonnet 4 as the primary AI model via OpenRouter."),
        h2("1.1 Key Metrics"),
        makeTable(
          ["Metric", "Value"],
          [
            ["API Endpoints", "170+"],
            ["Pages (Public + Dashboard + Admin)", "80+"],
            ["AI Agents + Orchestrator", "6 + 1"],
            ["AI Feature Categories", "12"],
            ["Database Models", "35+"],
            ["Free AI Tools", "18"],
            ["Payment Integration", "Stripe (subscriptions + one-time)"],
            ["Email Integration", "Gmail OAuth + Outlook OAuth + Resend"],
          ],
          [4500, 4860]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══ SECTION 2: ARCHITECTURE ═══
        h1("2. Architecture Overview"),
        h2("2.1 Tech Stack"),
        makeTable(
          ["Layer", "Technology", "Version"],
          [
            ["Framework", "Next.js (App Router)", "14.2.x"],
            ["Language", "TypeScript", "5.4.x"],
            ["Frontend", "React + Tailwind CSS", "18.3.x / 3.4.x"],
            ["Database", "PostgreSQL via Prisma ORM", "Prisma 5.14.x"],
            ["Auth", "NextAuth.js (JWT + Prisma Adapter)", "4.24.x"],
            ["AI", "OpenRouter API (Claude Sonnet 4)", "-"],
            ["Payments", "Stripe", "15.x"],
            ["Queue", "BullMQ + Redis (ioredis)", "5.70.x"],
            ["Email", "Resend + Gmail API + Outlook Graph", "-"],
            ["State", "Zustand", "4.5.x"],
            ["UI", "Radix UI + Lucide + Framer Motion", "-"],
            ["Charts", "Recharts", "2.12.x"],
            ["Storage", "Cloudinary", "2.9.x"],
            ["Hosting", "Hostinger VPS (PM2)", "-"],
          ],
          [2500, 4360, 2500]
        ),

        h2("2.2 Directory Structure"),
        boldBullet("src/app/", "Next.js App Router (pages + API routes)"),
        boldBullet("src/app/api/", "170+ serverless API endpoints"),
        boldBullet("src/app/dashboard/", "Authenticated dashboard pages"),
        boldBullet("src/components/", "68 React UI components"),
        boldBullet("src/lib/agents/", "6 AI agents + orchestrator"),
        boldBullet("src/lib/ai/", "OpenRouter integration, context building"),
        boldBullet("src/lib/auth/", "NextAuth configuration"),
        boldBullet("src/lib/email/", "Email services (Resend, Gmail, Outlook, IMAP)"),
        boldBullet("src/lib/stripe/", "Stripe payment integration"),
        boldBullet("src/lib/queue/", "BullMQ job queue"),
        boldBullet("src/lib/resume/", "Resume parsing & PDF generation"),
        boldBullet("src/lib/tokens/", "Credit system & feature gating"),
        boldBullet("src/hooks/", "Custom React hooks"),
        boldBullet("src/store/", "Zustand state stores"),
        boldBullet("prisma/", "Database schema"),

        h2("2.3 Middleware"),
        p("The middleware (src/middleware.ts) is non-blocking and handles:"),
        bullet("Geo detection via Cloudflare/Vercel headers, sets 3box-region cookie"),
        bullet("Referral tracking from URL params (ref, utm_source), sets 3box_ref_source cookie"),
        bullet("Route matching: applies to page routes only, skips /api and static files"),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══ SECTION 3: API ROUTES ═══
        h1("3. All API Routes (170+ Endpoints)"),

        h2("3.1 Authentication (15 endpoints)"),
        makeTable(
          ["Method", "Route", "Description"],
          [
            ["GET/POST", "/api/auth/[...nextauth]", "NextAuth handler"],
            ["POST", "/api/auth/register", "User registration"],
            ["POST", "/api/auth/forgot-password", "Password reset request"],
            ["POST", "/api/auth/reset-password", "Password reset confirm"],
            ["POST", "/api/auth/otp/send", "Send OTP via email"],
            ["POST", "/api/auth/otp/verify", "Verify OTP code"],
            ["GET/POST", "/api/auth/gmail/connect", "Connect Gmail OAuth"],
            ["POST", "/api/auth/gmail/callback", "Gmail OAuth callback"],
            ["POST", "/api/auth/gmail/disconnect", "Revoke Gmail"],
            ["GET", "/api/auth/gmail/status", "Gmail connection status"],
            ["GET/POST", "/api/auth/outlook/connect", "Connect Outlook OAuth"],
            ["POST", "/api/auth/outlook/callback", "Outlook OAuth callback"],
            ["POST", "/api/auth/outlook/disconnect", "Revoke Outlook"],
            ["GET", "/api/auth/outlook/status", "Outlook connection status"],
          ],
          [1400, 4000, 3960]
        ),

        h2("3.2 User & Profile (12 endpoints)"),
        makeTable(
          ["Method", "Route", "Description"],
          [
            ["GET/POST/PUT", "/api/user/profile", "User profile CRUD"],
            ["GET/POST/PUT", "/api/user/settings", "User settings"],
            ["POST", "/api/user/change-password", "Change password"],
            ["POST", "/api/user/delete-account", "Account deletion"],
            ["POST", "/api/user/export-data", "GDPR data export"],
            ["POST", "/api/user/assessment", "Skill assessments"],
            ["GET", "/api/user/stats", "User statistics"],
            ["GET", "/api/user/recent-activity", "Activity timeline"],
            ["POST", "/api/user/onboarding", "Complete onboarding"],
            ["GET/POST", "/api/user/smtp-config", "Custom SMTP settings"],
            ["GET", "/api/user/application-cap", "Application limit status"],
          ],
          [1600, 4000, 3760]
        ),

        h2("3.3 AI Features (14 endpoints)"),
        makeTable(
          ["Method", "Route", "Description"],
          [
            ["POST", "/api/ai/resume/generate", "AI resume generation"],
            ["POST", "/api/ai/resume/enhance", "AI resume enhancement"],
            ["POST", "/api/ai/resume/ats-check", "ATS compatibility check"],
            ["POST", "/api/ai/cover-letter", "Cover letter generation"],
            ["POST", "/api/ai/interview", "Interview preparation"],
            ["POST", "/api/ai/assessment", "Career assessment"],
            ["POST", "/api/ai/career-plan", "Career plan generation"],
            ["POST", "/api/ai/learning-path", "Learning path generation"],
            ["POST", "/api/ai/match-analysis", "Job match analysis"],
            ["POST", "/api/ai/dashboard-insights", "Dashboard insights"],
            ["POST", "/api/ai/resume-insights", "Resume analysis"],
            ["POST", "/api/ai/chat", "AI coach chat (streaming)"],
            ["POST", "/api/ai/onboarding-chat", "Onboarding chatbot"],
          ],
          [1200, 4200, 4000]
        ),

        h2("3.4 Agent Routes (20+ endpoints)"),
        makeTable(
          ["Method", "Route", "Description"],
          [
            ["POST", "/api/agents/run", "Manual agent run"],
            ["GET", "/api/agents/run/[id]", "Run status/details"],
            ["GET", "/api/agents/status", "Overall agent status"],
            ["POST", "/api/agents/activity", "Agent activity log"],
            ["GET", "/api/agents/config", "Agent configuration"],
            ["POST", "/api/agents/chat", "Agent chat interface"],
            ["GET", "/api/agents/pipeline-stats", "Pipeline statistics"],
            ["POST", "/api/agents/scout/run", "Run Scout job discovery"],
            ["GET", "/api/agents/scout/status", "Scout status"],
            ["GET", "/api/agents/scout/jobs", "Discovered jobs"],
            ["POST", "/api/agents/auto-apply/setup", "Setup auto-apply"],
            ["POST", "/api/agents/auto-apply/pause", "Pause auto-apply"],
          ],
          [1200, 4200, 4000]
        ),

        h2("3.5 Free Tools (18 endpoints)"),
        makeTable(
          ["Method", "Route", "Description"],
          [
            ["POST", "/api/tools/ats-checker", "ATS compatibility checker"],
            ["POST", "/api/tools/resume-score", "Resume scoring"],
            ["POST", "/api/tools/cover-letter-generator", "Cover letter generator"],
            ["POST", "/api/tools/cold-email-generator", "Cold email generator"],
            ["POST", "/api/tools/linkedin-headline-generator", "LinkedIn headline"],
            ["POST", "/api/tools/linkedin-post-generator", "LinkedIn post"],
            ["POST", "/api/tools/interview-question-prep", "Interview prep"],
            ["POST", "/api/tools/elevator-pitch-generator", "Elevator pitch"],
            ["POST", "/api/tools/job-description-analyzer", "Job analysis"],
            ["POST", "/api/tools/salary-estimator", "Salary estimation"],
            ["POST", "/api/tools/skills-gap-finder", "Skills gap analysis"],
            ["POST", "/api/tools/thank-you-email-generator", "Thank you email"],
          ],
          [1200, 4600, 3560]
        ),

        h2("3.6 Billing, Admin, Cron & Extension"),
        p("Billing: /api/stripe/checkout, /api/stripe/portal, /api/stripe/webhook, /api/coupon/redeem"),
        p("Admin: 30+ endpoints under /api/admin/* for user management, coupons, blog, changelog, tickets, newsletter, marketing, and monitoring."),
        p("Cron: 3 endpoints under /api/cron/* for weekly-digest, scan-replies, recalculate-success (all require CRON_SECRET)."),
        p("Extension: 6 endpoints under /api/extension/* for Chrome extension auth, sync, queue, and job detection."),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══ SECTION 4: DATABASE ═══
        h1("4. Database Schema"),
        p("Database: PostgreSQL via Prisma ORM | Provider: Neon PostgreSQL (cloud) | 35+ models"),

        h2("4.1 Core User Models"),
        p("User Model: id (cuid), email (unique), name, password (bcrypt hash), plan (PlanTier enum), stripeCustomerId, stripeSubId, totalAppsUsed, dailyAppsUsed, bonusApps, isOforoInternal, onboardingDone, referralCode (unique)."),
        p("PlanTier Enum: FREE | PRO | MAX | BASIC (legacy) | STARTER (legacy) | ULTRA (legacy)"),

        h2("4.2 Authentication Models"),
        bullet("Account: OAuth provider credentials (Google, LinkedIn)"),
        bullet("Session: Active user sessions"),
        bullet("VerificationToken: Email verification tokens"),
        bullet("OtpToken: One-time password tokens"),

        h2("4.3 Email & Billing"),
        bullet("UserEmailConnection: Gmail/Outlook OAuth tokens (encrypted via AES-256-GCM)"),
        bullet("EmailLog: Email send history"),
        bullet("Subscription: Stripe subscriptions (status, plan, interval, period dates)"),
        bullet("Coupon: Discount codes with usage limits"),
        bullet("Referral: Referral tracking (PENDING, ACTIVATED, REWARDED)"),

        h2("4.4 Career Development"),
        bullet("Assessment: Career assessments (questions, answers, skill scores)"),
        bullet("CareerPlan: Career plans (timeline, milestones, projects)"),
        bullet("LearningPath: Personalized learning paths"),
        bullet("CareerTwin: Persistent user profile snapshot (skills, interests, readiness)"),

        h2("4.5 Resumes & Applications"),
        bullet("Resume: User resumes (title, content JSON, ATS score, template, approval status)"),
        bullet("ResumeVariant: Per-job tailored resume versions"),
        bullet("JobApplication: Applications (status, channel, method, ATS type)"),
        bullet("FollowUp: Scheduled post-application follow-ups"),
        bullet("ApplicationOutcome: Outcome tracking for success rates"),

        h2("4.6 Agents & Job Discovery"),
        bullet("AutoApplyConfig: Agent configuration (Scout, Forge, Archer settings)"),
        bullet("AutoApplyRun: Agent execution records"),
        bullet("AgentActivity: Agent action logs"),
        bullet("AgentChatMessage: Agent chat history"),
        bullet("SearchProfile: User-configured job search loops"),
        bullet("ScoutJob: Discovered jobs (status, match score, ATS score, deduplication)"),
        bullet("ChannelSuccessRate: Application success metrics by channel/company"),

        h2("4.7 Content, Marketing & Admin"),
        bullet("BlogPost, Changelog, NewsletterCampaign"),
        bullet("MarketingPhase, MarketingTask, MarketingKPI, ContentCalendar"),
        bullet("SupportTicket, TicketMessage, AuditLog, PageView"),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══ SECTION 5: AI MODELS ═══
        h1("5. AI Models & Capabilities"),

        h2("5.1 Model Configuration"),
        p("All AI is routed through the OpenRouter API (https://openrouter.ai/api/v1)."),
        makeTable(
          ["Tier", "Model ID", "Provider", "Max Tokens", "JSON Mode", "Role"],
          [
            ["premium", "anthropic/claude-sonnet-4", "Anthropic", "8192", "No", "Primary (all features)"],
            ["reasoning", "deepseek/deepseek-chat", "DeepSeek", "8192", "Yes", "Fallback #1"],
            ["standard", "openai/gpt-4o-mini", "OpenAI", "8192", "Yes", "Fallback #2"],
            ["free", "arcee-ai/trinity-large-preview:free", "Arcee", "8192", "No", "Fallback #3"],
          ],
          [1200, 2800, 1200, 1100, 1000, 2060]
        ),

        h2("5.2 Plan-to-Model Routing"),
        p("ALL plans (FREE, PRO, MAX) route to Claude Sonnet 4 (premium tier) for ALL features. Cost monitoring is deferred post-launch. Every user gets the same high-quality AI experience."),

        h2("5.3 Fallback Chain"),
        p("If the primary model fails, the system automatically cascades:"),
        p("Claude Sonnet 4 (premium) -> DeepSeek Chat (reasoning) -> GPT-4o Mini (standard) -> Arcee Trinity (free)"),

        h2("5.4 AI Feature Categories (12 total)"),
        makeTable(
          ["Feature", "Endpoint", "What It Does"],
          [
            ["assessment", "/api/ai/assessment", "30 skill questions + scoring"],
            ["career-plan", "/api/ai/career-plan", "Milestones, projects, timeline"],
            ["coach", "/api/ai/chat", "Streaming conversational AI coach"],
            ["cover-letter", "/api/ai/cover-letter", "Job-specific cover letters"],
            ["interview", "/api/ai/interview", "Company-specific interview prep"],
            ["learning-path", "/api/ai/learning-path", "Adaptive learning modules"],
            ["job-matching", "/api/ai/match-analysis", "Resume-to-job match scoring"],
            ["resume", "/api/ai/resume/*", "Generate, enhance, ATS-check"],
            ["ats-checker", "/api/tools/ats-checker", "Public ATS tool"],
            ["salary-estimator", "/api/tools/salary-estimator", "Salary estimation"],
            ["tools-general", "/api/tools/*", "All 18 free AI tools"],
          ],
          [2000, 3200, 4160]
        ),

        h2("5.5 AI Context System"),
        p("Every AI call receives rich user context built from 9 parallel database queries (src/lib/ai/context.ts):"),
        bullet("User profile (name, plan, member since)"),
        bullet("Career profile (target roles, skills, readiness 0-100)"),
        bullet("Assessment scores and skill gaps"),
        bullet("Career plan progress (milestones, completion %)"),
        bullet("Learning path status (modules, progress)"),
        bullet("Resume data (ATS score, summary, skills list)"),
        bullet("Job search history (applications, outcomes)"),
        bullet("Portfolio data (projects, public visibility)"),
        bullet("Coach personality settings"),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══ SECTION 6: AI AGENTS ═══
        h1("6. AI Agents"),

        h2("6.1 Agent Registry"),
        makeTable(
          ["Agent", "ID", "Role", "Description"],
          [
            ["Scout", "scout", "Job Hunter", "Multi-source job discovery, match scoring, scam detection"],
            ["Forge", "forge", "Resume Optimizer", "ATS keyword optimization, job-specific variants, scoring"],
            ["Archer", "archer", "Application Agent", "Cover letters, ATS API submission, cold email outreach"],
            ["Atlas", "atlas", "Interview Coach", "Company-specific questions, practice scenarios"],
            ["Sage", "sage", "Skill Trainer", "Skill gap analysis, learning recommendations"],
            ["Sentinel", "sentinel", "Quality Reviewer", "Quality scoring (0-100), fabrication detection"],
            ["Cortex", "cortex", "Orchestrator", "Coordinates all 6 agents, pipeline automation"],
          ],
          [1200, 1200, 2000, 5000]
        ),
        p("All agents are available on ALL plans (FREE, PRO, MAX)."),

        h2("6.2 Automation Modes"),
        makeTable(
          ["Mode", "Behavior"],
          [
            ["Copilot", "Scout runs auto, others produce suggestions only"],
            ["Autopilot", "Scout + Forge + Sentinel auto, Archer asks approval"],
            ["Full-Agent", "All agents run with minimal intervention"],
            ["Smart-Auto", "All agents auto, Archer uses score threshold gate"],
          ],
          [2000, 7360]
        ),

        h2("6.3 Archer Submission Channels"),
        bullet("ATS API: Direct submission to Greenhouse + Lever"),
        bullet("Browser Extension: Auto-fill on Workday, iCIMS, LinkedIn, Indeed, Naukri"),
        bullet("OAuth Email: Gmail/Outlook personal outreach"),
        bullet("Cold Email: Via Hunter.io for verified HR emails"),
        bullet("Manual Portal: Queue for last resort"),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══ SECTION 7: BILLING ═══
        h1("7. Credit & Billing System"),

        h2("7.1 Pricing Tiers"),
        makeTable(
          ["Plan", "Monthly", "Yearly", "App Limit", "Reset"],
          [
            ["FREE", "$0", "$0", "5/week", "Monday 00:00 UTC"],
            ["PRO", "$29", "$290", "20/day", "Daily 00:00 UTC"],
            ["MAX", "$59", "$590", "50/day", "Daily 00:00 UTC"],
          ],
          [1500, 1500, 1500, 2360, 2500]
        ),

        h2("7.2 Key Points"),
        bullet("AI operations are UNLIMITED on all plans"),
        bullet("Only job application submissions count against limits"),
        bullet("Bonus apps available via referrals"),
        bullet("FREE users locked from ALL features when limit reached"),
        bullet("PRO/MAX users are never locked"),

        h2("7.3 Legacy Plan Mapping"),
        makeTable(["Legacy Plan", "Maps To"], [["BASIC", "FREE"], ["STARTER", "PRO"], ["ULTRA", "MAX"]], [4680, 4680]),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══ SECTION 8: AUTH ═══
        h1("8. Authentication System"),

        h2("8.1 Sign-In Methods"),
        boldBullet("Email/Password:", "bcryptjs hashing with 12 salt rounds"),
        boldBullet("Google OAuth:", "Auto-connects Gmail for job application sending"),
        boldBullet("LinkedIn OAuth:", "Professional profile import"),
        boldBullet("OTP (Email):", "Passwordless login via one-time code (rate limited: 3 per 10 min)"),

        h2("8.2 Session Configuration"),
        bullet("Strategy: JWT with Prisma adapter"),
        bullet("Cookies: httpOnly, SameSite=Lax, Secure in production"),
        bullet("Token refreshes plan/credits on each session load"),
        bullet("Standard cookie names for reverse proxy compatibility"),

        h2("8.3 OAuth Scopes"),
        bullet("Google: openid, email, profile, gmail.send"),
        bullet("LinkedIn: openid, profile, email"),
        bullet("Outlook: Mail.Send, User.Read, offline_access"),

        h2("8.4 OAuth Token Encryption"),
        p("Gmail and Outlook OAuth tokens are encrypted using AES-256-GCM before storage in the database (src/lib/email/oauth/encryption.ts). Uses proper IV randomization and authentication tags."),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══ SECTION 9: SECURITY AUDIT ═══
        h1("9. Security Audit"),

        h2("9.1 Security Status Summary"),
        makeTable(
          ["Category", "Status", "Notes"],
          [
            ["Password Hashing", "SECURE", "bcryptjs, 12 salt rounds"],
            ["Session Security", "SECURE", "httpOnly, Secure, SameSite"],
            ["CSRF Protection", "SECURE", "NextAuth built-in"],
            ["XSS Protection", "SECURE", "No dangerouslySetInnerHTML"],
            ["SQL Injection", "SECURE", "Prisma parameterized queries"],
            ["File Upload", "SECURE", "Type + size validation"],
            ["Stripe Webhooks", "SECURE", "Signature verification"],
            ["Security Headers", "SECURE", "X-Frame-Options, X-Content-Type-Options"],
            ["Admin Access", "SECURE", "Email + flag double-check"],
            ["OAuth Encryption", "SECURE", "AES-256-GCM"],
            ["Secrets Management", "CRITICAL", "Hardcoded fallbacks found"],
            ["Rate Limiting", "INCOMPLETE", "In-memory only (single-instance)"],
            ["Email Account Linking", "HIGH RISK", "allowDangerousEmailAccountLinking enabled"],
          ],
          [3000, 2000, 4360]
        ),

        h2("9.2 CRITICAL Security Issues"),
        h3("Issue 1: Weak JWT Secret Fallback"),
        boldBullet("File:", "src/app/api/extension/token/route.ts, Line 10"),
        boldBullet("Code:", "JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret'"),
        boldBullet("Risk:", "Extension tokens can be forged if NEXTAUTH_SECRET is missing"),
        boldBullet("Fix:", "Remove fallback, require explicit secret, throw error if missing"),

        h3("Issue 2: Database Password Exposure"),
        boldBullet("Risk:", "Real database credentials visible in .env file"),
        boldBullet("Fix:", "Rotate password immediately, use secrets manager, never commit to git"),

        h3("Issue 3: Weak NEXTAUTH_SECRET"),
        boldBullet("Current:", "local-dev-secret-3box-ai-2026 (too predictable)"),
        boldBullet("Fix:", "Generate cryptographically strong secret: openssl rand -base64 32"),

        h2("9.3 HIGH Priority Issues"),
        h3("Issue 4: Dangerous Email Account Linking"),
        boldBullet("File:", "src/lib/auth/config.ts, Line 63"),
        boldBullet("Setting:", "allowDangerousEmailAccountLinking: true"),
        boldBullet("Risk:", "Account takeover if attacker's Gmail matches victim's email"),
        boldBullet("Fix:", "Disable or require explicit user confirmation"),

        h3("Issue 5: Extension Token Duration"),
        boldBullet("Current:", "30-day expiry (too long)"),
        boldBullet("Fix:", "Reduce to 7-14 days with refresh token rotation"),

        h3("Issue 6: Missing OAUTH_ENCRYPTION_KEY"),
        boldBullet("Issue:", "Not documented in .env.example"),
        boldBullet("Fix:", "Add to .env.example and production environment"),

        h2("9.4 MEDIUM Priority Issues"),
        boldBullet("Issue 7:", "In-memory rate limiting (Map) breaks in multi-instance. Migrate to Redis."),
        boldBullet("Issue 8:", "No per-user rate limiting on AI routes. Add 100 calls/hour limit."),
        boldBullet("Issue 9:", "Admin sort parameter not whitelisted. Add ALLOWED_SORTS validation."),

        h2("9.5 LOW Priority Issues"),
        boldBullet("Issue 10:", "CRON_SECRET not documented in .env.example."),
        boldBullet("Issue 11:", "No Content Security Policy (CSP) header configured."),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══ SECTION 10: SECURITY RECOMMENDATIONS ═══
        h1("10. Security Recommendations (Action Plan)"),

        h2("10.1 Immediate Actions (Do Now)"),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Rotate database credentials and update DATABASE_URL", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Generate strong NEXTAUTH_SECRET (openssl rand -base64 32)", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Remove 'fallback-secret' from extension token route", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Add OAUTH_ENCRYPTION_KEY to production environment", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Add CRON_SECRET to production environment", font: "Arial", size: 20 })] }),

        h2("10.2 Short-Term (This Week)"),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Disable allowDangerousEmailAccountLinking or add confirmation flow", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Reduce extension token expiry to 7 days", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Add Content Security Policy header", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Add per-user rate limiting on AI routes", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Whitelist admin sort parameters", font: "Arial", size: 20 })] }),

        h2("10.3 Medium-Term (This Month)"),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Migrate rate limiting to Redis (ioredis already available)", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Add request signing for cron endpoints (nonce/timestamp)", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Implement API request logging for security audit trail", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Add brute force protection on login endpoint", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Implement token rotation for OAuth refresh tokens", font: "Arial", size: 20 })] }),

        h2("10.4 Long-Term (Ongoing)"),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Regular dependency security audits (npm audit)", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Penetration testing", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "SOC 2 compliance preparation", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "GDPR audit (data export already implemented)", font: "Arial", size: 20 })] }),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun({ text: "Security incident response plan", font: "Arial", size: 20 })] }),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══ SECTION 11: EXTERNAL INTEGRATIONS ═══
        h1("11. External Service Integrations"),
        makeTable(
          ["Service", "Purpose", "Config Variable"],
          [
            ["OpenRouter API", "AI/LLM multi-model access", "OPENROUTER_API_KEY"],
            ["Stripe", "Payments & subscriptions", "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET"],
            ["Resend", "Transactional emails", "RESEND_API_KEY"],
            ["Google APIs", "Gmail OAuth + sending", "GOOGLE_CLIENT_ID/SECRET"],
            ["Microsoft Graph", "Outlook OAuth + sending", "MICROSOFT_CLIENT_ID/SECRET"],
            ["RapidAPI JSearch", "Job search aggregation", "RAPIDAPI_KEY"],
            ["Cloudinary", "Image/file storage", "CLOUDINARY_* vars"],
            ["Redis", "Job queue (BullMQ)", "REDIS_URL"],
            ["Neon PostgreSQL", "Database", "DATABASE_URL"],
          ],
          [2500, 3500, 3360]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══ SECTION 12: KEY FILES ═══
        h1("12. Key File Reference"),
        makeTable(
          ["File", "Purpose"],
          [
            ["src/lib/auth/config.ts", "NextAuth configuration (providers, callbacks, session)"],
            ["src/lib/ai/openrouter.ts", "AI model routing, fallback chains, API calls"],
            ["src/lib/ai/context.ts", "User context builder for AI personalization"],
            ["src/lib/agents/scout.ts", "Job discovery agent"],
            ["src/lib/agents/forge.ts", "Resume optimization agent"],
            ["src/lib/agents/archer.ts", "Application submission agent"],
            ["src/lib/agents/atlas.ts", "Interview coaching agent"],
            ["src/lib/agents/sage.ts", "Skill training agent"],
            ["src/lib/agents/sentinel.ts", "Quality review agent"],
            ["src/lib/agents/orchestrator.ts", "Agent coordination"],
            ["src/lib/email/oauth/encryption.ts", "AES-256-GCM token encryption"],
            ["src/lib/stripe/index.ts", "Stripe payment integration"],
            ["src/lib/tokens/pricing.ts", "Plan pricing & feature gating"],
            ["src/lib/rateLimit.ts", "IP-based rate limiting"],
            ["src/middleware.ts", "Geo detection & referral tracking"],
            ["prisma/schema.prisma", "Complete database schema"],
            ["next.config.js", "Security headers, image domains"],
          ],
          [4500, 4860]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ═══ SECTION 13: ENV VARS ═══
        h1("13. Environment Variables Reference"),
        p("All required environment variables for production deployment:"),
        makeTable(
          ["Variable", "Purpose"],
          [
            ["DATABASE_URL", "PostgreSQL connection string"],
            ["NEXTAUTH_URL", "App URL (https://3box.ai)"],
            ["NEXTAUTH_SECRET", "JWT signing secret (MUST be strong random)"],
            ["GOOGLE_CLIENT_ID / SECRET", "Google OAuth"],
            ["LINKEDIN_CLIENT_ID / SECRET", "LinkedIn OAuth"],
            ["MICROSOFT_CLIENT_ID / SECRET / TENANT_ID", "Outlook OAuth"],
            ["OPENROUTER_API_KEY", "AI model access via OpenRouter"],
            ["STRIPE_SECRET_KEY", "Stripe backend key"],
            ["STRIPE_WEBHOOK_SECRET", "Stripe webhook signature verification"],
            ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "Stripe frontend key"],
            ["RESEND_API_KEY", "Resend email service"],
            ["EMAIL_FROM", "Default sender email"],
            ["RAPIDAPI_KEY", "JSearch job search API"],
            ["REDIS_URL", "Redis for BullMQ queue"],
            ["CRON_SECRET", "Cron job authentication"],
            ["OAUTH_ENCRYPTION_KEY", "AES-256-GCM token encryption"],
            ["OFORO_ADMIN_EMAILS", "Admin email whitelist"],
            ["OFORO_INTERNAL_DOMAINS", "Internal domain list"],
          ],
          [4500, 4860]
        ),

        // ═══ END ═══
        new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC", space: 8 } }, children: [] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "End of Document", font: "Arial", size: 20, color: "999999", italics: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "3BOX AI Technical Documentation v1.0 - CONFIDENTIAL", font: "Arial", size: 18, color: "999999" })] }),
      ],
    },
  ],
});

// ── Generate ──
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("E:/3BOXAI/docs/3BOX-AI-Technical-Documentation.docx", buffer);
  console.log("Document created: E:/3BOXAI/docs/3BOX-AI-Technical-Documentation.docx");
  console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
});
