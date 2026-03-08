export interface JobInsight {
  category: string;
  text: string;
  icon: string;
}

const insightsByKeyword: Record<string, JobInsight[]> = {
  react: [
    { category: 'Demand', text: 'React developer roles grew 23% this quarter across major platforms', icon: '📈' },
    { category: 'Hot Skill', text: 'TypeScript + Next.js is the most in-demand frontend stack right now', icon: '🔥' },
    { category: 'Salary Trend', text: 'Senior React roles now average 18-30 LPA in top metros', icon: '💰' },
    { category: 'Market Tip', text: 'Companies are prioritizing candidates with SSR and performance optimization skills', icon: '💡' },
    { category: 'Remote', text: '62% of React positions now offer remote or hybrid work options', icon: '🏠' },
    { category: 'Growth', text: 'React Native cross-platform skills can boost your offers by 15-20%', icon: '🚀' },
  ],
  frontend: [
    { category: 'Demand', text: 'Frontend engineering roles surged 18% with the rise of AI-powered interfaces', icon: '📈' },
    { category: 'Hot Skill', text: 'Component-driven development with design systems is the top hiring signal', icon: '🔥' },
    { category: 'Salary Trend', text: 'Frontend specialists with accessibility expertise earn 20% more on average', icon: '💰' },
    { category: 'Market Tip', text: 'Portfolio projects showcasing real-world performance wins stand out to recruiters', icon: '💡' },
    { category: 'Remote', text: 'Frontend roles lead remote hiring with 58% of positions being location-flexible', icon: '🏠' },
    { category: 'Growth', text: 'Full-stack frontend (Next.js, Remix) skills are overtaking pure SPA experience', icon: '🚀' },
  ],
  python: [
    { category: 'Demand', text: 'Python developer demand is at an all-time high driven by AI/ML adoption', icon: '📈' },
    { category: 'Hot Skill', text: 'FastAPI + LangChain experience is the fastest-growing skill combination', icon: '🔥' },
    { category: 'Salary Trend', text: 'Python ML engineers command 25-45 LPA in Indian metros', icon: '💰' },
    { category: 'Market Tip', text: 'Employers are looking for Python devs who can build production AI pipelines', icon: '💡' },
    { category: 'Remote', text: 'Python data roles have 70% remote availability globally', icon: '🏠' },
    { category: 'Growth', text: 'Adding cloud deployment skills (AWS/GCP) increases callback rate by 35%', icon: '🚀' },
  ],
  fullstack: [
    { category: 'Demand', text: 'Full-stack engineers remain the most sought-after profile across startups', icon: '📈' },
    { category: 'Hot Skill', text: 'Node.js + React + PostgreSQL is the golden trio for startup hiring', icon: '🔥' },
    { category: 'Salary Trend', text: 'Senior full-stack roles are offering 20-35 LPA with equity in growth-stage companies', icon: '💰' },
    { category: 'Market Tip', text: 'Demonstrating end-to-end feature ownership in past roles dramatically improves interviews', icon: '💡' },
    { category: 'Remote', text: '55% of full-stack positions now support remote-first work policies', icon: '🏠' },
    { category: 'Growth', text: 'DevOps and CI/CD knowledge alongside coding skills is a major differentiator', icon: '🚀' },
  ],
  data: [
    { category: 'Demand', text: 'Data engineering roles grew 40% as companies invest in analytics infrastructure', icon: '📈' },
    { category: 'Hot Skill', text: 'dbt + Snowflake + Airflow is the most requested data stack in job listings', icon: '🔥' },
    { category: 'Salary Trend', text: 'Data scientists with MLOps experience earn 30% above base market rate', icon: '💰' },
    { category: 'Market Tip', text: 'Showcase projects with measurable business impact rather than just technical complexity', icon: '💡' },
    { category: 'Remote', text: 'Data roles are among the most remote-friendly in tech at 65%', icon: '🏠' },
    { category: 'Growth', text: 'GenAI and LLM fine-tuning skills are rapidly becoming table stakes for senior roles', icon: '🚀' },
  ],
  java: [
    { category: 'Demand', text: 'Java remains top-3 in enterprise hiring, especially in fintech and banking', icon: '📈' },
    { category: 'Hot Skill', text: 'Spring Boot + Kubernetes experience is the most valued backend combination', icon: '🔥' },
    { category: 'Salary Trend', text: 'Senior Java architects command 30-50 LPA in financial services', icon: '💰' },
    { category: 'Market Tip', text: 'Microservices migration experience is a key differentiator in interviews', icon: '💡' },
    { category: 'Remote', text: '48% of Java positions offer hybrid or remote arrangements', icon: '🏠' },
    { category: 'Growth', text: 'Adding Kotlin to your Java skill set opens up Android + backend opportunities', icon: '🚀' },
  ],
  devops: [
    { category: 'Demand', text: 'DevOps and SRE roles are among the fastest growing in the infrastructure space', icon: '📈' },
    { category: 'Hot Skill', text: 'Terraform + Kubernetes + GitHub Actions is the top DevOps stack in 2025', icon: '🔥' },
    { category: 'Salary Trend', text: 'Platform engineers earn 15-25% more than traditional sysadmin roles', icon: '💰' },
    { category: 'Market Tip', text: 'Demonstrating cost optimization wins from infrastructure changes impresses hiring managers', icon: '💡' },
    { category: 'Remote', text: 'DevOps is 72% remote-friendly — one of the highest in tech', icon: '🏠' },
    { category: 'Growth', text: 'FinOps and cloud cost management is an emerging high-value niche', icon: '🚀' },
  ],
  default: [
    { category: 'Demand', text: 'Tech hiring is rebounding with a 15% increase in new positions this quarter', icon: '📈' },
    { category: 'Hot Skill', text: 'AI literacy and prompt engineering are becoming must-have skills across roles', icon: '🔥' },
    { category: 'Salary Trend', text: 'Companies are offering 10-20% higher packages to attract top talent in competitive markets', icon: '💰' },
    { category: 'Market Tip', text: 'Tailoring your resume for each application increases callback rate by 40%', icon: '💡' },
    { category: 'Remote', text: '54% of tech roles now offer some form of remote or hybrid work', icon: '🏠' },
    { category: 'Growth', text: 'Continuous learning and certifications signal growth mindset to employers', icon: '🚀' },
  ],
};

const KEYWORD_MAP: [string[], string][] = [
  [['react', 'next.js', 'nextjs', 'next js'], 'react'],
  [['frontend', 'front-end', 'front end', 'ui developer', 'ui engineer'], 'frontend'],
  [['python', 'django', 'flask', 'fastapi'], 'python'],
  [['fullstack', 'full-stack', 'full stack', 'mern', 'mean'], 'fullstack'],
  [['data', 'ml', 'machine learning', 'data science', 'data engineer', 'analytics'], 'data'],
  [['java', 'spring', 'spring boot', 'j2ee'], 'java'],
  [['devops', 'sre', 'platform engineer', 'infrastructure', 'cloud engineer', 'kubernetes'], 'devops'],
];

export function getInsightsForRole(targetRole: string): JobInsight[] {
  const lower = targetRole.toLowerCase();

  for (const [keywords, key] of KEYWORD_MAP) {
    if (keywords.some(kw => lower.includes(kw))) {
      return insightsByKeyword[key];
    }
  }

  return insightsByKeyword.default;
}
