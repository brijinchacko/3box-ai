import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Cache the counter for 60 seconds
let cachedCounter: { totalApplied: number; todayApplied: number } | null = null;
let cacheExpiry = 0;

export async function GET() {
  try {
    const now = Date.now();

    // Return cached if fresh
    if (cachedCounter && now < cacheExpiry) {
      return NextResponse.json(cachedCounter, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    // Fetch from DB
    let counter = await prisma.viralCounter.findUnique({
      where: { id: 'global' },
    });

    // Create if doesn't exist (seed with baseline)
    if (!counter) {
      counter = await prisma.viralCounter.create({
        data: {
          id: 'global',
          totalApplied: 5000, // Seed baseline
          todayApplied: 127,  // Seed baseline
          lastResetDate: new Date(),
        },
      });
    }

    // Reset daily counter if date changed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReset = new Date(counter.lastResetDate);
    lastReset.setHours(0, 0, 0, 0);

    if (today.getTime() > lastReset.getTime()) {
      counter = await prisma.viralCounter.update({
        where: { id: 'global' },
        data: {
          todayApplied: 0,
          lastResetDate: today,
        },
      });
    }

    const result = {
      totalApplied: counter.totalApplied,
      todayApplied: counter.todayApplied,
    };

    // Cache for 60 seconds
    cachedCounter = result;
    cacheExpiry = now + 60_000;

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('[free-burst/counter] Error:', error);
    // Return fallback values if DB unavailable
    return NextResponse.json(
      { totalApplied: 5000, todayApplied: 127 },
      { status: 200 },
    );
  }
}
