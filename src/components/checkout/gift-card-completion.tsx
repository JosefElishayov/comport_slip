'use client';

import { useState } from 'react';
import { getClient } from '@/lib/brainerce';
import { useTranslations } from '@/lib/translations';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';

/**
 * The gift cards cover the whole order — `providerAmountDue` is '0.00'.
 *
 * There is nothing for a payment provider to charge, so we skip the provider
 * entirely and complete the checkout directly. This is allowed in exactly this
 * case and produces a real paid order. The confirmation page clears the cart
 * (`handlePaymentSuccess`), and `completeCheckout` returns the order id up
 * front, so there is no order to wait for.
 */
export function GiftCardCompletion({
  checkoutId,
  className,
}: {
  checkoutId: string;
  className?: string;
}) {
  const t = useTranslations('giftCard');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    if (submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      await getClient().completeCheckout(checkoutId);
      window.location.href = `/order-confirmation?checkout_id=${checkoutId}`;
    } catch {
      setError(t('completeFailed'));
      setSubmitting(false);
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <p className="text-muted-foreground text-sm">{t('fullyCovered')}</p>

      <button
        type="button"
        onClick={handleComplete}
        disabled={submitting}
        className="bg-primary text-primary-foreground flex w-full items-center justify-center rounded px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <LoadingSpinner size="sm" className="border-primary-foreground/30 border-t-current" />
        ) : (
          t('completeOrder')
        )}
      </button>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
