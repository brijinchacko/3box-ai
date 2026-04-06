import { RawJob } from '../normalise'

export async function fetchHirist(): Promise<RawJob[]> {
  const jobs: RawJob[] = []

  try {
    const res = await fetch('https://www.hirist.tech/j/search-jobs.json?location=India&page=1&limit=100', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 3boxAI/1.0)' },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return jobs

    const data = await res.json()
    const list = data?.jobs || data?.data || data?.results || []

    for (const item of list) {
      if (!item.title || !item.company) continue
      jobs.push({
        title:       item.title || item.job_title,
        company:     item.company || item.company_name,
        location:    item.location || item.city || 'India',
        salary:      item.salary || item.ctc,
        description: item.description || item.snippet,
        applyUrl:    item.url || item.apply_url || item.job_url || 'https://www.hirist.tech',
        source: 'hirist',
        skills: item.skills || item.tags || [],
      })
    }
  } catch {
    // skip
  }

  return jobs
}
