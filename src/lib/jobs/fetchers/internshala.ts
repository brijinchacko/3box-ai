import * as cheerio from 'cheerio'
import { RawJob } from '../normalise'

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

const CATEGORIES = ['software-development', 'web-development', 'data-science', 'marketing', 'design']

export async function fetchInternshala(): Promise<RawJob[]> {
  const jobs: RawJob[] = []

  for (const cat of CATEGORIES) {
    try {
      const url = `https://internshala.com/jobs/${cat}-jobs/`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) continue
      const html = await res.text()
      const $ = cheerio.load(html)

      $('.individual_internship, .job-internship-card').each((_, el) => {
        const title   = $(el).find('.profile, .job-title, h3').first().text().trim()
        const company = $(el).find('.company_name, .company-name').first().text().trim()
        const location = $(el).find('.location_link, .job-location').first().text().trim() || 'India'
        const salary  = $(el).find('.stipend, .salary').first().text().trim()
        const link    = $(el).find('a').first().attr('href') || ''

        if (!title || !company) return
        jobs.push({
          title,
          company,
          location,
          salary: salary || undefined,
          applyUrl: link.startsWith('http') ? link : `https://internshala.com${link}`,
          source: 'internshala',
        })
      })

      await delay(2000)
    } catch {
      // skip
    }
  }

  return jobs
}
