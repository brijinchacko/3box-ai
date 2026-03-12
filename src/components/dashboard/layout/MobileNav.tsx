'use client';

import { Menu } from 'lucide-react';

interface MobileNavProps {
  onOpen: () => void;
}

export default function MobileNav({ onOpen }: MobileNavProps) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center h-14 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <button
        onClick={onOpen}
        className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
      <span className="ml-3 font-semibold text-gray-900 dark:text-white text-sm">3BOX AI</span>
    </div>
  );
}
