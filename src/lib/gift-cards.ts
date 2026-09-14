import type { Order } from 'brainerce';

/** One tender row as an order snapshots it. `GIFT_CARD` is the only type today. */
export type OrderTender = NonNullable<Order['tenders']>[number];

/**
 * Gift cards that settled part of an order.
 *
 * `order.total` is what the order was WORTH; these are what actually paid for
 * it. A receipt that shows only the total tells the customer they handed over
 * money they did not — so every caller that renders a total must render these
 * beside it.
 */
export function getOrderTenders(order: Order): OrderTender[] {
  return order.tenders ?? [];
}

/** What the tenders paid together. `total` minus this is what the provider charged. */
export function sumTenders(tenders: OrderTender[]): number {
  return tenders.reduce((sum, tender) => sum + (parseFloat(tender.amountBase) || 0), 0);
}

/** `•••• 1234` — the last four is all that can ever be shown; the code is stored as an HMAC. */
export function maskTender(tender: OrderTender): string | null {
  return tender.giftCard?.codeLast4 ? `•••• ${tender.giftCard.codeLast4}` : null;
}
