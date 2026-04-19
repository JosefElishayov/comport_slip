'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/lib/navigation';
import Image from 'next/image';
import type { Product } from 'brainerce';
import { getProductPriceInfo, getVariantPrice, formatPrice } from 'brainerce';
import { useTranslations } from '@/lib/translations';
import { PriceDisplay } from '@/components/shared/price-display';
import { StockBadge } from '@/components/products/stock-badge';
import { DiscountBadge } from '@/components/products/discount-badge';
import { useCart, useStoreInfo } from '@/providers/store-provider';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
}

function VariantPriceRange({ product }: { product: Product }) {
  const { storeInfo } = useStoreInfo();
  const currency = storeInfo?.currency || 'USD';
  const variants = product.variants ?? [];
  if (variants.length === 0) return null;

  const prices = variants.map((v) => getVariantPrice(v, product.basePrice));
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return (
    <span className="text-foreground text-sm font-medium">
      {min === max
        ? (formatPrice(min, { currency }) as string)
        : `${formatPrice(min, { currency })} – ${formatPrice(max, { currency })}`}
    </span>
  );
}

export function ProductCard({ product, className }: ProductCardProps) {
  const t = useTranslations('common');
  const tp = useTranslations('productDetail');
  const tProd = useTranslations('products');
  const router = useRouter();
  const { refreshCart } = useCart();
  const { price, originalPrice, isOnSale } = getProductPriceInfo(product);
  const mainImage = product.images?.[0];
  const imageUrl = mainImage?.url || null;
  const slug = product.slug || product.id;
  const isVariable = product.type === 'VARIABLE';

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const canPurchase = product.inventory?.canPurchase !== false;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isVariable) {
      router.push(`/products/${slug}`);
      return;
    }

    if (adding || !canPurchase) return;

    try {
      setAdding(true);
      const { getClient } = await import('@/lib/brainerce');
      const client = getClient();
      await client.smartAddToCart({ productId: product.id, quantity: 1 });
      await refreshCart();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div
      className={cn(
        'border-border bg-background group block overflow-hidden rounded-lg border transition-shadow hover:shadow-md',
        className
      )}
    >
      {/* Image — clickable */}
      <Link href={`/products/${slug}`} className="block">
        <div className="bg-muted relative aspect-square overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={mainImage?.alt || product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute start-2 top-2 flex flex-col gap-1">
            {isOnSale && (
              <span className="bg-destructive text-destructive-foreground rounded px-2 py-1 text-xs font-bold">
                {t('sale')}
              </span>
            )}
            <DiscountBadge discount={product.discount} />
            {product.isDownloadable && (
              <span className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs font-bold">
                {tp('digitalProduct')}
              </span>
            )}
          </div>

          {/* Add to cart overlay button */}
          {(isVariable || canPurchase) && (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              aria-label={isVariable ? tProd('selectOptions') : tp('addToCart')}
              className={cn(
                'absolute bottom-2 end-2 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all',
                'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              )}
            >
              {added ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : isVariable ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="space-y-2 p-3">
        {/* Categories */}
        {product.categories && product.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.categories.slice(0, 2).map((cat) => (
              <span
                key={cat.id}
                className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-[10px]"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Name — clickable */}
        <Link href={`/products/${slug}`}>
          <h3 className="text-foreground hover:text-primary line-clamp-2 text-sm font-medium transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        {isVariable ? (
          <VariantPriceRange product={product} />
        ) : (
          <PriceDisplay price={originalPrice} salePrice={isOnSale ? price : undefined} size="sm" />
        )}

        {/* Stock */}
        <StockBadge inventory={product.inventory} />
      </div>
    </div>
  );
}
