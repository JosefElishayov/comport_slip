'use client';

import type { TaxBreakdown } from 'brainerce';
import { formatPrice } from 'brainerce';
import { useTranslations } from '@/lib/translations';
import { useStoreInfo } from '@/providers/store-provider';
import { cn } from '@/lib/utils';

interface TaxDisplayProps {
  /** Whether shipping address has been set */
  addressSet: boolean;
  /** Tax amount string from checkout (only available after address is set) */
  taxAmount?: string;
  /** Detailed tax breakdown (optional) */
  taxBreakdown?: TaxBreakdown | null;
  className?: string;
}

export function TaxDisplay({ addressSet, taxAmount, taxBreakdown, className }: TaxDisplayProps) {
  const t = useTranslations('checkout');
  const tc = useTranslations('common');
  const { storeInfo } = useStoreInfo();
  const currency = storeInfo?.currency || 'USD';

  // Before address is set
  if (!addressSet) {
    return (
      <div className={cn('flex items-center justify-between text-sm', className)}>
        <span className="text-muted-foreground">{tc('tax')}</span>
        <span className="text-muted-foreground text-xs">{t('calculatedAfterAddress')}</span>
      </div>
    );
  }

  // After address, show tax amount
  const tax = taxAmount ? parseFloat(taxAmount) : 0;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{tc('tax')}</span>
        <span className="text-foreground font-medium">
          {tax > 0 ? (formatPrice(tax, { currency }) as string) : t('noTax')}
        </span>
      </div>

      {/* Tax breakdown details */}
      {taxBreakdown && taxBreakdown.breakdown?.length > 0 && tax > 0 && (
        <div className="space-y-0.5 ps-4">
          {taxBreakdown.breakdown.map((item, index) => (
            <div
              key={index}
              className="text-muted-foreground flex items-center justify-between text-xs"
            >
              <span>
                {item.name} ({(item.rate * 100).toFixed(1)}%)
              </span>
              <span>{formatPrice(item.amount, { currency }) as string}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
