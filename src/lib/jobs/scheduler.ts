import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { fetchNaukri } from './fetchers/naukri'
import { fetchTimesJobs } from './fetchers/timesjobs'
import { fetchHirist } from './fetchers/hirist'
import { fetchInternshala } from './fetchers/internshala'
import { normalise } from './normalise'
import { upsertJobs } from './upsert'

let schedulerInitialised = false

export function initJobScheduler() {
  if (schedulerInitialised) return
  schedulerInitialised = true

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    console.log('[3box jobs] No REDIS_URL configured — scheduler disabled')
    return
  }

  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  })

  const queue = new Queue('india-job-fetch', { connection: connection as any })

  // Schedule each source independently, staggered to avoid hitting all at once
  queue.add('naukri',      {}, { repeat: { pattern: '0 */6 * * *'  }, jobId: 'naukri-cron'      })
  queue.add('timesjobs',   {}, { repeat: { pattern: '30 */6 * * *' }, jobId: 'timesjobs-cron'   })
  queue.add('hirist',      {}, { repeat: { pattern: '0 */4 * * *'  }, jobId: 'hirist-cron'      })
  queue.add('internshala', {}, { repeat: { pattern: '0 */8 * * *'  }, jobId: 'internshala-cron' })

  const fetchers: Record<string, () => Promise<any[]>> = {
    naukri:      fetchNaukri,
    timesjobs:   fetchTimesJobs,
    hirist:      fetchHirist,
    internshala: fetchInternshala,
  }

  new Worker('india-job-fetch', async job => {
    const fetchFn = fetchers[job.name]
    if (!fetchFn) return

    console.log(`[3box jobs] Starting fetch: ${job.name}`)
    const raw  = await fetchFn()
    const jobs = raw.map(normalise).filter(Boolean) as any[]

    if (jobs.length > 0) {
      const count = await upsertJobs(jobs)
      console.log(`[3box jobs] Upserted ${count} jobs from ${job.name}`)
    }
  }, {
    connection: connection as any,
    concurrency: 1,
  })

  console.log('[3box jobs] Scheduler initialised')
}
