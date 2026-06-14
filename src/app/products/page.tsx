import { Suspense } from 'react';
import type { Metadata } from 'next';
import type { Product, ProductQueryParams } from 'brainerce';
import { getServerClient } from '@/lib/brainerce';
import { getServerLocale } from '@/lib/locale-server';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { sortOptions } from './sort-options';
import ProductsPageClient, { type CategoryNode } from './products-page-client';

const PAGE_SIZE = 20;

const PRODUCTS_META = {
  he: {
    title: 'כל המוצרים — מזרנים, מיטות ובסיסים',
    description:
      'מבחר רחב של מזרנים אורתופדיים, מיטות, בסיסים ומוצרי שינה מהמותגים המובילים — עמינח, פולירון, סימונס ועוד. סינון לפי קטגוריה, מותג ומחיר. משלוח חינם והחזרה תוך 30 יום.',
    ogTitle: 'כל המוצרים | קומפורט סליפ',
    ogDescription: 'מזרנים, מיטות ובסיסים מהמותגים המובילים — משלוח חינם והחזרה תוך 30 יום.',
    ogLocale: 'he_IL',
  },
  en: {
    title: 'All products — Mattresses, Beds & Bases',
    description:
      'A wide selection of orthopedic mattresses, beds, bases and sleep products from the leading brands — Aminach, Polyron, Simmons and more. Filter by category, brand and price. Free shipping and 30-day returns.',
    ogTitle: 'All products | Comfort Sleep',
    ogDescription: 'Mattresses, beds and bases from the leading brands — free shipping and 30-day returns.',
    ogLocale: 'en_US',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = PRODUCTS_META[locale];
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: '/products' },
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: '/products',
      type: 'website',
      locale: m.ogLocale,
    },
  };
}

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    brand?: string;
    tag?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const sp = await searchParams;
  const sortIndex = parseInt(sp.sort || '0', 10) || 0;
  const sort = sortOptions[sortIndex] || sortOptions[0];

  const params: ProductQueryParams = {
    page: 1,
    limit: PAGE_SIZE,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  };
  if (sp.search) params.search = sp.search;
  if (sp.category) params.categories = sp.category;
  if (sp.brand) params.brands = sp.brand;
  if (sp.tag) params.tags = sp.tag;

  const locale = await getServerLocale();
  const client = getServerClient(locale);
  const [productsRes, catRes, brandRes, tagRes] = await Promise.allSettled([
    client.getProducts(params),
    client.getCategories(),
    client.getBrands(),
    client.getTags(),
  ]);

  const initialProducts: Product[] =
    productsRes.status === 'fulfilled' ? productsRes.value.data : [];
  const initialTotal =
    productsRes.status === 'fulfilled' ? productsRes.value.meta.total : 0;
  const initialTotalPages =
    productsRes.status === 'fulfilled' ? productsRes.value.meta.totalPages : 1;
  const initialCategories: CategoryNode[] =
    catRes.status === 'fulfilled' ? (catRes.value.categories as CategoryNode[]) : [];
  const initialBrands =
    brandRes.status === 'fulfilled' ? brandRes.value.brands : [];
  const initialTags = tagRes.status === 'fulfilled' ? tagRes.value.tags : [];

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ProductsPageClient
        initialProducts={initialProducts}
        initialTotal={initialTotal}
        initialTotalPages={initialTotalPages}
        initialCategories={initialCategories}
        initialBrands={initialBrands}
        initialTags={initialTags}
      />
    </Suspense>
  );
}
