'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { Product, ProductRecommendation, ProductVariant } from 'brainerce';
import { formatPrice, getVariantOptions } from 'brainerce';
import { useCart } from '@/providers/store-provider';
import { useStoreInfo } from '@/providers/store-provider';
import { useTranslations } from '@/lib/translations';
import { useAttributeLabel } from '@/lib/attribute-i18n';
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

function getVariantEffectivePrice(variant: ProductVariant): number {
  const sale = variant.salePrice ? parseFloat(variant.salePrice) : null;
  const base = variant.price ? parseFloat(variant.price) : 0;
  return sale != null && sale < base ? sale : base;
}

function ProductThumb({
  name,
  imageUrl,
  price,
  currency,
  checked,
  onToggle,
}: {
  name: string;
  imageUrl: string | null;
  price: number;
  currency: string;
  checked: boolean;
  onToggle?: () => void;
}) {
  return (
    <label
      className={cn(
        'border-border bg-background relative flex cursor-pointer flex-col items-center rounded-lg border p-3 transition-all',
        checked ? 'ring-primary ring-2' : 'opacity-60'
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

interface BundleItem {
  key: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  type: string;
  basePrice: number;
  isCurrent: boolean;
}

export function FrequentlyBoughtTogether({
  items,
  currentProduct,
  className,
}: FrequentlyBoughtTogetherProps) {
  const { storeInfo } = useStoreInfo();
  const { refreshCart } = useCart();
  const t = useTranslations('productDetail');
  const attrLabel = useAttributeLabel();

  const currency = storeInfo?.currency || 'USD';

  // Only show up to 3 cross-sells
  const crossSells = useMemo(() => items.slice(0, 3), [items]);
  const crossSellIds = useMemo(() => crossSells.map((i) => i.id).join(','), [crossSells]);

  const currentImage = currentProduct.images?.[0];
  const currentImageUrl = currentImage
    ? typeof currentImage === 'string'
      ? currentImage
      : currentImage.url
    : null;

  // Variants for variable cross-sells are NOT included in the recommendations
  // payload, so we lazily fetch the full product to populate the size selector.
  const [fetchedVariants, setFetchedVariants] = useState<Map<string, ProductVariant[]>>(new Map());
  const fetchedRef = useRef<Set<string>>(new Set());

  // Selected variant id per bundle item (keyed by item key)
  const [chosenVariantId, setChosenVariantId] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    const cv = currentProduct.variants;
    if (currentProduct.type === 'VARIABLE' && cv && cv.length > 0) {
      map.set(currentProduct.id, cv[0].id);
    }
    return map;
  });

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set([currentProduct.id, ...crossSells.map((i) => i.id)])
  );
  const [adding, setAdding] = useState(false);
  // Ids of variable cross-sells whose variants are still being fetched.
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const toFetch = crossSells.filter(
      (i) => i.type === 'VARIABLE' && !fetchedRef.current.has(i.id)
    );
    if (toFetch.length === 0) return;

    let cancelled = false;
    setLoadingIds((prev) => {
      const next = new Set(prev);
      for (const item of toFetch) next.add(item.id);
      return next;
    });

    (async () => {
      const { getClient } = await import('@/lib/brainerce');
      const client = getClient();
      for (const item of toFetch) {
        fetchedRef.current.add(item.id);
        try {
          const full = await client.getProduct(item.id);
          const variants = full?.variants ?? [];
          if (cancelled || variants.length === 0) continue;
          setFetchedVariants((prev) => new Map(prev).set(item.id, variants));
          setChosenVariantId((prev) => {
            if (prev.has(item.id)) return prev;
            return new Map(prev).set(item.id, variants[0].id);
          });
        } catch {
          // Fetch failed — item falls back to no selector (added without a variant).
        } finally {
          if (!cancelled) {
            setLoadingIds((prev) => {
              const next = new Set(prev);
              next.delete(item.id);
              return next;
            });
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [crossSellIds, crossSells]);

  const bundleItems = useMemo<BundleItem[]>(() => {
    const current: BundleItem = {
      key: currentProduct.id,
      productId: currentProduct.id,
      name: currentProduct.name,
      imageUrl: currentImageUrl,
      type: currentProduct.type,
      basePrice: getEffectivePrice(currentProduct),
      isCurrent: true,
    };
    const others: BundleItem[] = crossSells.map((item) => {
      const img = item.images?.[0];
      const imgUrl = img ? (typeof img === 'string' ? img : img.url) : null;
      return {
        key: item.id,
        productId: item.id,
        name: item.name,
        imageUrl: imgUrl,
        type: item.type,
        basePrice: getEffectivePrice(item),
        isCurrent: false,
      };
    });
    return [current, ...others];
  }, [currentProduct, currentImageUrl, crossSells]);

  function getItemVariants(item: BundleItem): ProductVariant[] {
    if (item.isCurrent) {
      return (currentProduct.type === 'VARIABLE' ? currentProduct.variants : null) ?? [];
    }
    return fetchedVariants.get(item.key) ?? [];
  }

  function getChosenVariant(item: BundleItem): ProductVariant | null {
    const variants = getItemVariants(item);
    if (variants.length === 0) return null;
    const id = chosenVariantId.get(item.key);
    return variants.find((v) => v.id === id) ?? variants[0];
  }

  function getDisplayPrice(item: BundleItem): number {
    const chosen = getChosenVariant(item);
    return chosen ? getVariantEffectivePrice(chosen) : item.basePrice;
  }

  function variantOptionLabel(variant: ProductVariant): string {
    const opts = getVariantOptions(variant);
    // Price is shown on the thumbnail (and updates on selection), so keep the
    // option label to just the variant attributes to avoid truncation.
    return opts.map((o) => attrLabel(o.value)).join(' · ') || variant.name || '';
  }

  // All hooks/derived values above the early returns to keep hook order stable.
  if (!storeInfo?.upsell?.frequentlyBoughtTogetherEnabled) return null;
  if (crossSells.length === 0) return null;

  const totalPrice = bundleItems
    .filter((item) => selected.has(item.key))
    .reduce((sum, item) => sum + getDisplayPrice(item), 0);

  // Block the add button while any selected variable item's variants are loading,
  // so we never add a variable product before its variant can be chosen.
  const variantsLoading = bundleItems.some(
    (item) => selected.has(item.key) && loadingIds.has(item.key)
  );

  const toggleItem = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const setChosen = (key: string, variantId: string) => {
    setChosenVariantId((prev) => new Map(prev).set(key, variantId));
  };

  async function handleAddAll() {
    if (adding || selected.size === 0 || variantsLoading) return;
    try {
      setAdding(true);
      const { getClient } = await import('@/lib/brainerce');
      const client = getClient();
      const itemsToAdd = bundleItems.filter((item) => selected.has(item.key));
      for (const item of itemsToAdd) {
        const chosen = getChosenVariant(item);
        try {
          await client.smartAddToCart({
            productId: item.productId,
            variantId: chosen?.id,
            quantity: 1,
          });
        } catch (err) {
          // One item failing shouldn't abort the rest of the bundle.
          console.error(`Failed to add "${item.name}" to cart:`, err);
        }
      }
      await refreshCart();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className={cn('border-border rounded-lg border p-6', className)}>
      <h2 className="text-foreground mb-4 text-xl font-semibold">
        {t('frequentlyBoughtTogether')}
      </h2>

      <div className="flex flex-wrap items-start gap-3">
        {bundleItems.map((item, idx) => {
          const variants = getItemVariants(item);
          const chosen = getChosenVariant(item);
          return (
            <div key={item.key} className="flex items-start gap-3">
              {idx > 0 && (
                <span className="text-muted-foreground self-center text-lg font-light">+</span>
              )}
              <div className="flex w-28 flex-col items-center gap-2">
                <ProductThumb
                  name={item.name}
                  imageUrl={item.imageUrl}
                  price={getDisplayPrice(item)}
                  currency={currency}
                  checked={selected.has(item.key)}
                  onToggle={() => toggleItem(item.key)}
                />
                {variants.length > 1 && (
                  <div className="relative w-full">
                    <select
                      aria-label={t('selectVariant')}
                      value={chosen?.id ?? ''}
                      onChange={(e) => setChosen(item.key, e.target.value)}
                      className="border-border bg-background text-foreground hover:border-primary focus:border-primary focus:ring-primary/20 w-full cursor-pointer appearance-none rounded-lg border py-1.5 pe-7 ps-2.5 text-xs font-medium shadow-sm transition-colors focus:outline-none focus:ring-2"
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {variantOptionLabel(v)}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="text-muted-foreground pointer-events-none absolute inset-y-0 end-2 my-auto h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 8l4 4 4-4"
                      />
                    </svg>
                  </div>
                )}
              </div>
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
          disabled={adding || selected.size === 0 || variantsLoading}
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
