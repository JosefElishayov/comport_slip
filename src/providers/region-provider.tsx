'use client';

import React, { createContext, useContext, useMemo } from 'react';

interface RegionContextValue {
  /** Brainerce region id for the visitor, or null for the base currency. */
  regionId: string | null;
}

const RegionContext = createContext<RegionContextValue>({ regionId: null });

/**
 * Holds the server-resolved region id so Client Components can pass it to
 * `getProducts({ regionId })` and receive `displayPrice`/`displayCurrency` in
 * the visitor's currency. Resolved once on the server (see getServerRegionId).
 */
export function RegionProvider({
  regionId,
  children,
}: {
  regionId: string | null;
  children: React.ReactNode;
}) {
  const value = useMemo<RegionContextValue>(() => ({ regionId }), [regionId]);
  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion(): RegionContextValue {
  return useContext(RegionContext);
}

/** Convenience: the active region id (or null for base currency). */
export function useRegionId(): string | null {
  return useRegion().regionId;
}
