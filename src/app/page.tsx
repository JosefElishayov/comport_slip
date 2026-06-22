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
      'גלו את מבחר המזרנים, המיטות ומוצרי השינה של קומפורט סליפ מבית רהיטי וייס — עמינח, פולירון, סימונס ועוד. ייעוץ מקצועי, משלוח חינם, החזרה תוך 30 יום ותשלום מאובטח.',
    ogTitle: 'קומפורט סליפ — מזרנים ומוצרי שינה',
    ogDescription: 'חנות המזרנים המובילה — עמינח, פולירון, סימונס ועוד. משלוח חינם, החזרה תוך 30 יום.',
    ogLocale: 'he_IL',
  },
  en: {
    title: 'Comfort Sleep — Quality Mattresses, Beds & Sleep Products',
    description:
      'Discover the selection of mattresses, beds and sleep products from Comfort Sleep by Weiss Furniture — Aminach, Polyron, Simmons and more. Professional advice, free shipping, 30-day returns and secure checkout.',
    ogTitle: 'Comfort Sleep — Mattresses & Sleep Products',
    ogDescription: 'The leading mattress store — Aminach, Polyron, Simmons and more. Free shipping, 30-day returns.',
    ogLocale: 'en_US',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = HOME_META[locale];
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: '/' },
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: '/',
      type: 'website',
      locale: m.ogLocale,
    },
  };
}

export default async function HomePage() {
  const locale = await getServerLocale();
  const regionId = await getServerRegionId();
  const client = getServerClient(locale);
  const [productsRes, bannersRes] = await Promise.allSettled([
    client.getProducts({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc', regionId }),
    client.getDiscountBanners(),
  ]);

  const initialProducts: Product[] =
    productsRes.status === 'fulfilled' ? productsRes.value.data : [];
  const initialBanners: DiscountBanner[] =
    bannersRes.status === 'fulfilled' ? bannersRes.value : [];

  return <HomePageClient initialProducts={initialProducts} initialBanners={initialBanners} />;
}
