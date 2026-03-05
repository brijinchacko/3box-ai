'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard, Users, BarChart3, TrendingUp,
  Shield, ArrowLeft, FileText, MessageSquare, Mail, Ticket,
} from 'lucide-react';
import Logo from '@/components/brand/Logo';

const adminLinks = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/monitoring', icon: BarChart3, label: 'Monitoring' },
  { href: '/admin/marketing', icon: TrendingUp, label: 'Marketing' },
  { href: '/admin/content', icon: FileText, label: 'Content' },
  { href: '/admin/support', icon: MessageSquare, label: 'Support' },
  { href: '/admin/email', icon: Mail, label: 'Email' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/coupons', icon: Ticket, label: 'Coupons' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      // Check admin access
      fetch('/api/admin/stats')
        .then((res) => {
          if (res.ok) {
            setAuthorized(true);
          } else {
            router.push('/dashboard');
          }
        })
        .catch(() => router.push('/dashboard'))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Shield className="w-8 h-8 text-neon-purple" />
          <div className="text-white/40 text-sm">Verifying admin access...</div>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col fixed inset-y-0 left-0 z-40 border-r border-white/5 bg-surface-50">
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          <Link href="/admin" className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-neon-purple" />
            <span className="font-bold text-sm">Admin Console</span>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {adminLinks.map((link) => {
            const active = link.href === '/admin'
              ? pathname === '/admin'
              : pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 text-white border border-white/10'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <link.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-neon-purple' : ''}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/40 hover:text-white/70 rounded-xl hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
