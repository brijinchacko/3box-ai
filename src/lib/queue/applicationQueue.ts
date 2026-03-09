/**
 * Application Queue — processes job applications in parallel batches.
 * Uses BullMQ when Redis is available, falls back to in-memory Promise.allSettled batching.
 *
 * Supports 100+ applications/day with:
 * - Concurrent batch processing (5 at a time)
 * - Per-company rate limiting
 * - Automatic retries on transient failures
 * - Progress tracking via callbacks
 */
import { Queue, Worker, Job } from 'bullmq';
import { getRedisConnection, isRedisAvailable } from './connection';

// ─── Types ──────────────────────────────────────────

export interface ApplicationJobData {
  userId: string;
  runId: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    source: string;
    matchScore?: number;
    atsType?: string; // greenhouse | lever | workday | generic
  };
  resumeData: any;
  coverLetter?: string;
  channel: 'ats_api' | 'cold_email' | 'portal_queue';
  priority: number; // 1=highest
}

export interface ApplicationJobResult {
  success: boolean;
  jobId: string;
  method: string;
  details: string;
  applicationId?: string;
}

export type ApplicationProcessor = (data: ApplicationJobData) => Promise<ApplicationJobResult>;

// ─── Queue Constants ────────────────────────────────

const QUEUE_NAME = 'archer-applications';
const BATCH_CONCURRENCY = 5; // Process 5 apps at a time
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

// ─── BullMQ Queue (when Redis available) ────────────

let _queue: Queue | null = null;
let _worker: Worker | null = null;

function getQueue(): Queue | null {
  if (_queue) return _queue;
  const connection = getRedisConnection();
  if (!connection) return null;

  _queue = new Queue(QUEUE_NAME, {
    connection: connection as any, // Cast needed: standalone ioredis types differ from BullMQ's bundled ioredis
    defaultJobOptions: {
      attempts: MAX_RETRIES + 1,
      backoff: { type: 'exponential', delay: RETRY_DELAY_MS },
      removeOnComplete: { count: 500 }, // Keep last 500 completed
      removeOnFail: { count: 200 },
    },
  });
  return _queue;
}

/**
 * Start the BullMQ worker that processes application jobs.
 * Call this once at server startup.
 */
export function startApplicationWorker(processor: ApplicationProcessor): void {
  const connection = getRedisConnection();
  if (!connection) {
    console.log('[Queue] No Redis — BullMQ worker not started (using in-memory fallback)');
    return;
  }

  if (_worker) return; // Already running

  _worker = new Worker(
    QUEUE_NAME,
    async (job: Job<ApplicationJobData>) => {
      return processor(job.data);
    },
    {
      connection: connection as any, // Cast needed: standalone ioredis types differ from BullMQ's bundled ioredis
      concurrency: BATCH_CONCURRENCY,
      limiter: {
        max: 25, // Max 25 per hour (matches rate limits)
        duration: 3600000,
      },
    },
  );

  _worker.on('completed', (job) => {
    console.log(`[Queue] ✓ Application completed: ${job.data.job.title} at ${job.data.job.company}`);
  });

  _worker.on('failed', (job, err) => {
    console.error(`[Queue] ✗ Application failed: ${job?.data.job.title} — ${err.message}`);
  });

  console.log(`[Queue] Application worker started (concurrency: ${BATCH_CONCURRENCY})`);
}

/**
 * Add a batch of application jobs to the queue.
 * Returns immediately — jobs are processed asynchronously.
 */
export async function enqueueApplications(
  jobs: ApplicationJobData[],
): Promise<{ queued: number; queueId?: string }> {
  const queue = getQueue();
  if (!queue) {
    // Will fall through to in-memory processing
    return { queued: 0 };
  }

  const bulkJobs = jobs.map((data, i) => ({
    name: `apply-${data.job.id}`,
    data,
    opts: {
      priority: data.priority,
      delay: i * 2000, // Stagger by 2s to avoid bursts
    },
  }));

  await queue.addBulk(bulkJobs);
  return { queued: jobs.length, queueId: QUEUE_NAME };
}

// ─── In-Memory Fallback (no Redis) ──────────────────

/**
 * Process applications in-memory using Promise.allSettled batching.
 * This is the fallback when Redis/BullMQ is not available.
 *
 * Processes jobs in batches of BATCH_CONCURRENCY, with progress callbacks.
 */
export async function processApplicationsBatch(
  jobs: ApplicationJobData[],
  processor: ApplicationProcessor,
  onProgress?: (completed: number, total: number, result: ApplicationJobResult) => void,
): Promise<ApplicationJobResult[]> {
  const results: ApplicationJobResult[] = [];
  const total = jobs.length;

  // Sort by priority (lower = higher priority)
  const sorted = [...jobs].sort((a, b) => a.priority - b.priority);

  // Process in batches of BATCH_CONCURRENCY
  for (let i = 0; i < sorted.length; i += BATCH_CONCURRENCY) {
    const batch = sorted.slice(i, i + BATCH_CONCURRENCY);

    const batchResults = await Promise.allSettled(
      batch.map(async (jobData) => {
        let lastError: Error | null = null;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            return await processor(jobData);
          } catch (err) {
            lastError = err as Error;
            if (attempt < MAX_RETRIES) {
              await sleep(RETRY_DELAY_MS * (attempt + 1));
            }
          }
        }
        return {
          success: false,
          jobId: jobData.job.id,
          method: jobData.channel,
          details: `Failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`,
        } as ApplicationJobResult;
      }),
    );

    for (const result of batchResults) {
      const res = result.status === 'fulfilled'
        ? result.value
        : { success: false, jobId: 'unknown', method: 'unknown', details: `Error: ${result.reason}` };
      results.push(res);
      onProgress?.(results.length, total, res);
    }

    // Small delay between batches to respect rate limits
    if (i + BATCH_CONCURRENCY < sorted.length) {
      await sleep(3000);
    }
  }

  return results;
}

// ─── Queue Status ───────────────────────────────────

export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
} | null> {
  const queue = getQueue();
  if (!queue) return null;

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Drain all jobs from the queue (for cleanup/testing).
 */
export async function drainQueue(): Promise<void> {
  const queue = getQueue();
  if (queue) await queue.drain();
}

// ─── Helpers ────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
