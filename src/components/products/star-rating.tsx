'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
  ariaLabel?: string;
}

const SIZE_CLASS: Record<NonNullable<StarRatingProps['size']>, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-7 w-7',
};

export function StarRating({
  value,
  size = 'md',
  interactive = false,
  onChange,
  className,
  ariaLabel,
}: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const cls = SIZE_CLASS[size];
  const uid = useId();

  return (
    <div
      className={cn('inline-flex items-center', interactive ? 'gap-1' : 'gap-0.5', className)}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={ariaLabel}
      dir="ltr"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = clamped >= star;
        const half = !filled && clamped >= star - 0.5;
        const StarSvg = (
          <svg
            viewBox="0 0 24 24"
            className={cn(cls, 'transition-colors')}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`star-half-${uid}-${star}`}>
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="transparent" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              fill={filled ? '#f59e0b' : half ? `url(#star-half-${star})` : 'transparent'}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        );
        if (interactive && onChange) {
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={Math.round(clamped) === star}
              aria-label={`${star}`}
              onClick={() => onChange(star)}
              className="cursor-pointer rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {StarSvg}
            </button>
          );
        }
        return <span key={star}>{StarSvg}</span>;
      })}
    </div>
  );
}

interface RatingSummaryProps {
  avgRating?: number | null;
  reviewCount?: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showCount?: boolean;
  countLabel?: (count: number) => string;
}

export function RatingSummary({
  avgRating,
  reviewCount,
  size = 'sm',
  className,
  showCount = true,
  countLabel,
}: RatingSummaryProps) {
  if (!reviewCount || reviewCount <= 0 || avgRating == null) return null;
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <StarRating value={avgRating} size={size} />
      <span
        className={cn(
          'tabular-nums text-muted-foreground',
          size === 'lg' ? 'text-sm' : 'text-xs'
        )}
      >
        <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
        {showCount && (
          <>
            {' '}
            <span dir="ltr">({reviewCount})</span>
            {countLabel ? ` ${countLabel(reviewCount)}` : ''}
          </>
        )}
      </span>
    </div>
  );
}
