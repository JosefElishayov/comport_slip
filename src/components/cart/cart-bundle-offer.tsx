'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type {
  CartBundleOffer as CartBundleOfferType,
  Product,
  ProductVariant,
} from 'brainerce';
import { formatPrice } from 'brainerce';
import { useStoreInfo } from '@/providers/store-provider';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { VariantSelector } from '@/components/products/variant-selector';

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
  const [variableProducts, setVariableProducts] = useState<Record<string, Product>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariant>>({});

  const variableOffered = offer.offeredProducts.filter((p) => p.type === 'VARIABLE');

  useEffect(() => {
    if (variableOffered.length === 0) return;
    let cancelled = false;
    (async () => {
      const { getClient } = await import('@/lib/brainerce');
      const client = getClient();
      const results = await Promise.all(
        variableOffered.map(async (p) => {
          try {
            return await client.getProduct(p.id);
          } catch (err) {
            console.error('Failed to load variable bundle product:', p.id, err);
            return null;
          }
        }),
      );
      if (cancelled) return;
      const nextProducts: Record<string, Product> = {};
      const nextVariants: Record<string, ProductVariant> = {};
      results.forEach((full, i) => {
        if (!full) return;
        const id = variableOffered[i].id;
        nextProducts[id] = full;
        const firstAvailable =
          full.variants?.find((v) => v.inventory?.canPurchase !== false) ||
          full.variants?.[0];
        if (firstAvailable) nextVariants[id] = firstAvailable;
      });
      setVariableProducts(nextProducts);
      setSelectedVariants((prev) => ({ ...prev, ...nextVariants }));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer.id]);

  const discountLabel =
    offer.discountType === 'PERCENTAGE'
      ? `${offer.discountValue}%`
      : (formatPrice(parseFloat(offer.discountValue), { currency }) as string);

  const missingSelection = variableOffered.some((p) => !selectedVariants[p.id]);

  const discountPct =
    offer.discountType === 'PERCENTAGE' ? parseFloat(offer.discountValue) || 0 : 0;

  function effectiveLinePrices(
    product: CartBundleOfferType['offeredProducts'][number],
  ): { original: number; discounted: number } {
    const offerOriginal = parseFloat(product.originalPrice) || 0;
    const offerDiscounted = parseFloat(product.discountedPrice) || 0;

    if (offerOriginal > 0) {
      return { original: offerOriginal, discounted: offerDiscounted };
    }

    // Parent basePrice is 0 (variable product) — fall back to selected variant price
    const variant = selectedVariants[product.id];
    if (!variant) return { original: 0, discounted: 0 };
    const base = parseFloat(variant.price) || 0;
    const sale = variant.salePrice ? parseFloat(variant.salePrice) : null;
    const original = sale != null && sale < base ? sale : base;
    const discounted =
      offer.discountType === 'PERCENTAGE' ? original * (1 - discountPct / 100) : original;
    return { original, discounted };
  }

  const computedTotals = offer.offeredProducts.reduce(
    (acc, p) => {
      const { original, discounted } = effectiveLinePrices(p);
      acc.original += original;
      acc.discounted += discounted;
      return acc;
    },
    { original: 0, discounted: 0 },
  );

  // For FIXED_AMOUNT, subtract the bundle-level discount once at the total
  if (offer.discountType === 'FIXED_AMOUNT') {
    const fixed = parseFloat(offer.discountValue) || 0;
    computedTotals.discounted = Math.max(0, computedTotals.original - fixed);
  }

  const offerTotalOriginal = parseFloat(offer.totalOriginalPrice) || 0;
  const totals =
    offerTotalOriginal > 0
      ? {
          original: offerTotalOriginal,
          discounted: parseFloat(offer.totalDiscountedPrice) || 0,
        }
      : computedTotals;

  async function handleAdd() {
    if (adding || missingSelection) return;
    try {
      setAdding(true);
      const { getClient } = await import('@/lib/brainerce');
      const client = getClient();
      const variantSelections: Record<string, string> = {};
      for (const p of variableOffered) {
        const v = selectedVariants[p.id];
        if (v) variantSelections[p.id] = v.id;
      }
      await client.addBundleToCart(
        cartId,
        offer.id,
        Object.keys(variantSelections).length > 0 ? variantSelections : undefined,
      );
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
      <div className="mb-3 space-y-3">
        {offer.offeredProducts.map((product) => {
          const imageUrl = product.images?.[0]?.url ?? null;
          const fullProduct = variableProducts[product.id];
          const selectedVariant = selectedVariants[product.id] ?? null;
          const { original: lineOriginal, discounted: lineDiscounted } =
            effectiveLinePrices(product);
          const showOriginal = lineOriginal > 0 && lineDiscounted < lineOriginal;
          return (
            <div key={product.id} className="space-y-2">
              <div className="flex items-center gap-3">
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
                    {showOriginal && (
                      <span className="text-muted-foreground text-xs line-through">
                        {formatPrice(lineOriginal, { currency }) as string}
                      </span>
                    )}
                    <span className="text-foreground text-xs font-semibold">
                      {formatPrice(lineDiscounted, { currency }) as string}
                    </span>
                  </div>
                </div>
              </div>

              {product.type === 'VARIABLE' &&
                fullProduct &&
                fullProduct.variants &&
                fullProduct.variants.length > 0 && (
                  <div className="ps-[60px]">
                    <VariantSelector
                      product={fullProduct}
                      selectedVariant={selectedVariant}
                      onVariantChange={(v) =>
                        setSelectedVariants((prev) => ({ ...prev, [product.id]: v }))
                      }
                    />
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Footer: total + add button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          {totals.original > 0 && totals.discounted < totals.original && (
            <span className="text-muted-foreground text-xs line-through">
              {formatPrice(totals.original, { currency }) as string}
            </span>
          )}
          <span className="text-foreground ms-2 text-sm font-semibold">
            {formatPrice(totals.discounted, { currency }) as string}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || missingSelection}
          className={cn(
            'bg-primary text-primary-foreground flex-shrink-0 rounded px-4 py-2 text-xs font-medium transition-opacity hover:opacity-90',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {adding ? t('addingBundle') : missingSelection ? t('selectOptions') : t('addBundleItem')}
        </button>
      </div>
    </div>
  );
}
