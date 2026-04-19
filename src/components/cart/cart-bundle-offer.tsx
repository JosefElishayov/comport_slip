'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { CartBundleOffer as CartBundleOfferType } from 'brainerce';
import { formatPrice, getVariantOptions } from 'brainerce';
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
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const product = offer.bundleProduct;
  const variants = product.variants;
  const requiresSelection = offer.requiresVariantSelection && variants && variants.length > 0;

  // Build attribute groups from variants
  const attributeGroups = useMemo(() => {
    if (!requiresSelection || !variants) return [];
    const groups = new Map<string, Set<string>>();
    for (const v of variants) {
      const opts = getVariantOptions(v as any);
      for (const opt of opts) {
        if (!groups.has(opt.name)) groups.set(opt.name, new Set());
        groups.get(opt.name)!.add(opt.value);
      }
    }
    return Array.from(groups.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [requiresSelection, variants]);

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  const selectedVariant = useMemo(() => {
    if (!requiresSelection || !variants) return null;
    return (
      variants.find((v) => {
        const opts = getVariantOptions(v as any);
        return attributeGroups.every((group) => {
          const opt = opts.find((o) => o.name === group.name);
          return opt && selectedAttrs[group.name] === opt.value;
        });
      }) ?? null
    );
  }, [requiresSelection, variants, selectedAttrs, attributeGroups]);

  const effectiveVariantId = selectedVariant?.id ?? selectedVariantId;

  function handleAttrSelect(attrName: string, value: string) {
    const next = { ...selectedAttrs, [attrName]: value };
    setSelectedAttrs(next);
    if (variants) {
      const match = variants.find((v) => {
        const opts = getVariantOptions(v as any);
        return attributeGroups.every((group) => {
          const opt = opts.find((o) => o.name === group.name);
          return opt && next[group.name] === opt.value;
        });
      });
      setSelectedVariantId(match?.id ?? null);
    }
  }

  // Compute display prices
  const { displayOriginal, displayDiscounted, discountLabel } = useMemo(() => {
    let effectivePrice: number;
    if (selectedVariant) {
      const vSale = selectedVariant.salePrice ? parseFloat(selectedVariant.salePrice) : null;
      const vPrice = selectedVariant.price ? parseFloat(selectedVariant.price) : null;
      effectivePrice = vSale ?? vPrice ?? parseFloat(offer.originalPrice);
    } else {
      effectivePrice = parseFloat(offer.originalPrice);
    }

    let discounted: number;
    if (offer.discountType === 'PERCENTAGE') {
      discounted = effectivePrice * (1 - parseFloat(offer.discountValue) / 100);
    } else {
      discounted = Math.max(0, effectivePrice - parseFloat(offer.discountValue));
    }

    const label =
      offer.discountType === 'PERCENTAGE'
        ? `${offer.discountValue}%`
        : (formatPrice(parseFloat(offer.discountValue), { currency }) as string);

    return { displayOriginal: effectivePrice, displayDiscounted: discounted, discountLabel: label };
  }, [selectedVariant, offer.originalPrice, offer.discountType, offer.discountValue, currency]);

  const isOos =
    selectedVariant?.inventory?.trackingMode !== 'NOT_TRACKED' &&
    selectedVariant?.inventory?.available != null &&
    selectedVariant.inventory.available <= 0;

  const lockedLabel =
    offer.lockedVariant?.name ??
    (offer.lockedVariant?.attributes
      ? Object.values(offer.lockedVariant.attributes).join(' / ')
      : null);

  const firstImage = product.images?.[0];
  const imageUrl = firstImage
    ? typeof firstImage === 'string'
      ? firstImage
      : firstImage.url
    : null;

  const canAdd = !requiresSelection || !!effectiveVariantId;

  async function handleAdd() {
    if (adding || !canAdd || isOos) return;
    try {
      setAdding(true);
      const { getClient } = await import('@/lib/brainerce');
      const client = getClient();
      await client.addBundleToCart(cartId, offer.id, effectiveVariantId ?? undefined);
      onAdd();
    } catch (err) {
      console.error('Failed to add bundle item:', err);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className={cn('bg-background border-border rounded-lg border p-4', className)}>
      <div className="flex items-center gap-4">
        {/* Product image */}
        <div className="bg-muted relative h-16 w-16 flex-shrink-0 overflow-hidden rounded">
          {imageUrl ? (
            <Image src={imageUrl} alt={product.name} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <p className="text-foreground text-sm font-medium">{offer.name}</p>
          {offer.description && (
            <p className="text-muted-foreground mt-0.5 text-xs">{offer.description}</p>
          )}
          {lockedLabel && <p className="text-muted-foreground mt-0.5 text-xs">{lockedLabel}</p>}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-muted-foreground text-sm line-through">
              {formatPrice(displayOriginal, { currency }) as string}
            </span>
            <span className="text-foreground text-sm font-semibold">
              {formatPrice(displayDiscounted, { currency }) as string}
            </span>
            <span className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 text-xs font-medium">
              -{discountLabel}
            </span>
          </div>
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !canAdd || isOos}
          className={cn(
            'bg-primary text-primary-foreground flex-shrink-0 rounded px-4 py-2 text-xs font-medium transition-opacity hover:opacity-90',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {adding
            ? t('addingBundle')
            : requiresSelection && !canAdd
              ? t('selectOptions') || 'Select options'
              : t('addBundleItem')}
        </button>
      </div>

      {/* Compact variant selector */}
      {requiresSelection && (
        <div className="mt-3 space-y-1.5 ps-20">
          {attributeGroups.map((group) => (
            <div key={group.name} className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-xs">{group.name}:</span>
              {group.values.map((value) => {
                const isSelected = selectedAttrs[group.name] === value;
                const variantForValue = variants?.find((v) => {
                  const opts = getVariantOptions(v as any);
                  const matchesValue = opts.some((o) => o.name === group.name && o.value === value);
                  if (!matchesValue) return false;
                  return Object.entries(selectedAttrs).every(([k, sv]) => {
                    if (k === group.name) return true;
                    return opts.some((o) => o.name === k && o.value === sv);
                  });
                });
                const isVariantOos =
                  variantForValue?.inventory?.trackingMode !== 'NOT_TRACKED' &&
                  variantForValue?.inventory?.available != null &&
                  variantForValue.inventory.available <= 0;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleAttrSelect(group.name, value)}
                    disabled={isVariantOos}
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-foreground hover:border-primary/50',
                      isVariantOos && 'cursor-not-allowed line-through opacity-40'
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          ))}
          {isOos && effectiveVariantId && (
            <p className="text-destructive text-xs">{t('outOfStock') || 'Out of stock'}</p>
          )}
        </div>
      )}
    </div>
  );
}
