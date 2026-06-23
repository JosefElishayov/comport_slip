'use client';

/* Holds the current page's per-locale alternate URLs so the language switcher
 * can jump to the *equivalent* page in the other language — critical for
 * product pages, where each locale has a different slug and a naive prefix
 * toggle would 404. Pages that have locale-specific URLs register them via
 * <RegisterLocaleAlternates>; everything else falls back to a prefix toggle. */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Locale } from '@/lib/locale';

type Alternates = Partial<Record<Locale, string>>;

interface NavLocaleContextValue {
  alternates: Alternates;
  setAlternates: (a: Alternates) => void;
}

const NavLocaleContext = createContext<NavLocaleContextValue | null>(null);

export function NavLocaleProvider({ children }: { children: React.ReactNode }) {
  const [alternates, setAlternates] = useState<Alternates>({});
  return (
    <NavLocaleContext.Provider value={{ alternates, setAlternates }}>
      {children}
    </NavLocaleContext.Provider>
  );
}

/** Per-locale alternate URLs registered by the current page (empty if none). */
export function useLocaleAlternates(): Alternates {
  return useContext(NavLocaleContext)?.alternates ?? {};
}

/** Registers this page's per-locale alternate URLs while mounted, clearing them
 *  on unmount so a stale product URL never leaks onto the next page. */
export function RegisterLocaleAlternates({ alternates }: { alternates: Alternates }) {
  const ctx = useContext(NavLocaleContext);
  const key = JSON.stringify(alternates);
  useEffect(() => {
    if (!ctx) return;
    ctx.setAlternates(alternates);
    return () => ctx.setAlternates({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
