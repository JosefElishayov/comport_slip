'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { WishlistKey } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useAuth } from './store-provider';

const Context = createContext<{
  keys: WishlistKey[]; loading: boolean; error: boolean; busy: boolean;
  refresh: () => Promise<void>; toggle: (productId: string) => Promise<void>;
}>({ keys: [], loading: true, error: false, busy: false, refresh: async () => {}, toggle: async () => {} });

export const useWishlist = () => useContext(Context);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, authLoading, customer } = useAuth();
  const [keys, setKeys] = useState<WishlistKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const generation = useRef(0);
  const customerId = customer?.id;

  const refresh = useCallback(async () => {
    if (authLoading || (isLoggedIn && !customerId)) return;
    const version = ++generation.current;
    setLoading(true);
    setError(false);
    try {
      const wishlist = getClient().wishlist;
      const next = isLoggedIn ? (await wishlist.syncOnLogin()).keys : wishlist.local.keys();
      if (version === generation.current) setKeys(next);
    } catch {
      if (version === generation.current) setError(true);
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, [isLoggedIn, authLoading, customerId]);

  useEffect(() => {
    setKeys([]);
    void refresh();
    const onFocus = () => { if (!locked.current) void refresh(); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onFocus);
    return () => {
      // This is a request counter, not a DOM ref; invalidate pending reads.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onFocus);
    };
  }, [refresh]);

  const toggle = async (productId: string) => {
    if (locked.current || loading || error || authLoading) return;
    locked.current = true;
    setBusy(true);
    const version = generation.current;
    try {
      const wishlist = getClient().wishlist;
      const saved = keys.filter(key => key.productId === productId);
      if (isLoggedIn) {
        if (saved.length) {
          for (const key of saved) await wishlist.remove(key);
        } else await wishlist.add({ productId });
        const next = await wishlist.keys();
        if (version === generation.current) setKeys(next);
      } else {
        if (saved.length) saved.forEach(key => wishlist.local.remove(key));
        else wishlist.local.add({ productId });
        const next = wishlist.local.keys();
        if (!saved.length && !next.some(key => key.productId === productId)) throw new Error('Save failed');
        if (saved.length && next.some(key => key.productId === productId)) throw new Error('Remove failed');
        if (version === generation.current) setKeys(next);
      }
    } catch {
      if (version === generation.current) setError(true);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };

  return <Context.Provider value={{ keys, loading: loading || authLoading, error, busy, refresh, toggle }}>{children}</Context.Provider>;
}
