/**
 * Return the user's resume data for the extension to auto-fill forms.
 */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const { prisma } = require('@/lib/db/prisma');
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded.extensionAuth) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const resume = await prisma.resume.findFirst({
      where: { userId: decoded.userId },
      orderBy: { updatedAt: 'desc' },
      select: { data: true },
    });

    if (!resume?.data) {
      return NextResponse.json({ error: 'No resume found' }, { status: 404 });
    }

    return NextResponse.json({ resume: resume.data });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
