// =============================================================================
// NXTED AI — Regional Pricing & Geo Configuration
// =============================================================================
// Maps countries to regions, defines pricing per region in local currencies,
// and provides utility functions for price formatting and region lookup.
// =============================================================================

export type Region =
  | 'IN'
  | 'US'
  | 'UK'
  | 'CA'
  | 'AE'
  | 'SG'
  | 'AU'
  | 'NL'
  | 'PH'
  | 'AF'
  | 'DEFAULT';

export interface PlanPricing {
  monthly: number;
  yearly: number;
}

export interface CreditPricing {
  pack100: number;
  pack500: number;
  pack1000: number;
}

export interface RegionPricing {
  starter: PlanPricing;
  pro: PlanPricing;
  ultra: PlanPricing;
  credits: CreditPricing;
}

export interface RegionConfig {
  region: Region;
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  pricing: RegionPricing;
  studentDiscount: number; // percentage off (e.g. 50 = 50% off)
  tagline: string;
}

// ---------------------------------------------------------------------------
// Region Configurations
// ---------------------------------------------------------------------------

const REGION_CONFIGS: Record<Region, RegionConfig> = {
  IN: {
    region: 'IN',
    country: 'India',
    countryCode: 'IN',
    currency: 'INR',
    currencySymbol: '\u20B9',
    locale: 'en-IN',
    pricing: {
      starter: { monthly: 249, yearly: 2499 },
      pro: { monthly: 699, yearly: 6999 },
      ultra: { monthly: 1249, yearly: 12499 },
      credits: { pack100: 99, pack500: 399, pack1000: 699 },
    },
    studentDiscount: 50,
    tagline: "India's #1 AI Career Platform \u2014 Free Tools, No Signup Required",
  },

  US: {
    region: 'US',
    country: 'United States',
    countryCode: 'US',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    pricing: {
      starter: { monthly: 12, yearly: 99 },
      pro: { monthly: 29, yearly: 249 },
      ultra: { monthly: 59, yearly: 499 },
      credits: { pack100: 5, pack500: 20, pack1000: 35 },
    },
    studentDiscount: 40,
    tagline: 'The All-in-One AI Career Operating System',
  },

  UK: {
    region: 'UK',
    country: 'United Kingdom',
    countryCode: 'GB',
    currency: 'GBP',
    currencySymbol: '\u00A3',
    locale: 'en-GB',
    pricing: {
      starter: { monthly: 10, yearly: 84 },
      pro: { monthly: 24, yearly: 199 },
      ultra: { monthly: 49, yearly: 419 },
      credits: { pack100: 4, pack500: 16, pack1000: 28 },
    },
    studentDiscount: 40,
    tagline: 'AI-Powered Career Tools Built for the UK Job Market',
  },

  CA: {
    region: 'CA',
    country: 'Canada',
    countryCode: 'CA',
    currency: 'CAD',
    currencySymbol: 'CA$',
    locale: 'en-CA',
    pricing: {
      starter: { monthly: 15, yearly: 129 },
      pro: { monthly: 35, yearly: 299 },
      ultra: { monthly: 69, yearly: 589 },
      credits: { pack100: 6, pack500: 24, pack1000: 42 },
    },
    studentDiscount: 40,
    tagline: 'Your AI Career Co-Pilot \u2014 Tailored for Canada',
  },

  AE: {
    region: 'AE',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    currency: 'AED',
    currencySymbol: 'AED',
    locale: 'en-AE',
    pricing: {
      starter: { monthly: 45, yearly: 379 },
      pro: { monthly: 129, yearly: 1099 },
      ultra: { monthly: 249, yearly: 2099 },
      credits: { pack100: 18, pack500: 75, pack1000: 129 },
    },
    studentDiscount: 35,
    tagline: 'AI Career Tools for the Gulf \u2014 Stand Out in MENA',
  },

  SG: {
    region: 'SG',
    country: 'Singapore',
    countryCode: 'SG',
    currency: 'SGD',
    currencySymbol: 'S$',
    locale: 'en-SG',
    pricing: {
      starter: { monthly: 15, yearly: 129 },
      pro: { monthly: 35, yearly: 299 },
      ultra: { monthly: 69, yearly: 589 },
      credits: { pack100: 6, pack500: 24, pack1000: 42 },
    },
    studentDiscount: 40,
    tagline: 'Smart AI Career Tools for Asia-Pacific Professionals',
  },

  AU: {
    region: 'AU',
    country: 'Australia',
    countryCode: 'AU',
    currency: 'AUD',
    currencySymbol: 'A$',
    locale: 'en-AU',
    pricing: {
      starter: { monthly: 18, yearly: 149 },
      pro: { monthly: 39, yearly: 329 },
      ultra: { monthly: 69, yearly: 589 },
      credits: { pack100: 7, pack500: 28, pack1000: 49 },
    },
    studentDiscount: 40,
    tagline: 'AI Career Platform for Australia & New Zealand',
  },

  NL: {
    region: 'NL',
    country: 'Netherlands',
    countryCode: 'NL',
    currency: 'EUR',
    currencySymbol: '\u20AC',
    locale: 'en-NL',
    pricing: {
      starter: { monthly: 11, yearly: 89 },
      pro: { monthly: 27, yearly: 229 },
      ultra: { monthly: 54, yearly: 459 },
      credits: { pack100: 4, pack500: 18, pack1000: 32 },
    },
    studentDiscount: 40,
    tagline: 'AI Career Tools for European Professionals',
  },

  PH: {
    region: 'PH',
    country: 'Philippines',
    countryCode: 'PH',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-PH',
    pricing: {
      starter: { monthly: 5, yearly: 42 },
      pro: { monthly: 12, yearly: 99 },
      ultra: { monthly: 25, yearly: 209 },
      credits: { pack100: 2, pack500: 8, pack1000: 14 },
    },
    studentDiscount: 50,
    tagline: 'Affordable AI Career Tools for Southeast Asia',
  },

  AF: {
    region: 'AF',
    country: 'Africa',
    countryCode: 'NG',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-NG',
    pricing: {
      starter: { monthly: 3, yearly: 25 },
      pro: { monthly: 8, yearly: 67 },
      ultra: { monthly: 15, yearly: 125 },
      credits: { pack100: 1, pack500: 4, pack1000: 7 },
    },
    studentDiscount: 60,
    tagline: 'AI Career Tools Built for Africa \u2014 Empowering the Next Generation',
  },

  DEFAULT: {
    region: 'DEFAULT',
    country: 'International',
    countryCode: '',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    pricing: {
      starter: { monthly: 12, yearly: 99 },
      pro: { monthly: 29, yearly: 249 },
      ultra: { monthly: 59, yearly: 499 },
      credits: { pack100: 5, pack500: 20, pack1000: 35 },
    },
    studentDiscount: 40,
    tagline: 'The All-in-One AI Career Operating System',
  },
};

