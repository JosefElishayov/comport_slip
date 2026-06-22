'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from '@/lib/navigation';
import type { Product, DiscountBanner } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useStoreInfo } from '@/providers/store-provider';
import { useRegionId } from '@/providers/region-provider';
import { ProductGrid } from '@/components/products/product-grid';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Reveal } from '@/components/shared/reveal';
import { useTranslations } from '@/lib/translations';

interface HomePageClientProps {
  initialProducts: Product[];
  initialBanners: DiscountBanner[];
}

export default function HomePageClient({ initialProducts, initialBanners }: HomePageClientProps) {
  useStoreInfo();
  const regionId = useRegionId();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [banners, setBanners] = useState<DiscountBanner[]>(initialBanners);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [loading, setLoading] = useState(initialProducts.length === 0 && initialBanners.length === 0);
  const skipInitialFetch = useRef(initialProducts.length > 0 || initialBanners.length > 0);
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const heroRef = useRef<HTMLElement>(null);
  const heroOverlayRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bannerRef.current;
    if (!el) {
      document.documentElement.style.setProperty('--banner-h', '0px');
      return;
    }
    const apply = () => {
      document.documentElement.style.setProperty('--banner-h', `${el.offsetHeight}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty('--banner-h', '0px');
    };
  }, [banners.length, bannerDismissed]);

  useEffect(() => {
    const handleScroll = () => {
      const hero = heroRef.current;
      const overlay = heroOverlayRef.current;
      if (!hero) return;

      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      // shrink animation completes over first 55vh of scroll
      const progress = Math.min(scrollY / (vh * 0.55), 1);

      const scale = 1 - progress * 0.2;
      const radius = progress * 28;

      hero.style.transform = `scale(${scale})`;
      hero.style.borderRadius = `${radius}px`;

      // hide completely once content scrolls over it — no bleed-through
      hero.style.visibility = scrollY >= vh * 0.85 ? 'hidden' : 'visible';

      if (overlay) {
        overlay.style.opacity = String(Math.max(0, 1 - progress * 2.2));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    async function load() {
      try {
        const client = getClient();
        const [productsRes, bannersRes] = await Promise.allSettled([
          client.getProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc', regionId: regionId ?? undefined }),
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
  }, [regionId]);

  return (
    <div>
      {/* Discount Banners — fixed announcement bar above header & hero video */}
      {banners.length > 0 && !bannerDismissed && (
        <div
          ref={bannerRef}
          className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground"
        >
          <div className="relative mx-auto max-w-7xl px-4 py-2 pe-10 sm:px-6 sm:pe-12 lg:px-8 lg:pe-14">
            <div className="flex items-center justify-center gap-4 overflow-x-auto text-sm font-medium">
              {banners.map((banner) => (
                <span key={banner.ruleId}>{banner.text}</span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              aria-label="סגור"
              className="absolute end-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-primary-foreground/80 transition hover:bg-white/10 hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Fixed video — shrinks on scroll, content slides over it */}
      <section ref={heroRef} className="hero-video-section">
        <video autoPlay muted loop playsInline preload="auto" poster="">
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        <div ref={heroOverlayRef} className="hero-video-overlay">
          <div className="mx-auto max-w-3xl">
            <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              {t('heroTitle')}
            </h1>
            <p className="animate-fade-in-up-delay mx-auto mt-6 max-w-2xl text-lg text-white/95 sm:text-xl md:text-2xl">
              {t('heroSubtitle')}
            </p>
            <p className="animate-fade-in-up-delay mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
              {t('heroIntro')}
            </p>
            <div className="animate-fade-in-up-delay-2 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/products"
                className="btn-shimmer inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:brightness-110"
              >
                {t('heroCta')}
                <svg className="h-5 w-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="scroll-indicator">
            <svg className="h-8 w-8 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Spacer — scroll space so content starts below the video */}
      <div className="hero-spacer" aria-hidden="true" />

      {/* All page content scrolls over the fixed video */}
      <div className="hero-content-layer">

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center bg-background">
          <LoadingSpinner size="lg" />
        </div>
      ) : (<>
      {/* Strength Points */}
      <section className="strength-section border-b border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            <Reveal variant="up" delay={1} className="strength-card strength-card--spring flex flex-col items-center gap-3 text-center">
              <div className="strength-icon flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">{t('strengthBrandsTitle')}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('strengthBrandsBody')}</p>
            </Reveal>
            <Reveal variant="up" delay={2} className="strength-card strength-card--spring flex flex-col items-center gap-3 text-center">
              <div className="strength-icon flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">{t('strengthExperienceTitle')}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('strengthExperienceBody')}</p>
            </Reveal>
            <Reveal variant="up" delay={3} className="strength-card strength-card--spring flex flex-col items-center gap-3 text-center">
              <div className="strength-icon flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">{t('strengthLocalTitle')}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('strengthLocalBody')}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-[var(--bg)]">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8">
          {/* Header row: title right, button left */}
          <Reveal variant="up" className="mb-10 flex items-center justify-between gap-4">
            <h2 className="text-foreground text-2xl font-bold sm:text-3xl">{t('featuredProducts')}</h2>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-all hover:border-primary hover:text-primary"
            >
              {tc('viewAll')}
              <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </Reveal>
          <Reveal variant="up" delay={1}>
            <ProductGrid products={products} />
          </Reveal>
        </div>
      </section>

      {/* Comfort Promise Section */}
      <section className="section-cool">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal variant="right">
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
              <div className="mt-8">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:brightness-110"
                >
                  {t('promiseCta')}
                  <svg className="h-5 w-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </Reveal>
            <Reveal variant="left" delay={1} className="flex items-center justify-center">
              <div className="relative animate-float">
                <div className="pulse-ring relative flex h-72 w-72 items-center justify-center rounded-full bg-primary/5 sm:h-80 sm:w-80">
                  <div className="flex h-56 w-56 items-center justify-center rounded-full bg-primary/10 sm:h-64 sm:w-64">
                    <div className="text-center px-6">
                      <svg className="mx-auto h-16 w-16 text-primary sm:h-20 sm:w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                      <div className="mt-3 text-lg font-bold text-primary">{t('qualityBadgeTitle')}</div>
                      <div className="text-muted-foreground mt-1 text-sm">{t('qualityBadgeSub')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      </>)}
      </div>{/* end hero-content-layer */}
    </div>
  );
}
