import { BrainerceClient, type Product } from 'brainerce';

const CONNECTION_ID = process.env.NEXT_PUBLIC_BRAINERCE_CONNECTION_ID || 'vc_BslbK0EDGoUXP2c5VH0Dk';

// Mirror of the SDK's internal path encoder: normalize (decode if already
// encoded) then encode once, so it's idempotent whether the route slug arrives
// encoded or decoded. Plain encodeURIComponent would double-encode an already
// percent-encoded slug and 404.
function encodePathSegment(value: string): string {
  let normalized = value;
  try {
    normalized = decodeURIComponent(value);
  } catch {
    normalized = value;
  }
  return encodeURIComponent(normalized);
}

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

// Fetch a product by slug, optionally in a region's display currency.
//
// The SDK's getProductBySlug drops `regionId` in vibe-coded mode (bug as of
// brainerce 1.37.0), but the backend honors `?regionId=` on the by-slug route —
// so when a region is set we call that vc endpoint directly to get the
// displayPrice/displayCurrency overlay. Returns null on 404.
export async function getServerProductBySlug(
  slug: string,
  opts?: { locale?: string; regionId?: string }
): Promise<Product | null> {
  if (!opts?.regionId) {
    return getServerClient(opts?.locale).getProductBySlug(slug);
  }

  const apiUrl = (process.env.BRAINERCE_API_URL || 'https://api.brainerce.com').replace(/\/$/, '');
  const url = `${apiUrl}/api/vc/${CONNECTION_ID}/products/slug/${encodePathSegment(
    slug
  )}?regionId=${encodeURIComponent(opts.regionId)}`;
  const headers: Record<string, string> = {
    Origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  };
  if (opts.locale) headers['Accept-Language'] = opts.locale;

  const res = await fetch(url, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getServerProductBySlug failed: ${res.status}`);
  return (await res.json()) as Product;
}
