import type { Product } from 'brainerce';
import { getProductPriceInfo } from 'brainerce';
import { getNonce } from '@/lib/nonce';

interface ProductJsonLdProps {
  product: Product;
  url: string;
  currency?: string;
}

export async function ProductJsonLd({ product, url, currency = 'USD' }: ProductJsonLdProps) {
  const nonce = await getNonce();
  const priceInfo = getProductPriceInfo(product);
  const imageUrl = product.images?.[0]?.url;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: imageUrl,
    url,
    sku: product.sku || product.id,
    offers: {
      '@type': 'Offer',
      price: priceInfo.price,
      priceCurrency: currency,
      availability:
        product.inventory?.canPurchase !== false
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl || '/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: `${baseUrl}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
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
