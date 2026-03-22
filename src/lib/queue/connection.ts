/**
 * Redis connection for BullMQ job queues.
 * Falls back to in-memory mode if Redis is unavailable.
 */
import IORedis from 'ioredis';

let _connection: IORedis | null = null;
let _connectionFailed = false;
let _lastRetryAt = 0;
const RETRY_COOLDOWN_MS = 60_000; // Retry Redis every 60s after failure

/**
 * Get a shared Redis connection for BullMQ.
 * Returns null if Redis is not configured or unavailable.
 * Automatically retries after cooldown period if previously failed.
 */
export function getRedisConnection(): IORedis | null {
  // If connection previously failed, retry after cooldown
  if (_connectionFailed) {
    const now = Date.now();
    if (now - _lastRetryAt < RETRY_COOLDOWN_MS) return null;
    // Reset and try again
    _connectionFailed = false;
    _connection = null;
    _lastRetryAt = now;
    console.log('[Queue] Retrying Redis connection...');
  }
  if (_connection) return _connection;

  const redisUrl = process.env.REDIS_URL || process.env.BULLMQ_REDIS_URL;
  if (!redisUrl) {
    console.log('[Queue] No REDIS_URL configured — using in-memory fallback');
    _connectionFailed = true;
    _lastRetryAt = Date.now();
    return null;
  }

  try {
    _connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('[Queue] Redis connection failed after 3 retries — falling back to in-memory');
          _connectionFailed = true;
          _lastRetryAt = Date.now();
          return null;
        }
        return Math.min(times * 500, 3000);
      },
    });

    _connection.on('error', (err) => {
      console.error('[Queue] Redis error:', err.message);
    });

    _connection.on('connect', () => {
      console.log('[Queue] Redis connected');
      _connectionFailed = false; // Connection recovered
    });

    return _connection;
  } catch (err) {
    console.error('[Queue] Failed to create Redis connection:', err);
    _connectionFailed = true;
    _lastRetryAt = Date.now();
    return null;
  }
}

/**
 * Check if Redis is available for queue operations.
 */
export function isRedisAvailable(): boolean {
  return !_connectionFailed && !!getRedisConnection();
}
