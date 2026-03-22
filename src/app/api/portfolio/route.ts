import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const { prisma } = require('@/lib/db/prisma');

/**
 * GET /api/portfolio
 * Fetch the authenticated user's portfolio from DB.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ portfolio: portfolio || null });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portfolio
 * Create or update the authenticated user's portfolio.
 * Accepts: { title, bio, projects, skills, theme }
 * Generates slug from user's name if not already set.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, bio, projects, skills, theme } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Generate slug from user's name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    const baseName = user?.name || session.user.name || session.user.email || 'user';
    const baseSlug = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if user already has a portfolio
    const existing = await prisma.portfolio.findFirst({
      where: { userId: session.user.id },
      select: { id: true, slug: true },
    });

    let portfolio;

    if (existing) {
      // Update existing portfolio
      portfolio = await prisma.portfolio.update({
        where: { id: existing.id },
        data: {
          title,
          bio: bio || null,
          projects: projects || [],
          skills: skills || [],
          theme: theme || 'dark',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
    } else {
      // Generate a unique slug for new portfolio (clean incrementing suffix)
      let slug = baseSlug;
      const taken = await prisma.portfolio.findUnique({ where: { slug } });
      if (taken) {
        // Try incrementing suffixes: name-2, name-3, etc.
        let counter = 2;
        while (true) {
          const candidate = `${baseSlug}-${counter}`;
          const exists = await prisma.portfolio.findUnique({ where: { slug: candidate } });
          if (!exists) {
            slug = candidate;
            break;
          }
          counter++;
          if (counter > 100) {
            // Fallback to cuid-based suffix
            slug = `${baseSlug}-${session.user.id.slice(-6)}`;
            break;
          }
        }
      }

      // Create new portfolio
      portfolio = await prisma.portfolio.create({
        data: {
          userId: session.user.id,
          slug,
          title,
          bio: bio || null,
          projects: projects || [],
          skills: skills || [],
          theme: theme || 'dark',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ success: true, portfolio });
  } catch (error) {
    console.error('Error saving portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to save portfolio' },
      { status: 500 }
    );
  }
}
