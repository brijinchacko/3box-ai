'use client';

import { Share2 } from 'lucide-react';

interface WhatsAppShareProps {
  message?: string;
  url?: string;
  className?: string;
  variant?: 'primary' | 'outline';
}

export default function WhatsAppShare({
  message = 'AI just applied to 20 jobs for me in 60 seconds. Try it free:',
  url = 'https://3box.ai?ref=wa',
  className = '',
  variant = 'primary',
}: WhatsAppShareProps) {
  const href = `https://api.whatsapp.com/send?text=${encodeURIComponent(message + ' ' + url)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 font-medium transition-colors ${
        variant === 'primary'
          ? 'px-5 py-3 rounded-xl bg-[#25D366] text-white text-sm hover:bg-[#22c35e] shadow-lg shadow-[#25D366]/20'
          : 'px-4 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-sm hover:bg-[#25D366]/20'
      } ${className}`}
    >
      <Share2 className="w-4 h-4" />
      Share on WhatsApp
    </a>
  );
}
