'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import type {
  Product,
  ProductVariant,
  ProductImage,
  ProductMetafield,
  DownloadFile,
} from 'brainerce';
import { getProductPriceInfo, getDescriptionContent } from 'brainerce';
import { useCart } from '@/providers/store-provider';
import { flyToCart } from '@/lib/fly-to-cart';
import { PriceDisplay } from '@/components/shared/price-display';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { VariantSelector } from '@/components/products/variant-selector';
import { StockBadge } from '@/components/products/stock-badge';
import { RecommendationSection } from '@/components/products/recommendation-section';
import { FrequentlyBoughtTogether } from '@/components/products/frequently-bought-together';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { sanitizeProductHtml } from '@/lib/sanitize-html';

/** Render a metafield value based on its type */
function MetafieldValue({ field }: { field: ProductMetafield }) {
  const tc = useTranslations('common');
  switch (field.type) {
    case 'IMAGE': {
      if (!field.value) return <span className="text-muted-foreground">-</span>;
      return (
        <img
          src={field.value}
          alt={field.definitionName}
          className="h-16 w-16 rounded object-cover"
        />
      );
    }
    case 'GALLERY': {
      let urls: string[] = [];
      try {
        const parsed = JSON.parse(field.value);
        urls = Array.isArray(parsed)
          ? parsed.filter((u: unknown) => typeof u === 'string' && u)
          : [];
      } catch {
        urls = field.value ? [field.value] : [];
      }
      if (urls.length === 0) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`${field.definitionName} ${i + 1}`}
              className="h-16 w-16 rounded object-cover"
            />
          ))}
        </div>
      );
    }
    case 'URL':
      return field.value ? (
        <a
          href={field.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary break-all hover:underline"
        >
          {field.value}
        </a>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    case 'COLOR':
      return field.value ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="border-border inline-block h-4 w-4 rounded-full border"
            style={{ backgroundColor: field.value }}
          />
          {field.value}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    case 'BOOLEAN':
      return <span>{field.value === 'true' ? tc('yes') : tc('no')}</span>;
    case 'DATE':
    case 'DATETIME': {
      if (!field.value) return <span className="text-muted-foreground">-</span>;
      try {
        const date = new Date(field.value);
        return (
          <span>
            {field.type === 'DATETIME' ? date.toLocaleString() : date.toLocaleDateString()}
          </span>
        );
      } catch {
        return <span>{field.value}</span>;
      }
    }
    default:
      return <span>{field.value || '-'}</span>;
  }
}

interface ProductClientSectionProps {
  product: Product;
}

