import type { BrainerceClient } from 'brainerce';
import { getServerClient } from '@/lib/brainerce';
import type { Locale } from '@/lib/locale';

// The blog types ship in the SDK's runtime (`client.blog.*` works) but are not
// re-exported from its public type entry as of brainerce 1.37.3 — so derive them
// from the client's method signatures. This stays in sync with the SDK and is
// re-exported here as the single source for blog types across the storefront.
type BlogClient = BrainerceClient['blog'];
export type BlogPost = NonNullable<Awaited<ReturnType<BlogClient['getPost']>>>;
export type BlogPostListParams = NonNullable<Parameters<BlogClient['getPosts']>[0]>;

/**
 * Server-side blog helpers. Wrap the Brainerce SDK's `client.blog` surface
 * (public read endpoints — work in all modes) with graceful degradation: a
 * backend hiccup yields an empty list / null rather than crashing the page.
 *
 * The active locale is forwarded to the API (Accept-Language) so titles, slugs
 * and content come back in the visitor's language when the store has them.
 */

export interface BlogListResult {
  posts: BlogPost[];
  total: number;
  totalPages: number;
  page: number;
}

const EMPTY: BlogListResult = { posts: [], total: 0, totalPages: 1, page: 1 };

export async function getBlogPosts(
  locale: Locale,
  params: BlogPostListParams = {}
): Promise<BlogListResult> {
  try {
    const res = await getServerClient(locale).blog.getPosts({
      limit: 24,
      ...params,
    });
    return {
      posts: res.data,
      total: res.meta.total,
      totalPages: res.meta.totalPages,
      page: res.meta.page,
    };
  } catch {
    return EMPTY;
  }
}

export async function getBlogPost(
  slug: string,
  locale: Locale
): Promise<BlogPost | null> {
  try {
    return await getServerClient(locale).blog.getPost(slug);
  } catch {
    return null;
  }
}

/** Unique categories present in a set of posts, preserving first-seen order. */
export function collectCategories(posts: BlogPost[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of posts) {
    if (p.category && !seen.has(p.category)) {
      seen.add(p.category);
      out.push(p.category);
    }
  }
  return out;
}

/** Localized publish date, e.g. "25 ביוני 2026" / "June 25, 2026". */
export function formatBlogDate(iso: string | undefined, locale: Locale): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Rough reading time in minutes (>= 1), from the raw content length. */
export function readingMinutes(content: string | undefined): number {
  if (!content) return 1;
  const text = content.replace(/<[^>]+>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Best available short summary for a post. */
export function postExcerpt(post: BlogPost, max = 160): string {
  if (post.excerpt) return post.excerpt;
  const text = (post.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}
