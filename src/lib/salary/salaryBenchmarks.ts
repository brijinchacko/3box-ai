/**
 * Static salary benchmark database based on BLS Occupational Employment
 * and Wage Statistics (OES) 2024 data.
 *
 * Provides ~80 common job roles with realistic salary ranges, growth rates,
 * SOC codes, and a fuzzy matching function for lookups.
 */

export interface SalaryBenchmark {
  title: string;
  aliases: string[];
  medianUSD: number;
  p10USD: number;
  p90USD: number;
  growthRate: number;
  socCode?: string;
}

// ─── Benchmark Data ───────────────────────────────────────────────────────────

export const SALARY_BENCHMARKS: SalaryBenchmark[] = [
  // ── Technology ────────────────────────────────────────────────────────────────
  {
    title: 'Software Engineer',
    aliases: ['swe', 'software dev', 'programmer', 'coder', 'software engineering'],
    medianUSD: 130_000,
    p10USD: 78_000,
    p90USD: 200_000,
    growthRate: 0.25,
    socCode: '15-1252',
  },
  {
    title: 'Senior Software Engineer',
    aliases: ['senior swe', 'sr software engineer', 'sr swe', 'staff engineer', 'senior developer', 'senior dev'],
    medianUSD: 160_000,
    p10USD: 110_000,
    p90USD: 240_000,
    growthRate: 0.22,
    socCode: '15-1252',
  },
  {
    title: 'Software Developer',
    aliases: ['developer', 'app developer', 'application developer', 'sw developer'],
    medianUSD: 127_000,
    p10USD: 75_000,
    p90USD: 198_000,
    growthRate: 0.25,
    socCode: '15-1252',
  },
  {
    title: 'Frontend Developer',
    aliases: ['front end developer', 'front-end developer', 'frontend engineer', 'front end engineer', 'ui developer', 'react developer', 'angular developer', 'vue developer'],
    medianUSD: 115_000,
    p10USD: 70_000,
    p90USD: 175_000,
    growthRate: 0.20,
    socCode: '15-1254',
  },
  {
    title: 'Backend Developer',
    aliases: ['back end developer', 'back-end developer', 'backend engineer', 'back end engineer', 'server-side developer', 'api developer'],
    medianUSD: 130_000,
    p10USD: 80_000,
    p90USD: 195_000,
    growthRate: 0.22,
    socCode: '15-1252',
  },
  {
    title: 'Full Stack Developer',
    aliases: ['fullstack developer', 'full-stack developer', 'full stack engineer', 'fullstack engineer', 'full-stack engineer'],
    medianUSD: 125_000,
    p10USD: 75_000,
    p90USD: 185_000,
    growthRate: 0.23,
    socCode: '15-1252',
  },
  {
    title: 'Data Scientist',
    aliases: ['data science', 'ml scientist', 'research scientist', 'applied scientist'],
    medianUSD: 108_000,
    p10USD: 65_000,
    p90USD: 175_000,
    growthRate: 0.35,
    socCode: '15-2051',
  },
  {
    title: 'Data Engineer',
    aliases: ['data engineering', 'big data engineer', 'etl developer', 'data pipeline engineer'],
    medianUSD: 130_000,
    p10USD: 80_000,
    p90USD: 195_000,
    growthRate: 0.28,
    socCode: '15-1243',
  },
  {
    title: 'Data Analyst',
    aliases: ['data analytics', 'business data analyst', 'analytics analyst', 'junior data analyst'],
    medianUSD: 83_000,
    p10USD: 50_000,
    p90USD: 130_000,
    growthRate: 0.23,
    socCode: '15-2051',
  },
  {
    title: 'Machine Learning Engineer',
    aliases: ['ml engineer', 'mle', 'ai engineer', 'deep learning engineer', 'machine learning'],
    medianUSD: 155_000,
    p10USD: 100_000,
    p90USD: 235_000,
    growthRate: 0.40,
    socCode: '15-2051',
  },
  {
    title: 'DevOps Engineer',
    aliases: ['devops', 'site reliability engineer', 'sre', 'platform engineer', 'infrastructure engineer'],
    medianUSD: 130_000,
    p10USD: 85_000,
    p90USD: 185_000,
    growthRate: 0.22,
    socCode: '15-1244',
  },
  {
    title: 'Cloud Engineer',
    aliases: ['cloud architect', 'aws engineer', 'azure engineer', 'gcp engineer', 'cloud infrastructure engineer'],
    medianUSD: 135_000,
    p10USD: 90_000,
    p90USD: 195_000,
    growthRate: 0.25,
    socCode: '15-1244',
  },
  {
    title: 'QA Engineer',
    aliases: ['quality assurance engineer', 'test engineer', 'qa analyst', 'sdet', 'software test engineer', 'quality engineer', 'automation engineer'],
    medianUSD: 95_000,
    p10USD: 60_000,
    p90USD: 140_000,
    growthRate: 0.15,
    socCode: '15-1253',
  },
  {
    title: 'Product Manager',
    aliases: ['pm', 'product owner', 'product lead', 'product management'],
    medianUSD: 140_000,
    p10USD: 90_000,
    p90USD: 210_000,
    growthRate: 0.18,
    socCode: '11-2021',
  },
  {
    title: 'Technical Program Manager',
    aliases: ['tpm', 'technical pm', 'tech program manager', 'engineering program manager'],
    medianUSD: 150_000,
    p10USD: 100_000,
    p90USD: 220_000,
    growthRate: 0.18,
    socCode: '11-9041',
  },
  {
    title: 'UX Designer',
    aliases: ['ux', 'user experience designer', 'ux/ui designer', 'experience designer', 'product designer'],
    medianUSD: 105_000,
    p10USD: 65_000,
    p90USD: 160_000,
    growthRate: 0.16,
    socCode: '15-1255',
  },
  {
    title: 'UI Designer',
    aliases: ['user interface designer', 'visual designer', 'interaction designer'],
    medianUSD: 95_000,
    p10USD: 60_000,
    p90USD: 145_000,
    growthRate: 0.16,
    socCode: '15-1255',
  },
  {
    title: 'Mobile Developer',
    aliases: ['mobile engineer', 'mobile app developer', 'app developer mobile', 'react native developer', 'flutter developer'],
    medianUSD: 125_000,
    p10USD: 78_000,
    p90USD: 185_000,
    growthRate: 0.22,
    socCode: '15-1252',
  },
  {
    title: 'iOS Developer',
    aliases: ['ios engineer', 'swift developer', 'apple developer', 'ios mobile developer'],
    medianUSD: 130_000,
    p10USD: 80_000,
    p90USD: 190_000,
    growthRate: 0.20,
    socCode: '15-1252',
  },
  {
    title: 'Android Developer',
    aliases: ['android engineer', 'kotlin developer', 'android mobile developer'],
    medianUSD: 128_000,
    p10USD: 78_000,
    p90USD: 188_000,
    growthRate: 0.20,
    socCode: '15-1252',
  },
  {
    title: 'Cybersecurity Analyst',
    aliases: ['security analyst', 'information security analyst', 'infosec analyst', 'cybersecurity', 'security engineer', 'cyber security analyst'],
    medianUSD: 112_000,
    p10USD: 70_000,
    p90USD: 165_000,
    growthRate: 0.32,
    socCode: '15-1212',
  },
  {
    title: 'Systems Administrator',
    aliases: ['sysadmin', 'system admin', 'linux admin', 'windows admin', 'it admin'],
    medianUSD: 90_000,
    p10USD: 55_000,
    p90USD: 135_000,
    growthRate: 0.05,
    socCode: '15-1244',
  },
  {
    title: 'Database Administrator',
    aliases: ['dba', 'database admin', 'db admin', 'sql admin', 'database manager'],
    medianUSD: 100_000,
    p10USD: 60_000,
    p90USD: 150_000,
    growthRate: 0.08,
    socCode: '15-1242',
  },
  {
    title: 'Network Engineer',
    aliases: ['network admin', 'network administrator', 'network architect', 'network specialist'],
    medianUSD: 95_000,
    p10USD: 60_000,
    p90USD: 140_000,
    growthRate: 0.06,
    socCode: '15-1241',
  },
  {
    title: 'IT Manager',
    aliases: ['it director', 'information technology manager', 'technology manager', 'it lead'],
    medianUSD: 165_000,
    p10USD: 100_000,
    p90USD: 225_000,
    growthRate: 0.15,
    socCode: '11-3021',
  },
  {
    title: 'CTO',
    aliases: ['chief technology officer', 'chief technical officer', 'vp technology'],
    medianUSD: 220_000,
    p10USD: 140_000,
    p90USD: 350_000,
    growthRate: 0.15,
    socCode: '11-1021',
  },
  {
    title: 'VP of Engineering',
    aliases: ['vice president engineering', 'vp engineering', 'svp engineering', 'head of engineering', 'engineering director'],
    medianUSD: 250_000,
    p10USD: 170_000,
    p90USD: 380_000,
    growthRate: 0.15,
    socCode: '11-1021',
  },

  // ── Business / Management ────────────────────────────────────────────────────
  {
    title: 'Project Manager',
    aliases: ['pm', 'project lead', 'project coordinator', 'program manager', 'pmp'],
    medianUSD: 95_000,
    p10USD: 55_000,
    p90USD: 145_000,
    growthRate: 0.07,
    socCode: '11-9199',
  },
  {
    title: 'Business Analyst',
    aliases: ['ba', 'business systems analyst', 'requirements analyst', 'business analysis'],
    medianUSD: 85_000,
    p10USD: 55_000,
    p90USD: 130_000,
    growthRate: 0.09,
    socCode: '13-1111',
  },
  {
    title: 'Management Consultant',
    aliases: ['consultant', 'strategy consultant', 'business consultant', 'management consulting'],
    medianUSD: 100_000,
    p10USD: 60_000,
    p90USD: 170_000,
    growthRate: 0.11,
    socCode: '13-1111',
  },
  {
    title: 'Operations Manager',
    aliases: ['ops manager', 'operations director', 'operations lead', 'business operations manager'],
    medianUSD: 85_000,
    p10USD: 50_000,
    p90USD: 135_000,
    growthRate: 0.06,
    socCode: '11-1021',
  },
  {
    title: 'Human Resources Manager',
    aliases: ['hr manager', 'hr director', 'people manager', 'head of hr', 'human resources director'],
    medianUSD: 130_000,
    p10USD: 80_000,
    p90USD: 200_000,
    growthRate: 0.07,
    socCode: '11-3121',
  },
  {
    title: 'HR Specialist',
    aliases: ['human resources specialist', 'hr generalist', 'hr coordinator', 'people operations', 'hr associate'],
    medianUSD: 67_000,
    p10USD: 42_000,
    p90USD: 105_000,
    growthRate: 0.06,
    socCode: '13-1071',
  },
  {
    title: 'Financial Analyst',
    aliases: ['finance analyst', 'financial planning analyst', 'fp&a analyst', 'investment analyst'],
    medianUSD: 95_000,
    p10USD: 60_000,
    p90USD: 150_000,
    growthRate: 0.09,
    socCode: '13-2051',
  },
  {
    title: 'Accountant',
    aliases: ['cpa', 'certified public accountant', 'staff accountant', 'senior accountant', 'accounting'],
    medianUSD: 78_000,
    p10USD: 50_000,
    p90USD: 125_000,
    growthRate: 0.04,
    socCode: '13-2011',
  },
  {
    title: 'CFO',
    aliases: ['chief financial officer', 'finance director', 'vp finance', 'head of finance'],
    medianUSD: 215_000,
    p10USD: 130_000,
    p90USD: 350_000,
    growthRate: 0.07,
    socCode: '11-1011',
  },
  {
    title: 'CEO',
    aliases: ['chief executive officer', 'founder', 'president', 'managing director'],
    medianUSD: 190_000,
    p10USD: 80_000,
    p90USD: 400_000,
    growthRate: 0.06,
    socCode: '11-1011',
  },

  // ── Marketing / Sales ────────────────────────────────────────────────────────
  {
    title: 'Marketing Manager',
    aliases: ['marketing director', 'head of marketing', 'marketing lead', 'brand manager'],
    medianUSD: 140_000,
    p10USD: 80_000,
    p90USD: 210_000,
    growthRate: 0.10,
    socCode: '11-2021',
  },
  {
    title: 'Digital Marketing Specialist',
    aliases: ['digital marketer', 'online marketing specialist', 'digital marketing', 'growth marketer', 'performance marketer'],
    medianUSD: 75_000,
    p10USD: 45_000,
    p90USD: 120_000,
    growthRate: 0.15,
    socCode: '13-1161',
  },
  {
    title: 'Content Marketing Manager',
    aliases: ['content manager', 'content strategist', 'content marketing', 'editorial manager'],
    medianUSD: 90_000,
    p10USD: 55_000,
    p90USD: 140_000,
    growthRate: 0.12,
    socCode: '27-3043',
  },
  {
    title: 'SEO Specialist',
    aliases: ['seo', 'search engine optimization', 'seo analyst', 'seo manager', 'seo consultant'],
    medianUSD: 70_000,
    p10USD: 42_000,
    p90USD: 110_000,
    growthRate: 0.13,
    socCode: '13-1161',
  },
  {
    title: 'Sales Manager',
    aliases: ['sales director', 'head of sales', 'sales lead', 'regional sales manager', 'vp sales'],
    medianUSD: 130_000,
    p10USD: 70_000,
    p90USD: 200_000,
    growthRate: 0.05,
    socCode: '11-2022',
  },
  {
    title: 'Account Executive',
    aliases: ['ae', 'sales executive', 'enterprise account executive', 'account manager sales'],
    medianUSD: 75_000,
    p10USD: 45_000,
    p90USD: 130_000,
    growthRate: 0.06,
    socCode: '41-3091',
  },
  {
    title: 'Sales Representative',
    aliases: ['sales rep', 'sales associate', 'inside sales', 'outside sales', 'bdr', 'sdr', 'business development representative'],
    medianUSD: 62_000,
    p10USD: 35_000,
    p90USD: 100_000,
    growthRate: 0.04,
    socCode: '41-3091',
  },
  {
    title: 'Customer Success Manager',
    aliases: ['csm', 'customer success', 'client success manager', 'customer relationship manager'],
    medianUSD: 85_000,
    p10USD: 55_000,
    p90USD: 130_000,
    growthRate: 0.12,
    socCode: '11-2022',
  },

  // ── Healthcare ───────────────────────────────────────────────────────────────
  {
    title: 'Registered Nurse',
    aliases: ['rn', 'nurse', 'staff nurse', 'clinical nurse', 'registered nursing'],
    medianUSD: 81_000,
    p10USD: 60_000,
    p90USD: 120_000,
    growthRate: 0.06,
    socCode: '29-1141',
  },
  {
    title: 'Nurse Practitioner',
    aliases: ['np', 'aprn', 'advanced practice nurse', 'family nurse practitioner', 'fnp'],
    medianUSD: 121_000,
    p10USD: 90_000,
    p90USD: 160_000,
    growthRate: 0.45,
    socCode: '29-1171',
  },
  {
    title: 'Physician',
    aliases: ['doctor', 'md', 'medical doctor', 'attending physician', 'primary care physician'],
    medianUSD: 230_000,
    p10USD: 140_000,
    p90USD: 350_000,
    growthRate: 0.03,
    socCode: '29-1228',
  },
  {
    title: 'Pharmacist',
    aliases: ['pharmacy', 'clinical pharmacist', 'retail pharmacist', 'hospital pharmacist'],
    medianUSD: 132_000,
    p10USD: 100_000,
    p90USD: 165_000,
    growthRate: 0.03,
    socCode: '29-1051',
  },
  {
    title: 'Physical Therapist',
    aliases: ['pt', 'physiotherapist', 'physical therapy', 'rehab therapist'],
    medianUSD: 97_000,
    p10USD: 70_000,
    p90USD: 125_000,
    growthRate: 0.15,
    socCode: '29-1123',
  },
  {
    title: 'Medical Laboratory Technician',
    aliases: ['lab technician', 'lab tech', 'medical lab tech', 'clinical lab technician', 'mlt'],
    medianUSD: 57_000,
    p10USD: 38_000,
    p90USD: 82_000,
    growthRate: 0.07,
    socCode: '29-2012',
  },

  // ── Education ────────────────────────────────────────────────────────────────
  {
    title: 'Teacher (K-12)',
    aliases: ['teacher', 'school teacher', 'elementary teacher', 'high school teacher', 'middle school teacher', 'k-12 teacher', 'educator'],
    medianUSD: 62_000,
    p10USD: 42_000,
    p90USD: 90_000,
    growthRate: 0.04,
    socCode: '25-2031',
  },
  {
    title: 'Professor',
    aliases: ['college professor', 'university professor', 'associate professor', 'assistant professor', 'tenured professor', 'lecturer'],
    medianUSD: 82_000,
    p10USD: 48_000,
    p90USD: 140_000,
    growthRate: 0.08,
    socCode: '25-1099',
  },
  {
    title: 'Instructional Designer',
    aliases: ['learning designer', 'curriculum designer', 'elearning developer', 'e-learning designer', 'instructional design'],
    medianUSD: 75_000,
    p10USD: 50_000,
    p90USD: 110_000,
    growthRate: 0.08,
    socCode: '25-9031',
  },

  // ── Creative / Design ────────────────────────────────────────────────────────
  {
    title: 'Graphic Designer',
    aliases: ['graphic design', 'visual designer graphics', 'print designer', 'brand designer'],
    medianUSD: 58_000,
    p10USD: 36_000,
    p90USD: 95_000,
    growthRate: 0.03,
    socCode: '27-1024',
  },
  {
    title: 'Web Designer',
    aliases: ['website designer', 'web design', 'wordpress designer', 'webflow designer'],
    medianUSD: 65_000,
    p10USD: 40_000,
    p90USD: 100_000,
    growthRate: 0.08,
    socCode: '15-1255',
  },
  {
    title: 'Content Writer',
    aliases: ['writer', 'blog writer', 'freelance writer', 'content creator', 'technical writer content'],
    medianUSD: 55_000,
    p10USD: 35_000,
    p90USD: 85_000,
    growthRate: 0.04,
    socCode: '27-3043',
  },
  {
    title: 'Copywriter',
    aliases: ['copy writer', 'advertising copywriter', 'creative copywriter', 'senior copywriter'],
    medianUSD: 65_000,
    p10USD: 40_000,
    p90USD: 100_000,
    growthRate: 0.04,
    socCode: '27-3043',
  },
  {
    title: 'Video Editor',
    aliases: ['film editor', 'video post production', 'video producer', 'multimedia editor'],
    medianUSD: 60_000,
    p10USD: 38_000,
    p90USD: 95_000,
    growthRate: 0.12,
    socCode: '27-4032',
  },

  // ── Legal ────────────────────────────────────────────────────────────────────
  {
    title: 'Lawyer',
    aliases: ['attorney', 'counsel', 'legal counsel', 'solicitor', 'barrister', 'litigator', 'associate attorney'],
    medianUSD: 135_000,
    p10USD: 65_000,
    p90USD: 230_000,
    growthRate: 0.08,
    socCode: '23-1011',
  },
  {
    title: 'Paralegal',
    aliases: ['legal assistant', 'litigation paralegal', 'corporate paralegal', 'paralegal specialist'],
    medianUSD: 59_000,
    p10USD: 38_000,
    p90USD: 88_000,
    growthRate: 0.04,
    socCode: '23-2011',
  },
  {
    title: 'Compliance Officer',
    aliases: ['compliance analyst', 'compliance manager', 'regulatory compliance', 'compliance specialist'],
    medianUSD: 75_000,
    p10USD: 48_000,
    p90USD: 120_000,
    growthRate: 0.06,
    socCode: '13-1041',
  },

  // ── Engineering / Other ──────────────────────────────────────────────────────
  {
    title: 'Mechanical Engineer',
    aliases: ['mech engineer', 'mechanical engineering', 'design engineer mechanical', 'manufacturing engineer'],
    medianUSD: 96_000,
    p10USD: 65_000,
    p90USD: 140_000,
    growthRate: 0.04,
    socCode: '17-2141',
  },
  {
    title: 'Electrical Engineer',
    aliases: ['ee', 'electrical engineering', 'electronics engineer', 'power engineer'],
    medianUSD: 104_000,
    p10USD: 70_000,
    p90USD: 155_000,
    growthRate: 0.05,
    socCode: '17-2071',
  },
  {
    title: 'Civil Engineer',
    aliases: ['civil engineering', 'structural engineer', 'construction engineer', 'transportation engineer'],
    medianUSD: 89_000,
    p10USD: 60_000,
    p90USD: 130_000,
    growthRate: 0.05,
    socCode: '17-2051',
  },
  {
    title: 'Architect',
    aliases: ['building architect', 'architectural designer', 'licensed architect', 'design architect'],
    medianUSD: 93_000,
    p10USD: 55_000,
    p90USD: 140_000,
    growthRate: 0.05,
    socCode: '17-1011',
  },
  {
    title: 'Supply Chain Manager',
    aliases: ['supply chain', 'procurement manager', 'supply chain director', 'sourcing manager', 'logistics manager'],
    medianUSD: 98_000,
    p10USD: 60_000,
    p90USD: 150_000,
    growthRate: 0.06,
    socCode: '11-3071',
  },
  {
    title: 'Logistics Coordinator',
    aliases: ['logistics specialist', 'shipping coordinator', 'logistics analyst', 'supply chain coordinator'],
    medianUSD: 52_000,
    p10USD: 35_000,
    p90USD: 75_000,
    growthRate: 0.04,
    socCode: '43-5071',
  },
  {
    title: 'Executive Assistant',
    aliases: ['ea', 'executive admin', 'senior executive assistant', 'chief of staff assistant'],
    medianUSD: 65_000,
    p10USD: 42_000,
    p90USD: 95_000,
    growthRate: 0.03,
    socCode: '43-6011',
  },
  {
    title: 'Administrative Assistant',
    aliases: ['admin assistant', 'office assistant', 'administrative coordinator', 'office manager assistant', 'receptionist admin'],
    medianUSD: 45_000,
    p10USD: 30_000,
    p90USD: 65_000,
    growthRate: 0.03,
    socCode: '43-6014',
  },
  {
    title: 'Customer Service Representative',
    aliases: ['csr', 'customer support', 'customer service', 'support representative', 'call center agent', 'customer care'],
    medianUSD: 38_000,
    p10USD: 28_000,
    p90USD: 55_000,
    growthRate: 0.04,
    socCode: '43-4051',
  },
  {
    title: 'Real Estate Agent',
    aliases: ['realtor', 'real estate broker', 'property agent', 'real estate sales agent', 'real estate'],
    medianUSD: 52_000,
    p10USD: 28_000,
    p90USD: 110_000,
    growthRate: 0.05,
    socCode: '41-9022',
  },
];

