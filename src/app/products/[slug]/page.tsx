import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerClient } from '@/lib/brainerce';
import { ProductJsonLd } from '@/components/seo/product-json-ld';
import { ProductClientSection } from './product-client-section';

type Props = {
  params: Promise<{ slug: string; locale?: string }>;
};

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

function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  // Pass the raw slug — Next.js encodes the path when resolving against
  // metadataBase. Pre-encoding produces %25-escaped (double-encoded) URLs.
  const canonicalPath = `/products/${slug}`;

  try {
    const client = getServerClient(locale);
    const product = await client.getProductBySlug(slug);
    if (!product) {
      return {
        title: 'Product not found',
        alternates: { canonical: canonicalPath },
        robots: { index: false, follow: false },
      };
    }

    const seoTitle = (product as { seoTitle?: string | null }).seoTitle || product.name;
    const rawDescription =
      (product as { seoDescription?: string | null }).seoDescription || product.description || '';
    const cleanedDescription = clamp(stripHtml(rawDescription) || product.name, 160);

    const images = (product.images || [])
      .filter((img) => !!img?.url)
      .slice(0, 4)
      .map((img) => ({
        url: img.url,
        alt: img.alt || product.name,
        width: img.width,
        height: img.height,
      }));

    const brandNames =
      (product as { brands?: Array<{ name: string }> }).brands?.map((b) => b.name) ?? [];
    const categoryNames = product.categories?.map((c) => c.name) ?? [];
    const tagNames = (product.tags ?? [])
      .map((t) => (typeof t === 'string' ? t : (t as { name?: string })?.name || ''))
      .filter(Boolean);
    const keywords = Array.from(
      new Set([...tagNames, ...categoryNames, ...brandNames, product.name].filter(Boolean))
    );

    const currency = process.env.NEXT_PUBLIC_STORE_CURRENCY || 'USD';
    const inStock = product.inventory?.canPurchase !== false;
    const ogLocale = (locale || process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'he_IL').replace(
      '-',
      '_'
    );

    // Schema.org-compliant product OG meta tags (not part of Next's typed openGraph,
    // so we expose them via `other` so crawlers like Facebook/Pinterest can pick them up).
    const otherMeta: Record<string, string | string[]> = {
      'product:price:amount': String(product.basePrice ?? ''),
      'product:price:currency': currency,
      'product:availability': inStock ? 'in stock' : 'out of stock',
      'product:condition': 'new',
      'og:price:amount': String(product.basePrice ?? ''),
      'og:price:currency': currency,
    };
    if (product.sku) otherMeta['product:retailer_item_id'] = product.sku;
    if (brandNames.length > 0) otherMeta['product:brand'] = brandNames[0];
    if (categoryNames.length > 0) otherMeta['product:category'] = categoryNames[0];

    return {
      title: seoTitle,
      description: cleanedDescription,
      keywords: keywords.length > 0 ? keywords : undefined,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title: seoTitle,
        description: cleanedDescription,
        url: canonicalPath,
        siteName: process.env.NEXT_PUBLIC_STORE_NAME || undefined,
        images: images.length > 0 ? images : undefined,
        type: 'website',
        locale: ogLocale,
      },
      twitter: {
        card: 'summary_large_image',
        title: seoTitle,
        description: cleanedDescription,
        images: images.length > 0 ? images.map((i) => i.url) : undefined,
      },
      robots: {
        index: product.status === 'active' && inStock ? true : true,
        follow: true,
        googleBot: {
          index: product.status === 'active',
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      other: otherMeta,
    };
  } catch {
    // Backend down or product fetch failed — still return valid metadata so the
    // page renders 200 for crawlers instead of throwing and producing a 500.
    return {
      title: 'Product',
      alternates: { canonical: canonicalPath },
      robots: { index: false, follow: false },
    };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug, locale } = await params;

  let product;
  try {
    const client = getServerClient(locale);
    product = await client.getProductBySlug(slug);
  } catch {
    // Network/backend error — let Next show 404 rather than 500 to crawlers.
    notFound();
  }
  if (!product) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  // For absolute URL in JSON-LD we DO need to encode — this is a raw string,
  // not a Next.js Metadata field.
  const productUrl = `${baseUrl}/products/${encodeURIComponent(slug)}`;
  const currency = process.env.NEXT_PUBLIC_STORE_CURRENCY || 'USD';

  return (
    <>
      <ProductJsonLd product={product} url={productUrl} currency={currency} />
      <ProductClientSection product={product} />
    </>
  );
}
