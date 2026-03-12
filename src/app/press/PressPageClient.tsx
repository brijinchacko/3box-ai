'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Newspaper, Palette, Calendar, ExternalLink, Download,
  Mail, Linkedin, Image, Type, Box,
  Youtube, Facebook, Instagram
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const brandColors = [
  { name: 'Neon Blue', hex: '#00d4ff' },
  { name: 'Neon Purple', hex: '#a855f7' },
  { name: 'Neon Green', hex: '#00ff88' },
  { name: 'Neon Pink', hex: '#ff0080' },
];

const pressReleases = [
  {
    date: 'March 3, 2026',
    title: '3BOX AI Launches AI Career Operating System',
    description:
      'OFORO AI introduces 3BOX AI, a comprehensive AI-powered platform that transforms career development from skill assessment to job placement.',
  },
  {
    date: 'February 2026',
    title: 'OFORO AI Announces 3BOX AI Development',
    description:
      'OFORO AI begins development of its flagship career AI platform, designed to unify the fragmented career development tool landscape.',
  },
];

const socialLinks = [
  { icon: Linkedin, href: 'https://www.linkedin.com/company/3box-ai/', label: 'LinkedIn' },
  { icon: Youtube, href: 'https://youtube.com/channel/UCt1LnfzqtMRcfSPwAV3J1ZQ/', label: 'YouTube' },
  { icon: Facebook, href: 'https://www.facebook.com/61586302726912', label: 'Facebook' },
  { icon: Instagram, href: 'https://www.instagram.com/3box.ai', label: 'Instagram' },
];

// ── Brand asset definitions ──
interface BrandAsset {
  label: string;
  description: string;
  svgFile: string;
  pngFile: string;
  png2xFile: string;
  bgClass: string; // tailwind bg for preview
}

const fullLogos: BrandAsset[] = [
  {
    label: 'Logo — Dark Background',
    description: 'White text + gradient AI, for dark backgrounds',
    svgFile: '3box-logo-dark.svg',
    pngFile: '3box-logo-dark.png',
    png2xFile: '3box-logo-dark@2x.png',
    bgClass: 'bg-[#0a0a0f]',
  },
  {
    label: 'Logo — Light Background',
    description: 'Black text + gradient AI, for light backgrounds',
    svgFile: '3box-logo-light.svg',
    pngFile: '3box-logo-light.png',
    png2xFile: '3box-logo-light@2x.png',
    bgClass: 'bg-white',
  },
  {
    label: 'Logo — Monochrome White',
    description: 'All-white logo for overlays and dark surfaces',
    svgFile: '3box-logo-white.svg',
    pngFile: '3box-logo-white.png',
    png2xFile: '3box-logo-white@2x.png',
    bgClass: 'bg-[#0a0a0f]',
  },
];

const icons: BrandAsset[] = [
  {
    label: 'Icon — Gradient',
    description: 'Primary brand icon',
    svgFile: '3box-icon.svg',
    pngFile: '3box-icon.png',
    png2xFile: '3box-icon@2x.png',
    bgClass: 'bg-[#0a0a0f]',
  },
  {
    label: 'Icon — White',
    description: 'For dark backgrounds',
    svgFile: '3box-icon-white.svg',
    pngFile: '3box-icon-white.png',
    png2xFile: '3box-icon-white@2x.png',
    bgClass: 'bg-[#0a0a0f]',
  },
  {
    label: 'Icon — Black',
    description: 'For light backgrounds',
    svgFile: '3box-icon-black.svg',
    pngFile: '3box-icon-black.png',
    png2xFile: '3box-icon-black@2x.png',
    bgClass: 'bg-white',
  },
];

const wordmarks: BrandAsset[] = [
  {
    label: 'Wordmark — Dark Background',
    description: 'Text only, no icon',
    svgFile: '3box-wordmark-dark.svg',
    pngFile: '3box-wordmark-dark.png',
    png2xFile: '3box-wordmark-dark@2x.png',
    bgClass: 'bg-[#0a0a0f]',
  },
  {
    label: 'Wordmark — Light Background',
    description: 'Text only, no icon',
    svgFile: '3box-wordmark-light.svg',
    pngFile: '3box-wordmark-light.png',
    png2xFile: '3box-wordmark-light@2x.png',
    bgClass: 'bg-white',
  },
];

