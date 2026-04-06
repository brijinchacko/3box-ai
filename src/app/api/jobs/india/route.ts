import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { checkAndIncrementSearchLimit } from '@/lib/jobs/search-limit'
import { PLAN_SEARCH_LIMITS } from '@/lib/jobs/constants'
import { getRedisConnection } from '@/lib/queue/connection'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const userId = session.user.id
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })
  const plan = (user?.plan ?? 'FREE').toLowerCase()

  // Check plan-based search limit
  const limitCheck = await checkAndIncrementSearchLimit(userId, plan)
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: 'limit_reached', message: limitCheck.message, remaining: 0 },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(req.url)
  const q        = (searchParams.get('q') || '').trim()
  const location = (searchParams.get('location') || '').trim()
  const source   = searchParams.get('source') || ''
  const page     = parseInt(searchParams.get('page') || '1')

  const limits    = PLAN_SEARCH_LIMITS[plan] ?? PLAN_SEARCH_LIMITS.free
  const take      = limits.resultsPerSearch
  const skip      = (page - 1) * take

  // Redis cache key
  const cacheKey  = `3box:jobs:${q}:${location}:${source}:${page}`
  const redis = getRedisConnection()

  // Try Redis cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        return NextResponse.json({ ...parsed, remaining: limitCheck.remaining, fromCache: true })
      }
    } catch { /* redis miss is fine */ }
  }

  // Build Prisma where clause
  const where: any = {
    isActive:  true,
    expiresAt: { gt: new Date() },
  }

  if (location) {
    where.location = { contains: location, mode: 'insensitive' }
  }

  if (source) {
    where.source = source
  }

  if (q) {
    where.OR = [
      { title:       { contains: q, mode: 'insensitive' } },
      { company:     { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { skills:      { has: q.toLowerCase() } },
      { location:    { contains: q, mode: 'insensitive' } },
    ]
  }

  const [jobs, total] = await prisma.$transaction([
    prisma.cachedJob.findMany({
      where,
      orderBy: [{ postedAt: 'desc' }, { fetchedAt: 'desc' }],
      take,
      skip,
      select: {
        id: true, title: true, company: true, location: true,
        salary: true, description: true, applyUrl: true,
        source: true, skills: true, postedAt: true, fetchedAt: true,
      },
    }),
    prisma.cachedJob.count({ where }),
  ])

  // If main query returns < 5 results, also fetch related jobs to pad suggestions
  let related: any[] = []
  if (jobs.length < 5 && q) {
    const words = q.split(' ').filter(w => w.length > 3)
    if (words.length > 0) {
      related = await prisma.cachedJob.findMany({
        where: {
          isActive:  true,
          expiresAt: { gt: new Date() },
          id:        { notIn: jobs.map(j => j.id) },
          OR: words.map(word => ({ title: { contains: word, mode: 'insensitive' as const } })),
        },
        orderBy: { fetchedAt: 'desc' },
        take: Math.min(20, take - jobs.length),
        select: {
          id: true, title: true, company: true, location: true,
          salary: true, description: true, applyUrl: true,
          source: true, skills: true, postedAt: true, fetchedAt: true,
        },
      })
    }
  }

  const payload = {
    jobs,
    related,
    total,
    page,
    totalPages: Math.ceil(total / take),
    remaining: limitCheck.remaining,
    fromCache: false,
  }

  // Cache in Redis for 2 hours
  if (redis) {
    try {
      await redis.setex(cacheKey, 7200, JSON.stringify(payload))
    } catch { /* ignore */ }
  }

  return NextResponse.json(payload)
}
