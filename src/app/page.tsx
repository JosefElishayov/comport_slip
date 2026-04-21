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

      {/* Full-Screen Video Hero */}
      <section className="hero-video-section">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster=""
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        <div className="hero-video-overlay">
          <div className="mx-auto max-w-3xl">
            <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              {t('heroTitle')}
            </h1>
            <p className="animate-fade-in-up-delay mx-auto mt-6 max-w-xl text-lg text-white/90 sm:text-xl md:text-2xl">
              {t('heroSubtitle')}
            </p>
            <div className="animate-fade-in-up-delay-2 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
              >
                {t('heroCta')}
                <svg className="h-5 w-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="scroll-indicator">
            <svg className="h-8 w-8 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {(storeLoading || loading) ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (<>
      {/* Trust / Benefits Bar */}
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <span className="text-sm font-medium text-foreground">{t('benefitDelivery')}</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span className="text-sm font-medium text-foreground">{t('benefitWarranty')}</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <span className="text-sm font-medium text-foreground">{t('benefitComfort')}</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
              <span className="text-sm font-medium text-foreground">{t('benefitPrice')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-warm">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-foreground text-3xl font-bold sm:text-4xl">{t('featuredProducts')}</h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-lg text-lg">{t('featuredSubtitle')}</p>
          </div>
          <ProductGrid products={products} />
          <div className="mt-12 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-8 py-3 font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
            >
              {tc('viewAll')}
              <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Comfort Promise Section */}
      <section className="section-cool">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-foreground text-3xl font-bold sm:text-4xl">{t('promiseTitle')}</h2>
              <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{t('promiseText')}</p>
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-foreground">{t('promisePoint1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-foreground">{t('promisePoint2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-foreground">{t('promisePoint3')}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="flex h-72 w-72 items-center justify-center rounded-full bg-primary/5 sm:h-80 sm:w-80">
                  <div className="flex h-56 w-56 items-center justify-center rounded-full bg-primary/10 sm:h-64 sm:w-64">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary sm:text-6xl">100</div>
                      <div className="mt-1 text-lg font-medium text-primary">{t('nightsTrial')}</div>
                      <div className="text-muted-foreground text-sm">{t('nightsTrialSub')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </>)}
    </div>
  );
}
