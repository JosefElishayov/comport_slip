/**
 * Region-aware price helpers. When a product/variant was fetched with a
 * `regionId` whose currency differs from the store base, Brainerce adds
 * `displayPrice` / `displaySalePrice` / `displayCurrency` (the FX-converted,
 * display-only price). These helpers prefer those fields and fall back to the
 * base-currency price otherwise, so callers get one consistent shape.
 *
 * Display values are converted from basePrice/salePrice — they do NOT re-apply a
 * separate `product.discount` rule, matching how Brainerce returns them.
 * See [[multi-currency-regions]].
 */
import {
  getProductPriceInfo,
  getVariantPrice,
  type Product,
  type ProductVariant,
} from 'brainerce';

export interface DisplayPriceInfo {
  /** Effective price (sale price when on sale, else original). */
  price: number;
  originalPrice: number;
  isOnSale: boolean;
  /** Currency to format with: region display currency when converted, else `fallback`. */
  currency: string;
}

function fromDisplay(
  displayPrice: string | undefined,
  displaySalePrice: string | undefined,
  displayCurrency: string | undefined
): DisplayPriceInfo | null {
  if (!displayCurrency || displayPrice == null) return null;
  const originalPrice = parseFloat(displayPrice);
  if (!Number.isFinite(originalPrice)) return null;
  const sale = displaySalePrice != null ? parseFloat(displaySalePrice) : null;
  const isOnSale = sale != null && Number.isFinite(sale) && sale < originalPrice;
  return {
    price: isOnSale ? (sale as number) : originalPrice,
    originalPrice,
    isOnSale,
    currency: displayCurrency,
  };
}

/** Price info for a product, in the region currency when available. */
export function getDisplayPriceInfo(product: Product, fallbackCurrency: string): DisplayPriceInfo {
  const display = fromDisplay(product.displayPrice, product.displaySalePrice, product.displayCurrency);
  if (display) return display;
  const base = getProductPriceInfo(product);
  return {
    price: base.price,
    originalPrice: base.originalPrice,
    isOnSale: base.isOnSale,
    currency: fallbackCurrency,
  };
}

/** Effective display price for a single variant (region currency when available). */
export function getVariantDisplayPriceInfo(
  variant: ProductVariant,
  productBasePrice: string,
  fallbackCurrency: string
): DisplayPriceInfo {
  const display = fromDisplay(variant.displayPrice, variant.displaySalePrice, variant.displayCurrency);
  if (display) return display;
  const value = getVariantPrice(variant, productBasePrice);
  return { price: value, originalPrice: value, isOnSale: false, currency: fallbackCurrency };
}

/**
 * Currency a product's prices should be formatted in: the region display
 * currency when the product carries one, else the store base currency.
 */
export function getProductDisplayCurrency(product: Product, fallbackCurrency: string): string {
  return product.displayCurrency || fallbackCurrency;
}
