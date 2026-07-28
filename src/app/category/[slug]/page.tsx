import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Product } from 'brainerce';
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  jsonLdScriptProps,
  stripHtml,
} from 'brainerce';
import { getServerClient } from '@/lib/brainerce';
import { getServerLocale } from '@/lib/locale-server';
import { getServerRegionId } from '@/lib/region-server';
import { withLocalePrefix, type Locale } from '@/lib/locale';
import {
  categoryPath,
  flattenLinkableCategories,
  getCategoryDetail,
  getCategoryTree,
  normalizeCategorySlug,
} from '@/lib/categories';
import { ProductGrid } from '@/components/products/product-grid';
// Shared sanitize-and-render primitive for merchant-authored HTML. Category
// copy comes from the same dashboard editor as blog bodies, so it gets the same
// strict whitelist treatment before it reaches the DOM.
import { BlogContent } from '@/components/blog/blog-content';

const PAGE_SIZE = 24;

const COPY = {
  he: {
    home: 'דף הבית',
    products: 'מוצרים',
    productCount: (n: number) => (n === 1 ? 'מוצר אחד' : `${n} מוצרים`),
    empty: 'אין כרגע מוצרים בקטגוריה הזו.',
    emptyCta: 'לכל המוצרים',
    viewAllInCategory: 'לכל המוצרים בקטגוריה',
    otherCategories: 'קטגוריות נוספות',
    notFound: 'הקטגוריה לא נמצאה',
  },
  en: {
    home: 'Home',
    products: 'Products',
    productCount: (n: number) => (n === 1 ? '1 product' : `${n} products`),
    empty: 'There are no products in this category right now.',
    emptyCta: 'Browse all products',
    viewAllInCategory: 'View all products in this category',
    otherCategories: 'More categories',
    notFound: 'Category not found',
  },
} as const;

interface PageProps {
  params: Promise<{ slug: string }>;
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comfortsleep.co.il';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerLocale();
  const category = await getCategoryDetail(slug, locale);

  if (!category) {
    return { title: COPY[locale].notFound };
  }

  // The SEO hub writes `metaDescription`; fall back to the opening of the
  // long-form description so the page never ships without one.
  const description =
    category.metaDescription || stripHtml(category.description || '').slice(0, 160) || undefined;
  const path = categoryPath(category.slug || normalizeCategorySlug(slug));
  // Canonical must be self-referencing per locale — pointing the /en page at the
  // Hebrew URL would tell Google the English version is a duplicate to drop.
  const selfPath = withLocalePrefix(path, locale);

  return {
    title: category.name,
    description,
    alternates: {
      canonical: selfPath,
      // Category slugs are shared across locales (only the name is translated),
      // so the two language versions differ by URL prefix alone.
      languages: {
        'he-IL': path,
        'en-US': `/en${path}`,
        'x-default': path,
      },
    },
    openGraph: {
      title: category.name,
      description,
      url: selfPath,
      type: 'website',
      locale: locale === 'he' ? 'he_IL' : 'en_US',
      images: category.image ? [{ url: category.image, alt: category.name }] : undefined,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const locale: Locale = await getServerLocale();
  const category = await getCategoryDetail(slug, locale);

  if (!category) notFound();

  const c = COPY[locale];
  const regionId = await getServerRegionId();
  const client = getServerClient(locale);

  const [productsRes, treeRes] = await Promise.allSettled([
    client.getProducts({
      categories: [category.id],
      limit: PAGE_SIZE,
      ...(regionId ? { regionId } : {}),
    }),
    getCategoryTree(locale),
  ]);

  const products: Product[] = productsRes.status === 'fulfilled' ? productsRes.value.data : [];
  const total = productsRes.status === 'fulfilled' ? productsRes.value.meta.total : products.length;

  // Sibling links keep every category page reachable from every other one — a
  // page that only exists in sitemap.xml is an orphan and ranks like one.
  const siblings = (treeRes.status === 'fulfilled' ? flattenLinkableCategories(treeRes.value) : [])
    .filter((cat) => cat.id !== category.id);

  const path = categoryPath(category.slug || normalizeCategorySlug(slug));

  // CollectionPage — the correct markup for a listing. Never Product JSON-LD
  // here; Product rich results are single-product only.
  const collectionJsonLd = buildCollectionPageJsonLd(category, { siteUrl: baseUrl, path });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: c.home, url: `${baseUrl}${withLocalePrefix('/', locale)}` },
    { name: c.products, url: `${baseUrl}${withLocalePrefix('/products', locale)}` },
    // `breadcrumb` is root → parent; the API omits the category itself.
    ...category.breadcrumb
      .filter((crumb) => !!crumb.slug)
      .map((crumb) => ({
        name: crumb.name,
        url: `${baseUrl}${withLocalePrefix(categoryPath(crumb.slug as string), locale)}`,
      })),
    { name: category.name, url: `${baseUrl}${withLocalePrefix(path, locale)}` },
  ]);

  return (
    <div className="bg-background">
      <script {...jsonLdScriptProps(collectionJsonLd)} />
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />

      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-secondary to-background">
        <div className="absolute inset-0 -z-10 opacity-40">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <nav aria-label="breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <li>
                <Link
                  href={withLocalePrefix('/', locale)}
                  className="transition-colors hover:text-primary"
                >
                  {c.home}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={withLocalePrefix('/products', locale)}
                  className="transition-colors hover:text-primary"
                >
                  {c.products}
                </Link>
              </li>
              {category.breadcrumb
                .filter((crumb) => !!crumb.slug)
                .map((crumb) => (
                  <li key={crumb.slug} className="flex items-center gap-2">
                    <span aria-hidden>/</span>
                    <Link
                      href={withLocalePrefix(categoryPath(crumb.slug as string), locale)}
                      className="transition-colors hover:text-primary"
                    >
                      {crumb.name}
                    </Link>
                  </li>
                ))}
              <li aria-hidden>/</li>
              <li className="font-medium text-foreground" aria-current="page">
                {category.name}
              </li>
            </ol>
          </nav>

          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {category.name}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {c.productCount(total || category.productCount)}
          </p>
          {category.metaDescription && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80">
              {category.metaDescription}
            </p>
          )}
        </div>
      </header>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">{c.empty}</p>
            <Link
              href={withLocalePrefix('/products', locale)}
              className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {c.emptyCta}
            </Link>
          </div>
        )}

        {/* More of the catalog than fits on one page — send visitors to the
            filtered PLP rather than paginating this landing page. */}
        {total > products.length && (
          <div className="mt-10 text-center">
            <Link
              href={withLocalePrefix(`/products?category=${category.id}`, locale)}
              className="inline-flex rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              {c.viewAllInCategory}
            </Link>
          </div>
        )}
      </section>

      {/* Long-form SEO copy from the dashboard SEO hub — below the grid so the
          products stay above the fold. */}
      {category.description && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
          <BlogContent content={category.description} />
        </section>
      )}

      {siblings.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-foreground">{c.otherCategories}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {siblings.map((cat) => (
              <Link
                key={cat.id}
                href={withLocalePrefix(categoryPath(cat.slug), locale)}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
