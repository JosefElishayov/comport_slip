'use client';

import { useState, useRef } from 'react';
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
import { flyToCart } from '@/lib/fly-to-cart';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

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
    <span className="text-foreground text-sm font-semibold transition-colors group-hover:text-primary">
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
  const { refreshCart, openCartDrawer } = useCart();
  const imageRef = useRef<HTMLDivElement>(null);
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
      if (imageRef.current) {
        flyToCart(imageRef.current);
      }

      const { getClient } = await import('@/lib/brainerce');
      const client = getClient();
      await client.smartAddToCart({ productId: product.id, quantity: 1 });
      await refreshCart();
      setAdded(true);
      openCartDrawer();
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAdding(false);
    }
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isVariable) {
      router.push(`/products/${slug}`);
      return;
    }

    if (!canPurchase) return;

    // Add to cart and go to checkout
    (async () => {
      try {
        setAdding(true);
        const { getClient } = await import('@/lib/brainerce');
        const client = getClient();
        await client.smartAddToCart({ productId: product.id, quantity: 1 });
        await refreshCart();
        router.push('/checkout');
      } catch (err) {
        console.error('Failed to buy now:', err);
      } finally {
        setAdding(false);
      }
    })();
  }

  return (
    <div
      className={cn(
        'product-card-comfort border-border/70 bg-background group relative flex flex-col overflow-hidden rounded-2xl border',
        className
      )}
    >
      {/* Image — clickable */}
      <Link href={`/products/${slug}`} className="block">
        <div ref={imageRef} className="product-card-image bg-secondary/25 relative aspect-square overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={mainImage?.alt || product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-5 transition duration-700 ease-out group-hover:scale-[1.07]"
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
          <div className="absolute start-3 top-3 z-10 flex flex-col gap-1.5">
            {/* Categories */}
            {product.categories && product.categories.length > 0 && (
              product.categories.slice(0, 1).map((cat) => (
                <span
                  key={cat.id}
                  className="border-border/70 bg-background/90 text-foreground rounded-full border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-md transition-colors group-hover:border-primary/25 group-hover:text-primary"
                >
                  {cat.name}
                </span>
              ))
            )}
            {isOnSale && (
              <span className="bg-destructive text-destructive-foreground rounded-full px-3 py-1 text-xs font-bold shadow-sm">
                {t('sale')}
              </span>
            )}
            <DiscountBadge discount={product.discount} />
            {product.isDownloadable && (
              <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-bold shadow-sm">
                {tp('digitalProduct')}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="relative flex flex-1 flex-col p-4 pt-4">
        {/* Name — clickable */}
        <Link href={`/products/${slug}`}>
          <h3 className="product-card-title text-foreground line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 transition-colors duration-300 group-hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-2 transition-transform duration-300 group-hover:translate-x-0.5">
          {isVariable ? (
            <VariantPriceRange product={product} />
          ) : (
            <PriceDisplay price={originalPrice} salePrice={isOnSale ? price : undefined} size="sm" />
          )}
        </div>

        {/* Stock */}
        <div className="mt-1">
          <StockBadge inventory={product.inventory} />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Buttons */}
        {(isVariable || canPurchase) && (
          <div className="mt-4 flex gap-2">
            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={cn(
                'flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-300',
                added
                  ? 'border-green-500 bg-green-500 text-white shadow-sm'
                  : 'border-border/80 bg-background text-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-primary'
              )}
            >
              {added ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {tp('addedToCart')}
                </>
              ) : adding ? (
                <LoadingSpinner size="sm" className="border-muted-foreground/30 border-t-foreground" />
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {isVariable ? tProd('selectOptions') : tp('addToCart')}
                </>
              )}
            </button>

            {/* Buy Now */}
            <button
              onClick={handleBuyNow}
              disabled={adding}
              className="flex min-h-10 flex-1 items-center justify-center rounded-xl bg-accent px-3 py-2.5 text-xs font-semibold text-accent-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-md disabled:opacity-50"
            >
              {tProd('buyNow')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
