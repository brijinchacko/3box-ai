import crypto from 'crypto'
import { JOB_CACHE_TTL_DAYS } from './constants'

export interface RawJob {
  title: string
  company: string
  location: string
  salary?: string
  description?: string
  applyUrl: string
  source: string
  skills?: string[]
  postedAt?: Date
}

export interface NormalisedJob {
  externalId: string
  title: string
  company: string
  location: string
  salary: string | null
  description: string | null
  applyUrl: string
  source: string
  skills: string[]
  postedAt: Date | null
  fetchedAt: Date
  expiresAt: Date
  isActive: boolean
}

export function normalise(raw: RawJob): NormalisedJob | null {
  const title   = raw.title?.trim()
  const company = raw.company?.trim()
  const location = raw.location?.trim()

  if (!title || !company || !location || title.length < 3) return null

  const externalId = crypto
    .createHash('md5')
    .update(`${title.toLowerCase()}|${company.toLowerCase()}|${location.toLowerCase()}|${raw.source}`)
    .digest('hex')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + JOB_CACHE_TTL_DAYS)

  return {
    externalId,
    title,
    company,
    location,
    salary:      raw.salary?.trim() || null,
    description: raw.description?.trim() || null,
    applyUrl:    raw.applyUrl || '',
    source:      raw.source,
    skills:      raw.skills || extractSkills(raw.description || ''),
    postedAt:    raw.postedAt || null,
    fetchedAt:   new Date(),
    expiresAt,
    isActive:    true,
  }
}

function extractSkills(text: string): string[] {
  const known = [
    'react','node','python','java','typescript','javascript','aws','docker',
    'kubernetes','sql','mongodb','postgresql','redis','git','angular','vue',
    'django','flask','spring','golang','rust','c++','machine learning',
    'deep learning','tensorflow','pytorch','figma','flutter','kotlin','swift',
  ]
  const lower = text.toLowerCase()
  return known.filter(skill => lower.includes(skill))
}
