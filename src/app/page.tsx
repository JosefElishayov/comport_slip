import { withLocalePrefix } from '@/lib/locale';
import { localizedAlternates } from '@/lib/seo';
import type { Metadata } from 'next';
import type { Product, DiscountBanner } from 'brainerce';
import { getServerClient } from '@/lib/brainerce';
import { getServerLocale } from '@/lib/locale-server';
import { getServerRegionId } from '@/lib/region-server';
import HomePageClient from './home-page-client';

const HOME_META = {
  he: {
    title: 'קומפורט סליפ — מזרנים, מיטות ומוצרי שינה איכותיים',
    description:
      'מזרנים ומוצרי שינה בקומפורט סליפ מבית רהיטי וייס — עמינח, פולירון, סימונס ועוד. ייעוץ מקצועי ותשלום מאובטח. משלוחים והחזרות בהתאם למדיניות האתר.',
    ogTitle: 'קומפורט סליפ — מזרנים ומוצרי שינה',
    ogDescription: 'מזרנים מהמותגים המובילים מבית רהיטי וייס. ייעוץ אישי, תשלום מאובטח ומשלוחים והחזרות בהתאם למדיניות האתר.',
    ogLocale: 'he_IL',
  },
  en: {
    title: 'Comfort Sleep — Quality Mattresses, Beds & Sleep Products',
    description:
      'Discover the selection of mattresses, beds and sleep products from Comfort Sleep by Weiss Furniture — Aminach, Polyron, Simmons and more. Professional advice, secure checkout, with shipping and returns subject to store policy.',
    ogTitle: 'Comfort Sleep — Mattresses & Sleep Products',
    ogDescription: 'Mattresses by leading brands from Weiss Furniture. Personal advice and secure checkout. Shipping and returns are subject to store policy.',
    ogLocale: 'en_US',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = HOME_META[locale];
  return {
    title: m.title,
    description: m.description,
    alternates: localizedAlternates('/', locale),
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: withLocalePrefix('/', locale),
      type: 'website',
      locale: m.ogLocale,
    },
  };
}

export default async function HomePage() {
  const locale = await getServerLocale();
  const regionId = await getServerRegionId();
  const client = getServerClient(locale);
  const [productsRes, bannersRes, heroProductRes] = await Promise.allSettled([
    // No sortBy — same manual dashboard order (menuOrder) as the products page's default sort
    client.getProducts({ limit: 4, regionId }),
    client.getDiscountBanners(),
    // Resolve the translated slug by stable id, so the promotion opens the
    // product directly in either language instead of another search page.
    client.getProduct('cmmur5snn002x01o6mageud0v'),
  ]);

  const initialProducts: Product[] =
    productsRes.status === 'fulfilled' ? productsRes.value.data : [];
  const initialBanners: DiscountBanner[] =
    bannersRes.status === 'fulfilled' ? bannersRes.value : [];

  const goldenTouchHref = heroProductRes.status === 'fulfilled' && heroProductRes.value?.slug
    ? `/products/${heroProductRes.value.slug}` : '/products';
  return <HomePageClient initialProducts={initialProducts} initialBanners={initialBanners} goldenTouchHref={goldenTouchHref} />;
}
