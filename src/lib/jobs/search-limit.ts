import { getRedisConnection } from '@/lib/queue/connection'
import { PLAN_SEARCH_LIMITS } from './constants'

export async function checkAndIncrementSearchLimit(
  userId: string,
  plan: string
): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  const limits = PLAN_SEARCH_LIMITS[plan] ?? PLAN_SEARCH_LIMITS.free

  if (limits.searchesPerDay >= 999999) {
    return { allowed: true, remaining: 999999 }
  }

  const redis = getRedisConnection()
  if (!redis) {
    // If Redis is unavailable, allow the search (graceful degradation)
    return { allowed: true, remaining: limits.searchesPerDay }
  }

  // Use IST date as key so it resets at midnight IST
  const istDate = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
  const key = `3box:search_limit:${userId}:${istDate}`

  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, 86400)

  if (count > limits.searchesPerDay) {
    return {
      allowed: false,
      remaining: 0,
      message: `You've used all ${limits.searchesPerDay} job searches for today. Upgrade your plan for more.`,
    }
  }

  return {
    allowed: true,
    remaining: limits.searchesPerDay - count,
  }
}
