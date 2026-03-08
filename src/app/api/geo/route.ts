// =============================================================================
// jobTED AI — GET /api/geo
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
        starter: {
          monthly: config.pricing.starter.monthly,
          yearly: config.pricing.starter.yearly,
          monthlyFormatted: formatPrice(
            config.pricing.starter.monthly,
            config.currency,
            config.locale
          ),
          yearlyFormatted: formatPrice(
            config.pricing.starter.yearly,
            config.currency,
            config.locale
          ),
        },
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
        ultra: {
          monthly: config.pricing.ultra.monthly,
          yearly: config.pricing.ultra.yearly,
          monthlyFormatted: formatPrice(
            config.pricing.ultra.monthly,
            config.currency,
            config.locale
          ),
          yearlyFormatted: formatPrice(
            config.pricing.ultra.yearly,
            config.currency,
            config.locale
          ),
        },
        credits: {
          pack100: config.pricing.credits.pack100,
          pack500: config.pricing.credits.pack500,
          pack1000: config.pricing.credits.pack1000,
          pack100Formatted: formatPrice(
            config.pricing.credits.pack100,
            config.currency,
            config.locale
          ),
          pack500Formatted: formatPrice(
            config.pricing.credits.pack500,
            config.currency,
            config.locale
          ),
          pack1000Formatted: formatPrice(
            config.pricing.credits.pack1000,
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
          starter: {
            monthly: fallback.pricing.starter.monthly,
            yearly: fallback.pricing.starter.yearly,
            monthlyFormatted: formatPrice(
              fallback.pricing.starter.monthly,
              fallback.currency,
              fallback.locale
            ),
            yearlyFormatted: formatPrice(
              fallback.pricing.starter.yearly,
              fallback.currency,
              fallback.locale
            ),
          },
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
          ultra: {
            monthly: fallback.pricing.ultra.monthly,
            yearly: fallback.pricing.ultra.yearly,
            monthlyFormatted: formatPrice(
              fallback.pricing.ultra.monthly,
              fallback.currency,
              fallback.locale
            ),
            yearlyFormatted: formatPrice(
              fallback.pricing.ultra.yearly,
              fallback.currency,
              fallback.locale
            ),
          },
          credits: {
            pack100: fallback.pricing.credits.pack100,
            pack500: fallback.pricing.credits.pack500,
            pack1000: fallback.pricing.credits.pack1000,
            pack100Formatted: formatPrice(
              fallback.pricing.credits.pack100,
              fallback.currency,
              fallback.locale
            ),
            pack500Formatted: formatPrice(
              fallback.pricing.credits.pack500,
              fallback.currency,
              fallback.locale
            ),
            pack1000Formatted: formatPrice(
              fallback.pricing.credits.pack1000,
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
