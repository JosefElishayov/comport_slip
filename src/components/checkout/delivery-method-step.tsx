'use client';

import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface DeliveryMethodStepProps {
  onSelect: (method: 'shipping' | 'pickup') => void;
  className?: string;
}

export function DeliveryMethodStep({ onSelect, className }: DeliveryMethodStepProps) {
  const t = useTranslations('checkout');
  return (
    <div className={cn('space-y-3', className)}>
      <button
        type="button"
        onClick={() => onSelect('shipping')}
        className="border-border hover:border-primary flex w-full items-center gap-4 rounded border px-4 py-4 text-start transition-colors"
      >
        <svg
          className="text-muted-foreground h-6 w-6 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </svg>
        <div>
          <p className="text-foreground text-sm font-medium">{t('shipToAddress')}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{t('shipToAddressDesc')}</p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelect('pickup')}
        className="border-border hover:border-primary flex w-full items-center gap-4 rounded border px-4 py-4 text-start transition-colors"
      >
        <svg
          className="text-muted-foreground h-6 w-6 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z"
          />
        </svg>
        <div>
          <p className="text-foreground text-sm font-medium">{t('pickUpInStore')}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{t('pickUpInStoreDesc')}</p>
        </div>
      </button>
    </div>
  );
}
