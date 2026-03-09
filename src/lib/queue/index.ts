/**
 * Queue module — re-exports for application processing.
 */
export { getRedisConnection, isRedisAvailable } from './connection';
export {
  type ApplicationJobData,
  type ApplicationJobResult,
  type ApplicationProcessor,
  startApplicationWorker,
  enqueueApplications,
  processApplicationsBatch,
  getQueueStats,
  drainQueue,
} from './applicationQueue';
