// CUID format used by Prisma for Checkout.id — c + 24 lowercase alphanumeric chars.
// Allow a small range to tolerate cuid2 (slightly different length).
const CHECKOUT_ID_RE = /^c[a-z0-9]{20,30}$/;

export function isValidCheckoutId(id: unknown): id is string {
  return typeof id === 'string' && CHECKOUT_ID_RE.test(id);
}
