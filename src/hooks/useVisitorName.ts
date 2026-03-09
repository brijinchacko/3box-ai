'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/store/useStore';

export function useVisitorName() {
  const { data: session } = useSession();
  const visitorName = useStore((s) => s.visitorName);
  const setVisitorName = useStore((s) => s.setVisitorName);
  const [hydrated, setHydrated] = useState(false);
  const didHydrate = useRef(false);

  // Hydrate visitor name from localStorage once on mount
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    if (!visitorName) {
      const stored = localStorage.getItem('3box_visitor_name');
      if (stored) setVisitorName(stored);
    }
    setHydrated(true);
  }, [visitorName, setVisitorName]);

  // Before hydration, return null to match server render
  if (!hydrated) return { name: null, firstName: null };

  // Prefer authenticated user name, then stored visitor name
  const name = session?.user?.name || visitorName || null;
  const firstName = name ? name.split(' ')[0] : null;

  return { name, firstName };
}
