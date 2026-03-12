'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  CreditCard,
  HelpCircle,
  Sparkles,
  Gift,
  LogOut,
  ChevronUp,
  Compass,
  Sun,
  Moon,
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useTourStore } from '@/store/useTourStore';
import { useTheme } from '@/components/providers/ThemeProvider';

interface UserMenuProps {
  userName: string;
  userEmail?: string | null;
  userImage?: string | null;
  initials: string;
  planBadge: { label: string; color: string };
  collapsed: boolean;
}

export default function UserMenu({ userName, userEmail, userImage, initials, planBadge, collapsed }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { type: 'link' as const, label: 'Profile', icon: User, href: '/dashboard/settings?tab=profile' },
    { type: 'link' as const, label: 'Settings', icon: Settings, href: '/dashboard/settings' },
    { type: 'link' as const, label: 'Billing & Plan', icon: CreditCard, href: '/dashboard/settings?tab=billing' },
    { type: 'divider' as const },
    { type: 'link' as const, label: 'Help & Support', icon: HelpCircle, href: '/help' },
    { type: 'link' as const, label: "What's New", icon: Sparkles, href: '/changelog' },
    { type: 'action' as const, label: 'Dashboard Guide', icon: Compass, action: () => { localStorage.removeItem('dashboard-tour-completed'); useTourStore.getState().startTour(); } },
    { type: 'divider' as const },
    { type: 'action' as const, label: theme === 'dark' ? 'Light Mode' : 'Dark Mode', icon: theme === 'dark' ? Sun : Moon, action: toggleTheme },
    { type: 'link' as const, label: 'Invite Friends', icon: Gift, href: '/dashboard/settings?tab=referral' },
    { type: 'divider' as const },
    { type: 'action' as const, label: 'Log out', icon: LogOut, action: () => signOut({ callbackUrl: '/' }), danger: true },
  ];

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      {/* Dropdown — opens upward */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50"
            style={{ minWidth: collapsed ? 220 : undefined }}
          >
            {/* User header inside dropdown */}
            <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2.5">
                {userImage ? (
                  <img src={userImage} alt={userName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{userName}</div>
                  {userEmail && <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{userEmail}</div>}
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${planBadge.color}`}>
                  {planBadge.label}
                </span>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1.5 px-1.5">
              {menuItems.map((item, i) => {
                if (item.type === 'divider') {
                  return <div key={`div-${i}`} className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-1.5" />;
                }

                const Icon = item.icon!;
                const isDanger = 'danger' in item && item.danger;

                if (item.type === 'action') {
                  // Theme toggle stays open; other actions close the menu
                  const isThemeToggle = item.label === 'Light Mode' || item.label === 'Dark Mode';
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.action?.();
                        if (!isThemeToggle) setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                        isDanger
                          ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isThemeToggle && theme === 'dark' ? 'text-amber-400' : ''}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href!}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger — User card */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2.5 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
          collapsed ? 'justify-center p-2' : 'px-3 py-2.5'
        } ${isOpen ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
      >
        {userImage ? (
          <img src={userImage} alt={userName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            {initials}
          </div>
        )}
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{userName}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${planBadge.color}`}>
                  {planBadge.label}
                </span>
              </div>
            </div>
            <ChevronUp className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
          </>
        )}
      </button>
    </div>
  );
}
