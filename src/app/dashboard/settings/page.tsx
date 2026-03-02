'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, User, CreditCard, Bot, Bell, Shield, Palette,
  Save, Crown, Zap, Sparkles, Camera, LogOut, Trash2
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [coachName, setCoachName] = useState('Nova');
  const [coachPersonality, setCoachPersonality] = useState('friendly');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'coach', label: 'AI Coach', icon: Bot },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
          <Settings className="w-7 h-7 text-white/60" /> Settings
        </h1>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card">
                <h3 className="font-semibold mb-6">Profile Information</h3>
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-2xl font-bold relative">
                    AJ
                    <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center">
                      <Camera className="w-3.5 h-3.5 text-white/60" />
                    </button>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Alex Johnson</div>
                    <div className="text-sm text-white/40">alex@example.com</div>
                    <div className="mt-1 badge bg-neon-blue/10 text-neon-blue text-xs"><Zap className="w-3 h-3 mr-1" /> Pro Plan</div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Full Name</label>
                    <input className="input-field" defaultValue="Alex Johnson" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Email</label>
                    <input className="input-field" defaultValue="alex@example.com" disabled />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Target Role</label>
                    <input className="input-field" defaultValue="AI Engineer" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Location</label>
                    <input className="input-field" defaultValue="San Francisco, CA" />
                  </div>
                </div>
                <button className="btn-primary text-sm mt-6 flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
              </div>
            </motion.div>
          )}

          {activeTab === 'billing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card">
                <h3 className="font-semibold mb-6">Current Plan</h3>
                <div className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/20 flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-neon-blue" />
                    <div>
                      <div className="font-semibold">Pro Plan</div>
                      <div className="text-sm text-white/40">$19/month • Billed monthly</div>
                    </div>
                  </div>
                  <button className="btn-secondary text-sm">Upgrade to Ultra</button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">AI Credits Used</span>
                    <span>127 / 500</span>
                  </div>
                  <div className="skill-bar h-2">
                    <div className="skill-bar-fill bg-neon-blue" style={{ width: '25%' }} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Next billing date</span>
                    <span>March 15, 2026</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'coach' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card">
                <h3 className="font-semibold mb-6">AI Coach Customization</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Coach Name</label>
                    <input className="input-field" value={coachName} onChange={(e) => setCoachName(e.target.value)} placeholder="Name your AI coach" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-3">Personality</label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { id: 'friendly', label: 'Friendly', desc: 'Warm, encouraging, supportive' },
                        { id: 'professional', label: 'Professional', desc: 'Formal, concise, business-like' },
                        { id: 'motivational', label: 'Motivational', desc: 'Energetic, pushing boundaries' },
                        { id: 'technical', label: 'Technical', desc: 'Detailed, precise, analytical' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setCoachPersonality(p.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            coachPersonality === p.id ? 'border-neon-blue/50 bg-neon-blue/5' : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="text-sm font-medium">{p.label}</div>
                          <div className="text-xs text-white/40 mt-1">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className="btn-primary text-sm flex items-center gap-2"><Save className="w-4 h-4" /> Save Coach Settings</button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card">
                <h3 className="font-semibold mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { label: 'New job matches', desc: 'Get notified when AI finds matching jobs' },
                    { label: 'Learning reminders', desc: 'Daily reminders to continue learning' },
                    { label: 'Application updates', desc: 'Status changes on your applications' },
                    { label: 'Weekly progress digest', desc: 'Summary of your career progress' },
                    { label: 'Coach tips', desc: 'AI coach tips and insights' },
                  ].map((n) => (
                    <div key={n.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                      <div>
                        <div className="text-sm font-medium">{n.label}</div>
                        <div className="text-xs text-white/40">{n.desc}</div>
                      </div>
                      <div className="w-10 h-6 rounded-full bg-neon-blue/30 relative cursor-pointer">
                        <div className="w-4 h-4 rounded-full bg-neon-blue absolute top-1 right-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'privacy' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card">
                <h3 className="font-semibold mb-6">Privacy & Security</h3>
                <div className="space-y-4">
                  <button className="btn-secondary text-sm w-full text-left">Change Password</button>
                  <button className="btn-secondary text-sm w-full text-left">Enable Two-Factor Authentication</button>
                  <button className="btn-secondary text-sm w-full text-left">Download My Data</button>
                  <div className="pt-4 border-t border-white/5">
                    <button className="text-sm text-red-400 hover:text-red-300 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
