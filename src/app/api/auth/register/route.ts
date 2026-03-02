import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { isOforoDomain } from '@/lib/utils';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const isOforo = isOforoDomain(email);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        isOforoInternal: isOforo,
        plan: isOforo ? 'ULTRA' : 'BASIC',
        aiCreditsLimit: isOforo ? -1 : 50,
      },
    });

    // Create Career Twin
    await prisma.careerTwin.create({
      data: {
        userId: user.id,
        skillSnapshot: {},
        interests: [],
        targetRoles: [],
        marketReadiness: 0,
        hireProb: 0,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('[Register]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
