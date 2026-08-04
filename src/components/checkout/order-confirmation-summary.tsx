'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Order } from 'brainerce';
import { formatPrice } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useTranslations } from '@/lib/translations';

/**
 * Known payment methods we have a localized label for. Anything else is
 * simply not rendered rather than leaking a raw backend enum to the shopper.
 */
const PAYMENT_METHOD_KEYS: Record<string, string> = {
  card: 'paymentCard',
  credit_card: 'paymentCard',
  paypal: 'paymentPaypal',
  cash_on_delivery: 'paymentCod',
  cod: 'paymentCod',
  bit: 'paymentBit',
  apple_pay: 'paymentApplePay',
  google_pay: 'paymentGooglePay',
};

/** Price in an RTL page must stay LTR, and align across rows. */
function Money({ value, currency }: { value: number; currency: string }) {
  return (
    <span dir="ltr" className="tabular-nums">
      {formatPrice(value, { currency }) as string}
    </span>
  );
}

/**
 * Full order recap shown on the public order-confirmation page.
 *
 * The confirmation URL carries only `checkout_id` and is shareable/open —
 * anyone holding the link sees this. So it deliberately renders **no customer
 * identity**: no name, email, phone, or street address. Only the city/country
 * the parcel is heading to, which is what a shopper needs to sanity-check.
 */
