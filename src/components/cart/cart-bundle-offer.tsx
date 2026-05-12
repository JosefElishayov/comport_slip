'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { CartBundleOffer as CartBundleOfferType } from 'brainerce';
import { formatPrice } from 'brainerce';
import { useStoreInfo } from '@/providers/store-provider';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface CartBundleOfferCardProps {
  offer: CartBundleOfferType;
  cartId: string;
  onAdd: () => void;
  className?: string;
}

export function CartBundleOfferCard({ offer, cartId, onAdd, className }: CartBundleOfferCardProps) {
  const { storeInfo } = useStoreInfo();
  const t = useTranslations('cart');
  const currency = storeInfo?.currency || 'USD';
  const [adding, setAdding] = useState(false);

  const discountLabel =
    offer.discountType === 'PERCENTAGE'
      ? `${offer.discountValue}%`
      : (formatPrice(parseFloat(offer.discountValue), { currency }) as string);

  async function handleAdd() {
    if (adding) return;
    try {
      setAdding(true);
      const { getClient } = await import('@/lib/brainerce');
      const client = getClient();
      await client.addBundleToCart(cartId, offer.id);
      onAdd();
    } catch (err) {
      console.error('Failed to add bundle item:', err);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className={cn('bg-background border-border rounded-lg border p-4', className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-foreground text-sm font-semibold">{offer.name}</p>
          {offer.description && (
            <p className="text-muted-foreground mt-0.5 text-xs">{offer.description}</p>
          )}
        </div>
        <span className="bg-destructive/10 text-destructive flex-shrink-0 rounded px-2 py-0.5 text-xs font-medium">
          -{discountLabel}
        </span>
      </div>

      {/* Offered products */}
      <div className="mb-3 space-y-2">
        {offer.offeredProducts.map((product) => {
          const imageUrl = product.images?.[0]?.url ?? null;
          return (
            <div key={product.id} className="flex items-center gap-3">
              <div className="bg-muted relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
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
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm">{product.name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-muted-foreground text-xs line-through">
                    {formatPrice(parseFloat(product.originalPrice), { currency }) as string}
                  </span>
                  <span className="text-foreground text-xs font-semibold">
                    {formatPrice(parseFloat(product.discountedPrice), { currency }) as string}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: total + add button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-muted-foreground text-xs line-through">
            {formatPrice(parseFloat(offer.totalOriginalPrice), { currency }) as string}
          </span>
          <span className="text-foreground ms-2 text-sm font-semibold">
            {formatPrice(parseFloat(offer.totalDiscountedPrice), { currency }) as string}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className={cn(
            'bg-primary text-primary-foreground flex-shrink-0 rounded px-4 py-2 text-xs font-medium transition-opacity hover:opacity-90',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {adding ? t('addingBundle') : t('addBundleItem')}
        </button>
      </div>
    </div>
  );
}
