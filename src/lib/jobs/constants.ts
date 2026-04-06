export const INDIA_CITIES = [
  'bangalore', 'mumbai', 'delhi', 'hyderabad', 'pune',
  'chennai', 'kolkata', 'noida', 'gurgaon', 'ahmedabad',
]

export const INDIA_ROLES = [
  'software+engineer', 'frontend+developer', 'backend+developer',
  'full+stack+developer', 'data+scientist', 'machine+learning',
  'devops+engineer', 'product+manager', 'ui+ux+designer',
  'automation+engineer', 'qa+engineer', 'android+developer',
  'ios+developer', 'cloud+engineer', 'cybersecurity',
]

export const PLAN_SEARCH_LIMITS: Record<string, { searchesPerDay: number; resultsPerSearch: number }> = {
  free:    { searchesPerDay: 5,         resultsPerSearch: 10  },
  starter: { searchesPerDay: 30,        resultsPerSearch: 30  },
  pro:     { searchesPerDay: 50,        resultsPerSearch: 50  },
  ultra:   { searchesPerDay: 999999,    resultsPerSearch: 200 },
  max:     { searchesPerDay: 999999,    resultsPerSearch: 200 },
}

export const JOB_CACHE_TTL_DAYS = 14
export const REDIS_SEARCH_CACHE_TTL = 7200  // 2 hours in seconds
