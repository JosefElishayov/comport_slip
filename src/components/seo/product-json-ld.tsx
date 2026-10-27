import type { Product } from 'brainerce';
import { getProductPriceInfo } from 'brainerce';
import { getProductVariantPriceInfo } from '@/lib/pricing';
import { SITE_URL } from '@/lib/seo';
import { withLocalePrefix, type Locale } from '@/lib/locale';

interface ProductJsonLdProps {
  product: Product;
  url: string;
  currency?: string;
  locale?: Locale;
}

function stripHtml(input: string): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function ProductJsonLd(props: ProductJsonLdProps) {
  try {
    return await renderProductJsonLd(props);
  } catch {
    // Never let JSON-LD failure (bad data shape, missing field, etc.) take
    // down the whole page — crawlers should still get a 200.
    return null;
  }
}

async function renderProductJsonLd({ product, url, currency = 'ILS', locale = 'he' }: ProductJsonLdProps) {
  const priceInfo = getProductPriceInfo(product);
  const baseUrl = SITE_URL;
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || undefined;

  const images = (product.images || []).map((img) => img.url).filter(Boolean);
  const description = stripHtml(product.description || product.name);

  const inStock = product.inventory?.canPurchase !== false;
  const availability = inStock
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  // `priceValidUntil` must describe a real sale window — Brainerce exposes it as
  // `salePriceEndsAt`. Emitting an invented date (e.g. "a year from now") tells
  // Google the current price is guaranteed until then, which is a
  // misrepresentation the moment the price moves. Omit it when there is no
  // scheduled end; the field is optional.
  const saleEndsDate = product.salePriceEndsAt ? new Date(product.salePriceEndsAt) : null;
  const priceValidUntil =
    saleEndsDate && !isNaN(saleEndsDate.getTime()) && saleEndsDate.getTime() > Date.now()
      ? saleEndsDate.toISOString().split('T')[0]
      : null;

  const brandNames =
    (product as { brands?: Array<{ name: string }> }).brands?.map((b) => b.name) ?? [];
  const categoryNames = product.categories?.map((c) => c.name) ?? [];

  // Aggregate rating: prefer SDK-native avgRating/reviewCount; fall back to legacy
  // metafield keys (average_rating / rating_average, review_count / rating_count)
  // for stores still managing ratings outside the reviews surface.
  const sdkRating = typeof product.avgRating === 'number' ? product.avgRating : NaN;
  const sdkReviewCount = typeof product.reviewCount === 'number' ? product.reviewCount : NaN;

  const metafields = product.metafields ?? [];
  const findMeta = (...keys: string[]) =>
    metafields.find((m) => keys.includes(m.definitionKey))?.value ?? null;

  const ratingValueRaw = findMeta('average_rating', 'rating_average');
  const reviewCountRaw = findMeta('review_count', 'rating_count');
  const metaRating = ratingValueRaw ? parseFloat(ratingValueRaw) : NaN;
  const metaReviewCount = reviewCountRaw ? parseInt(reviewCountRaw, 10) : NaN;

  const ratingValue = !isNaN(sdkRating) && sdkRating > 0 ? sdkRating : metaRating;
  const reviewCount =
    !isNaN(sdkReviewCount) && sdkReviewCount > 0 ? sdkReviewCount : metaReviewCount;

  const aggregateRating =
    !isNaN(ratingValue) && ratingValue > 0 && !isNaN(reviewCount) && reviewCount > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue,
          reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : null;

  const seller = { '@id': `${baseUrl}/#store`, ...(storeName ? { name: storeName } : {}) };

  // Build offers: AggregateOffer for variable products with priced variants, Offer otherwise.
  const variantPrices = (product.variants || [])
    .filter((v) => v.status !== 'draft')
    .map((v) => {
      const effective = getProductVariantPriceInfo(product, v, currency).price;
      return Number.isFinite(effective) && effective >= 0 ? effective : null;
    })
    .filter((n): n is number => n != null);

  let offers: Record<string, unknown>;
  if (product.type === 'VARIABLE' && variantPrices.length > 0) {
    offers = {
      '@type': 'AggregateOffer',
      priceCurrency: currency,
      lowPrice: Math.min(...variantPrices),
      highPrice: Math.max(...variantPrices),
      offerCount: variantPrices.length,
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      url,
      ...(priceValidUntil ? { priceValidUntil } : {}),
      ...(seller ? { seller } : {}),
    };
  } else {
    offers = {
      '@type': 'Offer',
      price: priceInfo.price,
      priceCurrency: currency,
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      url,
      ...(priceValidUntil ? { priceValidUntil } : {}),
      ...(seller ? { seller } : {}),
    };
  }

  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: images.length > 1 ? images : images[0] || undefined,
    url,
    sku: product.sku || product.id,
    productID: product.id,
    offers,
  };

  if (brandNames.length > 0) {
    productJsonLd.brand = { '@type': 'Brand', name: brandNames[0] };
  }
  if (categoryNames.length > 0) {
    productJsonLd.category = categoryNames.join(' > ');
  }
  if (aggregateRating) {
    productJsonLd.aggregateRating = aggregateRating;
  }
  if (product.gtin) productJsonLd.gtin = product.gtin;
  if (product.mpn) productJsonLd.mpn = product.mpn;

  // Each offer links to a real URL that preselects that variant in the UI.
  if (product.type === 'VARIABLE' && variantPrices.length > 0) {
    const variants = (product.variants || []).filter((variant) => variant.status !== 'draft');
    const variantNodes = variants.flatMap((variant) => {
      const price = getProductVariantPriceInfo(product, variant, currency);
      if (!Number.isFinite(price.price) || price.price < 0) return [];
      const variantUrl = `${url}?variant=${encodeURIComponent(variant.id)}`;
      const attributes = variant.attributes || Object.fromEntries((variant.options || []).map((option) => [option.name, option.value]));
      const sizeKey = Object.keys(attributes).find((key) => /size|מידה/i.test(key));
      const variantImage = typeof variant.image === 'string' ? variant.image : variant.image?.url;
      return [{
        '@type': 'Product',
        '@id': variantUrl,
        name: [product.name, ...Object.values(attributes)].join(' — '),
        description,
        image: variantImage || images[0],
        sku: variant.sku || variant.id,
        url: variantUrl,
        ...(sizeKey ? { size: attributes[sizeKey] } : {}),
        additionalProperty: Object.entries(attributes).map(([name, value]) => ({ '@type': 'PropertyValue', name, value })),
        offers: {
          '@type': 'Offer',
          price: price.price,
          priceCurrency: price.currency,
          availability: (variant.inventory ?? product.inventory)?.canPurchase === false
            ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
          url: variantUrl,
          seller,
        },
      }];
    });
    productJsonLd['@type'] = 'ProductGroup';
    productJsonLd.productGroupID = product.id;
    productJsonLd.hasVariant = variantNodes;
    const attributeNames = [...new Set(variants.flatMap((variant) => Object.keys(variant.attributes || Object.fromEntries((variant.options || []).map((option) => [option.name, option.value])))))];
    productJsonLd.variesBy = attributeNames.map((name) => /size|מידה/i.test(name) ? 'https://schema.org/size' : name);
    delete productJsonLd.gtin; // A parent GTIN must not be assigned to every size.
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'he' ? 'דף הבית' : 'Home',
        item: `${baseUrl}${withLocalePrefix('/', locale)}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale === 'he' ? 'מוצרים' : 'Products',
        item: `${baseUrl}${withLocalePrefix('/products', locale)}`,
      },
      ...(product.categories?.[0]?.slug
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: categoryNames[0],
              item: `${baseUrl}${withLocalePrefix(`/category/${product.categories[0].slug}`, locale)}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: product.categories?.[0]?.slug ? 4 : 3,
        name: product.name,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
    </>
  );
}

// Serialize a JSON-LD object for embedding in a <script> tag. Escapes
// `<`, `>`, and `&` to \uXXXX so seller-controlled product fields cannot
// break out of the script element with `</script>` or inject HTML.
function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
