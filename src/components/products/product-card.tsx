'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
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
import { ProductShareButton } from '@/components/shared/product-share-button';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const t = useTranslations('common');
  const tp = useTranslations('productDetail');
  const tProd = useTranslations('products');
  const router = useRouter();
  const { refreshCart, openCartDrawer } = useCart();
  const { storeInfo } = useStoreInfo();
  const currency = storeInfo?.currency || 'ILS';
  const imageRef = useRef<HTMLDivElement>(null);
  const { price, originalPrice, isOnSale } = getProductPriceInfo(product);
  const mainImage = product.images?.[0];
  const imageUrl = mainImage?.url || null;
  const slug = product.slug || product.id;
  const isVariable = product.type === 'VARIABLE';

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const images = product.images ?? [];
  const [imgIndex, setImgIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCycling = useCallback(() => {
    if (images.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setImgIndex((i) => (i + 1) % images.length);
    }, 1800);
  }, [images.length]);

  const stopCycling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setImgIndex(0);
  }, []);

  // Build attribute groups from variants
  const attributeGroups = useMemo<Record<string, string[]>>(() => {
    if (!isVariable || !product.variants?.length) return {};
    const groups: Record<string, string[]> = {};
    for (const variant of product.variants) {
      const attrs = (variant.attributes as Record<string, string>) || {};
      for (const [key, value] of Object.entries(attrs)) {
        if (!groups[key]) groups[key] = [];
        if (!groups[key].includes(value)) groups[key].push(value);
      }
    }
    return groups;
  }, [isVariable, product.variants]);

  const attrKeys = Object.keys(attributeGroups);

  // Find the variant that matches all selected attributes
  const selectedVariant = useMemo(() => {
    if (!isVariable || !product.variants?.length || attrKeys.length === 0) return null;
    if (!attrKeys.every((k) => selectedAttributes[k])) return null;
    return (
      product.variants.find((v) => {
        const attrs = (v.attributes as Record<string, string>) || {};
        return attrKeys.every((k) => attrs[k] === selectedAttributes[k]);
      }) ?? null
    );
  }, [selectedAttributes, attrKeys, isVariable, product.variants]);

  const allAttrsSelected = attrKeys.length > 0 && attrKeys.every((k) => selectedAttributes[k]);
  const variantCanPurchase = selectedVariant
    ? selectedVariant.inventory?.canPurchase !== false
    : false;
  const simpleCanPurchase = product.inventory?.canPurchase !== false;

  // Variant price display
  const variantPrice = selectedVariant
    ? getVariantPrice(selectedVariant, product.basePrice)
    : null;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isVariable) {
      if (!selectedVariant || !variantCanPurchase) return;
      try {
        setAdding(true);
        if (imageRef.current) flyToCart(imageRef.current);
        const { getClient } = await import('@/lib/brainerce');
        const client = getClient();
        await client.smartAddToCart({ productId: product.id, variantId: selectedVariant.id, quantity: 1 });
        await refreshCart();
        setAdded(true);
        openCartDrawer();
        setTimeout(() => setAdded(false), 2000);
      } catch (err) {
        console.error('Failed to add to cart:', err);
      } finally {
        setAdding(false);
      }
      return;
    }

    if (adding || !simpleCanPurchase) return;
    try {
      setAdding(true);
      if (imageRef.current) flyToCart(imageRef.current);
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
    if (!simpleCanPurchase) return;
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

  function selectAttr(e: React.MouseEvent, key: string, value: string) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedAttributes((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div
      className={cn(
        'product-card-comfort group relative flex flex-col overflow-hidden bg-white',
        className
      )}
    >
      {/* Image */}
      <Link
        href={`/products/${slug}`}
        className="block"
        onMouseEnter={startCycling}
        onMouseLeave={stopCycling}
      >
        <div ref={imageRef} className="product-card-image relative aspect-square overflow-hidden bg-[#f5f4f0]">
          {images.length > 0 ? (
            <>
              {images.map((img, i) => (
                <Image
                  key={img.url}
                  src={img.url}
                  alt={img.alt || product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className={cn(
                    'object-cover transition-opacity duration-700',
                    i === imgIndex ? 'opacity-100' : 'opacity-0'
                  )}
                />
              ))}
              {/* Dots */}
              {images.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'block h-1 rounded-full transition-all duration-300',
                        i === imgIndex ? 'w-4 bg-white' : 'w-1 bg-white/50'
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute start-3 top-3 z-10 flex flex-col gap-1.5">
            {product.categories && product.categories.length > 0 &&
              product.categories.slice(0, 1).map((cat) => (
                <span key={cat.id} className="border-border/70 bg-background/90 text-foreground rounded-full border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-md">
                  {cat.name}
                </span>
              ))
            }
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
      <div className="relative flex flex-1 flex-col p-3">
        {/* Brand */}
        {product.brands && product.brands.length > 0 && (
          <Link href={`/products/${slug}`}>
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary/70 transition-colors hover:text-primary">
              {product.brands[0].name}
            </p>
          </Link>
        )}

        {/* Name + description snippet */}
        <Link href={`/products/${slug}`}>
          <h3 className="product-card-title text-foreground line-clamp-2 text-sm font-bold leading-5 transition-colors duration-300 group-hover:text-primary">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
              {product.description.replace(/<[^>]*>/g, '').trim()}
            </p>
          )}
        </Link>

        {/* Price */}
        <div className="mt-2">
          {isVariable ? (
            variantPrice != null ? (
              <span className="text-foreground text-sm font-semibold">
                {formatPrice(variantPrice, { currency }) as string}
              </span>
            ) : (
              (() => {
                const variants = product.variants ?? [];
                const prices = variants.map((v) => getVariantPrice(v, product.basePrice));
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                return (
                  <span className="text-foreground text-sm font-semibold">
                    {min === max
                      ? (formatPrice(min, { currency }) as string)
                      : `${formatPrice(min, { currency })} – ${formatPrice(max, { currency })}`}
                  </span>
                );
              })()
            )
          ) : (
            <PriceDisplay price={originalPrice} salePrice={isOnSale ? price : undefined} size="sm" />
          )}
        </div>

        {/* Stock */}
        {!isVariable && (
          <div className="mt-1">
            <StockBadge inventory={product.inventory} />
          </div>
        )}

        {/* Variant selectors */}
        {isVariable && attrKeys.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {attrKeys.map((attrName) => (
              <div key={attrName}>
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">{attrName}</p>
                <div className="flex flex-wrap gap-1">
                  {attributeGroups[attrName].map((value) => {
                    const isSelected = selectedAttributes[attrName] === value;
                    // Check if this value leads to any available variant
                    const isAvailable = product.variants?.some((v) => {
                      const attrs = (v.attributes as Record<string, string>) || {};
                      return attrs[attrName] === value && v.inventory?.canPurchase !== false;
                    });
                    return (
                      <button
                        key={value}
                        onClick={(e) => selectAttr(e, attrName, value)}
                        className={cn(
                          'rounded border px-2 py-0.5 text-xs font-medium transition-all',
                          isSelected
                            ? 'border-accent bg-accent text-accent-foreground'
                            : isAvailable === false
                              ? 'border-border/40 text-muted-foreground line-through opacity-50 cursor-not-allowed'
                              : 'border-border bg-background text-foreground hover:border-accent/60'
                        )}
                        disabled={isAvailable === false}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Action Buttons */}
        <div className="mt-3 flex gap-2">
          <ProductShareButton
            path={`/products/${slug}`}
            title={product.name}
            shareText={product.description || product.name}
            imageUrl={imageUrl}
            iconOnly
          />

          {isVariable ? (
            <button
              onClick={handleAddToCart}
              disabled={adding || !allAttrsSelected || !variantCanPurchase}
              className={cn(
                'flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-300',
                added
                  ? 'bg-green-500 text-white'
                  : allAttrsSelected && variantCanPurchase
                    ? 'bg-accent text-accent-foreground hover:-translate-y-0.5 hover:brightness-110 hover:shadow-md'
                    : allAttrsSelected && !variantCanPurchase
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'border border-border/80 bg-background text-foreground cursor-not-allowed opacity-60'
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
                <LoadingSpinner size="sm" />
              ) : allAttrsSelected && !variantCanPurchase ? (
                tProd('outOfStock') || 'אזל מהמלאי'
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {tp('addToCart')}
                </>
              )}
            </button>
          ) : simpleCanPurchase ? (
            <>
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className={cn(
                  'flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-300',
                  added
                    ? 'border-green-500 bg-green-500 text-white'
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
                    {tp('addToCart')}
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={adding}
                className="flex min-h-10 flex-1 items-center justify-center rounded-xl bg-accent px-3 py-2.5 text-xs font-semibold text-accent-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-md disabled:opacity-50"
              >
                {tProd('buyNow')}
              </button>
            </>
          ) : (
            <button
              disabled
              className="flex min-h-10 flex-1 items-center justify-center rounded-xl border border-border/60 bg-muted px-3 py-2.5 text-xs font-semibold text-muted-foreground cursor-not-allowed"
            >
              {tProd('outOfStock') || 'אזל מהמלאי'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
