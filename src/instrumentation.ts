export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initJobScheduler } = await import('@/lib/jobs/scheduler')
    initJobScheduler()
  }
}
