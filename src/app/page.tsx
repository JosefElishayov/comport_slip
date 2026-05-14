import type { Metadata } from 'next';
import type { Product, DiscountBanner } from 'brainerce';
import { getServerClient } from '@/lib/brainerce';
import HomePageClient from './home-page-client';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'קומפורט סליפ — מזרנים, מיטות ומוצרי שינה איכותיים',
  description:
    'גלו את מבחר המזרנים, המיטות ומוצרי השינה של קומפורט סליפ מבית רהיטי וייס — עמינח, פולירון, סימונס ועוד. ייעוץ מקצועי, משלוח חינם, החזרה תוך 30 יום ותשלום מאובטח.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'קומפורט סליפ — מזרנים ומוצרי שינה',
    description:
      'חנות המזרנים המובילה — עמינח, פולירון, סימונס ועוד. משלוח חינם, החזרה תוך 30 יום.',
    url: '/',
    type: 'website',
    locale: 'he_IL',
  },
};

export default async function HomePage() {
  const client = getServerClient();
  const [productsRes, bannersRes] = await Promise.allSettled([
    client.getProducts({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc' }),
    client.getDiscountBanners(),
  ]);

  const initialProducts: Product[] =
    productsRes.status === 'fulfilled' ? productsRes.value.data : [];
  const initialBanners: DiscountBanner[] =
    bannersRes.status === 'fulfilled' ? bannersRes.value : [];

  return <HomePageClient initialProducts={initialProducts} initialBanners={initialBanners} />;
}
