import type { MetadataRoute } from 'next';
import { getServerClient } from '@/lib/brainerce';
import { getPublishedBlogPosts } from '@/lib/blog';
import { SITE_URL } from '@/lib/seo';
import { categoryPath, flattenLinkableCategories, getCategoryTree } from '@/lib/categories';

// Without this the sitemap is generated once at build time and frozen —
// a product trashed/added in Brainerce wouldn't be reflected until the next
// deploy. Hourly revalidation keeps it in sync with the catalog.
export const revalidate = 3600;

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
  const baseUrl = SITE_URL;

  const staticPaths: Array<{ path: string; priority: number }> = [
    { path: '', priority: 1 },
    { path: '/products', priority: 0.9 },
    { path: '/blog', priority: 0.6 },
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
    priority,
    alternates: { languages: languagesFor(path, `/en${path}`, baseUrl) },
  }));

  // Category landing pages — the highest-priority organic surface after the
  // homepage. Slugs are shared across locales (only the name is translated),
  // so the he/en pair differs by URL prefix alone.
  const categoryPages: MetadataRoute.Sitemap = flattenLinkableCategories(
    await getCategoryTree()
  ).map((category) => {
    const path = categoryPath(category.slug);
    return {
      url: `${baseUrl}${path}`,
      priority: 0.85,
      alternates: { languages: languagesFor(path, `/en${path}`, baseUrl) },
    };
  });

  try {
    // Hebrew slugs (default locale). The `slug` field is locale-aware, so a
    // second fetch in `en` gives the English slug for the same product id.
    const heProducts = await getServerClient('he').getSitemapProducts(5000);

    const enSlugById = new Map<string, string>();
    try {
      const enProducts = await getServerClient('en').getSitemapProducts(5000);
      for (const p of enProducts) if (p.localeSlugs?.en || p.slug) enSlugById.set(p.id, p.localeSlugs?.en || p.slug!);
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

    // Blog posts — localized slugs, same he/en reciprocal-alternates treatment.
    let blogPages: MetadataRoute.Sitemap = [];
    try {
      const hePosts = await getPublishedBlogPosts('he');
      const enSlugById = new Map<string, string>();
      try {
        const enPosts = await getPublishedBlogPosts('en');
        for (const p of enPosts) if (p.slug) enSlugById.set(p.id, p.slug);
      } catch {
        // English fetch failed — emit Hebrew-only blog entries.
      }
      blogPages = hePosts
        .filter((post) => !!post.slug)
        .map((post) => {
          const enSlug = enSlugById.get(post.id);
          return {
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
            priority: 0.6,
            ...(enSlug
              ? {
                  alternates: {
                    languages: languagesFor(
                      `/blog/${post.slug}`,
                      `/en/blog/${enSlug}`,
                      baseUrl
                    ),
                  },
                }
              : {}),
          };
        });
    } catch {
      // Blog fetch failed entirely — skip blog entries, keep the rest.
    }

    return withEnglishEntries([...staticPages, ...categoryPages, ...productPages, ...blogPages]);
  } catch {
    // Product fetch failed — categories resolve independently (and already
    // degrade to [] on their own), so keep them rather than dropping to static.
    return withEnglishEntries([...staticPages, ...categoryPages]);
  }
}

function withEnglishEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return entries.flatMap((entry) => {
    const english = entry.alternates?.languages?.['en-US'];
    return typeof english === 'string' && english !== entry.url
      ? [entry, { ...entry, url: english }]
      : [entry];
  });
}
