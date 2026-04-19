import { BrainerceClient } from 'brainerce';

const CONNECTION_ID = process.env.NEXT_PUBLIC_BRAINERCE_CONNECTION_ID || 'vc_BslbK0EDGoUXP2c5VH0Dk';

// Singleton SDK client — routes through same-origin BFF proxy for httpOnly cookie auth
let clientInstance: BrainerceClient | null = null;

export function getClient(): BrainerceClient {
  if (!clientInstance) {
    clientInstance = new BrainerceClient({
      connectionId: CONNECTION_ID,
      baseUrl: '/api/store', // same-origin proxy handles auth via httpOnly cookie
      proxyMode: true, // skip client-side token checks; proxy adds Authorization header
    });
  }
  return clientInstance;
}


// Cart ID helpers (not a security token — safe in localStorage)
const CART_ID_KEY = 'brainerce_cart_id';

export function getStoredCartId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CART_ID_KEY);
}

export function setStoredCartId(cartId: string | null): void {
  if (typeof window === 'undefined') return;
  if (cartId) {
    localStorage.setItem(CART_ID_KEY, cartId);
  } else {
    localStorage.removeItem(CART_ID_KEY);
  }
}

// Initialize client (no token hydration — auth handled by httpOnly cookie)
export function initClient(): BrainerceClient {
  return getClient();
}

// Server-side client — calls backend directly (no proxy needed for public data)
// Used by Server Components for SSR data fetching (generateMetadata, page rendering)
export function getServerClient(locale?: string): BrainerceClient {
  const apiUrl = process.env.BRAINERCE_API_URL || 'https://api.brainerce.com';
  const client = new BrainerceClient({
    connectionId: CONNECTION_ID,
    baseUrl: apiUrl,
    origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  });
  if (locale) {
    client.setLocale(locale);
  }
  return client;
}
