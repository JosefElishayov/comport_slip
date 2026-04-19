import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerClient } from '@/lib/brainerce';
import { ProductJsonLd } from '@/components/seo/product-json-ld';
import { ProductClientSection } from './product-client-section';

type Props = {
  params: Promise<{ slug: string; locale?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;

  try {
    const client = getServerClient(locale);
    const product = await client.getProductBySlug(slug);
    const imageUrl = product.images?.[0]?.url;
    // Prefer merchant-authored SEO copy; fall back to the visible name/description.
    // Both are served already locale-resolved by the backend.
    const seoTitle = (product as { seoTitle?: string | null }).seoTitle || product.name;
    const seoDescription =
      (product as { seoDescription?: string | null }).seoDescription ||
      product.description?.substring(0, 160) ||
      product.name;

    return {
      title: seoTitle,
      description: seoDescription,
      alternates: {
        canonical: `/products/${slug}`,
      },
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        images: imageUrl ? [{ url: imageUrl, alt: product.name }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: seoTitle,
        description: seoDescription,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch {
    return {
      title: 'Product not found',
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
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const productUrl = `${baseUrl}/products/${slug}`;
  const currency = process.env.NEXT_PUBLIC_STORE_CURRENCY || 'USD';

  return (
    <>
      <ProductJsonLd product={product} url={productUrl} currency={currency} />
      <ProductClientSection product={product} />
    </>
  );
}