function InlineSvg({ src, className }: { src: string; className?: string }) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    fetch(src).then(r => r.text()).then(setHtml).catch(() => {});
  }, [src]);
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function AssetCard({ asset, delay = 0 }: { asset: BrandAsset; delay?: number }) {
  const base = '/assets/brand';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="rounded-2xl border border-white/10 overflow-hidden"
    >
      {/* Preview */}
      <div className={`${asset.bgClass} flex items-center justify-center p-8 min-h-[100px]`}>
        <InlineSvg src={`${base}/${asset.svgFile}`} className="max-h-12 w-auto [&>svg]:max-h-12 [&>svg]:w-auto" />
      </div>
      {/* Info + Downloads */}
      <div className="bg-white/5 p-4">
        <h4 className="text-sm font-semibold text-white mb-1">{asset.label}</h4>
        <p className="text-xs text-white/40 mb-3">{asset.description}</p>
        <div className="flex items-center gap-3">
          <a
            href={`${base}/${asset.svgFile}`}
            download={asset.svgFile}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neon-blue hover:text-neon-blue/80 transition-colors"
          >
            <Download className="w-3 h-3" />
            SVG
          </a>
          <a
            href={`${base}/${asset.pngFile}`}
            download={asset.pngFile}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neon-purple hover:text-neon-purple/80 transition-colors"
          >
            <Download className="w-3 h-3" />
            PNG
          </a>
          <a
            href={`${base}/${asset.png2xFile}`}
            download={asset.png2xFile}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white/60 transition-colors"
          >
            <Download className="w-3 h-3" />
            PNG @2x
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function PressPageClient() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-neon-blue/8 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Newspaper className="w-12 h-12 text-neon-blue mx-auto mb-4" />
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
              Press &amp; <span className="gradient-text">Brand Assets</span>
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              Download official logos, icons, and brand resources for 3BOX AI
            </p>
          </motion.div>

          {/* About 3BOX AI */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card mb-12"
          >
            <h2 className="text-2xl font-bold mb-4">About 3BOX AI</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              3BOX AI is the AI-powered career operating system built by OFORO AI. We help job
              seekers transform their careers with AI-driven skill assessments, personalized career
              plans, ATS-optimized resume building, portfolio creation, and intelligent job matching.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Founded', value: '2025' },
                { label: 'Product', value: 'AI Career Platform' },
                { label: 'Website', value: '3box.ai' },
                { label: 'Parent Company', value: 'OFORO AI' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-white/40">
                  <span className="text-white font-medium">{item.label}:</span>
                  {item.value}
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Brand Assets — Downloadable ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Palette className="w-8 h-8 text-neon-purple" />
                <h2 className="text-2xl font-bold">Brand Assets</h2>
              </div>
              <a
                href="/assets/brand/3box-brand-kit.zip"
                download="3box-brand-kit.zip"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" />
                Download All (.zip)
              </a>
            </div>

            {/* Full Logo */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Image className="w-4 h-4 text-white/40" />
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Full Logo</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fullLogos.map((a, i) => (
                  <AssetCard key={a.svgFile} asset={a} delay={i * 0.05} />
                ))}
              </div>
            </div>

            {/* Icon Only */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Box className="w-4 h-4 text-white/40" />
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Icon Only</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {icons.map((a, i) => (
                  <AssetCard key={a.svgFile} asset={a} delay={i * 0.05} />
                ))}
              </div>
            </div>

            {/* Wordmark */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Type className="w-4 h-4 text-white/40" />
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Wordmark Only</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {wordmarks.map((a, i) => (
                  <AssetCard key={a.svgFile} asset={a} delay={i * 0.05} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Brand Colors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card mb-12"
          >
            <h3 className="text-lg font-bold mb-4">Brand Colors</h3>
            <div className="flex flex-wrap gap-4">
              {brandColors.map((c) => (
                <div key={c.hex} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-white/10"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="text-sm">
                    <span className="text-white/60">{c.name}</span>{' '}
                    <span className="text-white/30 font-mono text-xs">{c.hex}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Usage Guidelines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card mb-12"
          >
            <h3 className="text-lg font-bold mb-4">Usage Guidelines</h3>
            <ul className="space-y-2 text-sm text-white/50">
              <li>Use the dark logo on dark backgrounds and the light logo on white/light backgrounds.</li>
              <li>Maintain clear space around the logo equal to the height of the icon.</li>
              <li>Do not stretch, rotate, or alter the logo colors.</li>
              <li>The gradient icon works on both dark and light backgrounds.</li>
              <li>For small sizes (favicons, app icons), use the icon-only variant.</li>
            </ul>
          </motion.div>

          {/* Latest News */}
          <div className="mb-12">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl font-bold mb-8 text-center"
            >
              Latest News
            </motion.h2>
            <div className="space-y-6">
              {pressReleases.map((pr, i) => (
                <motion.div
                  key={pr.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-neon-blue" />
                    <span className="text-xs text-white/30">{pr.date}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{pr.title}</h3>
                  <p className="text-sm text-white/40">{pr.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Media Contact */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Media Contact</h2>
            <p className="text-white/40 mb-6">
              For press inquiries, interviews, or media resources:
            </p>
            <a
              href="mailto:press@oforo.ai"
              className="inline-flex items-center gap-2 text-xl font-semibold text-neon-blue hover:underline mb-6"
            >
              <Mail className="w-5 h-5" />
              press@oforo.ai
            </a>
            <div className="flex items-center justify-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                >
                  <s.icon className="w-4 h-4 text-white/50" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
