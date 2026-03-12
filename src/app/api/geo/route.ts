// =============================================================================
// 3BOX AI — GET /api/geo
// =============================================================================
// Client-side endpoint for geo detection.
// Returns the detected region, currency, pricing, and tagline.
// Cached for 1 hour via Cache-Control headers.
// =============================================================================

import { NextResponse } from 'next/server';
import { detectCountry } from '@/lib/geo/detect';
import { getRegionByCountryCode, formatPrice } from '@/lib/geo/regions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Must be dynamic since it reads IP headers

export async function GET(request: Request) {
  try {
    const countryCode = await detectCountry(request);
    const config = getRegionByCountryCode(countryCode);

    const payload = {
      countryCode,
      region: config.region,
      country: config.country,
      currency: config.currency,
      currencySymbol: config.currencySymbol,
      locale: config.locale,
      tagline: config.tagline,
      studentDiscount: config.studentDiscount,
      pricing: {
        pro: {
          monthly: config.pricing.pro.monthly,
          yearly: config.pricing.pro.yearly,
          monthlyFormatted: formatPrice(
            config.pricing.pro.monthly,
            config.currency,
            config.locale
          ),
          yearlyFormatted: formatPrice(
            config.pricing.pro.yearly,
            config.currency,
            config.locale
          ),
        },
        max: {
          monthly: config.pricing.max.monthly,
          yearly: config.pricing.max.yearly,
          monthlyFormatted: formatPrice(
            config.pricing.max.monthly,
            config.currency,
            config.locale
          ),
          yearlyFormatted: formatPrice(
            config.pricing.max.yearly,
            config.currency,
            config.locale
          ),
        },
      },
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Vary': 'X-Forwarded-For, CF-IPCountry',
      },
    });
  } catch (error) {
    console.error('[Geo API] Detection failed:', error);

    // Return US defaults on error — never block the request
    const fallback = getRegionByCountryCode('US');

    return NextResponse.json(
      {
        countryCode: 'US',
        region: fallback.region,
        country: fallback.country,
        currency: fallback.currency,
        currencySymbol: fallback.currencySymbol,
        locale: fallback.locale,
        tagline: fallback.tagline,
        studentDiscount: fallback.studentDiscount,
        pricing: {
          pro: {
            monthly: fallback.pricing.pro.monthly,
            yearly: fallback.pricing.pro.yearly,
            monthlyFormatted: formatPrice(
              fallback.pricing.pro.monthly,
              fallback.currency,
              fallback.locale
            ),
            yearlyFormatted: formatPrice(
              fallback.pricing.pro.yearly,
              fallback.currency,
              fallback.locale
            ),
          },
          max: {
            monthly: fallback.pricing.max.monthly,
            yearly: fallback.pricing.max.yearly,
            monthlyFormatted: formatPrice(
              fallback.pricing.max.monthly,
              fallback.currency,
              fallback.locale
            ),
            yearlyFormatted: formatPrice(
              fallback.pricing.max.yearly,
              fallback.currency,
              fallback.locale
            ),
          },
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  }
}
