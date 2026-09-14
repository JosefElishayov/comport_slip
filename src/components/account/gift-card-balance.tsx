'use client';

import { useState } from 'react';
import type { GiftCardBalance } from 'brainerce';
import { formatPrice } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useTranslations } from '@/lib/translations';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';

/**
 * Gift card balance lookup for the account area.
 *
 * This is the whole customer-facing surface there is: the platform has no
 * "my gift cards" list, because a card is bearer value and is not owned by an
 * account. The answer is also deliberately uninformative — an unknown code, a
 * disabled one and an expired one all return `{ balance: '0.00', usable: false }`
 * — so there is one message for every unusable code.
 */
export function GiftCardBalanceCheck({ className }: { className?: string }) {
  const t = useTranslations('giftCard');
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<GiftCardBalance | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    const trimmed = code.trim();
    if (!trimmed || checking) return;

    try {
      setChecking(true);
      setError(null);
      setResult(null);
      setResult(await getClient().checkGiftCardBalance(trimmed));
    } catch {
      // Rate limiting is the only refusal worth its own message; everything else
      // is answered as an unusable card, not an error.
      setError(t('checkFailed'));
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className={cn('dashboard-card p-6', className)}>
      <h2 className="text-foreground mb-1 text-lg font-semibold">{t('balanceTitle')}</h2>
      <p className="text-muted-foreground mb-4 text-sm">{t('balanceHint')}</p>

      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
            if (result) setResult(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleCheck();
            }
          }}
          dir="ltr"
          autoComplete="off"
          aria-label={t('balanceTitle')}
          placeholder={t('placeholder')}
          className="bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary border-border h-10 flex-1 rounded border px-3 text-sm focus:outline-none focus:ring-2"
        />
        <button
          type="button"
          onClick={handleCheck}
          disabled={checking || !code.trim()}
          className="bg-accent text-accent-foreground h-10 rounded px-5 text-sm font-medium transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {checking ? (
            <LoadingSpinner size="sm" className="border-accent-foreground/30 border-t-current" />
          ) : (
            t('check')
          )}
        </button>
      </div>

      {result && (
        <div
          className={cn(
            'mt-4 rounded-lg px-4 py-3 text-sm',
            result.usable ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted'
          )}
        >
          {result.usable ? (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('balanceLabel')}</span>
              <span dir="ltr" className="text-foreground text-base font-semibold tabular-nums">
                {formatPrice(parseFloat(result.balance), { currency: result.currency }) as string}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground">{t('unusable')}</p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-destructive mt-3 text-xs">
          {error}
        </p>
      )}

      <p className="text-muted-foreground mt-4 text-xs">{t('issuedNote')}</p>
    </div>
  );
}
