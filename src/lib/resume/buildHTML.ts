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
  return 'Professional proficiency in industry applications';
}

/* ─── Shared helpers ─────────────────────────────────────────── */

export function esc(str: string): string {
  return (str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function printBar(accent: string): string {
  return `<div class="no-print" style="background:#f3f4f6;text-align:center;padding:12px;font-size:14px;color:#374151;">
    Press <strong>Ctrl+P</strong> (or <strong>Cmd+P</strong> on Mac) to save as PDF &nbsp;|&nbsp;
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

    /* ── Page sizing ───────────────────────── */
    @page { size: letter; margin: 0; }

    ${css}

    /* ── Print ──────────────────────────────── */
    @media print {
      html, body { width: 816px; }
      body { background: #fff !important; margin: 0; padding: 0; }
      .no-print { display: none !important; }
      .page { box-shadow: none !important; margin: 0 !important; page-break-after: always; }
      .page:last-child { page-break-after: auto; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
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
      (s) =>
        `<div class="${cssClass}"><span class="skill-name">${esc(s)}</span><span class="skill-desc"> &mdash; ${esc(getSkillDescription(s, skillDescriptions))}</span></div>`,
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

  /* ── Skills list with descriptions ──────── */
  const skillsHTML = buildSkillsSection(skills, skillDescriptions, 'skill-row');

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
        <ul>${exp.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
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
      color: #1f2937; background: #e5e7eb; line-height: 1.55;
    }
    .page {
      width: 816px; min-height: 1056px; margin: 20px auto;
      display: flex; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.12);
      position: relative;
    }

    /* ── Sidebar ────────────────────────────── */
    .sidebar {
      width: 30%; background: #f0f4f8; padding: 32px 18px 24px; flex-shrink: 0;
      display: flex; flex-direction: column;
    }
    .sidebar h1 { font-size: 20px; font-weight: 700; color: ${accent}; margin-bottom: 14px; line-height: 1.25; }
    .sidebar-section-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
      color: ${accent}; margin: 16px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #d0d8e4;
    }
    .sidebar-item { font-size: 11.5px; color: #374151; margin-bottom: 5px; word-break: break-word; }
    .sidebar-item a { color: ${accent}; text-decoration: none; }
    .sidebar-icon { display: inline-block; width: 16px; color: ${accent}; font-style: normal; text-align: center; margin-right: 4px; }
    .sidebar-spacer { flex: 1; }

    /* ── Main content ───────────────────────── */
    .main {
      width: 70%; padding: 32px 28px 24px;
      display: flex; flex-direction: column;
    }
    .section-title {
      font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
      color: ${accent}; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid ${accent};
    }
    .section-title:first-child { margin-top: 0; }
    .summary { font-size: 12.5px; color: #4b5563; line-height: 1.6; }

    /* ── Skills with descriptions ────────────── */
    .skill-row { font-size: 11.5px; color: #374151; margin-bottom: 3px; line-height: 1.45; }
    .skill-name { font-weight: 600; color: #111827; }
    .skill-desc { color: #6b7280; }

    /* ── Entries ─────────────────────────────── */
    .entry { margin-bottom: 12px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
    .entry-role { font-weight: 600; font-size: 13px; color: #111827; }
    .entry-company { font-size: 12.5px; color: #6b7280; }
    .entry-date { font-size: 11.5px; color: #9ca3af; white-space: nowrap; }
    .entry-location { font-size: 11.5px; color: #9ca3af; margin-bottom: 3px; }
    .edu-detail { font-size: 12.5px; color: #4b5563; margin-top: 2px; }
    ul { list-style: disc; padding-left: 16px; margin-top: 3px; }
    li { font-size: 12.5px; color: #374151; margin-bottom: 2px; line-height: 1.5; }

    /* ── Projects ────────────────────────────── */
    .project-link { font-size: 11px; color: ${accent}; text-decoration: none; }
    .project-desc { font-size: 12px; color: #4b5563; margin-top: 2px; line-height: 1.5; }
    .project-tech { font-size: 11px; color: #9ca3af; margin-top: 2px; }

    /* ── Certifications ─────────────────────── */
    .cert { font-size: 12.5px; color: #374151; margin-bottom: 4px; }
    .cert-name { font-weight: 600; }
    .cert-issuer { color: #6b7280; }
    .verified { color: #16a34a; margin-right: 4px; }

    /* ── Fill + Watermark ───────────────────── */
    .fill-space { flex: 1; }
    .watermark {
      text-align: center; font-size: 10px; color: #9ca3af;
      margin-top: auto; padding-top: 10px; border-top: 1px solid #e5e7eb;
    }
  `;

  return `${docHead(`${esc(contact.name)} &ndash; Resume`, css)}
<body>
  ${printBar(accent)}
  <div class="page">
    <!-- Sidebar -->
    <div class="sidebar">
      <h1>${esc(contact.name)}</h1>

      <div class="sidebar-section-title">Contact</div>
      ${contactLines.join('\n      ')}

      <div class="sidebar-spacer"></div>
    </div>

    <!-- Main content -->
    <div class="main">
      ${summary ? `<div class="section-title">Professional Summary</div><div class="summary">${esc(summary)}</div>` : ''}

      ${skills.length ? `<div class="section-title">Technical Skills</div><div class="skills-list">${skillsHTML}</div>` : ''}

      ${experience.length ? `<div class="section-title">Work Experience</div>${expHTML}` : ''}

      ${education.length ? `<div class="section-title">Education</div>${eduHTML}` : ''}

      ${projects && projects.length ? `<div class="section-title">Projects</div>${projHTML}` : ''}

      ${certifications.length ? `<div class="section-title">Certifications</div>${certsHTML}` : ''}

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
  const { contact, summary, experience, education, skills, skillDescriptions, certifications, projects, showWatermark } = p;

  /* ── Contact row (pipe-separated) ──────── */
  const contactParts: string[] = [];
  if (contact.email) contactParts.push(esc(contact.email));
  if (contact.phone) contactParts.push(esc(contact.phone));
  if (contact.location) contactParts.push(esc(contact.location));
  if (contact.linkedin) contactParts.push(`<a href="https://${esc(contact.linkedin)}">${esc(contact.linkedin)}</a>`);
  if (contact.portfolio) contactParts.push(`<a href="https://${esc(contact.portfolio)}">${esc(contact.portfolio)}</a>`);
  const contactRow = contactParts.join(' <span class="pipe">|</span> ');

  /* ── Skills with descriptions ────────────── */
  const skillsHTML = buildSkillsSection(skills, skillDescriptions, 'skill-row');

  /* ── Experience ─────────────────────────── */
  const expHTML = experience
    .map(
      (exp) => `
      <div class="entry">
        <div class="entry-header">
          <div><span class="entry-role">${esc(exp.role)}</span>, <span class="entry-company">${esc(exp.company)}</span><span class="entry-loc"> &mdash; ${esc(exp.location)}</span></div>
          <span class="entry-date">${esc(exp.startDate)} &ndash; ${exp.current ? 'Present' : esc(exp.endDate)}</span>
        </div>
        <ul>${exp.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  /* ── Education ──────────────────────────── */
  const eduHTML = education
    .map(
      (edu) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <span class="entry-role">${esc(edu.institution)}</span>
            <span class="entry-loc"> &mdash; ${esc(edu.degree)} in ${esc(edu.field)}${edu.gpa ? `, GPA: ${esc(edu.gpa)}` : ''}</span>
          </div>
          <span class="entry-date">${esc(edu.startDate)} &ndash; ${esc(edu.endDate)}</span>
        </div>
      </div>`,
    )
    .join('');

  /* ── Projects ───────────────────────────── */
  const projHTML = buildProjectsHTML(projects, 'entry');

  /* ── Certifications ─────────────────────── */
  const certsHTML = buildCertsHTML(certifications);

  const css = `
    body {
      font-family: Georgia, 'Times New Roman', 'Palatino Linotype', serif;
      color: #1f2937; background: #e5e7eb; line-height: 1.5;
    }
    .page {
      width: 816px; min-height: 1056px; margin: 20px auto;
      padding: 40px 48px 32px; background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
      display: flex; flex-direction: column;
    }

    /* ── Header ─────────────────────────────── */
    .header { text-align: center; margin-bottom: 16px; }
    .header h1 { font-size: 26px; font-weight: 700; color: ${accent}; margin-bottom: 6px; letter-spacing: 0.5px; }
    .contact-row { font-size: 11.5px; color: #6b7280; font-family: 'Segoe UI', system-ui, sans-serif; }
    .contact-row a { color: ${accent}; text-decoration: none; }
    .pipe { color: #d1d5db; margin: 0 4px; }
    .header hr { border: none; border-top: 1.5px solid ${accent}; margin-top: 14px; }

    /* ── Section titles ─────────────────────── */
    .section-title {
      font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
      color: ${accent}; margin: 18px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1;
    }

    /* ── Skills with descriptions ────────────── */
    .skills-list { columns: 2; column-gap: 24px; }
    .skill-row {
      font-size: 12px; color: #374151; margin-bottom: 3px; line-height: 1.4;
      break-inside: avoid; font-family: 'Segoe UI', system-ui, sans-serif;
    }
    .skill-name { font-weight: 600; color: ${accent}; }
    .skill-desc { color: #6b7280; }

    /* ── Entries ─────────────────────────────── */
    .entry { margin-bottom: 12px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
    .entry-role { font-weight: 700; font-size: 13px; color: ${accent}; }
    .entry-company { font-size: 13px; color: #374151; }
    .entry-loc { font-size: 12px; color: #6b7280; }
    .entry-date { font-size: 11.5px; color: #9ca3af; white-space: nowrap; font-family: 'Segoe UI', system-ui, sans-serif; }
    ul { list-style: disc; padding-left: 18px; margin-top: 4px; }
    li { font-size: 12.5px; color: #374151; margin-bottom: 2px; line-height: 1.5; font-family: 'Segoe UI', system-ui, sans-serif; }

    /* ── Summary ─────────────────────────────── */
    .summary { font-size: 12.5px; color: #4b5563; line-height: 1.6; font-family: 'Segoe UI', system-ui, sans-serif; }

    /* ── Projects ────────────────────────────── */
    .project-link { font-size: 11px; color: ${accent}; text-decoration: none; font-family: 'Segoe UI', system-ui, sans-serif; }
    .project-desc { font-size: 12px; color: #4b5563; margin-top: 2px; line-height: 1.5; font-family: 'Segoe UI', system-ui, sans-serif; }
    .project-tech { font-size: 11px; color: #9ca3af; margin-top: 2px; font-family: 'Segoe UI', system-ui, sans-serif; }

    /* ── Certifications ─────────────────────── */
    .cert { font-size: 12.5px; color: #374151; margin-bottom: 4px; font-family: 'Segoe UI', system-ui, sans-serif; }
    .cert-name { font-weight: 600; }
    .cert-issuer { color: #6b7280; }
    .verified { color: #16a34a; margin-right: 4px; }

    /* ── Fill + Watermark ───────────────────── */
    .fill-space { flex: 1; }
    .watermark {
      text-align: center; font-size: 10px; color: #9ca3af;
      margin-top: auto; padding-top: 10px; border-top: 1px solid #e5e7eb;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }
  `;

  return `${docHead(`${esc(contact.name)} &ndash; Resume`, css)}
<body>
  ${printBar(accent)}
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>${esc(contact.name)}</h1>
      <div class="contact-row">${contactRow}</div>
      <hr />
    </div>

    ${summary ? `<div class="section-title">Professional Summary</div><div class="summary">${esc(summary)}</div>` : ''}

    ${skills.length ? `<div class="section-title">Technical Skills</div><div class="skills-list">${skillsHTML}</div>` : ''}

    ${experience.length ? `<div class="section-title">Experience</div>${expHTML}` : ''}

    ${education.length ? `<div class="section-title">Education</div>${eduHTML}` : ''}

    ${projects && projects.length ? `<div class="section-title">Projects</div>${projHTML}` : ''}

    ${certifications.length ? `<div class="section-title">Certifications</div>${certsHTML}` : ''}

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
  const { contact, summary, experience, education, skills, skillDescriptions, certifications, projects, showWatermark } = p;

  /* ── Contact inline ─────────────────────── */
  const contactParts: string[] = [];
  if (contact.email) contactParts.push(esc(contact.email));
  if (contact.phone) contactParts.push(esc(contact.phone));
  if (contact.location) contactParts.push(esc(contact.location));
  if (contact.linkedin) contactParts.push(`<a href="https://${esc(contact.linkedin)}">${esc(contact.linkedin)}</a>`);
  if (contact.portfolio) contactParts.push(`<a href="https://${esc(contact.portfolio)}">${esc(contact.portfolio)}</a>`);
  const contactLine = contactParts.join(' <span class="dot">&middot;</span> ');

  /* ── Skills with descriptions ────────────── */
  const skillsHTML = buildSkillsSection(skills, skillDescriptions, 'skill-row');

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
        <ul>${exp.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  /* ── Education ──────────────────────────── */
  const eduHTML = education
    .map(
      (edu) => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-role">${esc(edu.institution)}</span>
          <span class="entry-date">${esc(edu.startDate)} &ndash; ${esc(edu.endDate)}</span>
        </div>
        <div class="entry-company">${esc(edu.degree)} in ${esc(edu.field)}${edu.gpa ? ` &middot; GPA: ${esc(edu.gpa)}` : ''}</div>
      </div>`,
    )
    .join('');

  /* ── Projects ───────────────────────────── */
  const projHTML = buildProjectsHTML(projects, 'entry');

  /* ── Certifications ─────────────────────── */
  const certsHTML = buildCertsHTML(certifications);

  const css = `
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: #374151; background: #e5e7eb; line-height: 1.6;
    }
    .page {
      width: 816px; min-height: 1056px; margin: 20px auto;
      padding: 44px 52px 32px; background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
      display: flex; flex-direction: column;
    }

    /* ── Header ─────────────────────────────── */
    .header { margin-bottom: 24px; }
    .header h1 { font-size: 30px; font-weight: 300; color: #111827; margin-bottom: 2px; letter-spacing: -0.5px; }
    .header .subtitle { font-size: 13px; color: #9ca3af; margin-bottom: 10px; }
    .contact-line { font-size: 11.5px; color: #9ca3af; }
    .contact-line a { color: #6b7280; text-decoration: none; }
    .dot { margin: 0 6px; color: #d1d5db; }

    /* ── Section titles ─────────────────────── */
    .section-title {
      font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px;
      color: #9ca3af; margin: 22px 0 10px;
    }

    /* ── Skills with descriptions ────────────── */
    .skills-list { columns: 2; column-gap: 24px; }
    .skill-row { font-size: 12px; color: #6b7280; margin-bottom: 3px; line-height: 1.4; break-inside: avoid; }
    .skill-name { font-weight: 500; color: #111827; }
    .skill-desc { color: #9ca3af; }

    /* ── Entries ─────────────────────────────── */
    .entry { margin-bottom: 14px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
    .entry-role { font-weight: 500; font-size: 13px; color: #111827; }
    .entry-company { font-size: 12.5px; color: #9ca3af; margin-top: 1px; }
    .entry-date { font-size: 11.5px; color: #d1d5db; white-space: nowrap; }
    ul { list-style: none; padding-left: 0; margin-top: 4px; }
    li { font-size: 12.5px; color: #4b5563; margin-bottom: 3px; line-height: 1.55; padding-left: 14px; position: relative; }
    li::before { content: '\\2013'; position: absolute; left: 0; color: #d1d5db; }

    /* ── Summary ─────────────────────────────── */
    .summary { font-size: 12.5px; color: #6b7280; line-height: 1.65; }

    /* ── Projects ────────────────────────────── */
    .project-link { font-size: 11px; color: #6b7280; text-decoration: none; }
    .project-desc { font-size: 12px; color: #6b7280; margin-top: 2px; line-height: 1.5; }
    .project-tech { font-size: 11px; color: #d1d5db; margin-top: 2px; }

    /* ── Certifications ─────────────────────── */
    .cert { font-size: 12.5px; color: #6b7280; margin-bottom: 4px; }
    .cert-name { font-weight: 500; color: #374151; }
    .cert-issuer { color: #9ca3af; }
    .verified { color: #16a34a; margin-right: 4px; }

    /* ── Fill + Watermark ───────────────────── */
    .fill-space { flex: 1; }
    .watermark {
      text-align: center; font-size: 10px; color: #d1d5db;
      margin-top: auto; padding-top: 12px;
    }
  `;

  return `${docHead(`${esc(contact.name)} &ndash; Resume`, css)}
<body>
  ${printBar(accent)}
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>${esc(contact.name)}</h1>
      ${experience.length ? `<div class="subtitle">${esc(experience[0].role)}</div>` : ''}
      <div class="contact-line">${contactLine}</div>
    </div>

    ${summary ? `<div class="section-title">About</div><div class="summary">${esc(summary)}</div>` : ''}

    ${skills.length ? `<div class="section-title">Technical Skills</div><div class="skills-list">${skillsHTML}</div>` : ''}

    ${experience.length ? `<div class="section-title">Experience</div>${expHTML}` : ''}

    ${education.length ? `<div class="section-title">Education</div>${eduHTML}` : ''}

    ${projects && projects.length ? `<div class="section-title">Projects</div>${projHTML}` : ''}

    ${certifications.length ? `<div class="section-title">Certifications</div>${certsHTML}` : ''}

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
  const { contact, summary, experience, education, skills, skillDescriptions, certifications, projects, showWatermark } = p;

  /* ── Contact pills ──────────────────────── */
  const pillColors = ['#a855f7', '#00d4ff', '#00ff88', '#a855f7', '#00d4ff'];
  const contactParts: { label: string; value: string; href?: string }[] = [];
  if (contact.email) contactParts.push({ label: contact.email, value: contact.email });
  if (contact.phone) contactParts.push({ label: contact.phone, value: contact.phone });
  if (contact.location) contactParts.push({ label: contact.location, value: contact.location });
  if (contact.linkedin) contactParts.push({ label: contact.linkedin, value: contact.linkedin, href: `https://${contact.linkedin}` });
  if (contact.portfolio) contactParts.push({ label: contact.portfolio, value: contact.portfolio, href: `https://${contact.portfolio}` });

  const pillsHTML = contactParts
    .map((cp, i) => {
      const color = pillColors[i % pillColors.length];
      const inner = cp.href
        ? `<a href="${esc(cp.href)}" style="color:${color};text-decoration:none;">${esc(cp.label)}</a>`
        : esc(cp.label);
      return `<span class="pill" style="border-color:${color}30;background:${color}0a;color:${color};">${inner}</span>`;
    })
    .join('');

  /* ── Skills with descriptions (colored) ─── */
  const tagColors = ['#a855f7', '#00d4ff', '#00ff88'];
  const skillsHTML = skills
    .map((s, i) => {
      const c = tagColors[i % tagColors.length];
      const desc = getSkillDescription(s, skillDescriptions);
      return `<div class="skill-row"><span class="skill-name" style="color:${c};">${esc(s)}</span><span class="skill-desc"> &mdash; ${esc(desc)}</span></div>`;
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
        <ul>${exp.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('');

  /* ── Education ──────────────────────────── */
  const eduHTML = education
    .map(
      (edu) => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-role">${esc(edu.institution)}</span>
          <span class="entry-date">${esc(edu.startDate)} &ndash; ${esc(edu.endDate)}</span>
        </div>
        <div class="entry-company">${esc(edu.degree)} in ${esc(edu.field)}${edu.gpa ? ` &middot; GPA: ${esc(edu.gpa)}` : ''}</div>
      </div>`,
    )
    .join('');

  /* ── Projects ───────────────────────────── */
  const projHTML = buildProjectsHTML(projects, 'entry');

  /* ── Certifications ─────────────────────── */
  const certsHTML = buildCertsHTML(certifications);

  const css = `
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1f2937; background: #e5e7eb; line-height: 1.55;
    }
    .page {
      width: 816px; min-height: 1056px; margin: 20px auto;
      overflow: hidden; background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
      display: flex; flex-direction: column;
    }

    /* ── Gradient header ────────────────────── */
    .creative-header {
      background: linear-gradient(135deg, #a855f7, #00d4ff, #00ff88);
      padding: 28px 36px 24px; color: #fff; flex-shrink: 0;
    }
    .creative-header h1 { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
    .creative-header .role { font-size: 13px; color: rgba(255,255,255,0.8); }

    /* ── Contact pills ──────────────────────── */
    .pills { padding: 12px 36px; display: flex; flex-wrap: wrap; gap: 6px; flex-shrink: 0; }
    .pill {
      display: inline-block; font-size: 11px; padding: 3px 12px;
      border-radius: 20px; border: 1px solid; white-space: nowrap;
    }
    .pill a { text-decoration: none; }

    /* ── Content area ───────────────────────── */
    .content-area {
      flex: 1; padding: 0 36px 28px; display: flex; flex-direction: column;
    }

    /* ── Summary with accent bar ────────────── */
    .summary-wrap { display: flex; gap: 12px; margin: 8px 0 16px; }
    .accent-bar {
      width: 3px; flex-shrink: 0; border-radius: 2px;
      background: linear-gradient(to bottom, #a855f7, #00d4ff);
    }
    .summary { font-size: 12.5px; color: #4b5563; line-height: 1.65; }

    /* ── Section titles ─────────────────────── */
    .section-title {
      font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
      color: ${accent}; margin: 16px 0 8px; padding-bottom: 4px;
      border-bottom: 2px solid ${accent}30;
    }

    /* ── Skills with descriptions ────────────── */
    .skills-list { columns: 2; column-gap: 20px; }
    .skill-row { font-size: 11.5px; color: #374151; margin-bottom: 3px; line-height: 1.4; break-inside: avoid; }
    .skill-name { font-weight: 600; }
    .skill-desc { color: #6b7280; }

    /* ── Entries ─────────────────────────────── */
    .entry { margin-bottom: 12px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
    .entry-role { font-weight: 600; font-size: 13px; color: #111827; }
    .entry-company { font-size: 12.5px; color: #9ca3af; margin-top: 1px; }
    .entry-date { font-size: 11.5px; color: #9ca3af; white-space: nowrap; }
    ul { list-style: disc; padding-left: 16px; margin-top: 3px; }
    li { font-size: 12.5px; color: #374151; margin-bottom: 2px; line-height: 1.5; }

    /* ── Projects ────────────────────────────── */
    .project-link { font-size: 11px; color: ${accent}; text-decoration: none; }
    .project-desc { font-size: 12px; color: #4b5563; margin-top: 2px; line-height: 1.5; }
    .project-tech { font-size: 11px; color: #9ca3af; margin-top: 2px; }

    /* ── Certifications ─────────────────────── */
    .cert { font-size: 12.5px; color: #374151; margin-bottom: 4px; }
    .cert-name { font-weight: 600; }
    .cert-issuer { color: #6b7280; }
    .verified { color: #16a34a; margin-right: 4px; }

    /* ── Bottom gradient bar ─────────────────── */
    .bottom-bar {
      height: 4px; margin: 0 36px;
      background: linear-gradient(90deg, #a855f7, #00d4ff, #00ff88); border-radius: 2px;
      flex-shrink: 0;
    }

    /* ── Fill + Watermark ───────────────────── */
    .fill-space { flex: 1; }
    .watermark {
      text-align: center; font-size: 10px; color: #9ca3af;
      margin-top: auto; padding: 10px 36px 20px;
    }
  `;

  return `${docHead(`${esc(contact.name)} &ndash; Resume`, css)}
<body>
  ${printBar(accent)}
  <div class="page">
    <!-- Gradient header -->
    <div class="creative-header">
      <h1>${esc(contact.name)}</h1>
      ${experience.length ? `<div class="role">${esc(experience[0].role)}</div>` : ''}
    </div>

    <!-- Contact pills -->
    <div class="pills">${pillsHTML}</div>

    <!-- Content area -->
    <div class="content-area">
      <!-- Summary with accent bar -->
      ${summary ? `<div class="summary-wrap"><div class="accent-bar"></div><div class="summary">${esc(summary)}</div></div>` : ''}

      ${skills.length ? `<div class="section-title">Technical Skills</div><div class="skills-list">${skillsHTML}</div>` : ''}

      ${experience.length ? `<div class="section-title">Experience</div>${expHTML}` : ''}

      ${education.length ? `<div class="section-title">Education</div>${eduHTML}` : ''}

      ${projects && projects.length ? `<div class="section-title">Projects</div>${projHTML}` : ''}

      ${certifications.length ? `<div class="section-title">Certifications</div>${certsHTML}` : ''}

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
