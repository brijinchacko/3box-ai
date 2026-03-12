// =============================================================================
// 3BOX AI — Geo Module Barrel Export
// =============================================================================

// Region configuration & pricing
export {
  type Region,
  type RegionConfig,
  type RegionPricing,
  type PlanPricing,
  getRegionByCountryCode,
  getRegionConfig,
  formatPrice,
  applyStudentDiscount,
  getAllRegions,
  getCountryRegionMap,
  REGION_CONFIGS,
  COUNTRY_TO_REGION,
} from './regions';

// Server-side detection
export {
  detectCountry,
  detectCountryFromTimezone,
  extractClientIP,
} from './detect';

// Client-side context (re-exported for convenience)
export { RegionProvider, useRegion } from './context';
