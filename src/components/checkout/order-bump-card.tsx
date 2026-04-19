'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { OrderBump, RecommendationVariant } from 'brainerce';
import { formatPrice, getVariantOptions } from 'brainerce';
import { useStoreInfo } from '@/providers/store-provider';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface OrderBumpCardProps {
  bump: OrderBump;
  isAdded: boolean;
  onToggle: (bumpId: string, add: boolean, variantId?: string) => void;
  loading: boolean;
  className?: string;
}

export function OrderBumpCard({ bump, isAdded, onToggle, loading, className }: OrderBumpCardProps) {
  const { storeInfo } = useStoreInfo();
  const t = useTranslations('checkout');
  const currency = storeInfo?.currency || 'USD';
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const product = bump.bumpProduct;
  const variants = product.variants;
  const requiresSelection = bump.requiresVariantSelection && variants && variants.length > 0;

  // Build attribute groups from variants for pill selector
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

  // Track selected attributes
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  // Find matching variant based on selected attributes
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

  // Update selectedVariantId when variant match changes
  const effectiveVariantId = selectedVariant?.id ?? selectedVariantId;

  function handleAttrSelect(attrName: string, value: string) {
    const next = { ...selectedAttrs, [attrName]: value };
    setSelectedAttrs(next);
    // Find matching variant with new selection
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

  // Compute display price
  const { displayOriginal, displayDiscounted } = useMemo(() => {
    let effectivePrice: number;
    if (selectedVariant) {
      const vSale = selectedVariant.salePrice ? parseFloat(selectedVariant.salePrice) : null;
      const vPrice = selectedVariant.price ? parseFloat(selectedVariant.price) : null;
      effectivePrice = vSale ?? vPrice ?? parseFloat(bump.originalPrice);
    } else {
      effectivePrice = parseFloat(bump.originalPrice);
    }

    let discounted: number | null = null;
    if (bump.discountType && bump.discountValue) {
      const dv = parseFloat(bump.discountValue);
      if (bump.discountType === 'PERCENTAGE') {
        discounted = effectivePrice * (1 - dv / 100);
      } else {
        discounted = Math.max(0, effectivePrice - dv);
      }
    }

    return { displayOriginal: effectivePrice, displayDiscounted: discounted };
  }, [selectedVariant, bump.originalPrice, bump.discountType, bump.discountValue]);

  // Check if selected variant is out of stock
  const isOos =
    selectedVariant?.inventory?.trackingMode !== 'NOT_TRACKED' &&
    selectedVariant?.inventory?.available != null &&
    selectedVariant.inventory.available <= 0;

  // Locked variant label
  const lockedLabel =
    bump.lockedVariant?.name ??
    (bump.lockedVariant?.attributes
      ? Object.values(bump.lockedVariant.attributes).join(' / ')
      : null);

  const firstImage = product.images?.[0];
  const imageUrl = firstImage
    ? typeof firstImage === 'string'
      ? firstImage
      : firstImage.url
    : null;

  const canToggle = !requiresSelection || !!effectiveVariantId;

  return (
    <div
      className={cn(
        'border-border hover:border-primary/50 rounded-lg border p-3 transition-colors',
        isAdded && 'border-primary bg-primary/5',
        loading && 'pointer-events-none opacity-60',
        className
      )}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={isAdded}
          onChange={() => {
            if (canToggle) {
              onToggle(bump.id, !isAdded, effectiveVariantId ?? undefined);
            }
          }}
          disabled={loading || !canToggle || isOos}
          className="mt-1 h-4 w-4 shrink-0 rounded"
        />

        {/* Image */}
        {imageUrl && (
          <div className="bg-muted relative h-10 w-10 shrink-0 overflow-hidden rounded">
            <Image src={imageUrl} alt={product.name} fill sizes="40px" className="object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-medium">{bump.title}</p>
          {bump.description && (
            <p className="text-muted-foreground mt-0.5 text-xs">{bump.description}</p>
          )}

          {/* Locked variant label */}
          {lockedLabel && <p className="text-muted-foreground mt-0.5 text-xs">{lockedLabel}</p>}

          {/* Price */}
          <div className="mt-1 flex items-center gap-2">
            {displayDiscounted != null ? (
              <>
                <span className="text-muted-foreground text-xs line-through">
                  {formatPrice(displayOriginal, { currency }) as string}
                </span>
                <span className="text-foreground text-sm font-semibold">
                  {formatPrice(displayDiscounted, { currency }) as string}
                </span>
              </>
            ) : (
              <span className="text-foreground text-sm font-semibold">
                {formatPrice(displayOriginal, { currency }) as string}
              </span>
            )}
            {requiresSelection && !effectiveVariantId && (
              <span className="text-muted-foreground text-xs">
                {t('selectOptions') || 'Select options'}
              </span>
            )}
          </div>
        </div>
      </label>

      {/* Compact variant selector */}
      {requiresSelection && !isAdded && (
        <div className="ms-7 mt-2 space-y-1.5">
          {attributeGroups.map((group) => (
            <div key={group.name} className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-xs">{group.name}:</span>
              {group.values.map((value) => {
                const isSelected = selectedAttrs[group.name] === value;
                // Check if this value leads to any available variant
                const variantForValue = variants?.find((v) => {
                  const opts = getVariantOptions(v as any);
                  const matchesValue = opts.some((o) => o.name === group.name && o.value === value);
                  if (!matchesValue) return false;
                  // Check other selected attrs
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
