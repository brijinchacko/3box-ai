import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { fetchNaukri } from '@/lib/jobs/fetchers/naukri'
import { fetchHirist } from '@/lib/jobs/fetchers/hirist'
import { normalise } from '@/lib/jobs/normalise'
import { upsertJobs } from '@/lib/jobs/upsert'

export async function POST() {
  const session = await getServerSession(authOptions)
  const adminEmails = (process.env.OFORO_ADMIN_EMAILS || '').split(',')

  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Run Naukri + Hirist immediately for testing
  const [naukriRaw, hiristRaw] = await Promise.all([fetchNaukri(), fetchHirist()])
  const all = [...naukriRaw, ...hiristRaw].map(normalise).filter(Boolean) as any[]
  const count = await upsertJobs(all)

  return NextResponse.json({ success: true, upserted: count })
}
