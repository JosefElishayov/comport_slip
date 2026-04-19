'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/lib/navigation';
import type { Product, DiscountBanner } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useStoreInfo } from '@/providers/store-provider';
import { ProductGrid } from '@/components/products/product-grid';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useTranslations } from '@/lib/translations';

export default function HomePage() {
  const { storeInfo, loading: storeLoading } = useStoreInfo();
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<DiscountBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('home');
  const tc = useTranslations('common');

  useEffect(() => {
    async function load() {
      try {
        const client = getClient();
        const [productsRes, bannersRes] = await Promise.allSettled([
          client.getProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
          client.getDiscountBanners(),
        ]);

        if (productsRes.status === 'fulfilled') {
          setProducts(productsRes.value.data);
        }
        if (bannersRes.status === 'fulfilled') {
          setBanners(bannersRes.value);
        }
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (storeLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Discount Banners */}
      {banners.length > 0 && (
        <div className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-4 overflow-x-auto text-sm font-medium">
              {banners.map((banner) => (
                <span key={banner.ruleId}>{banner.text}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-muted">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
            {t('welcomeTo')} {storeInfo?.name || tc('store')}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
            {t('heroSubtitle')}
          </p>
          <Link
            href="/products"
            className="bg-primary text-primary-foreground mt-8 inline-flex items-center rounded px-6 py-3 font-medium transition-opacity hover:opacity-90"
          >
            {tc('shopNow')}
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-foreground text-2xl font-bold">{t('featuredProducts')}</h2>
          <Link href="/products" className="text-primary text-sm font-medium hover:underline">
            {tc('viewAll')}
          </Link>
        </div>
        <ProductGrid products={products} />
      </section>
    </div>
  );
}
