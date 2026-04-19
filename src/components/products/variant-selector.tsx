'use client';

import { useMemo } from 'react';
import type { Product, ProductVariant } from 'brainerce';
import { getVariantOptions, getProductSwatches, formatPrice } from 'brainerce';
import type { InventoryInfo } from 'brainerce';
import { useStoreInfo } from '@/providers/store-provider';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface VariantSelectorProps {
  product: Product;
  selectedVariant: ProductVariant | null;
  onVariantChange: (variant: ProductVariant) => void;
  className?: string;
}

interface AttributeGroup {
  name: string;
  displayType: string;
  values: Array<{
    value: string;
    swatchColor?: string | null;
    swatchColor2?: string | null;
    swatchImageUrl?: string | null;
    variants: ProductVariant[];
  }>;
}

export function VariantSelector({
  product,
  selectedVariant,
  onVariantChange,
  className,
}: VariantSelectorProps) {
  const { storeInfo } = useStoreInfo();
  const t = useTranslations('productDetail');
  const currency = storeInfo?.currency || 'USD';
  const variants = useMemo(() => product.variants || [], [product.variants]);

  // Get swatch metadata from product attribute options
  const swatchData = useMemo(() => getProductSwatches(product), [product]);
  const swatchMap = useMemo(() => {
    const map = new Map<
      string,
      {
        displayType: string;
        options: Map<
          string,
          {
            swatchColor?: string | null;
            swatchColor2?: string | null;
            swatchImageUrl?: string | null;
          }
        >;
      }
    >();
    for (const attr of swatchData) {
      const optMap = new Map<
        string,
        {
          swatchColor?: string | null;
          swatchColor2?: string | null;
          swatchImageUrl?: string | null;
        }
      >();
      for (const opt of attr.options) {
        optMap.set(opt.name, {
          swatchColor: opt.swatchColor,
          swatchColor2: opt.swatchColor2,
          swatchImageUrl: opt.swatchImageUrl,
        });
      }
      map.set(attr.attributeName, { displayType: attr.displayType, options: optMap });
    }
    return map;
  }, [swatchData]);

  // Build attribute groups from variant data, enriched with swatch info
  const attributeGroups = useMemo<AttributeGroup[]>(() => {
    const groups = new Map<string, Map<string, ProductVariant[]>>();

    for (const variant of variants) {
      const options = getVariantOptions(variant);
      for (const { name, value } of options) {
        if (!groups.has(name)) {
          groups.set(name, new Map());
        }
        const valuesMap = groups.get(name)!;
        if (!valuesMap.has(value)) {
          valuesMap.set(value, []);
        }
        valuesMap.get(value)!.push(variant);
      }
    }

    return Array.from(groups.entries()).map(([name, valuesMap]) => {
      const attrSwatch = swatchMap.get(name);
      return {
        name,
        displayType: attrSwatch?.displayType || 'DROPDOWN',
        values: Array.from(valuesMap.entries()).map(([value, variantList]) => {
          const optSwatch = attrSwatch?.options.get(value);
          return {
            value,
            swatchColor: optSwatch?.swatchColor,
            swatchColor2: optSwatch?.swatchColor2,
            swatchImageUrl: optSwatch?.swatchImageUrl,
            variants: variantList,
          };
        }),
      };
    });
  }, [variants, swatchMap]);

  // Get currently selected attribute values
  const selectedOptions = useMemo(() => {
    if (!selectedVariant) return new Map<string, string>();
    const opts = getVariantOptions(selectedVariant);
    return new Map(opts.map(({ name, value }) => [name, value]));
  }, [selectedVariant]);

  // Find the variant that matches all selected attributes
  function findMatchingVariant(
    attributeName: string,
    newValue: string
  ): ProductVariant | undefined {
    const nextSelection = new Map(selectedOptions);
    nextSelection.set(attributeName, newValue);

    return variants.find((v) => {
      const opts = getVariantOptions(v);
      return Array.from(nextSelection.entries()).every(([name, value]) =>
        opts.some((o) => o.name === name && o.value === value)
      );
    });
  }

  if (attributeGroups.length === 0) return null;

  return (
    <div className={cn('space-y-4', className)}>
      {attributeGroups.map((group) => (
        <div key={group.name}>
          <label className="text-foreground mb-2 block text-sm font-medium">
            {group.name}
            {selectedOptions.get(group.name) && (
              <span className="text-muted-foreground ms-1 font-normal">
                : {selectedOptions.get(group.name)}
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {group.values.map(
              ({
                value,
                swatchColor,
                swatchColor2,
                swatchImageUrl,
                variants: matchingVariants,
              }) => {
                const isSelected = selectedOptions.get(group.name) === value;
                const matchedVariant = findMatchingVariant(group.name, value);
                const isAvailable = matchedVariant?.inventory?.canPurchase !== false;

                // Color swatch rendering
                if (group.displayType === 'COLOR_SWATCH' && swatchColor) {
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!isAvailable}
                      title={value}
                      onClick={() => {
                        const variant = matchedVariant || matchingVariants[0];
                        if (variant) onVariantChange(variant);
                      }}
                      className={cn(
                        'h-9 w-9 rounded-full border-2 transition-all',
                        isSelected
                          ? 'border-primary ring-primary/30 ring-2'
                          : isAvailable
                            ? 'border-border hover:border-primary'
                            : 'cursor-not-allowed opacity-40'
                      )}
                      style={{
                        background: swatchColor2
                          ? `linear-gradient(135deg, ${swatchColor} 50%, ${swatchColor2} 50%)`
                          : swatchColor,
                      }}
                    >
                      {!isAvailable && (
                        <span
                          className="bg-muted-foreground block h-full w-full rounded-full opacity-50"
                          style={{
                            backgroundImage:
                              'linear-gradient(135deg, transparent 45%, currentColor 45%, currentColor 55%, transparent 55%)',
                          }}
                        />
                      )}
                    </button>
                  );
                }

                // Image swatch rendering
                if (group.displayType === 'IMAGE_SWATCH' && swatchImageUrl) {
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!isAvailable}
                      title={value}
                      onClick={() => {
                        const variant = matchedVariant || matchingVariants[0];
                        if (variant) onVariantChange(variant);
                      }}
                      className={cn(
                        'h-10 w-10 overflow-hidden rounded-lg border-2 transition-all',
                        isSelected
                          ? 'border-primary ring-primary/30 ring-2'
                          : isAvailable
                            ? 'border-border hover:border-primary'
                            : 'cursor-not-allowed opacity-40'
                      )}
                    >
                      <img
                        src={swatchImageUrl}
                        alt={value}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                }

                // Default button rendering (BUTTON, DROPDOWN, or fallback)
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => {
                      const variant = matchedVariant || matchingVariants[0];
                      if (variant) onVariantChange(variant);
                    }}
                    className={cn(
                      'rounded border px-4 py-2 text-sm transition-colors',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isAvailable
                          ? 'border-border bg-background text-foreground hover:border-primary'
                          : 'border-border bg-muted text-muted-foreground cursor-not-allowed line-through opacity-50'
                    )}
                  >
                    {value}
                  </button>
                );
              }
            )}
          </div>
        </div>
      ))}

      {/* Variant-specific info */}
      {selectedVariant && (
        <div className="text-muted-foreground flex items-center gap-3 pt-1 text-sm">
          {selectedVariant.price && (
            <span>
              {
                formatPrice(selectedVariant.salePrice || selectedVariant.price, {
                  currency,
                }) as string
              }
            </span>
          )}
          <span>{getTranslatedStockStatus(selectedVariant.inventory, t)}</span>
        </div>
      )}
    </div>
  );
}

function getTranslatedStockStatus(
  inventory: InventoryInfo | null | undefined,
  t: (key: string) => string
): string {
  if (!inventory) return t('outOfStock');
  const { trackingMode, inStock, available } = inventory;
  if (trackingMode === 'DISABLED') return t('unavailable');
  if (!inStock) return t('outOfStock');
  if (trackingMode === 'UNLIMITED') return t('inStock');
  return t('availableInStock').replace('{available}', String(available));
}
