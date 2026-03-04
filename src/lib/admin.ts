/**
 * Admin utilities — RBAC middleware helper for admin routes.
 * Uses isOforoInternal flag and OFORO_ADMIN_EMAILS env var.
 */
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const getPrisma = () => require('@/lib/db/prisma').prisma;

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401, user: null };
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isOforoInternal: true, plan: true, name: true },
  });

  if (!user) {
    return { error: 'User not found', status: 404, user: null };
  }

  // Check admin access: isOforoInternal flag OR email in OFORO_ADMIN_EMAILS
  const adminEmails = (process.env.OFORO_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = user.isOforoInternal || adminEmails.includes((user.email || '').toLowerCase());

  if (!isAdmin) {
    return { error: 'Forbidden', status: 403, user: null };
  }

  return { error: null, status: 200, user };
}
