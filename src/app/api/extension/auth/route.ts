/**
 * Validate extension JWT token and return user profile.
 */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const { prisma } = require('@/lib/db/prisma');
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded.extensionAuth || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid extension token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, plan: true, image: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
