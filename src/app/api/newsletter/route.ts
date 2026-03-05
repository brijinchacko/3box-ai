import { NextResponse, NextRequest } from 'next/server';

const { prisma } = require('@/lib/db/prisma');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {
        active: true,
        ...(source ? { source } : {}),
      },
      create: {
        email,
        source: source || 'website',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    );
  }
}
