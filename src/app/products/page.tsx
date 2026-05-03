import { Suspense } from 'react';
import type { Product, ProductQueryParams } from 'brainerce';
import { getServerClient } from '@/lib/brainerce';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { sortOptions } from './sort-options';
import ProductsPageClient, { type CategoryNode } from './products-page-client';

const PAGE_SIZE = 20;

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

  const client = getServerClient();
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
