'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { StoreInfo, Cart, CustomerProfile } from 'brainerce';
import { getCartTotals } from 'brainerce';
import { getClient, initClient, setStoredCartId } from '@/lib/brainerce';
import { checkAuthStatus, proxyLogout } from '@/lib/auth';


// ---- Store Info Context ----
interface StoreInfoContextValue {
  storeInfo: StoreInfo | null;
  loading: boolean;
}

const StoreInfoContext = createContext<StoreInfoContextValue>({
  storeInfo: null,
  loading: true,
});

export function useStoreInfo() {
  return useContext(StoreInfoContext);
}

// ---- Auth Context ----
interface AuthContextValue {
  isLoggedIn: boolean;
  authLoading: boolean;
  customer: CustomerProfile | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  authLoading: true,
  customer: null,
  login: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ---- Cart Context ----
interface CartContextValue {
  cart: Cart | null;
  cartLoading: boolean;
  refreshCart: () => Promise<void>;
  itemCount: number;
  totals: { subtotal: number; discount: number; shipping: number; total: number };
}

const CartContext = createContext<CartContextValue>({
  cart: null,
  cartLoading: true,
  refreshCart: async () => {},
  itemCount: 0,
  totals: { subtotal: 0, discount: 0, shipping: 0, total: 0 },
});

export function useCart() {
  return useContext(CartContext);
}

// ---- Provider Component ----

export function StoreProvider({ children }: { children: React.ReactNode }) {

  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);


  // Check auth status via httpOnly cookie (server-side validation)
  const refreshAuth = useCallback(async () => {
    try {
      const status = await checkAuthStatus();
      setIsLoggedIn(status.isLoggedIn);
      setCustomer(status.isLoggedIn ? (status.customer as CustomerProfile) : null);
    } catch {
      setIsLoggedIn(false);
      setCustomer(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Initialize client, check auth, and fetch store info
  useEffect(() => {
    const client = initClient();


    // Optimistic check: if brainerce_logged_in cookie exists, assume logged in
    // while we validate the actual token server-side
    if (typeof document !== 'undefined' && document.cookie.includes('brainerce_logged_in=1')) {
      setIsLoggedIn(true);
    }

    // Validate auth token server-side
    refreshAuth();

    // Fetch store info (public, no auth needed)
    client
      .getStoreInfo()
      .then(setStoreInfo)
      .catch(console.error)
      .finally(() => setStoreLoading(false));

  }, [refreshAuth]);


  // Cart management
  const refreshCart = useCallback(async () => {
    try {
      setCartLoading(true);
      const client = getClient();
      const c = await client.smartGetCart();
      setCart(c);

      // Persist server cart ID
      if (c && c.id) {
        setStoredCartId(c.id);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart, isLoggedIn]);

  // Called after successful login (cookie already set by proxy)
  const login = useCallback(async () => {
    // Refresh auth state from server (reads httpOnly cookie)
    await refreshAuth();

    // Merge guest session cart into customer cart
    const client = getClient();
    client.syncCartOnLogin().catch(console.error);
  }, [refreshAuth]);

  const logout = useCallback(async () => {
    // Clear httpOnly cookie server-side
    await proxyLogout();

    const client = getClient();
    client.onLogout();
    setIsLoggedIn(false);
    setCustomer(null);
    setCart(null);
    refreshCart();
  }, [refreshCart]);

  const itemCount = cart
    ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  const totals = cart ? getCartTotals(cart) : { subtotal: 0, discount: 0, shipping: 0, total: 0 };


  return (
    <StoreInfoContext.Provider value={{ storeInfo, loading: storeLoading }}>
      <AuthContext.Provider value={{ isLoggedIn, authLoading, customer, login, logout }}>
        <CartContext.Provider
          value={{ cart, cartLoading, refreshCart, itemCount, totals }}
        >
          {children}
        </CartContext.Provider>
      </AuthContext.Provider>
    </StoreInfoContext.Provider>
  );

}