// ─── Fuzzy Matching ───────────────────────────────────────────────────────────

/**
 * Normalize a string for comparison: lowercase, trim, collapse whitespace.
 */
function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[\s\-_]+/g, ' ');
}

/**
 * Compute a simple word-overlap score between two normalized strings.
 * Returns a value between 0 and 1.
 */
function wordOverlapScore(a: string, b: string): number {
  const wordsA = new Set(a.split(' ').filter(Boolean));
  const wordsB = new Set(b.split(' ').filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }

  // Jaccard-like: overlap / total unique words
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? overlap / union : 0;
}

/**
 * Find the closest salary benchmark for a given job title query.
 * Search order:
 *   1. Exact title match (case-insensitive)
 *   2. Exact alias match (case-insensitive)
 *   3. Best word-overlap score (threshold >= 0.3)
 *
 * Returns null if no reasonable match is found.
 */
export function findClosestBenchmark(query: string): SalaryBenchmark | null {
  if (!query || !query.trim()) return null;

  const normalizedQuery = normalize(query);

  // 1. Exact title match
  for (const benchmark of SALARY_BENCHMARKS) {
    if (normalize(benchmark.title) === normalizedQuery) {
      return benchmark;
    }
  }

  // 2. Exact alias match
  for (const benchmark of SALARY_BENCHMARKS) {
    for (const alias of benchmark.aliases) {
      if (normalize(alias) === normalizedQuery) {
        return benchmark;
      }
    }
  }

  // 3. Word-overlap scoring across titles and aliases
  let bestMatch: SalaryBenchmark | null = null;
  let bestScore = 0;

  for (const benchmark of SALARY_BENCHMARKS) {
    // Score against title
    const titleScore = wordOverlapScore(normalizedQuery, normalize(benchmark.title));
    if (titleScore > bestScore) {
      bestScore = titleScore;
      bestMatch = benchmark;
    }

    // Score against each alias
    for (const alias of benchmark.aliases) {
      const aliasScore = wordOverlapScore(normalizedQuery, normalize(alias));
      if (aliasScore > bestScore) {
        bestScore = aliasScore;
        bestMatch = benchmark;
      }
    }
  }

  // Only return if score exceeds threshold
  return bestScore >= 0.3 ? bestMatch : null;
}
