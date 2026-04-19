'use client';

import type { InventoryInfo } from 'brainerce';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/translations';

interface StockBadgeProps {
  inventory: InventoryInfo | null | undefined;
  lowStockThreshold?: number;
  className?: string;
}

export function StockBadge({ inventory, lowStockThreshold = 5, className }: StockBadgeProps) {
  const t = useTranslations('productDetail');
  const label = getStockLabel(inventory, lowStockThreshold, t);
  const color = getStockColor(inventory, lowStockThreshold);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        color,
        className
      )}
    >
      {label}
    </span>
  );
}

function getStockLabel(
  inventory: InventoryInfo | null | undefined,
  lowStockThreshold: number,
  t: (key: string) => string
): string {
  if (!inventory) return t('outOfStock');

  const { trackingMode, inStock, available } = inventory;

  if (trackingMode === 'DISABLED') return t('unavailable');
  if (!inStock) return t('outOfStock');
  if (trackingMode === 'UNLIMITED') return t('inStock');

  // TRACKED — show actual quantity
  if (available <= lowStockThreshold) {
    return t('onlyLeft').replace('{available}', String(available));
  }
  return t('availableInStock').replace('{available}', String(available));
}

function getStockColor(
  inventory: InventoryInfo | null | undefined,
  lowStockThreshold: number
): string {
  if (!inventory) return 'bg-red-100 text-red-800';

  const { trackingMode, inStock, available } = inventory;

  if (trackingMode === 'DISABLED' || !inStock) return 'bg-red-100 text-red-800';
  if (trackingMode === 'TRACKED' && available <= lowStockThreshold)
    return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}
