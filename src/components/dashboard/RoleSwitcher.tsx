'use client';

import { useState, useRef, useEffect } from 'react';
import { Target, ChevronDown, Check, Search } from 'lucide-react';

const popularRoles = [
  'AI Engineer', 'Data Scientist', 'Full Stack Developer', 'ML Engineer',
  'DevOps Engineer', 'Product Manager', 'UX Designer', 'Cloud Architect',
  'Cybersecurity Analyst', 'PLC Programmer', 'Mobile Developer', 'Blockchain Developer',
  'Backend Developer', 'Frontend Developer', 'Data Analyst', 'QA Engineer',
];

interface RoleSwitcherProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  compact?: boolean;
}

export default function RoleSwitcher({ currentRole, onRoleChange, compact }: RoleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customRole, setCustomRole] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredRoles = popularRoles.filter((r) =>
    r.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = async (role: string) => {
    setOpen(false);
    setSearch('');
    setCustomRole('');
    localStorage.setItem('jobted_target_role', role);
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: role }),
      });
    } catch {}
    onRoleChange(role);
  };

  const handleCustomSubmit = () => {
    if (customRole.trim()) handleSelect(customRole.trim());
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg transition-all ${
          compact
            ? 'text-[10px] text-white/30 hover:text-white/60 py-0.5'
            : 'text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 border border-white/10 hover:border-white/20'
        }`}
      >
        <Target className={compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5 text-neon-blue'} />
        <span className="truncate max-w-[140px]">{currentRole || 'Select Role'}</span>
        <ChevronDown className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute z-50 mt-1 bg-surface-50 border border-white/10 rounded-xl shadow-2xl overflow-hidden ${
          compact ? 'right-0 w-56' : 'left-0 w-64'
        }`}>
          {/* Search */}
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/30"
                autoFocus
              />
            </div>
          </div>

          {/* Role list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {filteredRoles.map((role) => (
              <button
                key={role}
                onClick={() => handleSelect(role)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white transition-colors"
              >
                {role === currentRole && <Check className="w-3 h-3 text-neon-green" />}
                <span className={role === currentRole ? 'text-neon-green font-medium' : ''}>{role}</span>
              </button>
            ))}
            {filteredRoles.length === 0 && (
              <div className="px-3 py-2 text-xs text-white/30">No matching roles</div>
            )}
          </div>

          {/* Custom role input */}
          <div className="p-2 border-t border-white/5">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                placeholder="Custom role..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/30"
              />
              <button
                onClick={handleCustomSubmit}
                disabled={!customRole.trim()}
                className="px-2.5 py-1.5 rounded-lg bg-neon-blue/10 text-neon-blue text-xs font-medium hover:bg-neon-blue/20 disabled:opacity-30 transition-colors"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
