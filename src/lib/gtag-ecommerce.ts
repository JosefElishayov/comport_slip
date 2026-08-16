/**
 * GA4 ecommerce events (`view_item`, `add_to_cart`, `begin_checkout`).
 *
 * NO `purchase` EVENT HERE — deliberately. Brainerce sends the purchase
 * conversion from its own server via the Measurement Protocol, joined to this
 * browser's session by the stitch ids in `@/lib/gtag`. Firing a client-side
 * `purchase` as well would count every order's revenue twice in GA4. A Google
 * Ads conversion, if added later, belongs on the `AW-` id with an explicit
 * `send_to` — it must not be sent as a GA4 `purchase`.
 *
 * Every function here is fire-and-forget: `gtag()` no-ops when the tag was
 * blocked or hasn't loaded, so none of these can throw into a shopper flow.
 * Nothing is sent to storage until the visitor accepts in the cookie banner —
 * Consent Mode holds that back, not this module.
 */

import type { Cart } from 'brainerce';
import { getCartTotals } from 'brainerce';
import { gtag } from './gtag';

/**
 * Loose on purpose: call sites range from the PDP (full product + price) to the
 * chat bot's add-to-cart callback, which only ever receives ids and a quantity.
 * A thin event still beats a missing one — GA4 only requires `item_id`.
 */
export interface Ga4ItemInput {
  id: string;
  name?: string;
  /** Unit price, in `currency` — the price the shopper actually saw. */
  price?: number;
  quantity?: number;
  variantName?: string | null;
  category?: string | null;
}

interface Ga4Item {
  item_id: string;
  item_name?: string;
  item_variant?: string;
  item_category?: string;
  price?: number;
  quantity: number;
}

/** Money in GA4 events is a number, and fractional agorot are noise. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function toGa4Item(item: Ga4ItemInput): Ga4Item {
  const out: Ga4Item = {
    item_id: item.id,
    quantity: item.quantity ?? 1,
  };
  if (item.name) out.item_name = item.name;
  if (item.variantName) out.item_variant = item.variantName;
  if (item.category) out.item_category = item.category;
  if (typeof item.price === 'number' && Number.isFinite(item.price)) {
    out.price = round2(item.price);
  }
  return out;
}

/**
 * `value` is the sum of price × quantity, and is omitted entirely when any line
 * is missing a price — a partial total would understate revenue in GA4's
 * reports, which is worse than no total at all.
 */
function totalValue(items: Ga4Item[]): number | null {
  let sum = 0;
  for (const item of items) {
    if (item.price == null) return null;
    sum += item.price * item.quantity;
  }
  return round2(sum);
}

function sendEcommerceEvent(
  name: 'view_item' | 'add_to_cart' | 'begin_checkout',
  currency: string | undefined,
  items: Ga4Item[]
): void {
  if (items.length === 0) return;
  const payload: Record<string, unknown> = { items };
  const value = totalValue(items);
  // GA4 requires `currency` whenever `value` is set, so they travel together.
  if (value != null && currency) {
    payload.value = value;
    payload.currency = currency;
  }
  gtag('event', name, payload);
}

/** Product detail page view. Fire once per product, not per re-render. */
export function trackViewItem(currency: string | undefined, item: Ga4ItemInput): void {
  sendEcommerceEvent('view_item', currency, [toGa4Item(item)]);
}

/** Accepts several lines so bundle / "add all" flows report as one event. */
export function trackAddToCart(
  currency: string | undefined,
  items: Ga4ItemInput | Ga4ItemInput[]
): void {
  const list = Array.isArray(items) ? items : [items];
  sendEcommerceEvent('add_to_cart', currency, list.map(toGa4Item));
}

/**
 * Checkout entered. Built from the server cart so it reflects what will
 * actually be charged, including Buy Now (which routes through a cart too).
 *
 * `unitPrice` is the price locked onto the line, which is what the shopper is
 * billed — not `currentUnitPrice`, which may have drifted since.
 */
export function trackBeginCheckout(cart: Cart): void {
  const items = cart.items.map((item) =>
    toGa4Item({
      id: item.productId,
      name: item.product?.name,
      price: parseFloat(item.unitPrice),
      quantity: item.quantity,
      variantName: item.variant?.name,
    })
  );
  if (items.length === 0) return;

  // Prefer the cart's own subtotal: it accounts for discounts and promos that
  // per-line unit prices don't carry.
  const subtotal = getCartTotals(cart).subtotal;
  const payload: Record<string, unknown> = { items };
  if (Number.isFinite(subtotal) && cart.currency) {
    payload.value = round2(subtotal);
    payload.currency = cart.currency;
  }
  gtag('event', 'begin_checkout', payload);
}
