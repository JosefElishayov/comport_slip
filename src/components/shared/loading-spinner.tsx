'use client';

import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const t = useTranslations('common');
  return (
    <div
      className={cn(
        'border-muted-foreground/30 border-t-primary animate-spin rounded-full',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={t('loading')}
    >
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}
