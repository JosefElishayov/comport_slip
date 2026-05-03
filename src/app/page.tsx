import type { Product, DiscountBanner } from 'brainerce';
import { getServerClient } from '@/lib/brainerce';
import HomePageClient from './home-page-client';

export const revalidate = 300;

export default async function HomePage() {
  const client = getServerClient();
  const [productsRes, bannersRes] = await Promise.allSettled([
    client.getProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
    client.getDiscountBanners(),
  ]);

  const initialProducts: Product[] =
    productsRes.status === 'fulfilled' ? productsRes.value.data : [];
  const initialBanners: DiscountBanner[] =
    bannersRes.status === 'fulfilled' ? bannersRes.value : [];

  return <HomePageClient initialProducts={initialProducts} initialBanners={initialBanners} />;
}