export function ProductClientSection({ product: initialProduct }: ProductClientSectionProps) {
  const { refreshCart, openCartDrawer } = useCart();
  const mainImageRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('productDetail');

  const product = initialProduct;
  const recommendations = product?.recommendations ?? null;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedMessage, setAddedMessage] = useState(false);

  // Images list - switch main image when variant changes
  const images: ProductImage[] = useMemo(() => {
    return product?.images || [];
  }, [product]);

  // When variant changes, update selected image to variant image if available
  useEffect(() => {
    if (!selectedVariant?.image || !product) return;

    const variantImgUrl =
      typeof selectedVariant.image === 'string' ? selectedVariant.image : selectedVariant.image.url;

    // Find if variant image exists in product images
    const idx = images.findIndex((img) => img.url === variantImgUrl);
    if (idx >= 0) {
      setSelectedImageIndex(idx);
    } else {
      // Variant image not in product images - select index 0 as fallback
      setSelectedImageIndex(-1);
    }
  }, [selectedVariant, images, product]);

  // Determine which image to show
  const mainImageUrl = useMemo(() => {
    if (selectedImageIndex === -1 && selectedVariant?.image) {
      const img = selectedVariant.image;
      return typeof img === 'string' ? img : img.url;
    }
    return images[selectedImageIndex]?.url || null;
  }, [selectedImageIndex, selectedVariant, images]);

  // Price info - use variant price if selected, else product price
  const priceInfo = useMemo(() => {
    if (selectedVariant?.price) {
      const variantBase = parseFloat(selectedVariant.price);
      const variantSale = selectedVariant.salePrice ? parseFloat(selectedVariant.salePrice) : null;
      const variantEffective =
        variantSale != null && variantSale < variantBase ? variantSale : variantBase;

      // Overlay any product-level discount rule onto the variant price using the rule's ratio
      if (product.discount) {
        const ruleOriginal = parseFloat(product.discount.originalPrice) || 0;
        const ruleDiscounted = parseFloat(product.discount.discountedPrice) || 0;
        const ratio = ruleOriginal > 0 ? ruleDiscounted / ruleOriginal : 1;
        const discounted = variantEffective * ratio;
        const amount = Math.max(0, variantEffective - discounted);
        return {
          price: discounted,
          originalPrice: variantEffective,
          isOnSale: discounted < variantEffective,
          discountAmount: amount,
          discountPercent: variantEffective > 0 ? Math.round((amount / variantEffective) * 100) : 0,
        };
      }

      return {
        price: variantEffective,
        originalPrice: variantBase,
        isOnSale: variantEffective < variantBase,
        discountPercent:
          variantEffective < variantBase && variantBase > 0
            ? Math.round(((variantBase - variantEffective) / variantBase) * 100)
            : 0,
      };
    }
    return getProductPriceInfo(product);
  }, [product, selectedVariant]);

  // Inventory: use variant inventory if selected, else product inventory
  const inventory = selectedVariant?.inventory ?? product?.inventory ?? null;
  const canPurchase = inventory?.canPurchase !== false;

  // Description
  const description = useMemo(() => {
    return product ? getDescriptionContent(product) : null;
  }, [product]);

  async function handleAddToCart() {
    if (!product || addingToCart) return;

    try {
      setAddingToCart(true);

      // Start fly animation
      if (mainImageRef.current) {
        flyToCart(mainImageRef.current);
      }

      const { getClient } = await import('@/lib/brainerce');
      const client = getClient();
      await client.smartAddToCart({
        productId: product.id,
        variantId: selectedVariant?.id,
        quantity,
      });
      await refreshCart();
      setAddedMessage(true);
      openCartDrawer();
      setTimeout(() => setAddedMessage(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAddingToCart(false);
    }
  }

  const firstCategoryName = product.categories?.[0]?.name;

  return (
    <article className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <nav aria-label={t('breadcrumb')} className="text-muted-foreground mb-6 text-sm">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <a href="/" className="hover:text-foreground hover:underline">
              {t('home')}
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <a href="/products" className="hover:text-foreground hover:underline">
              {t('products')}
            </a>
          </li>
          {firstCategoryName && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <span>{firstCategoryName}</span>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground font-medium truncate max-w-[200px]">
            {product.name}
          </li>
        </ol>
      </nav>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div ref={mainImageRef} className="bg-secondary/30 relative aspect-square overflow-hidden rounded-2xl shadow-sm">
            {mainImageUrl ? (
              <Image
                src={mainImageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain"
                priority
              />
            ) : (
              <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
                <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={cn(
                    'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                    selectedImageIndex === idx
                      ? 'border-primary shadow-sm'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || `${product.name} ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Categories */}
          {product.categories && product.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          {/* Brand */}
          {(product as { brands?: Array<{ id: string; name: string }> }).brands &&
            (product as { brands: Array<{ id: string; name: string }> }).brands.length > 0 && (
              <div className="text-muted-foreground text-sm">
                {t('by')}{' '}
                <span className="text-foreground font-medium">
                  {(product as { brands: Array<{ id: string; name: string }> }).brands
                    .map((b) => b.name)
                    .join(', ')}
                </span>
              </div>
            )}

          {/* Title */}
          <h1 className="text-foreground text-3xl font-bold sm:text-4xl leading-tight">{product.name}</h1>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag, idx) => {
                  const name =
                    typeof tag === 'string'
                      ? tag
                      : (tag as { name?: string })?.name || '';
                  if (!name) return null;
                  return (
                    <span
                      key={`${name}-${idx}`}
                      className="border-border text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs"
                    >
                      #{name}
                    </span>
                  );
                })}
              </div>
            )}

          {/* Price */}
          <PriceDisplay
            price={priceInfo.originalPrice}
            salePrice={priceInfo.isOnSale ? priceInfo.price : undefined}
            size="lg"
          />

          {/* Stock / Digital badge */}
          {product.isDownloadable ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-950/30 dark:text-green-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {t('instantDownload')}
            </span>
          ) : (
            <StockBadge inventory={inventory} lowStockThreshold={5} />
          )}

          {/* Downloadable files info */}
          {product.isDownloadable && product.downloads && product.downloads.length > 0 && (
            <div className="bg-muted/50 rounded-lg border p-4">
              <p className="text-foreground mb-2 text-sm font-medium">
                {t('filesIncluded')} ({product.downloads.length})
              </p>
              <ul className="space-y-1.5">
                {product.downloads.map((file: DownloadFile) => (
                  <li
                    key={file.id}
                    className="text-muted-foreground flex items-center gap-2 text-sm"
                  >
                    <svg
                      className="h-4 w-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="truncate">{file.name}</span>
                    {file.size && (
                      <span className="flex-shrink-0 text-xs">
                        (
                        {file.size < 1024 * 1024
                          ? `${(file.size / 1024).toFixed(0)} KB`
                          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                        )
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Variant Selector */}
          {product.type === 'VARIABLE' && product.variants && product.variants.length > 0 && (
            <VariantSelector
              product={product}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
            />
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="border-border flex items-center rounded-xl border bg-secondary/30">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="text-foreground hover:bg-secondary px-4 py-3 transition-colors rounded-s-xl"
                aria-label={t('decreaseQuantity')}
              >
                -
              </button>
              <span className="text-foreground min-w-[3rem] px-4 py-3 text-center text-sm font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="text-foreground hover:bg-secondary px-4 py-3 transition-colors rounded-e-xl"
                aria-label={t('increaseQuantity')}
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canPurchase || addingToCart}
              className={cn(
                'flex-1 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all shadow-sm',
                canPurchase
                  ? 'bg-accent text-accent-foreground hover:brightness-110 hover:shadow-md'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {addingToCart ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner
                    size="sm"
                    className="border-primary-foreground/30 border-t-primary-foreground"
                  />
                  {t('addingToCart')}
                </span>
              ) : addedMessage ? (
                t('addedToCart')
              ) : !canPurchase ? (
                t('outOfStock')
              ) : (
                t('addToCart')
              )}
            </button>
          </div>

          {/* Download after purchase note */}
          {product.isDownloadable && (
            <p className="text-muted-foreground text-sm">{t('downloadAfterPurchase')}</p>
          )}

          {/* Description */}
          {description && (
            <div className="border-border border-t pt-4">
              <h2 className="text-foreground mb-3 text-lg font-semibold">{t('description')}</h2>
              {'html' in description ? (
                <div
                  className="prose prose-sm text-muted-foreground max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeProductHtml(description.html) }}
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">{description.text}</p>
              )}
            </div>
          )}

          {/* Metafields / Specifications */}
          {product.metafields && product.metafields.length > 0 && (
            <div className="border-border border-t pt-4">
              <h2 className="text-foreground mb-3 text-lg font-semibold">{t('specifications')}</h2>
              <table className="w-full text-sm">
                <tbody>
                  {product.metafields.map((field) => (
                    <tr key={field.id} className="border-border border-b last:border-0">
                      <td className="text-foreground whitespace-nowrap py-2 pe-4 font-medium">
                        {field.definitionName}
                      </td>
                      <td className="text-muted-foreground py-2">
                        <MetafieldValue field={field} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Frequently Bought Together (cross-sells) */}
      {recommendations?.crossSells && recommendations.crossSells.length > 0 && (
        <FrequentlyBoughtTogether
          items={recommendations.crossSells}
          currentProduct={product}
          className="mt-12"
        />
      )}

      {/* Upsells */}
      {recommendations?.upsells && recommendations.upsells.length > 0 && (
        <RecommendationSection
          title={t('upgradeYourChoice')}
          items={recommendations.upsells}
          className="mt-12"
        />
      )}

      {/* Related products */}
      {recommendations?.related && recommendations.related.length > 0 && (
        <RecommendationSection
          title={t('similarProducts')}
          items={recommendations.related}
          className="mt-12"
        />
      )}
    </article>
  );
}