// ---------------------------------------------------------------------------
// Country Code -> Region mapping
// ---------------------------------------------------------------------------

const COUNTRY_TO_REGION: Record<string, Region> = {
  // India
  IN: 'IN',

  // United States & territories
  US: 'US',
  PR: 'US', // Puerto Rico
  GU: 'US', // Guam
  VI: 'US', // US Virgin Islands

  // United Kingdom
  GB: 'UK',

  // Canada
  CA: 'CA',

  // Gulf / Middle East -> AE region
  AE: 'AE',
  SA: 'AE', // Saudi Arabia
  QA: 'AE', // Qatar
  BH: 'AE', // Bahrain
  OM: 'AE', // Oman
  KW: 'AE', // Kuwait
  JO: 'AE', // Jordan
  LB: 'AE', // Lebanon
  IQ: 'AE', // Iraq

  // Singapore
  SG: 'SG',

  // Australia & New Zealand
  AU: 'AU',
  NZ: 'AU',

  // European Union / Europe -> NL region
  NL: 'NL',
  DE: 'NL', // Germany
  FR: 'NL', // France
  ES: 'NL', // Spain
  IT: 'NL', // Italy
  PT: 'NL', // Portugal
  BE: 'NL', // Belgium
  AT: 'NL', // Austria
  CH: 'NL', // Switzerland
  IE: 'NL', // Ireland
  SE: 'NL', // Sweden
  NO: 'NL', // Norway
  DK: 'NL', // Denmark
  FI: 'NL', // Finland
  PL: 'NL', // Poland
  CZ: 'NL', // Czech Republic
  HU: 'NL', // Hungary
  RO: 'NL', // Romania
  GR: 'NL', // Greece
  HR: 'NL', // Croatia
  BG: 'NL', // Bulgaria
  SK: 'NL', // Slovakia
  SI: 'NL', // Slovenia
  LT: 'NL', // Lithuania
  LV: 'NL', // Latvia
  EE: 'NL', // Estonia
  LU: 'NL', // Luxembourg
  MT: 'NL', // Malta
  CY: 'NL', // Cyprus
  IS: 'NL', // Iceland

  // Southeast Asia -> PH region
  PH: 'PH', // Philippines
  ID: 'PH', // Indonesia
  TH: 'PH', // Thailand
  VN: 'PH', // Vietnam
  MY: 'PH', // Malaysia
  MM: 'PH', // Myanmar
  KH: 'PH', // Cambodia
  LA: 'PH', // Laos
  BD: 'PH', // Bangladesh
  LK: 'PH', // Sri Lanka
  NP: 'PH', // Nepal
  PK: 'PH', // Pakistan

  // Africa -> AF region
  NG: 'AF', // Nigeria
  KE: 'AF', // Kenya
  ZA: 'AF', // South Africa
  GH: 'AF', // Ghana
  EG: 'AF', // Egypt
  TZ: 'AF', // Tanzania
  UG: 'AF', // Uganda
  ET: 'AF', // Ethiopia
  RW: 'AF', // Rwanda
  SN: 'AF', // Senegal
  CI: 'AF', // Ivory Coast
  CM: 'AF', // Cameroon
  DZ: 'AF', // Algeria
  MA: 'AF', // Morocco
  TN: 'AF', // Tunisia
  AO: 'AF', // Angola
  MZ: 'AF', // Mozambique
  ZW: 'AF', // Zimbabwe
  BW: 'AF', // Botswana
  NA: 'AF', // Namibia
};

