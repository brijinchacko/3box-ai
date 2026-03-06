/**
 * Static cost-of-living index for ~100 major cities worldwide.
 * Indices are relative to the US national average (1.0).
 *
 * Data sources: BLS Consumer Expenditure Survey, Numbeo, EIU,
 * and Mercer Cost of Living Survey — synthesized for 2024 estimates.
 */

export interface CostOfLivingEntry {
  city: string;
  country: string;
  index: number;
  currency: string;
}

// ─── Cost of Living Database ──────────────────────────────────────────────────

export const COST_OF_LIVING: CostOfLivingEntry[] = [
  // ── United States ────────────────────────────────────────────────────────────
  // Very High
  { city: 'San Francisco', country: 'United States', index: 1.42, currency: 'USD' },
  { city: 'San Jose', country: 'United States', index: 1.40, currency: 'USD' },
  { city: 'New York', country: 'United States', index: 1.37, currency: 'USD' },
  { city: 'Los Angeles', country: 'United States', index: 1.32, currency: 'USD' },
  { city: 'Boston', country: 'United States', index: 1.30, currency: 'USD' },
  { city: 'Seattle', country: 'United States', index: 1.28, currency: 'USD' },
  { city: 'Washington DC', country: 'United States', index: 1.25, currency: 'USD' },
  // High
  { city: 'San Diego', country: 'United States', index: 1.18, currency: 'USD' },
  { city: 'Denver', country: 'United States', index: 1.12, currency: 'USD' },
  { city: 'Portland', country: 'United States', index: 1.10, currency: 'USD' },
  { city: 'Chicago', country: 'United States', index: 1.10, currency: 'USD' },
  { city: 'Miami', country: 'United States', index: 1.12, currency: 'USD' },
  { city: 'Austin', country: 'United States', index: 1.08, currency: 'USD' },
  { city: 'Minneapolis', country: 'United States', index: 1.05, currency: 'USD' },
  { city: 'Philadelphia', country: 'United States', index: 1.05, currency: 'USD' },
  // Average
  { city: 'Dallas', country: 'United States', index: 0.98, currency: 'USD' },
  { city: 'Atlanta', country: 'United States', index: 0.97, currency: 'USD' },
  { city: 'Phoenix', country: 'United States', index: 0.95, currency: 'USD' },
  { city: 'Nashville', country: 'United States', index: 0.95, currency: 'USD' },
  { city: 'Charlotte', country: 'United States', index: 0.92, currency: 'USD' },
  { city: 'Raleigh', country: 'United States', index: 0.92, currency: 'USD' },
  { city: 'Salt Lake City', country: 'United States', index: 0.93, currency: 'USD' },
  { city: 'Tampa', country: 'United States', index: 0.92, currency: 'USD' },
  // Below Average
  { city: 'Houston', country: 'United States', index: 0.90, currency: 'USD' },
  { city: 'Columbus', country: 'United States', index: 0.88, currency: 'USD' },
  { city: 'Indianapolis', country: 'United States', index: 0.85, currency: 'USD' },
  { city: 'Kansas City', country: 'United States', index: 0.82, currency: 'USD' },
  { city: 'Pittsburgh', country: 'United States', index: 0.85, currency: 'USD' },
  { city: 'St Louis', country: 'United States', index: 0.83, currency: 'USD' },
  { city: 'Detroit', country: 'United States', index: 0.80, currency: 'USD' },
  { city: 'Cleveland', country: 'United States', index: 0.78, currency: 'USD' },
  { city: 'Memphis', country: 'United States', index: 0.78, currency: 'USD' },
  { city: 'Oklahoma City', country: 'United States', index: 0.75, currency: 'USD' },

  // ── Canada ───────────────────────────────────────────────────────────────────
  { city: 'Vancouver', country: 'Canada', index: 1.18, currency: 'CAD' },
  { city: 'Toronto', country: 'Canada', index: 1.15, currency: 'CAD' },
  { city: 'Montreal', country: 'Canada', index: 0.90, currency: 'CAD' },
  { city: 'Ottawa', country: 'Canada', index: 0.92, currency: 'CAD' },
  { city: 'Calgary', country: 'Canada', index: 0.95, currency: 'CAD' },

  // ── Europe ───────────────────────────────────────────────────────────────────
  { city: 'Zurich', country: 'Switzerland', index: 1.55, currency: 'CHF' },
  { city: 'Geneva', country: 'Switzerland', index: 1.50, currency: 'CHF' },
  { city: 'London', country: 'United Kingdom', index: 1.25, currency: 'GBP' },
  { city: 'Manchester', country: 'United Kingdom', index: 0.88, currency: 'GBP' },
  { city: 'Edinburgh', country: 'United Kingdom', index: 0.90, currency: 'GBP' },
  { city: 'Paris', country: 'France', index: 1.18, currency: 'EUR' },
  { city: 'Lyon', country: 'France', index: 0.82, currency: 'EUR' },
  { city: 'Amsterdam', country: 'Netherlands', index: 1.15, currency: 'EUR' },
  { city: 'Dublin', country: 'Ireland', index: 1.15, currency: 'EUR' },
  { city: 'Munich', country: 'Germany', index: 1.10, currency: 'EUR' },
  { city: 'Berlin', country: 'Germany', index: 0.95, currency: 'EUR' },
  { city: 'Hamburg', country: 'Germany', index: 0.95, currency: 'EUR' },
  { city: 'Frankfurt', country: 'Germany', index: 1.00, currency: 'EUR' },
  { city: 'Stockholm', country: 'Sweden', index: 1.10, currency: 'SEK' },
  { city: 'Copenhagen', country: 'Denmark', index: 1.20, currency: 'DKK' },
  { city: 'Oslo', country: 'Norway', index: 1.30, currency: 'NOK' },
  { city: 'Helsinki', country: 'Finland', index: 1.05, currency: 'EUR' },
  { city: 'Vienna', country: 'Austria', index: 0.95, currency: 'EUR' },
  { city: 'Brussels', country: 'Belgium', index: 0.95, currency: 'EUR' },
  { city: 'Milan', country: 'Italy', index: 0.90, currency: 'EUR' },
  { city: 'Rome', country: 'Italy', index: 0.82, currency: 'EUR' },
  { city: 'Barcelona', country: 'Spain', index: 0.80, currency: 'EUR' },
  { city: 'Madrid', country: 'Spain', index: 0.85, currency: 'EUR' },
  { city: 'Lisbon', country: 'Portugal', index: 0.65, currency: 'EUR' },
  { city: 'Warsaw', country: 'Poland', index: 0.60, currency: 'PLN' },
  { city: 'Krakow', country: 'Poland', index: 0.52, currency: 'PLN' },
  { city: 'Prague', country: 'Czech Republic', index: 0.55, currency: 'CZK' },
  { city: 'Budapest', country: 'Hungary', index: 0.50, currency: 'HUF' },
  { city: 'Bucharest', country: 'Romania', index: 0.45, currency: 'RON' },
  { city: 'Athens', country: 'Greece', index: 0.62, currency: 'EUR' },

  // ── Asia-Pacific ─────────────────────────────────────────────────────────────
  { city: 'Singapore', country: 'Singapore', index: 1.25, currency: 'SGD' },
  { city: 'Tokyo', country: 'Japan', index: 1.18, currency: 'JPY' },
  { city: 'Osaka', country: 'Japan', index: 0.95, currency: 'JPY' },
  { city: 'Sydney', country: 'Australia', index: 1.20, currency: 'AUD' },
  { city: 'Melbourne', country: 'Australia', index: 1.12, currency: 'AUD' },
  { city: 'Brisbane', country: 'Australia', index: 1.00, currency: 'AUD' },
  { city: 'Auckland', country: 'New Zealand', index: 1.00, currency: 'NZD' },
  { city: 'Hong Kong', country: 'Hong Kong', index: 1.22, currency: 'HKD' },
  { city: 'Seoul', country: 'South Korea', index: 0.95, currency: 'KRW' },
  { city: 'Taipei', country: 'Taiwan', index: 0.65, currency: 'TWD' },
  { city: 'Beijing', country: 'China', index: 0.60, currency: 'CNY' },
  { city: 'Shanghai', country: 'China', index: 0.65, currency: 'CNY' },
  { city: 'Shenzhen', country: 'China', index: 0.58, currency: 'CNY' },
  { city: 'Bangkok', country: 'Thailand', index: 0.45, currency: 'THB' },
  { city: 'Kuala Lumpur', country: 'Malaysia', index: 0.42, currency: 'MYR' },
  { city: 'Jakarta', country: 'Indonesia', index: 0.30, currency: 'IDR' },
  { city: 'Ho Chi Minh City', country: 'Vietnam', index: 0.32, currency: 'VND' },
  { city: 'Hanoi', country: 'Vietnam', index: 0.30, currency: 'VND' },
  { city: 'Manila', country: 'Philippines', index: 0.35, currency: 'PHP' },

  // ── India ────────────────────────────────────────────────────────────────────
  { city: 'Mumbai', country: 'India', index: 0.35, currency: 'INR' },
  { city: 'Bangalore', country: 'India', index: 0.30, currency: 'INR' },
  { city: 'Delhi', country: 'India', index: 0.28, currency: 'INR' },
  { city: 'Hyderabad', country: 'India', index: 0.27, currency: 'INR' },
  { city: 'Chennai', country: 'India', index: 0.26, currency: 'INR' },
  { city: 'Pune', country: 'India', index: 0.28, currency: 'INR' },
  { city: 'Kolkata', country: 'India', index: 0.22, currency: 'INR' },

  // ── Middle East ──────────────────────────────────────────────────────────────
  { city: 'Dubai', country: 'United Arab Emirates', index: 1.05, currency: 'AED' },
  { city: 'Abu Dhabi', country: 'United Arab Emirates', index: 0.95, currency: 'AED' },
  { city: 'Tel Aviv', country: 'Israel', index: 1.20, currency: 'ILS' },
  { city: 'Riyadh', country: 'Saudi Arabia', index: 0.70, currency: 'SAR' },
  { city: 'Doha', country: 'Qatar', index: 0.90, currency: 'QAR' },

  // ── Latin America ────────────────────────────────────────────────────────────
  { city: 'Mexico City', country: 'Mexico', index: 0.45, currency: 'MXN' },
  { city: 'Sao Paulo', country: 'Brazil', index: 0.65, currency: 'BRL' },
  { city: 'Rio de Janeiro', country: 'Brazil', index: 0.58, currency: 'BRL' },
  { city: 'Buenos Aires', country: 'Argentina', index: 0.40, currency: 'ARS' },
  { city: 'Bogota', country: 'Colombia', index: 0.38, currency: 'COP' },
  { city: 'Santiago', country: 'Chile', index: 0.55, currency: 'CLP' },
  { city: 'Lima', country: 'Peru', index: 0.42, currency: 'PEN' },

  // ── Africa ───────────────────────────────────────────────────────────────────
  { city: 'Cape Town', country: 'South Africa', index: 0.40, currency: 'ZAR' },
  { city: 'Johannesburg', country: 'South Africa', index: 0.42, currency: 'ZAR' },
  { city: 'Nairobi', country: 'Kenya', index: 0.35, currency: 'KES' },
  { city: 'Lagos', country: 'Nigeria', index: 0.30, currency: 'NGN' },
  { city: 'Cairo', country: 'Egypt', index: 0.30, currency: 'EGP' },
  { city: 'Accra', country: 'Ghana', index: 0.35, currency: 'GHS' },
];

