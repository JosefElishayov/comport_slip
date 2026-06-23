import type { MetadataRoute } from 'next';
import { getServerClient } from '@/lib/brainerce';

// Hebrew lives at the root (existing indexed URLs — unchanged); English under
// /en. Each entry carries reciprocal hreflang alternates so Google treats the
// two language versions as translations, not duplicates. x-default → Hebrew.
function languagesFor(hePath: string, enPath: string, baseUrl: string) {
  return {
    'he-IL': `${baseUrl}${hePath}`,
    'en-US': `${baseUrl}${enPath}`,
    'x-default': `${baseUrl}${hePath}`,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  const staticPaths: Array<{ path: string; priority: number }> = [
    { path: '', priority: 1 },
    { path: '/products', priority: 0.9 },
    { path: '/about', priority: 0.5 },
    { path: '/contact', priority: 0.5 },
    { path: '/privacy', priority: 0.3 },
    { path: '/terms', priority: 0.3 },
    { path: '/shipping', priority: 0.3 },
    { path: '/returns', priority: 0.3 },
    { path: '/accessibility', priority: 0.3 },
  ];

  const staticPages: MetadataRoute.Sitemap = staticPaths.map(({ path, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    priority,
    alternates: { languages: languagesFor(path, `/en${path}`, baseUrl) },
  }));

  try {
    // Hebrew slugs (default locale). The `slug` field is locale-aware, so a
    // second fetch in `en` gives the English slug for the same product id.
    const heProducts = (await getServerClient('he').getProducts({ limit: 1000 })).data;

    const enSlugById = new Map<string, string>();
    try {
      const enProducts = (await getServerClient('en').getProducts({ limit: 1000 })).data;
      for (const p of enProducts) if (p.slug) enSlugById.set(p.id, p.slug);
    } catch {
      // English fetch failed — emit Hebrew-only entries (no hreflang) rather
      // than dropping the whole product sitemap.
    }

    const productPages: MetadataRoute.Sitemap = heProducts
      .filter((product) => !!product.slug)
      .map((product) => {
        const enSlug = enSlugById.get(product.id);
        return {
          url: `${baseUrl}/products/${product.slug}`,
          lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
          priority: 0.8,
          ...(enSlug
            ? {
                alternates: {
                  languages: languagesFor(
                    `/products/${product.slug}`,
                    `/en/products/${enSlug}`,
                    baseUrl
                  ),
                },
              }
            : {}),
        };
      });

    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
