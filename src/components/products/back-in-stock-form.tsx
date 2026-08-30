'use client';

import { useEffect, useState } from 'react';
import type { InventoryInfo, StoreInfo } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useStoreInfo } from '@/providers/store-provider';
import { useOptionalLocale } from '@/providers/locale-provider';
import { useTranslations } from '@/lib/translations';
import { isValidEmail } from '@/lib/validation';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';

/**
 * The backend silently discards a stock-alert request for anything that isn't a
 * tracked, non-backorderable, out-of-stock item — so a form rendered anywhere
 * else looks like it worked and does nothing. `backorderMode` only arrives from
 * SDK 1.61+ backends; treat it as absent = 'NONE'.
 */
export function canOfferStockAlert(
  inventory: InventoryInfo | null | undefined,
  storeInfo: StoreInfo | null
): boolean {
  if (!storeInfo || storeInfo.stockAlertsEnabled === false) return false;
  if (!inventory) return false;
  return (
    inventory.trackingMode === 'TRACKED' &&
    !inventory.canPurchase &&
    (inventory.backorderMode ?? 'NONE') === 'NONE'
  );
}

interface BackInStockFormProps {
  productId: string;
  /** Selected variant — an alert without it fires when ANY sibling returns. */
  variantId?: string;
  /** Selected variant's inventory when there is one, else the product's. */
  inventory: InventoryInfo | null | undefined;
  /** True for variable products: no variant picked = nothing to wait on. */
  requiresVariant?: boolean;
  className?: string;
}

export function BackInStockForm({
  productId,
  variantId,
  inventory,
  requiresVariant = false,
  className,
}: BackInStockFormProps) {
  const t = useTranslations('productDetail');
  const locale = useOptionalLocale();
  const { storeInfo } = useStoreInfo();

  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // A different variant is a different waiting list — start over.
  useEffect(() => {
    setSuccess(false);
    setError(null);
  }, [productId, variantId]);

  if (!canOfferStockAlert(inventory, storeInfo)) return null;

  const needsVariantChoice = requiresVariant && !variantId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    // Bots fill every input; give them the same success screen, no request.
    if (honeypot.trim() !== '') {
      setSuccess(true);
      return;
    }

    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError(t('notifyMeInvalidEmail'));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await getClient().stockAlerts.subscribe({
        email: trimmed,
        productId,
        variantId,
        locale,
        honeypot,
      });
      // The response is deliberately uniform (new, duplicate, suppressed
      // address all return { ok: true }) — one message, nothing to branch on.
      setSuccess(true);
      setEmail('');
    } catch (err) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      setError(statusCode === 429 ? t('notifyMeRateLimited') : t('notifyMeError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn('border-border bg-secondary/30 rounded-xl border p-4', className)}>
      <p className="text-foreground text-sm font-semibold">{t('notifyMeHeading')}</p>

      {success ? (
        <p className="mt-2 text-sm text-green-700 dark:text-green-400">{t('notifyMeSuccess')}</p>
      ) : needsVariantChoice ? (
        <p className="text-muted-foreground mt-2 text-sm">{t('notifyMeSelectVariant')}</p>
      ) : (
        <>
          <p className="text-muted-foreground mt-1 text-sm">{t('notifyMeSubtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-3" noValidate>
            {/* Honeypot — off-screen, never focusable */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <label>
                {t('notifyMeHoneypot')}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </label>
            </div>

            <label htmlFor="back-in-stock-email" className="sr-only">
              {t('notifyMeEmailLabel')}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="back-in-stock-email"
                type="email"
                dir="ltr"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t('notifyMeEmailPlaceholder')}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'back-in-stock-error' : undefined}
                className={cn(
                  'border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none',
                  error && 'border-destructive focus:border-destructive focus:ring-destructive/20'
                )}
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-accent text-accent-foreground shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold whitespace-nowrap shadow-sm transition-all hover:brightness-110 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner
                      size="sm"
                      className="border-primary-foreground/30 border-t-primary-foreground"
                    />
                    {t('notifyMeSending')}
                  </span>
                ) : (
                  t('notifyMeSubmit')
                )}
              </button>
            </div>

            {error && (
              <p id="back-in-stock-error" className="text-destructive mt-2 text-sm">
                {error}
              </p>
            )}
          </form>
        </>
      )}
    </div>
  );
}
