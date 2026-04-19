'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Product, ProductRecommendation } from 'brainerce';
import { formatPrice } from 'brainerce';
import { useCart } from '@/providers/store-provider';
import { useStoreInfo } from '@/providers/store-provider';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface FrequentlyBoughtTogetherProps {
  items: ProductRecommendation[];
  currentProduct: Product;
  className?: string;
}

function getEffectivePrice(item: { basePrice: string; salePrice?: string | null }): number {
  const sale = item.salePrice ? parseFloat(item.salePrice) : null;
  const base = parseFloat(item.basePrice);
  return sale != null && sale < base ? sale : base;
}

function ProductThumb({
  name,
  imageUrl,
  price,
  currency,
  checked,
  onToggle,
  disabled,
}: {
  name: string;
  imageUrl: string | null;
  price: number;
  currency: string;
  checked: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        'border-border bg-background relative flex cursor-pointer flex-col items-center rounded-lg border p-3 transition-all',
        checked ? 'ring-primary ring-2' : 'opacity-60',
        disabled && 'pointer-events-none'
      )}
    >
      {onToggle && (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="absolute start-2 top-2 h-4 w-4 rounded"
        />
      )}
      <div className="bg-muted relative mb-2 h-20 w-20 overflow-hidden rounded">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill sizes="80px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="text-muted-foreground h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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
      <span className="text-foreground line-clamp-2 text-center text-xs font-medium">{name}</span>
      <span className="text-muted-foreground mt-1 text-xs">
        {formatPrice(price, { currency }) as string}
      </span>
    </label>
  );
}

export function FrequentlyBoughtTogether({
  items,
  currentProduct,
  className,
}: FrequentlyBoughtTogetherProps) {
  const { storeInfo } = useStoreInfo();
  const { refreshCart } = useCart();
  const t = useTranslations('productDetail');

  // Only show up to 3 cross-sells
  const crossSells = items.slice(0, 3);

  const [selected, setSelected] = useState<Set<string>>(() => new Set(crossSells.map((i) => i.id)));
  const [adding, setAdding] = useState(false);

  if (!storeInfo?.upsell?.frequentlyBoughtTogetherEnabled) return null;
  if (crossSells.length === 0) return null;

  const currency = storeInfo.currency || 'USD';

  const currentPrice = getEffectivePrice(currentProduct);
  const currentImage = currentProduct.images?.[0];
  const currentImageUrl = currentImage
    ? typeof currentImage === 'string'
      ? currentImage
      : currentImage.url
    : null;

  const totalPrice = crossSells
    .filter((item) => selected.has(item.id))
    .reduce((sum, item) => sum + getEffectivePrice(item), currentPrice);

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  async function handleAddAll() {
    if (adding || selected.size === 0) return;
    try {
      setAdding(true);
      const { getClient } = await import('@/lib/brainerce');
      const client = getClient();
      const selectedItems = crossSells.filter((item) => selected.has(item.id));
      for (const item of selectedItems) {
        await client.smartAddToCart({ productId: item.id, quantity: 1 });
      }
      await refreshCart();
    } catch (err) {
      console.error('Failed to add items to cart:', err);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className={cn('border-border rounded-lg border p-6', className)}>
      <h2 className="text-foreground mb-4 text-xl font-semibold">
        {t('frequentlyBoughtTogether')}
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        {/* Current product (always included, no checkbox) */}
        <ProductThumb
          name={currentProduct.name}
          imageUrl={currentImageUrl}
          price={currentPrice}
          currency={currency}
          checked={true}
          disabled
        />

        {crossSells.map((item) => {
          const img = item.images?.[0];
          const imgUrl = img ? (typeof img === 'string' ? img : img.url) : null;
          return (
            <div key={item.id} className="flex items-center gap-3">
              <span className="text-muted-foreground text-lg font-light">+</span>
              <ProductThumb
                name={item.name}
                imageUrl={imgUrl}
                price={getEffectivePrice(item)}
                currency={currency}
                checked={selected.has(item.id)}
                onToggle={() => toggleItem(item.id)}
              />
            </div>
          );
        })}
      </div>

      {/* Total + Add button */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="text-foreground text-lg font-semibold">
          {t('totalPrice', { price: formatPrice(totalPrice, { currency }) as string })}
        </span>
        <button
          onClick={handleAddAll}
          disabled={adding || selected.size === 0}
          className={cn(
            'bg-primary text-primary-foreground rounded px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {adding ? t('addingAll') : t('addSelectedToCart')}
        </button>
      </div>
    </div>
  );
}
