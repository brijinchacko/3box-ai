'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { useNotificationStore, type AppNotification } from '@/store/useNotificationStore';
import AgentAvatar from '@/components/brand/AgentAvatar';

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const typeIcons: Record<AppNotification['type'], React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-neon-green" />,
  info: <Info className="w-4 h-4 text-neon-blue" />,
  warning: <AlertCircle className="w-4 h-4 text-amber-400" />,
  error: <AlertCircle className="w-4 h-4 text-red-400" />,
};

const typeBorderColors: Record<AppNotification['type'], string> = {
  success: 'border-l-neon-green',
  info: 'border-l-neon-blue',
  warning: 'border-l-amber-400',
  error: 'border-l-red-400',
};

export default function NotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    if (notif.action) {
      router.push(notif.action);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <Bell className="w-4 h-4 text-white/60" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-96 max-h-[480px] rounded-2xl border border-white/10 bg-surface-50 shadow-2xl shadow-black/40 z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/20">
                  <Bell className="w-8 h-8 mb-2" />
                  <span className="text-sm">No notifications yet</span>
                  <span className="text-xs mt-1">Agent activity will appear here</span>
                </div>
              ) : (
                <div>
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left px-4 py-3 border-l-2 border-b border-b-white/5 hover:bg-white/5 transition-colors ${
                        typeBorderColors[notif.type]
                      } ${!notif.read ? 'bg-white/[0.03]' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Agent avatar or type icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {notif.agent ? (
                            <AgentAvatar agentId={notif.agent} size={24} />
                          ) : (
                            typeIcons[notif.type]
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold truncate ${!notif.read ? 'text-white' : 'text-white/60'}`}>
                              {notif.title}
                            </span>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-neon-blue flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{notif.message}</p>
                          <span className="text-[10px] text-white/20 mt-1 block">{timeAgo(notif.createdAt)}</span>
                        </div>
                        {notif.action && (
                          <span className="text-[10px] text-neon-blue/60 flex-shrink-0 mt-1">View</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
