/**
 * Skill Gap Analysis
 *
 * Extracts required skills from job descriptions and compares
 * them against the user's CareerTwin skillSnapshot to produce
 * a match summary.
 */

// Common tech / professional skills to look for in job descriptions.
// Kept intentionally broad; the matching is case-insensitive.
const SKILL_KEYWORDS: string[] = [
  // Programming languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C\\+\\+', 'Go', 'Rust',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Dart',
  'Elixir', 'Haskell', 'Lua', 'Objective-C', 'Solidity',
  // Frontend
  'React', 'Angular', 'Vue', 'Vue\\.js', 'Next\\.js', 'Nuxt', 'Svelte',
  'HTML', 'CSS', 'Sass', 'SCSS', 'Tailwind', 'Bootstrap', 'jQuery',
  'Redux', 'MobX', 'Zustand', 'Webpack', 'Vite', 'Babel',
  // Backend / runtime
  'Node\\.js', 'Express', 'NestJS', 'Django', 'Flask', 'FastAPI',
  'Spring Boot', 'Spring', 'Rails', 'Laravel', 'ASP\\.NET', '.NET',
  'GraphQL', 'REST', 'gRPC',
  // Data / ML
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'Kafka', 'RabbitMQ', 'Cassandra', 'DynamoDB', 'Firebase', 'Supabase',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
  'Data Science', 'Data Engineering', 'ETL', 'Spark', 'Hadoop',
  'Tableau', 'Power BI', 'Snowflake', 'BigQuery', 'Airflow',
  // Cloud / DevOps
  'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes',
  'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'CI/CD',
  'Linux', 'Nginx', 'Apache', 'Serverless', 'Lambda',
  'CloudFormation', 'Pulumi', 'Helm', 'Istio',
  // Mobile
  'React Native', 'Flutter', 'iOS', 'Android', 'SwiftUI',
  'Jetpack Compose', 'Xamarin',
  // Testing
  'Jest', 'Mocha', 'Cypress', 'Playwright', 'Selenium',
  'JUnit', 'pytest', 'Testing', 'TDD', 'BDD',
  // Design / Product
  'Figma', 'Sketch', 'Adobe XD', 'UX', 'UI', 'UX/UI',
  'Product Management', 'Agile', 'Scrum', 'Kanban', 'Jira',
  // Security
  'Cybersecurity', 'OAuth', 'JWT', 'SSO', 'Penetration Testing',
  // Soft / business skills
  'Leadership', 'Communication', 'Project Management', 'Problem Solving',
  'Stakeholder Management', 'Strategic Planning', 'Public Speaking',
  // Other
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'API', 'Microservices',
  'System Design', 'Distributed Systems', 'Blockchain', 'Web3',
];

// Build a single regex that matches any of the keywords (word-boundary, case-insensitive).
const SKILL_REGEX = new RegExp(
  '\\b(' + SKILL_KEYWORDS.join('|') + ')\\b',
  'gi',
);

/** Normalise a skill name for comparison (lowercase, trim, collapse whitespace). */
function normalise(skill: string): string {
  return skill.toLowerCase().replace(/[.\-/+#]/g, '').replace(/\s+/g, ' ').trim();
}

export interface SkillGapResult {
  /** Total required skills detected in the job description. */
  totalRequired: number;
  /** Number of those the user already has. */
  matched: number;
  /** Skills from the description that the user is missing. */
  missing: string[];
  /** Skills that matched. */
  matchedSkills: string[];
  /** Ratio 0-1. */
  ratio: number;
}

/**
 * Analyse the gap between a job description's required skills and
 * the user's skill snapshot.
 *
 * @param description  The full job description text.
 * @param userSkills   The user's CareerTwin skillSnapshot (Record<string, number>).
 *                     Keys prefixed with "_" are metadata and ignored.
 */
/**
 * Quick ATS compatibility check (zero AI cost).
 *
 * Extracts keywords from the job description, compares against the
 * user's skill snapshot, and returns a 0-100 score with color tier.
 * Mirrors the server-side quickATSScore logic but works client-side
 * with just the userSkills map + job description.
 */
export interface QuickATSResult {
  /** ATS compatibility score 0-100 */
  score: number;
  /** Color tier: 'green' (70+), 'yellow' (50-69), 'red' (<50) */
  tier: 'green' | 'yellow' | 'red';
  /** Number of JD keywords matched */
  matched: number;
  /** Total unique JD keywords found */
  total: number;
  /** Top missing keywords (up to 5) */
  topMissing: string[];
}

export function quickATSCheck(
  description: string,
  userSkills: Record<string, number>,
): QuickATSResult | null {
  if (!description || !userSkills || Object.keys(userSkills).length === 0) {
    return null;
  }

  // Extract skill keywords from the job description using the same regex
  const matches = description.match(SKILL_REGEX);
  if (!matches || matches.length === 0) return null;

  // Deduplicate (case-insensitive)
  const seen = new Map<string, string>();
  for (const m of matches) {
    const key = normalise(m);
    if (!seen.has(key)) seen.set(key, m);
  }

  const requiredSkills = Array.from(seen.values());
  if (requiredSkills.length === 0) return null;

  // Normalise user skills for comparison
  const userNormalised = new Set(
    Object.keys(userSkills)
      .filter((k) => !k.startsWith('_'))
      .map(normalise),
  );

  // Also include raw JD word overlap (words > 3 chars) for broader coverage
  const userSkillText = Object.keys(userSkills)
    .filter((k) => !k.startsWith('_'))
    .join(' ')
    .toLowerCase();

  const matchedSkills: string[] = [];
  const missing: string[] = [];

  for (const skill of requiredSkills) {
    if (userNormalised.has(normalise(skill)) || userSkillText.includes(normalise(skill))) {
      matchedSkills.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const ratio = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 0;
  const score = Math.min(100, Math.round(ratio * 120)); // Slight boost (mirrors server logic)
  const tier: 'green' | 'yellow' | 'red' = score >= 70 ? 'green' : score >= 50 ? 'yellow' : 'red';

  return {
    score,
    tier,
    matched: matchedSkills.length,
    total: requiredSkills.length,
    topMissing: missing.slice(0, 5),
  };
}

export function analyseSkillGap(
  description: string,
  userSkills: Record<string, number>,
): SkillGapResult | null {
  if (!description || !userSkills || Object.keys(userSkills).length === 0) {
    return null;
  }

  // Extract required skills from the job description.
  const matches = description.match(SKILL_REGEX);
  if (!matches || matches.length === 0) return null;

  // Deduplicate (case-insensitive) and keep the first-seen capitalisation.
  const seen = new Map<string, string>();
  for (const m of matches) {
    const key = normalise(m);
    if (!seen.has(key)) seen.set(key, m);
  }

  const requiredSkills = Array.from(seen.values());
  if (requiredSkills.length === 0) return null;

  // Normalise user skills for comparison.
  const userNormalised = new Set(
    Object.keys(userSkills)
      .filter((k) => !k.startsWith('_'))
      .map(normalise),
  );

  const matchedSkills: string[] = [];
  const missing: string[] = [];

  for (const skill of requiredSkills) {
    if (userNormalised.has(normalise(skill))) {
      matchedSkills.push(skill);
    } else {
      missing.push(skill);
    }
  }

  return {
    totalRequired: requiredSkills.length,
    matched: matchedSkills.length,
    missing,
    matchedSkills,
    ratio: requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 0,
  };
}
