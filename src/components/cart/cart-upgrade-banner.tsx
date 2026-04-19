'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { CartUpgradeSuggestion, CartItem as CartItemType } from 'brainerce';
import { formatPrice } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useStoreInfo } from '@/providers/store-provider';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface CartUpgradeBannerProps {
  suggestion: CartUpgradeSuggestion;
  cartItem: CartItemType;
  onUpgrade: () => void;
  className?: string;
}

export function CartUpgradeBanner({
  suggestion,
  cartItem,
  onUpgrade,
  className,
}: CartUpgradeBannerProps) {
  const { storeInfo } = useStoreInfo();
  const t = useTranslations('cart');
  const currency = storeInfo?.currency || 'USD';
  const [upgrading, setUpgrading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const storageKey = `dismissed_upgrade_${suggestion.sourceProductId}`;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(storageKey)) {
        setDismissed(true);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  if (dismissed) return null;

  const target = suggestion.targetProduct;
  const firstImage = target.images?.[0];
  const imageUrl = firstImage
    ? typeof firstImage === 'string'
      ? firstImage
      : firstImage.url
    : null;
  const formattedDelta = formatPrice(parseFloat(suggestion.priceDelta), { currency }) as string;

  function handleDismiss() {
    try {
      sessionStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  async function handleUpgrade() {
    if (upgrading) return;
    try {
      setUpgrading(true);
      const client = getClient();
      await client.smartRemoveFromCart(cartItem.productId, cartItem.variantId || undefined);
      await client.smartAddToCart({ productId: target.id, quantity: cartItem.quantity });
      onUpgrade();
    } catch (err) {
      console.error('Failed to upgrade cart item:', err);
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div
      className={cn(
        'bg-primary/5 border-primary/20 relative flex items-center gap-3 rounded-lg border px-4 py-3',
        className
      )}
    >
      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground absolute end-2 top-2 text-xs"
        aria-label={t('dismissUpgrade')}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Product image */}
      <div className="bg-muted relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
        {imageUrl ? (
          <Image src={imageUrl} alt={target.name} fill sizes="48px" className="object-cover" />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-sm font-medium">
          {t('upgradeFor', { name: target.name, amount: formattedDelta })}
        </p>
      </div>

      {/* Upgrade button */}
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={upgrading}
        className={cn(
          'bg-primary text-primary-foreground flex-shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        {upgrading ? t('upgrading') : t('upgrade')}
      </button>
    </div>
  );
}
