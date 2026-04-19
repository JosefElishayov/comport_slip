'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { CartItem as CartItemType } from 'brainerce';
import { getCartItemImage, formatPrice } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useTranslations } from '@/lib/translations';
import { useStoreInfo } from '@/providers/store-provider';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
  onUpdate: () => void;
  className?: string;
}

export function CartItem({ item, onUpdate, className }: CartItemProps) {
  const t = useTranslations('common');
  const td = useTranslations('productDetail');
  const { storeInfo } = useStoreInfo();
  const currency = storeInfo?.currency || 'USD';
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);

  const productName = item.product.name;
  const imageUrl = getCartItemImage(item);
  const variantName = item.variant?.name;
  const unitPrice = parseFloat(item.unitPrice);
  const lineTotal = unitPrice * item.quantity;

  async function handleQuantityChange(newQuantity: number) {
    if (newQuantity < 1 || updating) return;

    try {
      setUpdating(true);
      const client = getClient();
      await client.smartUpdateCartItem(item.productId, newQuantity, item.variantId || undefined);
      onUpdate();
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setUpdating(false);
    }
  }

  async function handleRemove() {
    if (removing) return;

    try {
      setRemoving(true);
      const client = getClient();
      await client.smartRemoveFromCart(item.productId, item.variantId || undefined);
      onUpdate();
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div
      className={cn(
        'border-border flex gap-4 border-b py-4 last:border-0',
        (updating || removing) && 'opacity-60',
        className
      )}
    >
      {/* Image */}
      <div className="bg-muted relative h-20 w-20 flex-shrink-0 overflow-hidden rounded">
        {imageUrl ? (
          <Image src={imageUrl} alt={productName} fill sizes="80px" className="object-cover" />
        ) : (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* Details */}
      <div className="min-w-0 flex-1">
        <h3 className="text-foreground truncate text-sm font-medium">{productName}</h3>

        {/* Variant name */}
        {variantName && <p className="text-muted-foreground mt-1 text-xs">{variantName}</p>}

        {/* Unit price */}
        <p className="text-muted-foreground mt-1 text-sm">
          {formatPrice(unitPrice, { currency }) as string}
        </p>

        {/* Quantity controls */}
        <div className="mt-2 flex items-center gap-3">
          <div className="border-border flex items-center rounded border">
            <button
              type="button"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              className="text-foreground hover:bg-muted px-2 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={td('decreaseQuantity')}
            >
              -
            </button>
            <span className="text-foreground min-w-[2.5rem] px-3 py-1 text-center text-sm font-medium">
              {updating ? (
                <LoadingSpinner
                  size="sm"
                  className="border-muted-foreground/30 border-t-foreground mx-auto"
                />
              ) : (
                item.quantity
              )}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={updating}
              className="text-foreground hover:bg-muted px-2 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={td('increaseQuantity')}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="text-destructive hover:text-destructive/80 text-xs transition-colors disabled:opacity-40"
          >
            {removing ? t('removing') : t('remove')}
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="flex-shrink-0 text-end">
        <span className="text-foreground text-sm font-medium">
          {formatPrice(lineTotal, { currency }) as string}
        </span>
      </div>
    </div>
  );
}
