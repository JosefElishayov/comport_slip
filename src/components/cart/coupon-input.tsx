'use client';

import { useState } from 'react';
import type { Cart } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useTranslations } from '@/lib/translations';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';

interface CouponInputProps {
  cart: Cart;
  onUpdate: () => void;
  className?: string;
}

export function CouponInput({ cart, onUpdate, className }: CouponInputProps) {
  const t = useTranslations('coupon');
  const tc = useTranslations('common');
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appliedCoupon = cart.couponCode || null;

  async function handleApply() {
    const trimmed = code.trim();
    if (!trimmed || applying) return;

    try {
      setApplying(true);
      setError(null);
      const client = getClient();
      await client.applyCoupon(cart.id, trimmed);
      setCode('');
      onUpdate();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('invalidCode');
      setError(message);
    } finally {
      setApplying(false);
    }
  }

  async function handleRemove() {
    if (removing) return;

    try {
      setRemoving(true);
      setError(null);
      const client = getClient();
      await client.removeCoupon(cart.id);
      onUpdate();
    } catch (err) {
      console.error('Failed to remove coupon:', err);
    } finally {
      setRemoving(false);
    }
  }

  // Show applied coupon
  if (appliedCoupon) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="bg-muted flex items-center justify-between rounded px-3 py-2">
          <div className="flex items-center gap-2">
            <svg
              className="text-primary h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <span className="text-foreground text-sm font-medium">{appliedCoupon}</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="text-destructive hover:text-destructive/80 text-xs transition-colors disabled:opacity-40"
          >
            {removing ? tc('removing') : tc('remove')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
          placeholder={t('placeholder')}
          className={cn(
            'bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-9 flex-1 rounded border px-3 text-sm focus:outline-none focus:ring-2',
            error ? 'border-destructive' : 'border-border'
          )}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={applying || !code.trim()}
          className="border-border bg-background text-foreground hover:bg-muted h-9 rounded border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          {applying ? (
            <LoadingSpinner size="sm" className="border-muted-foreground/30 border-t-foreground" />
          ) : (
            tc('apply')
          )}
        </button>
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
