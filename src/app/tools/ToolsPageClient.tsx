'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { TOOL_CATEGORIES, ALL_TOOLS, type ToolCategory } from '@/lib/tools/toolsConfig';
import { useVisitorName } from '@/hooks/useVisitorName';

function getToolsByCategory(category: ToolCategory) {
  return ALL_TOOLS.filter((t) => t.category === category);
}

export default function ToolsPageClient() {
  const { firstName } = useVisitorName();
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-neon-green/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="badge-neon text-xs mb-4 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Free AI Tools
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              {firstName ? `${firstName}'s ` : ''}AI <span className="gradient-text">Career Tools</span>
            </h1>
            <p className="text-white/40 max-w-xl mx-auto text-lg">
              17 free AI-powered tools to supercharge your job search. No signup required.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tool Categories */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {TOOL_CATEGORIES.map((cat, catIndex) => {
          const tools = getToolsByCategory(cat.key);
          return (
            <div key={cat.key} className="mb-16 last:mb-0">
              {/* Category Header */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIndex * 0.05 }}
                className="mb-6"
              >
                <h2 className="text-2xl font-bold mb-1">{cat.label}</h2>
                <p className="text-sm text-white/40">{cat.description}</p>
              </motion.div>

              {/* Tool Cards Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {tools.map((tool, i) => (
                  <motion.div
                    key={tool.slug}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link href={tool.href} className="block group h-full">
                      <div className={`card h-full flex flex-col items-center text-center transition-all duration-300 ${tool.borderHover} relative`}>
                        {/* NEW badge */}
                        {tool.isNew && (
                          <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neon-green/20 text-neon-green border border-neon-green/20">
                            New
                          </span>
                        )}

                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                          <tool.icon className={`w-7 h-7 ${tool.iconColor}`} />
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold mb-2">{tool.title}</h3>

                        {/* Description */}
                        <p className="text-sm text-white/40 mb-5 flex-1 leading-relaxed">{tool.description}</p>

                        {/* CTA Button */}
                        <span className="btn-primary inline-flex items-center gap-2 text-sm">
                          {tool.cta}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="glass p-8 max-w-xl mx-auto">
            <h3 className="text-xl font-bold mb-2">Want unlimited access + AI agents?</h3>
            <p className="text-white/40 text-sm mb-6">
              Subscribe and unlock unlimited tool uses, 6 AI career agents, and personalized coaching.
            </p>
            <Link href="/pricing" className="btn-primary inline-flex items-center gap-2">
              View Plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
