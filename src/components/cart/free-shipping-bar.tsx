'use client';

import { formatPrice } from 'brainerce';
import { useStoreInfo, useCart } from '@/providers/store-provider';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface FreeShippingBarProps {
  className?: string;
}

export function FreeShippingBar({ className }: FreeShippingBarProps) {
  const t = useTranslations('cart');
  const { storeInfo } = useStoreInfo();
  const { totals } = useCart();

  const upsell = storeInfo?.upsell;
  const threshold = upsell?.freeShippingThreshold;
  const enabled = upsell?.freeShippingBarEnabled !== false;

  // Don't render if disabled or no threshold configured
  if (!enabled || !threshold || threshold <= 0) return null;

  const subtotal = totals.subtotal;
  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, (subtotal / threshold) * 100);
  const qualified = remaining <= 0;
  const currency = storeInfo?.currency || 'USD';

  // Don't show if already qualified
  if (qualified) {
    return (
      <div className={cn('rounded-lg border border-green-200 bg-green-50 p-3', className)}>
        <div className="flex items-center gap-2 text-sm font-medium text-green-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {t('freeShippingQualified')}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-amber-200 bg-amber-50 p-3', className)}>
      <p className="mb-2 text-sm text-amber-800">
        {t('freeShippingRemaining', {
          amount: formatPrice(remaining, { currency }) as string,
        })}
      </p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-amber-200">
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
