import type { ProductDiscount } from 'brainerce';
import { cn } from '@/lib/utils';

interface DiscountBadgeProps {
  discount?: ProductDiscount | null;
  className?: string;
}

export function DiscountBadge({ discount, className }: DiscountBadgeProps) {
  if (!discount) return null;

  return (
    <span
      className={cn(
        'bg-destructive text-destructive-foreground inline-flex items-center rounded px-2 py-1 text-xs font-bold',
        className
      )}
    >
      {discount.badgeText}
    </span>
  );
}
