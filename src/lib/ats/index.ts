/**
 * ATS (Applicant Tracking System) module
 * Provides direct API integrations with major ATS platforms
 * and extension-based auto-fill for platforms without public APIs.
 */
export {
  type GreenhouseApplicationData,
  type GreenhouseSubmitResult,
  parseGreenhouseUrl,
  isGreenhouseUrl,
  submitGreenhouseApplication,
} from './greenhouse';

export {
  type LeverApplicationData,
  type LeverSubmitResult,
  parseLeverUrl,
  isLeverUrl,
  submitLeverApplication,
} from './lever';

export {
  type WorkdayJobMetadata,
  type WorkdayFormData,
  parseWorkdayUrl,
  isWorkdayUrl,
  prepareWorkdayApplicationData,
} from './workday';

export {
  type IcimsJobMetadata,
  type IcimsFormData,
  parseIcimsUrl,
  isIcimsUrl,
  prepareIcimsApplicationData,
} from './icims';
