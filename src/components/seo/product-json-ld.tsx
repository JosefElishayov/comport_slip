import type { Product } from 'brainerce';
import { getProductPriceInfo } from 'brainerce';
import { getNonce } from '@/lib/nonce';

interface ProductJsonLdProps {
  product: Product;
  url: string;
  currency?: string;
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

async function renderProductJsonLd({ product, url, currency = 'USD' }: ProductJsonLdProps) {
  const nonce = await getNonce();
  const priceInfo = getProductPriceInfo(product);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || undefined;

  const images = (product.images || []).map((img) => img.url).filter(Boolean);
  const description = stripHtml(product.description || product.name);

  const inStock = product.inventory?.canPurchase !== false;
  const availability = inStock
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  // Default price validity: ~1 year out, common SEO recommendation.
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const brandNames =
    (product as { brands?: Array<{ name: string }> }).brands?.map((b) => b.name) ?? [];
  const categoryNames = product.categories?.map((c) => c.name) ?? [];

  const seller = storeName ? { '@type': 'Organization', name: storeName } : undefined;

  // Build offers: AggregateOffer for variable products with priced variants, Offer otherwise.
  const variantPrices = (product.variants || [])
    .map((v) => {
      const base = v.price ? parseFloat(v.price) : NaN;
      const sale = v.salePrice ? parseFloat(v.salePrice) : NaN;
      const effective = !isNaN(sale) && sale > 0 ? sale : base;
      return isNaN(effective) ? null : effective;
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
      url,
      ...(seller ? { seller } : {}),
    };
  } else {
    offers = {
      '@type': 'Offer',
      price: priceInfo.price,
      priceCurrency: currency,
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      priceValidUntil,
      url,
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

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'דף הבית',
        item: baseUrl || '/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'מוצרים',
        item: `${baseUrl}/products`,
      },
      ...(categoryNames[0]
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: categoryNames[0],
              item: `${baseUrl}/products`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: categoryNames[0] ? 4 : 3,
        name: product.name,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
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
