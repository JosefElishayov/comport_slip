'use client';

import { formatPrice } from 'brainerce';
import { useStoreInfo } from '@/providers/store-provider';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  price: string | number;
  salePrice?: string | number | null;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl font-semibold',
};

export function PriceDisplay({
  price,
  salePrice,
  currency,
  className,
  size = 'md',
}: PriceDisplayProps) {
  const { storeInfo } = useStoreInfo();
  const currencyCode = currency || storeInfo?.currency || 'USD';

  const basePrice = typeof price === 'string' ? parseFloat(price) : price;
  const sale =
    salePrice != null ? (typeof salePrice === 'string' ? parseFloat(salePrice) : salePrice) : null;
  const isOnSale = sale !== null && sale < basePrice;

  const discountPercent =
    isOnSale && basePrice > 0 ? Math.round(((basePrice - sale!) / basePrice) * 100) : 0;

  return (
    <span className={cn('inline-flex items-center gap-2', sizeClasses[size], className)}>
      {isOnSale ? (
        <>
          <span className="text-destructive font-medium">
            {formatPrice(sale!, { currency: currencyCode }) as string}
          </span>
          <span className="text-muted-foreground text-[0.85em] line-through">
            {formatPrice(basePrice, { currency: currencyCode }) as string}
          </span>
          {discountPercent > 0 && (
            <span className="bg-destructive text-destructive-foreground rounded px-1.5 py-0.5 text-xs font-medium">
              -{discountPercent}%
            </span>
          )}
        </>
      ) : (
        <span className="text-foreground font-medium">
          {formatPrice(basePrice, { currency: currencyCode }) as string}
        </span>
      )}
    </span>
  );
}
