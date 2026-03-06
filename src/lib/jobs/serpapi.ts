/**
 * SerpAPI Google Search Integration
 * Uses Google search operators to find jobs on Indian job portals
 */

interface SerpApiResult {
  title: string;
  link: string;
  snippet: string;
  displayed_link?: string;
}

interface DiscoveredJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  url: string;
  source: string;
  postedAt: string;
  remote: boolean;
}

async function searchGoogle(query: string, num: number = 10): Promise<SerpApiResult[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];
  
  try {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('q', query);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('num', String(num));
    url.searchParams.set('gl', 'in'); // India focus
    
    const res = await fetch(url.toString(), { next: { revalidate: 600 } });
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.organic_results || [];
  } catch {
    return [];
  }
}

// Parse job info from Google search result snippets
function parseJobFromResult(result: SerpApiResult, source: string): DiscoveredJob | null {
  // Extract title (clean "- Naukri.com" etc from end)
  let title = result.title
    .replace(/\s*[-–|].*?(naukri|linkedin|indeed|glassdoor).*$/i, '')
    .replace(/\s*[-–|]\s*$/, '')
    .trim();
  
  if (!title || title.length < 3) return null;
  
  // Try to extract company from snippet or title
  let company = 'Unknown Company';
  const companyMatch = result.snippet.match(/(?:at|@|by)\s+([A-Z][A-Za-z\s&.]+?)(?:\s*[-–,.|]|\s+in\s)/);
  if (companyMatch) company = companyMatch[1].trim();
  
  // Try to extract location
  let location = 'India';
  const locationMatch = result.snippet.match(/(?:in|at|location[:\s])\s*([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)?)/);
  if (locationMatch) location = locationMatch[1].trim();
  
  const isRemote = /remote|work from home|wfh/i.test(result.title + ' ' + result.snippet);
  
  // Try to extract salary
  let salary: string | null = null;
  const salaryMatch = result.snippet.match(/₹[\d,.]+ ?(?:- ?₹[\d,.]+)?(?:\s*(?:LPA|PA|per annum|per month|lakh|lakhs))?/i);
  if (salaryMatch) salary = salaryMatch[0];
  
  return {
    id: `serp-${Buffer.from(result.link).toString('base64').slice(0, 20)}`,
    title,
    company,
    location: isRemote ? 'Remote' : location,
    description: result.snippet.slice(0, 300),
    salary,
    url: result.link,
    source,
    postedAt: new Date().toISOString(),
    remote: isRemote,
  };
}

export async function searchNaukri(role: string, location: string = ''): Promise<DiscoveredJob[]> {
  const query = `site:naukri.com ${role}${location ? ` ${location}` : ''} jobs`;
  const results = await searchGoogle(query, 10);
  return results.map(r => parseJobFromResult(r, 'Naukri')).filter((j): j is DiscoveredJob => j !== null);
}

export async function searchLinkedInJobs(role: string, location: string = ''): Promise<DiscoveredJob[]> {
  const query = `site:linkedin.com/jobs ${role}${location ? ` ${location}` : ' India'}`;
  const results = await searchGoogle(query, 10);
  return results.map(r => parseJobFromResult(r, 'LinkedIn')).filter((j): j is DiscoveredJob => j !== null);
}

export async function searchIndeedIndia(role: string, location: string = ''): Promise<DiscoveredJob[]> {
  const query = `site:indeed.co.in ${role}${location ? ` ${location}` : ''}`;
  const results = await searchGoogle(query, 10);
  return results.map(r => parseJobFromResult(r, 'Indeed India')).filter((j): j is DiscoveredJob => j !== null);
}

export async function searchGoogleJobs(role: string, location: string = ''): Promise<DiscoveredJob[]> {
  const query = `${role} jobs${location ? ` in ${location}` : ' in India'} hiring now`;
  const results = await searchGoogle(query, 10);
  return results
    .filter(r => !r.link.includes('naukri.com') && !r.link.includes('linkedin.com') && !r.link.includes('indeed.co'))
    .map(r => parseJobFromResult(r, 'Google Jobs'))
    .filter((j): j is DiscoveredJob => j !== null);
}