// ---------------------------------------------------------------------------
// Lookup Functions
// ---------------------------------------------------------------------------

/**
 * Get the region configuration for a given ISO 3166-1 alpha-2 country code.
 * Falls back to DEFAULT if the country is not mapped.
 */
export function getRegionByCountryCode(code: string): RegionConfig {
  const upperCode = code.toUpperCase().trim();
  const region = COUNTRY_TO_REGION[upperCode];

  if (region && REGION_CONFIGS[region]) {
    return REGION_CONFIGS[region];
  }

  return REGION_CONFIGS.DEFAULT;
}

/**
 * Get a region config directly by Region key.
 */
export function getRegionConfig(region: Region): RegionConfig {
  return REGION_CONFIGS[region] ?? REGION_CONFIGS.DEFAULT;
}

/**
 * Format a price amount according to locale and currency.
 * Uses Intl.NumberFormat for proper locale-aware formatting.
 */
export function formatPrice(
  amount: number,
  currency: string,
  locale: string
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: amount % 1 !== 0 ? 2 : 0,
    }).format(amount);
  } catch {
    // Fallback for unsupported locales
    return `${currency} ${amount}`;
  }
}

/**
 * Calculate a discounted price given the original amount and discount percentage.
 */
export function applyStudentDiscount(
  amount: number,
  discountPercent: number
): number {
  return Math.round(amount * (1 - discountPercent / 100));
}

/**
 * Get all available regions (useful for dropdowns / selectors).
 */
export function getAllRegions(): RegionConfig[] {
  return Object.values(REGION_CONFIGS);
}

/**
 * Get all supported country codes and their mapped region.
 */
export function getCountryRegionMap(): Record<string, Region> {
  return { ...COUNTRY_TO_REGION };
}

export { REGION_CONFIGS, COUNTRY_TO_REGION };
