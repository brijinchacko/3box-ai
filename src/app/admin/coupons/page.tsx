'use client';

import { useState, useEffect } from 'react';
import { Ticket, Plus, X, Copy, Check, ToggleLeft, ToggleRight } from 'lucide-react';

interface CouponData {
  id: string;
  code: string;
  plan: string;
  maxUses: number;
  usedCount: number;
  durationDays: number | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { redemptions: number };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const [form, setForm] = useState({
    code: '',
    plan: 'PRO',
    maxUses: '1',
    durationDays: '',
    expiresAt: '',
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch {
      console.error('Failed to fetch coupons');
    }
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code || undefined,
          plan: form.plan,
          maxUses: parseInt(form.maxUses) || 1,
          durationDays: form.durationDays ? parseInt(form.durationDays) : undefined,
          expiresAt: form.expiresAt || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create coupon');
        return;
      }

      setShowCreate(false);
      setForm({ code: '', plan: 'PRO', maxUses: '1', durationDays: '', expiresAt: '' });
      fetchCoupons();
    } catch {
      setError('Network error');
    } finally {
      setCreating(false);
    }
  };

  const toggleCoupon = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      });
      fetchCoupons();
    } catch {
      console.error('Failed to toggle coupon');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const planColors: Record<string, string> = {
    FREE: 'text-white/40 bg-white/5',
    PRO: 'text-neon-blue bg-neon-blue/10',
    MAX: 'text-neon-purple bg-neon-purple/10',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="w-6 h-6 text-neon-purple" /> Coupon Codes
          </h1>
          <p className="text-white/40 text-sm mt-1">{coupons.length} total coupons</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Coupons Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 bg-white/[0.02]">
                <th className="text-left py-3 px-4">Code</th>
                <th className="text-left py-3 px-3">Plan</th>
                <th className="text-center py-3 px-3">Uses</th>
                <th className="text-center py-3 px-3">Duration</th>
                <th className="text-left py-3 px-3">Expires</th>
                <th className="text-left py-3 px-3">Created</th>
                <th className="text-center py-3 px-3">Status</th>
                <th className="text-center py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 px-4" colSpan={8}>
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr>
                  <td className="py-8 px-4 text-center text-white/30" colSpan={8}>
                    No coupons created yet
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-white/5 px-2 py-0.5 rounded">{c.code}</code>
                        <button
                          onClick={() => copyCode(c.code)}
                          className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
                          title="Copy code"
                        >
                          {copied === c.code ? <Check className="w-3 h-3 text-neon-green" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[c.plan] || ''}`}>
                        {c.plan}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-white/60">
                      {c.usedCount}/{c.maxUses}
                    </td>
                    <td className="py-3 px-3 text-center text-white/40">
                      {c.durationDays ? `${c.durationDays} days` : 'Permanent'}
                    </td>
                    <td className="py-3 px-3 text-white/40 whitespace-nowrap">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-3 text-white/40 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs font-medium ${c.isActive ? 'text-neon-green' : 'text-red-400'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleCoupon(c.id, !c.isActive)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          c.isActive
                            ? 'hover:bg-red-500/10 text-neon-green hover:text-red-400'
                            : 'hover:bg-neon-green/10 text-red-400 hover:text-neon-green'
                        }`}
                        title={c.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {c.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-surface-50 border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-white/30 hover:text-white/60">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neon-purple/10 mb-4">
              <Ticket className="w-6 h-6 text-neon-purple" />
            </div>

            <h2 className="text-lg font-bold mb-1">Create Coupon</h2>
            <p className="text-sm text-white/50 mb-4">Generate a coupon code for plan upgrades.</p>

            <div className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Code (optional — auto-generated if empty)</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="input-field w-full font-mono"
                  placeholder="e.g. WELCOME2024"
                />
              </div>

              {/* Plan */}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Target Plan</label>
                <div className="grid grid-cols-4 gap-2">
                  {['FREE', 'PRO', 'MAX'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setForm({ ...form, plan: p })}
                      className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                        form.plan === p
                          ? 'border-neon-purple/50 bg-neon-purple/10 text-neon-purple'
                          : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Max Uses</label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  className="input-field w-full"
                  min="1"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Duration (days) — leave empty for permanent</label>
                <input
                  type="number"
                  value={form.durationDays}
                  onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                  className="input-field w-full"
                  placeholder="e.g. 30"
                />
              </div>

              {/* Expires */}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="input-field w-full"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-neon-purple hover:bg-neon-purple/80 text-white disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Create
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