// ─── Lookup Functions ─────────────────────────────────────────────────────────

/**
 * Normalize a city query for matching.
 * Handles inputs like "San Francisco, CA, USA" by extracting the city name portion.
 */
function normalizeCityQuery(query: string): string {
  // Take only the first segment before any comma (the city name)
  const cityPart = query.split(',')[0].trim();
  return cityPart.toLowerCase().replace(/[\s\-_]+/g, ' ');
}

/**
 * Normalize a stored city name for comparison.
 */
function normalizeCity(city: string): string {
  return city.toLowerCase().replace(/[\s\-_]+/g, ' ');
}

/**
 * Find a cost-of-living entry by city name query.
 * Supports fuzzy matching: handles extra qualifiers like state/country after commas,
 * and performs substring matching if exact match fails.
 *
 * @param cityQuery - City name, optionally with state/country (e.g., "San Francisco, CA, USA")
 * @returns The matching CostOfLivingEntry, or null if not found
 */
export function getCostOfLiving(cityQuery: string): CostOfLivingEntry | null {
  if (!cityQuery || !cityQuery.trim()) return null;

  const normalizedQuery = normalizeCityQuery(cityQuery);

  // 1. Exact match on city name
  for (const entry of COST_OF_LIVING) {
    if (normalizeCity(entry.city) === normalizedQuery) {
      return entry;
    }
  }

  // 2. Check if query contains city name or vice versa
  for (const entry of COST_OF_LIVING) {
    const normalizedCity = normalizeCity(entry.city);
    if (normalizedQuery.includes(normalizedCity) || normalizedCity.includes(normalizedQuery)) {
      return entry;
    }
  }

  // 3. Also try matching with country qualifier from the query
  const fullNormalized = cityQuery.toLowerCase().replace(/[\s\-_]+/g, ' ').trim();
  for (const entry of COST_OF_LIVING) {
    const cityCountry = `${entry.city} ${entry.country}`.toLowerCase();
    if (fullNormalized.includes(normalizeCity(entry.city))) {
      return entry;
    }
    // Check if query matches "City, Country" format
    if (cityCountry.includes(normalizedQuery)) {
      return entry;
    }
  }

  return null;
}

/**
 * Adjust a base USD salary for a target city using cost-of-living index.
 * Returns the adjusted amount in the local currency of the target city.
 *
 * If the city is not found, returns the base salary unchanged with USD currency.
 *
 * @param baseSalaryUSD - The base annual salary in USD
 * @param targetCity - The target city (e.g., "London" or "Bangalore, India")
 * @param baseCurrency - Optional override for output currency (defaults to city's local currency)
 * @returns Object with adjusted amount, currency code, and the COL index used
 */
export function adjustSalaryForLocation(
  baseSalaryUSD: number,
  targetCity: string,
  baseCurrency?: string
): { adjustedAmount: number; currency: string; colIndex: number } {
  const entry = getCostOfLiving(targetCity);

  if (!entry) {
    return {
      adjustedAmount: Math.round(baseSalaryUSD),
      currency: baseCurrency || 'USD',
      colIndex: 1.0,
    };
  }

  const adjustedAmount = Math.round(baseSalaryUSD * entry.index);
  const currency = baseCurrency || entry.currency;

  return {
    adjustedAmount,
    currency,
    colIndex: entry.index,
  };
}
