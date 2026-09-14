'use client';

import { useState } from 'react';
import type { Checkout, CheckoutStatus } from 'brainerce';
import { formatPrice } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useTranslations } from '@/lib/translations';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';

interface GiftCardInputProps {
  checkoutId?: string;
  /** Held cards, read from the checkout — never from local state, so a reload keeps them. */
  tenders?: Checkout['tenders'];
  currency: string;
  /** Applying and removing both fail once the checkout is locked for payment. */
  status?: CheckoutStatus;
  onUpdate: (checkout: Checkout) => void;
  className?: string;
}

/**
 * Gift card redemption. A card is a means of payment, not a discount: applying
 * one leaves `checkout.total` alone and lowers `providerAmountDue`, which the
 * summary renders as its own line.
 *
 * Refusals are deliberately indistinguishable — unknown, expired, spent,
 * disabled and wrong-currency codes all answer the same way, so that the API is
 * not an oracle for walking the code space. We show one message for all of them.
 */
export function GiftCardInput({
  checkoutId,
  tenders,
  currency,
  status,
  onUpdate,
  className,
}: GiftCardInputProps) {
  const t = useTranslations('giftCard');
  const tc = useTranslations('common');
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A card is held against a checkout, so there is nothing to apply it to yet.
  if (!checkoutId) return null;

  async function refresh(id: string) {
    onUpdate(await getClient().getCheckout(id));
  }

  async function handleApply() {
    const trimmed = code.trim();
    if (!trimmed || applying || !checkoutId) return;

    try {
      setApplying(true);
      setError(null);
      await getClient().applyGiftCard(checkoutId, trimmed);
      setCode('');
      await refresh(checkoutId);
    } catch {
      // Never surface the backend message — every refusal reads the same on purpose.
      setError(t('unusable'));
    } finally {
      setApplying(false);
    }
  }

  async function handleRemove(tenderId: string) {
    if (removingId || !checkoutId) return;

    try {
      setRemovingId(tenderId);
      setError(null);
      await getClient().removeGiftCard(checkoutId, tenderId);
      await refresh(checkoutId);
    } catch {
      setError(t('removeFailed'));
    } finally {
      setRemovingId(null);
    }
  }

  const applied = tenders ?? [];
  // Once an intent exists the provider has been quoted a figure, so the server
  // refuses to move value in or out from under it (CHECKOUT_LOCKED).
  const locked = status === 'PAYMENT_PENDING' || status === 'PAYMENT_PROCESSING';

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-foreground text-sm font-medium">{t('title')}</p>

      {applied.map((tender) => (
        <div
          key={tender.tenderId}
          className="bg-muted flex items-center justify-between rounded px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <svg
              className="text-primary h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
            <span className="text-foreground text-sm font-medium">
              {t('applied')}{' '}
              <span dir="ltr" className="tabular-nums">
                −{formatPrice(parseFloat(tender.amountApplied), { currency }) as string}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleRemove(tender.tenderId)}
            disabled={locked || removingId === tender.tenderId}
            className="text-destructive hover:text-destructive/80 text-xs transition-colors disabled:opacity-40"
          >
            {removingId === tender.tenderId ? tc('removing') : tc('remove')}
          </button>
        </div>
      ))}

      {locked ? (
        <p className="text-muted-foreground text-xs">{t('locked')}</p>
      ) : (
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
          dir="ltr"
          autoComplete="off"
          aria-label={t('title')}
          placeholder={t('placeholder')}
          className={cn(
            'bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-9 flex-1 rounded border px-3 text-sm focus:outline-none focus:ring-2',
            error ? 'border-destructive' : 'border-border'
          )}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={applying || !code.trim()}
          className="border-border bg-background text-foreground hover:bg-muted h-9 rounded border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          {applying ? (
            <LoadingSpinner size="sm" className="border-muted-foreground/30 border-t-foreground" />
          ) : (
            tc('apply')
          )}
        </button>
      </div>
      )}

      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
