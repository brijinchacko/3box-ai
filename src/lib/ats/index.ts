/**
 * ATS (Applicant Tracking System) module
 * Provides direct API integrations with major ATS platforms.
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
