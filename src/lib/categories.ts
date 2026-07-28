import type { CategoryDetail, CategoryNode } from 'brainerce';
import { getServerClient } from '@/lib/brainerce';
import type { Locale } from '@/lib/locale';

/**
 * Server-side category helpers. Category (collection) pages are the store's
 * highest-leverage organic surface — they rank for broad research-intent
 * queries that individual product pages never do — and their copy
 * (`description` / `metaDescription`) is authored in the Brainerce dashboard's
 * SEO hub, so it must be rendered rather than re-invented here.
 *
 * Everything degrades gracefully: a backend hiccup yields `null` / `[]` instead
 * of taking a page down.
 */

/** Decode a percent-encoded path segment if needed; idempotent and never throws. */
export function normalizeCategorySlug(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Landing-page payload for one category, or null when it doesn't exist. */
export async function getCategoryDetail(
  slug: string,
  locale: Locale
): Promise<CategoryDetail | null> {
  try {
    // Next.js hands the dynamic `[slug]` segment to us still percent-encoded for
    // non-ASCII slugs (Hebrew), and the SDK encodes it again on the way out —
    // decode first so it is encoded exactly once. (Same step as lib/blog.)
    return await getServerClient(locale).getCategoryBySlug(normalizeCategorySlug(slug), {
      locale,
    });
  } catch {
    return null;
  }
}

/** Full category tree for the locale; empty on failure. */
export async function getCategoryTree(locale?: Locale): Promise<CategoryNode[]> {
  try {
    const { categories } = await getServerClient(locale).getCategories();
    return categories;
  } catch {
    return [];
  }
}

/** One entry per linkable (slugged) category, depth-first, parents before children. */
export interface LinkableCategory {
  id: string;
  name: string;
  slug: string;
}

export function flattenLinkableCategories(nodes: CategoryNode[]): LinkableCategory[] {
  const out: LinkableCategory[] = [];
  const walk = (list: CategoryNode[]) => {
    for (const node of list) {
      if (node.slug) out.push({ id: node.id, name: node.name, slug: node.slug });
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

/** Path for a category landing page (unprefixed — add the locale prefix at link time). */
export function categoryPath(slug: string): string {
  return `/category/${slug}`;
}
