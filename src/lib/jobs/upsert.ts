import { prisma } from '@/lib/db/prisma'
import { NormalisedJob } from './normalise'

export async function upsertJobs(jobs: NormalisedJob[]): Promise<number> {
  let count = 0
  const chunks = chunkArray(jobs, 50)

  for (const chunk of chunks) {
    const result = await prisma.$transaction(
      chunk.map(job =>
        prisma.cachedJob.upsert({
          where:  { externalId: job.externalId },
          update: { isActive: true, fetchedAt: new Date(), expiresAt: job.expiresAt },
          create: job,
        })
      )
    )
    count += result.length
  }

  return count
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}
