'use client';

import type { ShippingRate } from 'brainerce';
import { formatPrice } from 'brainerce';
import { useTranslations } from '@/lib/translations';
import { useStoreInfo } from '@/providers/store-provider';
import { cn } from '@/lib/utils';

interface ShippingStepProps {
  rates: ShippingRate[];
  selectedRateId: string | null;
  onSelect: (rateId: string) => void;
  loading?: boolean;
  className?: string;
}

export function ShippingStep({
  rates,
  selectedRateId,
  onSelect,
  loading = false,
  className,
}: ShippingStepProps) {
  const t = useTranslations('checkout');
  const tc = useTranslations('common');
  const { storeInfo } = useStoreInfo();
  const currency = storeInfo?.currency || 'USD';

  if (rates.length === 0) {
    return (
      <div className={cn('py-8 text-center', className)}>
        <svg
          className="text-muted-foreground mx-auto mb-3 h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p className="text-muted-foreground text-sm">{t('noShippingOptions')}</p>
        <p className="text-muted-foreground mt-1 text-xs">{t('noShippingOptionsHint')}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {rates.map((rate) => {
        const price = parseFloat(rate.price);
        const isFree = price === 0;
        const isSelected = selectedRateId === rate.id;

        return (
          <button
            key={rate.id}
            type="button"
            onClick={() => onSelect(rate.id)}
            disabled={loading}
            className={cn(
              'flex w-full items-center gap-4 rounded border px-4 py-3 text-start transition-colors',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground',
              loading && 'cursor-not-allowed opacity-60'
            )}
          >
            {/* Radio indicator */}
            <div
              className={cn(
                'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2',
                isSelected ? 'border-primary' : 'border-muted-foreground/40'
              )}
            >
              {isSelected && <div className="bg-primary h-2 w-2 rounded-full" />}
            </div>

            {/* Rate info */}
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm font-medium">{rate.name}</p>
              {rate.description && (
                <p className="text-muted-foreground mt-0.5 text-xs">{rate.description}</p>
              )}
              {rate.estimatedDays != null && (
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {t('estimatedDelivery')} {rate.estimatedDays}{' '}
                  {rate.estimatedDays === 1 ? tc('day') : tc('days')}
                </p>
              )}
            </div>

            {/* Price */}
            <span
              className={cn(
                'flex-shrink-0 text-sm font-medium',
                isFree ? 'text-primary' : 'text-foreground'
              )}
            >
              {isFree ? tc('free') : (formatPrice(price, { currency }) as string)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
