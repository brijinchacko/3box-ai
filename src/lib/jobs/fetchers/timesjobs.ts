import { RawJob } from '../normalise'
import { INDIA_CITIES } from '../constants'

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function fetchTimesJobs(): Promise<RawJob[]> {
  const jobs: RawJob[] = []

  for (const city of INDIA_CITIES.slice(0, 6)) {
    try {
      const url = `https://www.timesjobs.com/candidate/job-search.html?searchType=personalizedSearch&from=submit&txtKeywords=&txtLocation=${city}&cboWorkExp1=0&postWeek=7`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 3boxAI/1.0 job aggregator)' },
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) continue
      const html = await res.text()

      const titleMatches  = html.match(/class="[^"]*heading-trun[^"]*"[^>]*>([^<]+)</g) || []
      const companyBlocks = html.match(/class="[^"]*joblist-comp-name[^"]*"[^>]*>[\s\S]*?<\/h3>/g) || []

      const count = Math.min(titleMatches.length, companyBlocks.length, 20)
      for (let i = 0; i < count; i++) {
        const title   = titleMatches[i]?.replace(/^[^>]+>/, '').replace(/<[^>]+>.*/, '').trim()
        const company = companyBlocks[i]?.replace(/<[^>]+>/g, '').trim()
        if (!title || !company) continue

        jobs.push({
          title,
          company,
          location: city,
          applyUrl: `https://www.timesjobs.com`,
          source: 'timesjobs',
        })
      }

      await delay(2000)
    } catch {
      // skip
    }
  }

  return jobs
}
