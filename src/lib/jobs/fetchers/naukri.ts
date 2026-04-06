import * as cheerio from 'cheerio'
import { RawJob } from '../normalise'
import { INDIA_CITIES, INDIA_ROLES } from '../constants'

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function fetchNaukri(): Promise<RawJob[]> {
  const jobs: RawJob[] = []

  for (const city of INDIA_CITIES.slice(0, 6)) {
    for (const role of INDIA_ROLES.slice(0, 8)) {
      try {
        const url = `https://www.naukri.com/${role.replace(/\+/g, '-')}-jobs-in-${city}`
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-IN,en;q=0.9',
          },
          signal: AbortSignal.timeout(10000),
        })

        if (!res.ok) continue
        const html = await res.text()
        const $ = cheerio.load(html)

        $('article.jobTuple, div.jobTupleHeader, div[class*="jobTuple"]').each((_, el) => {
          const title   = $(el).find('a.title, .jobTitle, [class*="title"]').first().text().trim()
          const company = $(el).find('a.subTitle, .companyName, [class*="company"]').first().text().trim()
          const link    = $(el).find('a.title, [class*="title"] a').first().attr('href') || ''
          const salary  = $(el).find('.salary, [class*="salary"]').first().text().trim()
          const exp     = $(el).find('.experience, [class*="exp"]').first().text().trim()

          if (!title || !company || title.length < 3) return

          jobs.push({
            title,
            company,
            location: city,
            salary:   salary || undefined,
            description: exp ? `Experience required: ${exp}` : undefined,
            applyUrl: link.startsWith('http') ? link : `https://www.naukri.com${link}`,
            source: 'naukri',
          })
        })

        await delay(1500 + Math.random() * 1000)
      } catch {
        // skip failed fetch silently
      }
    }
  }

  return jobs
}
