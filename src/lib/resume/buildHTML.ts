/* ─── HTML builder ─────────────────────────────────────────────── */

export interface BuildHTMLParams {
  contact: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary: string;
  experience: {
    id: string;
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }[];
  skills: string[];
  skillDescriptions?: Record<string, string>;
  certifications: {
    id: string;
    name: string;
    issuer: string;
    date: string;
    verified: boolean;
  }[];
  projects?: {
    id: string;
    name: string;
    description: string;
    url: string;
    technologies: string[];
  }[];
  template: string;
  showWatermark: boolean;
  isPreview?: boolean;
}

/* ─── Fallback skill descriptions ────────────────────────────── */

const DEFAULT_SKILL_DESCRIPTIONS: Record<string, string> = {
  // Languages
  'JavaScript': 'Dynamic scripting language for web and server-side development',
  'TypeScript': 'Typed superset of JavaScript for scalable applications',
  'Python': 'High-level language for data science, automation, and backend',
  'Java': 'Object-oriented language for enterprise and Android development',
  'C++': 'High-performance systems programming language',
  'C#': 'Microsoft language for .NET and game development',
  'C': 'Low-level systems programming language',
  'Go': 'Concurrent systems language by Google for cloud services',
  'Rust': 'Memory-safe systems programming language',
  'Ruby': 'Dynamic scripting language for rapid web development',
  'PHP': 'Server-side scripting language for web applications',
  'Swift': 'Apple platform language for iOS and macOS development',
  'Kotlin': 'Modern JVM language for Android and server-side apps',
  'Scala': 'Functional JVM language for distributed computing',
  'R': 'Statistical computing language for data analysis',
  'Dart': 'Client-optimized language for Flutter cross-platform apps',
  'Perl': 'Text processing and scripting language',
  'Lua': 'Lightweight embeddable scripting language',
  'Haskell': 'Purely functional programming language',
  'Elixir': 'Functional language for scalable concurrent systems',
  'Clojure': 'Functional Lisp dialect on the JVM',
  'SQL': 'Standard language for relational database queries',
  'HTML': 'Markup language for structuring web content',
  'CSS': 'Stylesheet language for web presentation and layout',
  'Bash': 'Unix shell scripting for automation and system tasks',
  'Shell': 'Command-line scripting for system automation',
  'MATLAB': 'Numerical computing language for engineering and science',

  // Frontend Frameworks
  'React': 'Component-based UI library for dynamic web applications',
  'React.js': 'Component-based UI library for dynamic web applications',
  'ReactJS': 'Component-based UI library for dynamic web applications',
  'Next.js': 'React framework for server-rendered production applications',
  'NextJS': 'React framework for server-rendered production applications',
  'Vue.js': 'Progressive JavaScript framework for building UIs',
  'Vue': 'Progressive JavaScript framework for building UIs',
  'Angular': 'Enterprise TypeScript framework for large-scale SPAs',
  'Svelte': 'Compile-time UI framework with minimal runtime overhead',
  'Nuxt.js': 'Vue framework for server-side rendered applications',
  'Gatsby': 'React-based static site generator for fast websites',
  'Remix': 'Full-stack React framework with nested routing',

  // CSS/UI
  'Tailwind CSS': 'Utility-first CSS framework for rapid UI development',
  'Tailwind': 'Utility-first CSS framework for rapid UI development',
  'Bootstrap': 'Responsive CSS framework for web UI components',
  'Material UI': 'React component library implementing Material Design',
  'MUI': 'React component library implementing Material Design',
  'Sass': 'CSS preprocessor with variables and nesting support',
  'SCSS': 'CSS preprocessor with variables and nesting support',
  'Less': 'CSS preprocessor for maintainable stylesheets',
  'Styled Components': 'CSS-in-JS library for React component styling',
  'Chakra UI': 'Accessible React component library for modern UIs',

  // Backend
  'Node.js': 'JavaScript runtime for server-side and API development',
  'NodeJS': 'JavaScript runtime for server-side and API development',
  'Express': 'Minimal Node.js web framework for APIs and servers',
  'Express.js': 'Minimal Node.js web framework for APIs and servers',
  'NestJS': 'Progressive Node.js framework for enterprise server apps',
  'Django': 'Python web framework for rapid secure development',
  'Flask': 'Lightweight Python web microframework for APIs',
  'FastAPI': 'High-performance Python API framework with auto-docs',
  'Spring Boot': 'Java framework for production-grade microservices',
  'Spring': 'Enterprise Java framework for dependency injection',
  'Rails': 'Ruby framework for convention-based web development',
  'Ruby on Rails': 'Ruby framework for convention-based web development',
  'Laravel': 'PHP framework for elegant web application development',
  'ASP.NET': '.NET framework for building enterprise web applications',
  '.NET': 'Microsoft framework for cross-platform applications',
  'GraphQL': 'API query language for flexible data fetching',
  'REST': 'Architectural style for scalable web service APIs',
  'gRPC': 'High-performance RPC framework for microservices',

  // Databases
  'PostgreSQL': 'Advanced open-source relational database system',
  'MySQL': 'Popular open-source relational database for web apps',
  'MongoDB': 'Document-oriented NoSQL database for flexible schemas',
  'Redis': 'In-memory data store for caching and real-time data',
  'SQLite': 'Lightweight embedded relational database engine',
  'DynamoDB': 'AWS managed NoSQL database for serverless applications',
  'Cassandra': 'Distributed NoSQL database for high-availability workloads',
  'Elasticsearch': 'Distributed search and analytics engine',
  'Firebase': 'Google platform for real-time databases and auth',
  'Firestore': 'Google serverless NoSQL document database',
  'Supabase': 'Open-source Firebase alternative with PostgreSQL backend',
  'Oracle': 'Enterprise relational database management system',
  'SQL Server': 'Microsoft enterprise relational database system',
  'Neo4j': 'Graph database for connected data and relationships',
  'Prisma': 'Type-safe ORM for Node.js and TypeScript applications',

  // Cloud & DevOps
  'AWS': 'Amazon cloud platform for scalable infrastructure services',
  'Azure': 'Microsoft cloud platform for enterprise applications',
  'GCP': 'Google Cloud platform for compute and data services',
  'Google Cloud': 'Google Cloud platform for compute and data services',
  'Docker': 'Container platform for consistent application deployment',
  'Kubernetes': 'Container orchestration for automated scaling and deployment',
  'K8s': 'Container orchestration for automated scaling and deployment',
  'Terraform': 'Infrastructure-as-code tool for cloud provisioning',
  'Ansible': 'Automation tool for configuration management and deployment',
  'Jenkins': 'CI/CD automation server for build and deployment pipelines',
  'GitHub Actions': 'CI/CD workflow automation integrated with GitHub',
  'GitLab CI': 'Integrated CI/CD pipelines within GitLab platform',
  'CircleCI': 'Cloud-based CI/CD platform for automated testing',
  'Nginx': 'High-performance web server and reverse proxy',
  'Apache': 'Open-source HTTP web server',
  'Vercel': 'Deployment platform optimized for frontend frameworks',
  'Netlify': 'Platform for automated frontend builds and deployment',
  'Heroku': 'Cloud platform for deploying and managing applications',
  'Linux': 'Open-source operating system for servers and development',
  'CI/CD': 'Continuous integration and delivery automation practices',

  // Tools
  'Git': 'Distributed version control system for source code',
  'GitHub': 'Code hosting platform for collaboration and version control',
  'GitLab': 'DevOps platform for source control and CI/CD pipelines',
  'Bitbucket': 'Git repository hosting with Jira integration',
  'Jira': 'Agile project management and issue tracking tool',
  'Confluence': 'Team collaboration and documentation wiki platform',
  'Figma': 'Collaborative interface design and prototyping tool',
  'Webpack': 'Module bundler for JavaScript application assets',
  'Vite': 'Fast frontend build tool with hot module replacement',
  'ESLint': 'JavaScript linting tool for code quality enforcement',
  'Prettier': 'Opinionated code formatter for consistent style',
  'npm': 'Node.js package manager for dependency management',
  'Yarn': 'Fast reliable JavaScript package manager',
  'pnpm': 'Efficient disk-space-saving JavaScript package manager',
  'Postman': 'API development and testing collaboration platform',
  'VS Code': 'Extensible source code editor by Microsoft',
  'IntelliJ': 'JetBrains IDE for JVM and polyglot development',

  // Testing
  'Jest': 'JavaScript testing framework for unit and snapshot tests',
  'Mocha': 'Flexible JavaScript test framework for Node.js',
  'Cypress': 'End-to-end testing framework for web applications',
  'Playwright': 'Cross-browser end-to-end testing automation framework',
  'Selenium': 'Browser automation framework for web application testing',
  'pytest': 'Python testing framework for scalable test suites',
  'JUnit': 'Unit testing framework for Java applications',
  'Testing Library': 'Utilities for testing UI components by user behavior',
  'Vitest': 'Fast Vite-native unit testing framework',
  'Storybook': 'UI component development and visual testing environment',

  // Data & ML
  'TensorFlow': 'Machine learning framework for neural network models',
  'PyTorch': 'Deep learning framework for research and production',
  'Pandas': 'Python library for data manipulation and analysis',
  'NumPy': 'Python library for numerical and array computing',
  'Scikit-learn': 'Python library for classical machine learning algorithms',
  'Keras': 'High-level neural network API for deep learning',
  'Apache Spark': 'Distributed engine for large-scale data processing',
  'Hadoop': 'Framework for distributed storage and big data processing',
  'Tableau': 'Business intelligence platform for data visualization',
  'Power BI': 'Microsoft business analytics and visualization service',
  'Apache Kafka': 'Distributed event streaming platform for real-time data',
  'Kafka': 'Distributed event streaming platform for real-time data',
  'Airflow': 'Workflow orchestration platform for data pipelines',

  // Mobile
  'React Native': 'Cross-platform mobile framework using React',
  'Flutter': 'Google UI toolkit for cross-platform mobile applications',
  'iOS': 'Apple mobile platform development with Swift/Obj-C',
  'Android': 'Google mobile platform development with Kotlin/Java',
  'SwiftUI': 'Declarative UI framework for Apple platform development',
  'Expo': 'Platform for universal React Native applications',
  'Xamarin': '.NET framework for cross-platform mobile development',

  // APIs & Messaging
  'RabbitMQ': 'Open-source message broker for asynchronous communication',
  'WebSockets': 'Protocol for real-time bidirectional communication',
  'Socket.IO': 'Real-time bidirectional event-based communication library',
  'OAuth': 'Authorization framework for secure delegated access',
  'JWT': 'Token-based authentication for stateless API security',
  'Stripe': 'Payment processing platform for online transactions',

  // Architecture
  'Microservices': 'Architectural pattern for independent deployable services',
  'Serverless': 'Cloud execution model without server management',
  'Agile': 'Iterative development methodology for software delivery',
  'Scrum': 'Agile framework for iterative product development',
  'TDD': 'Test-driven development methodology for reliable code',
  'OOP': 'Object-oriented programming paradigm for modular design',
  'Design Patterns': 'Reusable solutions to common software design problems',
  'System Design': 'Architecture planning for scalable distributed systems',
  'Data Structures': 'Organized data storage for efficient algorithm operations',
  'Algorithms': 'Computational procedures for efficient problem solving',
};

