'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { StoreInfo, Cart, CustomerProfile, CartStore } from 'brainerce';
import { getCartTotals } from 'brainerce';
import { CartProvider, useCart as useCartSnapshot } from 'brainerce/react';
import { getClient, initClient } from '@/lib/brainerce';
import { getCartStore } from '@/lib/cart-store';
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
  /** First load failed and there is no cart to show — offer `retryCart`. */
  cartError: boolean;
  retryCart: () => Promise<void>;
  /** A write is queued or in flight; totals in `cart` may not include it yet. */
  cartSyncing: boolean;
  refreshCart: () => Promise<void>;
  cartStore: CartStore | null;
  itemCount: number;
  totals: { subtotal: number; discount: number; shipping: number; total: number };
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
}

const CartContext = createContext<CartContextValue>({
  cart: null,
  cartLoading: true,
  cartError: false,
  retryCart: async () => {},
  cartSyncing: false,
  refreshCart: async () => {},
  cartStore: null,
  itemCount: 0,
  totals: { subtotal: 0, discount: 0, shipping: 0, total: 0 },
  isCartDrawerOpen: false,
  openCartDrawer: () => {},
  closeCartDrawer: () => {},
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


  // Called after successful login (cookie already set by proxy)
  const login = useCallback(async () => {
    // Refresh auth state from server (reads httpOnly cookie)
    await refreshAuth();

    // Merge guest session cart into customer cart. Awaited so callers that
    // hard-navigate right after login() don't abort the merge mid-flight.
    try {
      await getClient().syncCartOnLogin();
    } catch (err) {
      console.error(err);
    }

    // The cart's identity changed: drop the guest view and load the merged cart
    getCartStore().reset('login');
  }, [refreshAuth]);

  const logout = useCallback(async () => {
    // Clear httpOnly cookie server-side
    await proxyLogout();

    const client = getClient();
    client.onLogout();
    setIsLoggedIn(false);
    setCustomer(null);
    getCartStore().reset('logout');
  }, []);

  return (
    <StoreInfoContext.Provider value={{ storeInfo, loading: storeLoading }}>
      <AuthContext.Provider value={{ isLoggedIn, authLoading, customer, login, logout }}>
        <CartProvider store={getCartStore()}>
          <CartContextBridge>{children}</CartContextBridge>
        </CartProvider>
      </AuthContext.Provider>
    </StoreInfoContext.Provider>
  );
}

// Adapts the SDK cart store to this app's cart context, and owns the drawer.
function CartContextBridge({ children }: { children: React.ReactNode }) {
  const snapshot = useCartSnapshot();
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const openCartDrawer = useCallback(() => setIsCartDrawerOpen(true), []);
  const closeCartDrawer = useCallback(() => setIsCartDrawerOpen(false), []);

  const { store, cart, itemCount, status, isSyncing } = snapshot;
  const refreshCart = useCallback(() => store.refresh({ force: true }), [store]);
  const retryCart = useCallback(() => store.retry(), [store]);

  const totals = cart ? getCartTotals(cart) : { subtotal: 0, discount: 0, shipping: 0, total: 0 };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartLoading: status === 'loading',
        cartError: status === 'error',
        retryCart,
        cartSyncing: isSyncing,
        refreshCart,
        cartStore: store,
        itemCount,
        totals,
        isCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
