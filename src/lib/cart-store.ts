import { createCartStore, type AddToCartInput, type CartStore } from 'brainerce';
import { getClient } from '@/lib/brainerce';

const CONNECTION_ID = process.env.NEXT_PUBLIC_BRAINERCE_CONNECTION_ID || 'vc_BslbK0EDGoUXP2c5VH0Dk';

// One cart store per browser tab. Created lazily so server renders never touch
// it; started at first use so the cart fetch begins before React hydrates.
let store: CartStore | null = null;

export function getCartStore(): CartStore {
  if (!store) {
    store = createCartStore(getClient(), { scope: CONNECTION_ID });
  }
  return store;
}

if (typeof window !== 'undefined') {
  getCartStore().start();
}

/**
 * Store actions never reject — a failed write is rolled back and lands in
 * `mutationError`. Callers here want a throw (to show an error, skip the
 * fly-to-cart animation, skip analytics), so surface a NEW error as one.
 */
async function throwOnNewError(run: (s: CartStore) => Promise<void>): Promise<void> {
  const s = getCartStore();
  const before = s.getSnapshot().mutationError;
  await run(s);
  const after = s.getSnapshot().mutationError;
  if (after && after !== before) throw after;
}

export function addToCart(input: AddToCartInput): Promise<void> {
  return throwOnNewError((s) => s.add(input));
}

export function removeCartItem(itemId: string): Promise<void> {
  return throwOnNewError((s) => s.remove(itemId));
}

export function applyCartCoupon(code: string): Promise<void> {
  return throwOnNewError((s) => s.applyCoupon(code));
}

export function removeCartCoupon(): Promise<void> {
  return throwOnNewError((s) => s.removeCoupon());
}