export function OrderConfirmationSummary({ checkoutId }: { checkoutId: string }) {
  const t = useTranslations('orderConfirmation');
  const tc = useTranslations('common');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrder() {
      const client = getClient();
      // The order row may still be settling right after the payment webhook,
      // so retry briefly before giving up silently.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await client.getOrderByCheckout(checkoutId);
          if (!cancelled && result) {
            setOrder(result);
            setLoading(false);
            return;
          }
        } catch {
          // fall through to retry
        }
        if (attempt < 2 && !cancelled) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      if (!cancelled) setLoading(false);
    }

    fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [checkoutId]);

  if (loading) {
    return (
      <div className="border-border mx-auto mt-10 max-w-xl animate-pulse rounded-lg border p-6">
        <div className="bg-muted h-4 w-32 rounded" />
        <div className="mt-6 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="bg-muted h-16 w-16 flex-shrink-0 rounded" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted h-3 w-3/4 rounded" />
                <div className="bg-muted h-3 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currency = order.currency || 'ILS';
  const total = parseFloat(order.totalAmount || order.total || '0');
  const subtotal = order.subtotal ? parseFloat(order.subtotal) : null;
  const ruleAmt = order.ruleDiscountAmount ? parseFloat(order.ruleDiscountAmount) : 0;
  const couponAmt = order.couponDiscount ? parseFloat(order.couponDiscount) : 0;
  const shipping = order.shippingAmount ? parseFloat(order.shippingAmount) : 0;
  const tax = order.taxAmount ? parseFloat(order.taxAmount) : 0;
  const includedVat =
    order.taxBreakdown?.pricesIncludeTax && order.taxBreakdown.totalTax > 0
      ? order.taxBreakdown.totalTax
      : null;
  const rules = order.appliedDiscounts;
  const hasBreakdown = subtotal !== null && subtotal > 0;

  const createdAt =
    order.createdAt && !isNaN(new Date(order.createdAt).getTime())
      ? new Date(order.createdAt)
      : null;

  // City + country only — never the street line, which would identify the buyer.
  const destination = [order.shippingAddress?.city, order.shippingAddress?.country]
    .filter(Boolean)
    .join(', ');

  const paymentKey = order.paymentMethod
    ? PAYMENT_METHOD_KEYS[order.paymentMethod.toLowerCase()]
    : undefined;

  return (
    <div className="border-border mx-auto mt-10 max-w-xl overflow-hidden rounded-lg border text-start">
      <div className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
        <h2 className="text-foreground text-sm font-semibold">{t('orderDetails')}</h2>
        {createdAt && (
          <span className="text-muted-foreground text-xs">
            {createdAt.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>

      {/* Line items */}
      <ul className="divide-border divide-y">
        {order.items.map((item, index) => {
          const unitPrice = parseFloat(item.price || item.unitPrice || '0');
          const lineTotal = item.totalPrice
            ? parseFloat(item.totalPrice)
            : unitPrice * item.quantity;
          const customizations = item.customizations ? Object.values(item.customizations) : [];

          return (
            <li key={`${item.productId}-${index}`} className="flex gap-4 px-5 py-4">
              <div className="bg-muted relative h-16 w-16 flex-shrink-0 overflow-hidden rounded">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name || t('productFallback')}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-medium">
                  {item.name || t('productFallback')}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {tc('qty')} <span dir="ltr">{item.quantity}</span>
                  {item.quantity > 1 && (
                    <>
                      {' · '}
                      <Money value={unitPrice} currency={currency} />
                      {` ${t('perUnit')}`}
                    </>
                  )}
                </p>

                {customizations.length > 0 && (
                  <ul className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                    {customizations.map((c, i) => (
                      <li key={i} className="truncate">
                        {c.label}: {Array.isArray(c.value) ? c.value.join(', ') : c.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <span className="text-foreground flex-shrink-0 text-sm font-medium">
                <Money value={lineTotal} currency={currency} />
              </span>
            </li>
          );
        })}
      </ul>

      {/* Financial breakdown */}
      <div className="border-border bg-muted/30 space-y-1.5 border-t px-5 py-4 text-sm">
        {hasBreakdown && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{tc('subtotal')}</span>
              <span className="text-foreground">
                <Money value={subtotal} currency={currency} />
              </span>
            </div>

            {rules && rules.length > 0
              ? rules.map((rule) => (
                  <div key={rule.ruleId} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{rule.ruleName}</span>
                    <span className="text-destructive">
                      -
                      <Money value={parseFloat(rule.discountAmount || '0')} currency={currency} />
                    </span>
                  </div>
                ))
              : ruleAmt > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{tc('generalDiscount')}</span>
                    <span className="text-destructive">
                      -<Money value={ruleAmt} currency={currency} />
                    </span>
                  </div>
                )}

            {order.couponCode && couponAmt > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {tc('couponDiscount')} ({order.couponCode})
                </span>
                <span className="text-destructive">
                  -<Money value={couponAmt} currency={currency} />
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{tc('shipping')}</span>
              <span className="text-foreground">
                {shipping > 0 ? <Money value={shipping} currency={currency} /> : tc('free')}
              </span>
            </div>

            {tax > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{tc('tax')}</span>
                <span className="text-foreground">
                  <Money value={tax} currency={currency} />
                </span>
              </div>
            )}
          </>
        )}

        <div className="border-border flex items-center justify-between border-t pt-2">
          <span className="text-foreground font-semibold">{tc('total')}</span>
          <span className="text-foreground text-lg font-bold">
            <Money value={total} currency={currency} />
          </span>
        </div>

        {includedVat !== null && (
          <p className="text-muted-foreground text-end text-xs">
            {tc('includesTax')} <Money value={includedVat} currency={currency} />
          </p>
        )}
      </div>

      {/* Non-identifying logistics info */}
      {(destination || paymentKey) && (
        <dl className="border-border space-y-2 border-t px-5 py-4 text-sm">
          {destination && (
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">{t('shipTo')}</dt>
              <dd className="text-foreground text-end">{destination}</dd>
            </div>
          )}
          {paymentKey && (
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">{t('paymentMethod')}</dt>
              <dd className="text-foreground text-end">{t(paymentKey)}</dd>
            </div>
          )}
        </dl>
      )}

      <p className="text-muted-foreground border-border border-t px-5 py-3 text-xs">
        {t('privacyNote')}
      </p>
    </div>
  );
}