function getSkillDescription(skill: string, descriptions?: Record<string, string>): string {
  if (descriptions && descriptions[skill]) return descriptions[skill];
  if (DEFAULT_SKILL_DESCRIPTIONS[skill]) return DEFAULT_SKILL_DESCRIPTIONS[skill];
  // Case-insensitive fallback
  const lower = skill.toLowerCase();
  for (const [key, val] of Object.entries(DEFAULT_SKILL_DESCRIPTIONS)) {
    if (key.toLowerCase() === lower) return val;
  }
  return '';
}

/* ─── Shared helpers ─────────────────────────────────────────── */

/** Pass through bullets as-is — splitting handled at parse/upload time */
function normalizeBullets(bullets: string[]): string[] {
  return bullets.filter(b => b && b.trim().length > 0);
}

export function esc(str: string): string {
  return (str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function printBar(accent: string, hide?: boolean): string {
  if (hide) return '';
  return `<div class="no-print" style="background:#f3f4f6;text-align:center;padding:12px;font-size:14px;color:#374151;">
    Press <strong>Ctrl+P</strong> (or <strong>Cmd+P</strong> on Mac) to save as PDF &nbsp;|&nbsp;
    Set Margins to <strong>None</strong> &amp; check <strong>Background graphics</strong> for best results &nbsp;|&nbsp;
    <button onclick="window.print()" style="background:${accent};color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:13px;">Print / Save PDF</button>
  </div>`;
}

function watermark(show: boolean): string {
  if (!show) return '';
  return `<div class="watermark">Created with 3BOX AI &mdash; 3box.ai</div>`;
}

function docHead(title: string, css: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    /* ── Reset ──────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Page sizing — A4 ──────────────────── */
    @page { size: A4; margin: 0; }

    ${css}

    /* ── Print ──────────────────────────────── */
    @media print {
      html, body { margin: 0; padding: 0; }
      body { background: #fff !important; }
      .no-print { display: none !important; }
      .page {
        box-shadow: none !important; margin: 0 !important;
        page-break-after: always; page-break-inside: avoid;
        overflow: hidden;
      }
      .page:last-child { page-break-after: auto; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
  <script>
    /* Auto-fit: widen layout + zoom so content fits exactly one A4 page at 794px */
    window.addEventListener('load', function() {
      var pages = document.querySelectorAll('.page');
      pages.forEach(function(page) {
        var pageHeight = 1123;
        var contentHeight = page.scrollHeight;
        if (contentHeight > pageHeight) {
          var scale = pageHeight / contentHeight;
          scale = Math.max(scale, 0.55);
          /* Widen the page so content reflows shorter, then zoom brings width back to 794px */
          page.style.width = Math.ceil(794 / scale) + 'px';
          page.style.minHeight = pageHeight + 'px';
          page.style.zoom = String(scale);
          page.style.overflow = 'hidden';
        }
      });
    });
  </script>
</head>`;
}

/* ─── Shared section builders ────────────────────────────────── */

function buildSkillsSection(
  skills: string[],
  skillDescriptions: Record<string, string> | undefined,
  cssClass: string,
): string {
  if (!skills.length) return '';
  return skills
    .map(
      (s) => {
        const desc = getSkillDescription(s, skillDescriptions);
        return desc
          ? `<div class="${cssClass}"><span class="skill-name">${esc(s)}</span><span class="skill-desc"> &mdash; ${esc(desc)}</span></div>`
          : `<div class="${cssClass}"><span class="skill-name">${esc(s)}</span></div>`;
      },
    )
    .join('');
}

function buildProjectsHTML(
  projects: BuildHTMLParams['projects'],
  entryClass: string,
): string {
  if (!projects || !projects.length) return '';
  return projects
    .map(
      (proj) => `
      <div class="${entryClass}">
        <div class="entry-header">
          <span class="entry-role">${esc(proj.name)}</span>
          ${proj.url ? `<a href="${esc(proj.url)}" class="project-link">${esc(proj.url)}</a>` : ''}
        </div>
        <div class="project-desc">${esc(proj.description)}</div>
        ${proj.technologies.length ? `<div class="project-tech">${proj.technologies.map((t) => esc(t)).join(' &middot; ')}</div>` : ''}
      </div>`,
    )
    .join('');
}

function buildCertsHTML(
  certifications: BuildHTMLParams['certifications'],
): string {
  if (!certifications.length) return '';
  return certifications
    .map(
      (c) =>
        `<div class="cert">${c.verified ? '<span class="verified">&#10003;</span>' : ''}
         <span class="cert-name">${esc(c.name)}</span>
         <span class="cert-issuer"> &mdash; ${esc(c.issuer)} (${esc(c.date)})</span></div>`,
    )
    .join('');
}

/* ================================================================
   Template 1 — Modern  (accent #2563eb)
   Two-column: left sidebar + right content
   ================================================================ */

function buildModern(p: BuildHTMLParams): string {
  const accent = '#2563eb';
  const { contact, summary, experience, education, skills, skillDescriptions, certifications, projects, showWatermark } = p;

  /* ── Sidebar contact lines ─────────────── */
  const contactLines: string[] = [];
  if (contact.email) contactLines.push(`<div class="sidebar-item"><span class="sidebar-icon">&#9993;</span> ${esc(contact.email)}</div>`);
  if (contact.phone) contactLines.push(`<div class="sidebar-item"><span class="sidebar-icon">&#9742;</span> ${esc(contact.phone)}</div>`);
  if (contact.location) contactLines.push(`<div class="sidebar-item"><span class="sidebar-icon">&#9906;</span> ${esc(contact.location)}</div>`);
  if (contact.linkedin) contactLines.push(`<div class="sidebar-item"><span class="sidebar-icon">in</span> <a href="https://${esc(contact.linkedin)}">${esc(contact.linkedin)}</a></div>`);
  if (contact.portfolio) contactLines.push(`<div class="sidebar-item"><span class="sidebar-icon">&#9901;</span> <a href="https://${esc(contact.portfolio)}">${esc(contact.portfolio)}</a></div>`);

  /* ── Skills as tags for sidebar ──────────── */
  const skillTagsHTML = skills
    .map((s) => `<span class="skill-tag">${esc(s)}</span>`)
    .join('');

  /* ── Experience HTML ────────────────────── */
  const expHTML = experience
    .map(
      (exp) => `
      <div class="entry">
        <div class="entry-header">
          <div><span class="entry-role">${esc(exp.role)}</span><span class="entry-company"> &mdash; ${esc(exp.company)}</span></div>
          <span class="entry-date">${esc(exp.startDate)} &ndash; ${exp.current ? 'Present' : esc(exp.endDate)}</span>
        </div>
        <div class="entry-location">${esc(exp.location)}</div>
        <ul>${normalizeBullets(exp.bullets).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  /* ── Education HTML ─────────────────────── */
  const eduHTML = education
    .map(
      (edu) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <span class="entry-role">${esc(edu.institution)}</span>
          </div>
          <span class="entry-date">${esc(edu.startDate)} &ndash; ${esc(edu.endDate)}</span>
        </div>
        <div class="edu-detail">${esc(edu.degree)} in ${esc(edu.field)}${edu.gpa ? ` &middot; GPA: ${esc(edu.gpa)}` : ''}</div>
      </div>`,
    )
    .join('');

  /* ── Projects HTML ──────────────────────── */
  const projHTML = buildProjectsHTML(projects, 'entry');

  /* ── Certifications HTML ────────────────── */
  const certsHTML = buildCertsHTML(certifications);

  const css = `
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1f2937; background: #e5e7eb; line-height: 1.6;
    }
    .page {
      width: 794px; min-height: 1123px; margin: 20px auto;
      display: flex; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.12);
      position: relative;
    }

    /* ── Sidebar ────────────────────────────── */
    .sidebar {
      width: 30%; background: #f0f4f8; padding: 28px 18px 20px 24px; flex-shrink: 0;
      display: flex; flex-direction: column;
    }
    .sidebar h1 { font-size: 22px; font-weight: 700; color: ${accent}; margin-bottom: 12px; line-height: 1.2; }
    .sidebar-section-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
      color: ${accent}; margin: 14px 0 5px; padding-bottom: 3px; border-bottom: 1px solid #d0d8e4;
    }
    .sidebar-item { font-size: 11px; color: #374151; margin-bottom: 4px; word-break: break-word; line-height: 1.4; }
    .sidebar-item a { color: ${accent}; text-decoration: none; }
    .sidebar-icon { display: inline-block; width: 15px; color: ${accent}; font-style: normal; text-align: center; margin-right: 4px; }
    .skill-tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .skill-tag {
      font-size: 10px; padding: 3px 8px; border-radius: 3px;
      background: ${accent}15; border: 1px solid ${accent}30; color: ${accent};
      white-space: nowrap;
    }
    .sidebar-edu { font-size: 11px; margin-bottom: 6px; }
    .sidebar-edu-degree { font-weight: 600; color: #374151; }
    .sidebar-edu-school { color: #6b7280; }
    .sidebar-edu-date { font-size: 10px; color: #9ca3af; }
    .sidebar-cert { font-size: 11px; margin-bottom: 5px; }
    .sidebar-cert-name { font-weight: 600; color: #374151; }
    .sidebar-cert-issuer { color: #6b7280; }
    .sidebar-spacer { flex: 1; }

    /* ── Main content ───────────────────────── */
    .main {
      width: 70%; padding: 28px 24px 20px;
      display: flex; flex-direction: column;
    }
    .section-title {
      font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
      color: ${accent}; margin: 14px 0 6px; padding-bottom: 4px; border-bottom: 2px solid ${accent};
    }
    .section-title:first-child { margin-top: 0; }
    .summary { font-size: 12px; color: #4b5563; line-height: 1.55; }

    /* ── Entries ─────────────────────────────── */
    .entry { margin-bottom: 12px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
    .entry-role { font-weight: 600; font-size: 13px; color: #111827; }
    .entry-company { font-size: 12px; color: #6b7280; }
    .entry-date { font-size: 11px; color: #9ca3af; white-space: nowrap; }
    .entry-location { font-size: 11px; color: #9ca3af; margin-bottom: 3px; }
    .edu-detail { font-size: 12px; color: #4b5563; margin-top: 2px; }
    ul { list-style: disc; padding-left: 16px; margin-top: 3px; }
    li { font-size: 12px; color: #374151; margin-bottom: 2px; line-height: 1.5; }

    /* ── Projects ────────────────────────────── */
    .project-link { font-size: 11px; color: ${accent}; text-decoration: none; }
    .project-desc { font-size: 12px; color: #4b5563; margin-top: 2px; line-height: 1.5; }
    .project-tech { font-size: 11px; color: #9ca3af; margin-top: 2px; }

    /* ── Certifications ─────────────────────── */
    .cert { font-size: 12px; color: #374151; margin-bottom: 4px; }
    .cert-name { font-weight: 600; }
    .cert-issuer { color: #6b7280; }
    .verified { color: #16a34a; margin-right: 4px; }

    /* ── Fill + Watermark ───────────────────── */
    .fill-space { flex: 1; }
    .watermark {
      text-align: center; font-size: 10px; color: #9ca3af;
      margin-top: auto; padding-top: 8px; border-top: 1px solid #e5e7eb;
    }
  `;

  return `${docHead(`${esc(contact.name)} &ndash; Resume`, css)}
<body>
  ${printBar(accent, p.isPreview)}
  <div class="page">
    <!-- Sidebar -->
    <div class="sidebar">
      <h1>${esc(contact.name)}</h1>

      <div class="sidebar-section-title">Contact</div>
      ${contactLines.join('\n      ')}

      ${skills.length ? `
      <div class="sidebar-section-title">Skills</div>
      <div class="skill-tags">${skillTagsHTML}</div>` : ''}

      ${education.length ? `
      <div class="sidebar-section-title">Education</div>
      ${education.map((edu) => `
        <div class="sidebar-edu">
          <div class="sidebar-edu-degree">${esc(edu.degree)}${edu.field ? ` in ${esc(edu.field)}` : ''}</div>
          <div class="sidebar-edu-school">${esc(edu.institution)}</div>
          ${edu.endDate ? `<div class="sidebar-edu-date">${esc(edu.startDate)} &ndash; ${esc(edu.endDate)}</div>` : ''}
        </div>`).join('')}` : ''}

      ${certifications.length ? `
      <div class="sidebar-section-title">Certifications</div>
      ${certifications.map((c) => `
        <div class="sidebar-cert">
          <div class="sidebar-cert-name">${c.verified ? '<span class="verified">&#10003;</span>' : ''}${esc(c.name)}</div>
          ${c.issuer ? `<div class="sidebar-cert-issuer">${esc(c.issuer)}</div>` : ''}
        </div>`).join('')}` : ''}

      <div class="sidebar-spacer"></div>
    </div>

    <!-- Main content -->
    <div class="main">
      ${summary ? `<div class="section-title">Professional Summary</div><div class="summary">${esc(summary)}</div>` : ''}

      ${experience.length ? `<div class="section-title">Work Experience</div>${expHTML}` : ''}

      ${projects && projects.length ? `<div class="section-title">Projects</div>${projHTML}` : ''}

      <div class="fill-space"></div>
      ${watermark(showWatermark)}
    </div>
  </div>
</body>
</html>`;
}

/* ================================================================
   Template 2 — Classic  (accent #1e293b)
   Single-column, centered header, serif-inspired, traditional
   ================================================================ */

function buildClassic(p: BuildHTMLParams): string {
  const accent = '#1e293b';
  const { contact, summary, experience, education, skills, certifications, projects, showWatermark } = p;

  /* ── Contact row (bullet-separated) ──────── */
  const contactParts: string[] = [];
  if (contact.email) contactParts.push(esc(contact.email));
  if (contact.phone) contactParts.push(esc(contact.phone));
  if (contact.location) contactParts.push(esc(contact.location));
  if (contact.linkedin) contactParts.push(`<a href="https://${esc(contact.linkedin)}">${esc(contact.linkedin)}</a>`);
  if (contact.portfolio) contactParts.push(`<a href="https://${esc(contact.portfolio)}">${esc(contact.portfolio)}</a>`);
  const contactRow = contactParts.join(' <span class="bullet">&bull;</span> ');

  /* ── Skill pills ────────────────────────── */
  const skillPillsHTML = skills
    .map((s) => `<span class="skill-pill">${esc(s)}</span>`)
    .join('');

  /* ── Experience ─────────────────────────── */
  const expHTML = experience
    .map(
      (exp) => `
      <div class="entry">
        <div class="entry-header">
          <div><span class="entry-role">${esc(exp.role)}</span> <span class="entry-company">&mdash; ${esc(exp.company)}${exp.location ? `, ${esc(exp.location)}` : ''}</span></div>
          <span class="entry-date">${esc(exp.startDate)} &ndash; ${exp.current ? 'Present' : esc(exp.endDate)}</span>
        </div>
        <ul>${normalizeBullets(exp.bullets).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  /* ── Education ──────────────────────────── */
  const eduHTML = education
    .map(
      (edu) => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-role">${esc(edu.degree)}${edu.field ? ` in ${esc(edu.field)}` : ''}</span>
          ${edu.endDate ? `<span class="entry-date">${esc(edu.endDate)}</span>` : ''}
        </div>
        <div class="entry-sub">${esc(edu.institution)}${edu.gpa ? ` &middot; GPA: ${esc(edu.gpa)}` : ''}</div>
      </div>`,
    )
    .join('');

  /* ── Projects ───────────────────────────── */
  const projHTML = buildProjectsHTML(projects, 'entry');

  /* ── Certifications ─────────────────────── */
  const certsHTML = certifications
    .map(
      (c) => `<div class="cert"><span class="cert-name">${esc(c.name)}</span>${c.issuer ? `<span class="cert-issuer"> &mdash; ${esc(c.issuer)}</span>` : ''}</div>`,
    )
    .join('');

  const css = `
    body {
      font-family: Georgia, 'Times New Roman', 'Palatino Linotype', serif;
      color: #1f2937; background: #e5e7eb; line-height: 1.5;
    }
    .page {
      width: 794px; min-height: 1123px; margin: 20px auto;
      padding: 28px 36px 24px; background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
      display: flex; flex-direction: column;
    }

    /* ── Header ─────────────────────────────── */
    .header { text-align: center; margin-bottom: 12px; }
    .header h1 { font-size: 24px; font-weight: 700; color: ${accent}; margin-bottom: 6px; letter-spacing: 0.5px; }
    .contact-row { font-size: 11px; color: #6b7280; font-family: 'Segoe UI', system-ui, sans-serif; }
    .contact-row a { color: ${accent}; text-decoration: none; }
    .bullet { color: #d1d5db; margin: 0 4px; }
    .header hr { border: none; border-top: 2px solid ${accent}; margin-top: 12px; }

    /* ── Section titles ─────────────────────── */
    .section-title {
      font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
      color: ${accent}; margin: 14px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1;
    }

    /* ── Skill pills ─────────────────────────── */
    .skill-pills { display: flex; flex-wrap: wrap; gap: 5px; }
    .skill-pill {
      font-size: 11px; padding: 3px 10px; border-radius: 12px;
      border: 1px solid ${accent}40; background: ${accent}08; color: #374151;
      white-space: nowrap; font-family: 'Segoe UI', system-ui, sans-serif;
    }

    /* ── Entries ─────────────────────────────── */
    .entry { margin-bottom: 12px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
    .entry-role { font-weight: 700; font-size: 13px; color: #111827; }
    .entry-company { font-size: 12px; color: #6b7280; }
    .entry-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .entry-date { font-size: 11px; color: #9ca3af; white-space: nowrap; font-family: 'Segoe UI', system-ui, sans-serif; }
    ul { list-style: disc; padding-left: 16px; margin-top: 3px; }
    li { font-size: 12px; color: #374151; margin-bottom: 2px; line-height: 1.5; font-family: 'Segoe UI', system-ui, sans-serif; }

    /* ── Summary ─────────────────────────────── */
    .summary { font-size: 12px; color: #4b5563; line-height: 1.55; font-family: 'Segoe UI', system-ui, sans-serif; }

    /* ── Projects ────────────────────────────── */
    .project-link { font-size: 11px; color: ${accent}; text-decoration: none; font-family: 'Segoe UI', system-ui, sans-serif; }
    .project-desc { font-size: 12px; color: #4b5563; margin-top: 2px; line-height: 1.5; font-family: 'Segoe UI', system-ui, sans-serif; }
    .project-tech { font-size: 11px; color: #9ca3af; margin-top: 2px; font-family: 'Segoe UI', system-ui, sans-serif; }

    /* ── Certifications ─────────────────────── */
    .cert { font-size: 12px; color: #374151; margin-bottom: 4px; font-family: 'Segoe UI', system-ui, sans-serif; }
    .cert-name { font-weight: 600; }
    .cert-issuer { color: #6b7280; }
    .verified { color: #16a34a; margin-right: 4px; }

    /* ── Fill + Watermark ───────────────────── */
    .fill-space { flex: 1; }
    .watermark {
      text-align: center; font-size: 10px; color: #9ca3af;
      margin-top: auto; padding-top: 8px; border-top: 1px solid #e5e7eb;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }
  `;

  return `${docHead(`${esc(contact.name)} &ndash; Resume`, css)}
<body>
  ${printBar(accent, p.isPreview)}
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>${esc(contact.name)}</h1>
      <div class="contact-row">${contactRow}</div>
      <hr />
    </div>

    ${summary ? `<div class="section-title">Professional Summary</div><div class="summary">${esc(summary)}</div>` : ''}

    ${experience.length ? `<div class="section-title">Work Experience</div>${expHTML}` : ''}

    ${education.length ? `<div class="section-title">Education</div>${eduHTML}` : ''}

    ${skills.length ? `<div class="section-title">Skills</div><div class="skill-pills">${skillPillsHTML}</div>` : ''}

    ${certifications.length ? `<div class="section-title">Certifications</div>${certsHTML}` : ''}

    ${projects && projects.length ? `<div class="section-title">Projects</div>${projHTML}` : ''}

    <div class="fill-space"></div>
    ${watermark(showWatermark)}
  </div>
</body>
</html>`;
}

/* ================================================================
   Template 3 — Minimal  (accent #374151)
   Single-column, maximum whitespace, ultraclean
   ================================================================ */

function buildMinimal(p: BuildHTMLParams): string {
  const accent = '#374151';
  const { contact, summary, experience, education, skills, certifications, projects, showWatermark } = p;

  /* ── Contact pipe-separated ─────────────── */
  const contactParts: string[] = [];
  if (contact.email) contactParts.push(esc(contact.email));
  if (contact.phone) contactParts.push(esc(contact.phone));
  if (contact.location) contactParts.push(esc(contact.location));
  if (contact.linkedin) contactParts.push(`<a href="https://${esc(contact.linkedin)}">${esc(contact.linkedin)}</a>`);
  if (contact.portfolio) contactParts.push(`<a href="https://${esc(contact.portfolio)}">${esc(contact.portfolio)}</a>`);
  const contactLine = contactParts.join(' <span class="pipe">|</span> ');

  /* ── Skills — dot-joined string ─────────── */
  const skillsHTML = skills.map((s) => esc(s)).join(' &nbsp;&middot;&nbsp; ');

  /* ── Experience ─────────────────────────── */
  const expHTML = experience
    .map(
      (exp) => `
      <div class="entry">
        <div class="entry-header">
          <span><span class="entry-role">${esc(exp.role)}</span> <span class="entry-company">&mdash; ${esc(exp.company)}</span></span>
          <span class="entry-date">${esc(exp.startDate)} &ndash; ${exp.current ? 'Present' : esc(exp.endDate)}</span>
        </div>
        <ul>${normalizeBullets(exp.bullets).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  /* ── Education ──────────────────────────── */
  const eduHTML = education
    .map(
      (edu) => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-degree">${esc(edu.degree)} in ${esc(edu.field)}</span>
          <span class="entry-date">${esc(edu.endDate)}</span>
        </div>
        <div class="entry-institution">${esc(edu.institution)}${edu.gpa ? ` &middot; GPA: ${esc(edu.gpa)}` : ''}</div>
      </div>`,
    )
    .join('');

  /* ── Projects ───────────────────────────── */
  const projHTML = buildProjectsHTML(projects, 'entry');

  /* ── Certifications ─────────────────────── */
  const certsHTML = certifications
    .map(
      (c) =>
        `<div class="cert"><span class="cert-name">${esc(c.name)}</span><span class="cert-issuer"> &mdash; ${esc(c.issuer)}</span></div>`,
    )
    .join('');

  const css = `
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: #374151; background: #e5e7eb; line-height: 1.6;
    }
    .page {
      width: 794px; min-height: 1123px; margin: 20px auto;
      padding: 36px 44px 24px; background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
      display: flex; flex-direction: column;
    }

    /* ── Header ─────────────────────────────── */
    .header { margin-bottom: 20px; }
    .header h1 { font-size: 28px; font-weight: 300; color: #111827; margin-bottom: 6px; letter-spacing: -0.5px; }
    .contact-line { font-size: 11px; color: #9ca3af; }
    .contact-line a { color: #6b7280; text-decoration: none; }
    .pipe { margin: 0 6px; color: #d1d5db; }

    /* ── Section titles ─────────────────────── */
    .section-title {
      font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2.5px;
      color: #9ca3af; margin: 18px 0 8px; padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }

    /* ── Skills (dot-joined string) ──────────── */
    .skills-text { font-size: 12px; color: #4b5563; line-height: 1.6; }

    /* ── Entries ─────────────────────────────── */
    .entry { margin-bottom: 14px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
    .entry-role { font-weight: 600; font-size: 13px; color: #111827; }
    .entry-company { font-size: 13px; color: #6b7280; }
    .entry-degree { font-weight: 500; font-size: 13px; color: #111827; }
    .entry-institution { font-size: 12px; color: #9ca3af; margin-top: 2px; }
    .entry-date { font-size: 11px; color: #d1d5db; white-space: nowrap; }
    ul { list-style: none; padding-left: 0; margin-top: 4px; }
    li { font-size: 12px; color: #4b5563; margin-bottom: 3px; line-height: 1.55; padding-left: 14px; position: relative; }
    li::before { content: '\\2022'; position: absolute; left: 0; color: #d1d5db; font-size: 9px; top: 2px; }

    /* ── Summary ─────────────────────────────── */
    .summary { font-size: 12px; color: #6b7280; line-height: 1.6; }

    /* ── Projects ────────────────────────────── */
    .project-link { font-size: 11px; color: #6b7280; text-decoration: none; }
    .project-desc { font-size: 12px; color: #6b7280; margin-top: 2px; line-height: 1.55; }
    .project-tech { font-size: 11px; color: #d1d5db; margin-top: 2px; }

    /* ── Certifications ─────────────────────── */
    .cert { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .cert-name { font-weight: 500; color: #374151; }
    .cert-issuer { color: #9ca3af; }

    /* ── Fill + Watermark ───────────────────── */
    .fill-space { flex: 1; }
    .watermark {
      text-align: center; font-size: 10px; color: #d1d5db;
      margin-top: auto; padding-top: 10px;
    }
  `;

  return `${docHead(`${esc(contact.name)} &ndash; Resume`, css)}
<body>
  ${printBar(accent, p.isPreview)}
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>${esc(contact.name)}</h1>
      <div class="contact-line">${contactLine}</div>
    </div>

    ${summary ? `<div class="section-title">Summary</div><div class="summary">${esc(summary)}</div>` : ''}

    ${experience.length ? `<div class="section-title">Experience</div>${expHTML}` : ''}

    ${education.length ? `<div class="section-title">Education</div>${eduHTML}` : ''}

    ${skills.length ? `<div class="section-title">Skills</div><div class="skills-text">${skillsHTML}</div>` : ''}

    ${certifications.length ? `<div class="section-title">Certifications</div>${certsHTML}` : ''}

    ${projects && projects.length ? `<div class="section-title">Projects</div>${projHTML}` : ''}

    <div class="fill-space"></div>
    ${watermark(showWatermark)}
  </div>
</body>
</html>`;
}

/* ================================================================
   Template 4 — Creative  (accent #7c3aed purple)
   Gradient header + single-column body
   ================================================================ */

function buildCreative(p: BuildHTMLParams): string {
  const accent = '#7c3aed';
  const { contact, summary, experience, education, skills, certifications, projects, showWatermark } = p;

  /* ── Contact info (white text in header) ─── */
  const contactParts: string[] = [];
  if (contact.email) contactParts.push(esc(contact.email));
  if (contact.phone) contactParts.push(esc(contact.phone));
  if (contact.location) contactParts.push(esc(contact.location));
  if (contact.linkedin) contactParts.push(`<a href="https://${esc(contact.linkedin)}" style="color:#fff;text-decoration:none;">${esc(contact.linkedin)}</a>`);
  if (contact.portfolio) contactParts.push(`<a href="https://${esc(contact.portfolio)}" style="color:#fff;text-decoration:none;">${esc(contact.portfolio)}</a>`);
  const contactLine = contactParts.join(' <span style="margin:0 6px;opacity:0.6;">|</span> ');

  /* ── Skill pills (first 10, rotating colors) */
  const pillColors = ['#a855f7', '#00d4ff', '#00ff88', '#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#06b6d4'];
  const skillPills = skills.slice(0, 10)
    .map((s, i) => {
      const c = pillColors[i % pillColors.length];
      return `<span class="skill-pill" style="background:${c}15;color:${c};border:1px solid ${c}30;">${esc(s)}</span>`;
    })
    .join('');

  /* ── Experience ─────────────────────────── */
  const expHTML = experience
    .map(
      (exp) => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-role">${esc(exp.role)}</span>
          <span class="entry-date">${esc(exp.startDate)} &ndash; ${exp.current ? 'Present' : esc(exp.endDate)}</span>
        </div>
        <div class="entry-company">${esc(exp.company)} &middot; ${esc(exp.location)}</div>
        <ul>${normalizeBullets(exp.bullets).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  /* ── Education ──────────────────────────── */
  const eduHTML = education
    .map(
      (edu) => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-degree">${esc(edu.degree)} in ${esc(edu.field)}</span>
          <span class="entry-date">${esc(edu.endDate)}</span>
        </div>
        <div class="entry-institution">${esc(edu.institution)}${edu.gpa ? ` &middot; GPA: ${esc(edu.gpa)}` : ''}</div>
      </div>`,
    )
    .join('');

  /* ── Projects ───────────────────────────── */
  const projHTML = buildProjectsHTML(projects, 'entry');

  /* ── Certifications ─────────────────────── */
  const certsHTML = certifications
    .map(
      (c) =>
        `<div class="cert"><span class="cert-name">${esc(c.name)}</span><span class="cert-issuer"> &mdash; ${esc(c.issuer)}</span></div>`,
    )
    .join('');

  const css = `
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1f2937; background: #e5e7eb; line-height: 1.55;
    }
    .page {
      width: 794px; min-height: 1123px; margin: 20px auto;
      overflow: hidden; background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
      display: flex; flex-direction: column;
    }

    /* ── Gradient header banner ──────────────── */
    .creative-header {
      background: linear-gradient(135deg, #a855f7, #00d4ff, #00ff88);
      padding: 28px 32px 22px; color: #fff; flex-shrink: 0;
    }
    .creative-header h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
    .creative-header .contact-row { font-size: 11px; color: rgba(255,255,255,0.85); }

    /* ── Skill pills below header ────────────── */
    .skill-pills { padding: 12px 32px; display: flex; flex-wrap: wrap; gap: 6px; flex-shrink: 0; }
    .skill-pill {
      display: inline-block; font-size: 11px; padding: 3px 12px;
      border-radius: 20px; white-space: nowrap; font-weight: 500;
    }

    /* ── Content area ───────────────────────── */
    .content-area {
      flex: 1; padding: 0 32px 20px; display: flex; flex-direction: column;
    }

    /* ── Section titles with gradient underline ─ */
    .section-title {
      font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
      color: ${accent}; margin: 16px 0 8px; padding-bottom: 4px;
      border-bottom: 2px solid transparent;
      border-image: linear-gradient(90deg, #a855f7, #00d4ff, #00ff88) 1;
    }

    /* ── About section with accent bar ────────── */
    .about-wrap { display: flex; gap: 12px; margin: 8px 0 14px; }
    .accent-bar {
      width: 3px; flex-shrink: 0; border-radius: 2px;
      background: linear-gradient(to bottom, #a855f7, #00d4ff);
    }
    .summary { font-size: 12px; color: #4b5563; line-height: 1.6; }

    /* ── Entries ─────────────────────────────── */
    .entry { margin-bottom: 12px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
    .entry-role { font-weight: 600; font-size: 13px; color: #111827; }
    .entry-company { font-size: 12px; color: #9ca3af; margin-top: 2px; }
    .entry-degree { font-weight: 500; font-size: 13px; color: #111827; }
    .entry-institution { font-size: 12px; color: #9ca3af; margin-top: 2px; }
    .entry-date { font-size: 11px; color: #9ca3af; white-space: nowrap; }
    ul { list-style: none; padding-left: 0; margin-top: 4px; }
    li { font-size: 12px; color: #374151; margin-bottom: 3px; line-height: 1.55; padding-left: 14px; position: relative; }
    li::before {
      content: ''; position: absolute; left: 0; top: 5px;
      width: 3px; height: 10px; border-radius: 2px;
      background: linear-gradient(to bottom, #a855f7, #00d4ff);
    }

    /* ── Projects ────────────────────────────── */
    .project-link { font-size: 11px; color: ${accent}; text-decoration: none; }
    .project-desc { font-size: 12px; color: #4b5563; margin-top: 2px; line-height: 1.55; }
    .project-tech { font-size: 11px; color: #9ca3af; margin-top: 2px; }

    /* ── Certifications ─────────────────────── */
    .cert { font-size: 12px; color: #374151; margin-bottom: 4px; }
    .cert-name { font-weight: 600; }
    .cert-issuer { color: #6b7280; }

    /* ── Bottom gradient bar ─────────────────── */
    .bottom-bar {
      height: 3px; margin: 0 32px;
      background: linear-gradient(90deg, #a855f7, #00d4ff, #00ff88); border-radius: 2px;
      flex-shrink: 0;
    }

    /* ── Fill + Watermark ───────────────────── */
    .fill-space { flex: 1; }
    .watermark {
      text-align: center; font-size: 10px; color: #9ca3af;
      margin-top: auto; padding: 8px 32px 16px;
    }
  `;

  return `${docHead(`${esc(contact.name)} &ndash; Resume`, css)}
<body>
  ${printBar(accent, p.isPreview)}
  <div class="page">
    <!-- Gradient header banner -->
    <div class="creative-header">
      <h1>${esc(contact.name)}</h1>
      <div class="contact-row">${contactLine}</div>
    </div>

    <!-- Colorful skill pills -->
    ${skills.length ? `<div class="skill-pills">${skillPills}</div>` : ''}

    <!-- Content area -->
    <div class="content-area">
      <!-- About section with accent bar -->
      ${summary ? `<div class="section-title">About</div><div class="about-wrap"><div class="accent-bar"></div><div class="summary">${esc(summary)}</div></div>` : ''}

      ${experience.length ? `<div class="section-title">Experience</div>${expHTML}` : ''}

      ${education.length ? `<div class="section-title">Education</div>${eduHTML}` : ''}

      ${certifications.length ? `<div class="section-title">Certifications</div>${certsHTML}` : ''}

      ${projects && projects.length ? `<div class="section-title">Projects</div>${projHTML}` : ''}

      <div class="fill-space"></div>
    </div>

    <!-- Bottom gradient bar -->
    <div class="bottom-bar"></div>

    ${watermark(showWatermark)}
  </div>
</body>
</html>`;
}

/* ================================================================
   Main dispatcher
   ================================================================ */

export function buildResumeHTML(params: BuildHTMLParams): string {
  switch (params.template) {
    case 'classic':
      return buildClassic(params);
    case 'minimal':
      return buildMinimal(params);
    case 'creative':
      return buildCreative(params);
    case 'modern':
    default:
      return buildModern(params);
  }
}
