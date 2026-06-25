import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { withLocalePrefix, type Locale } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';
import {
  getBlogPost,
  getBlogPosts,
  formatBlogDate,
  readingMinutes,
  postExcerpt,
  type BlogPost,
} from '@/lib/blog';
import { BlogContent } from '@/components/blog/blog-content';

// Serialize a JSON-LD object for embedding in a <script> tag. Escapes `<`, `>`
// and `&` so author-controlled post fields cannot break out of the script
// element with `</script>` or inject HTML. Mirrors the helper in product-json-ld.
function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

const COPY = {
  he: {
    backToBlog: 'חזרה ליומן השינה',
    by: 'מאת',
    minRead: 'דק׳ קריאה',
    related: 'כתבות נוספות',
    shopCta: 'מצאו את המזרן המושלם עבורכם',
    shopCtaBody: 'מבחר רחב של מזרנים, מיטות ובסיסים מהמותגים המובילים — משלוח חינם והחזרה תוך 30 יום.',
    shopCtaBtn: 'למעבר לחנות',
  },
  en: {
    backToBlog: 'Back to the Sleep Journal',
    by: 'By',
    minRead: 'min read',
    related: 'More stories',
    shopCta: 'Find the mattress that fits you',
    shopCtaBody: 'A wide selection of mattresses, beds and bases from the leading brands — free shipping and 30-day returns.',
    shopCtaBtn: 'Browse the store',
  },
} as const;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerLocale();
  const post = await getBlogPost(slug, locale);

  if (!post) {
    return { title: locale === 'he' ? 'כתבה לא נמצאה' : 'Article not found' };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || postExcerpt(post, 160);
  const ogImage = post.ogImageUrl || post.coverImageUrl;
  const canonical = `/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      locale: locale === 'he' ? 'he_IL' : 'en_US',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
      images: ogImage ? [{ url: ogImage, alt: post.coverImageAlt || post.title }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const locale: Locale = await getServerLocale();
  const post = await getBlogPost(slug, locale);

  if (!post) notFound();

  const c = COPY[locale];
  const date = formatBlogDate(post.publishedAt || post.createdAt, locale);
  const mins = readingMinutes(post.content);

  // Related posts — same category when available, else latest; exclude self.
  const { posts: pool } = await getBlogPosts(
    locale,
    post.category ? { category: post.category, limit: 4 } : { limit: 4 }
  );
  const related = pool.filter((p) => p.id !== post.id).slice(0, 3);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comfortsleep.co.il';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || postExcerpt(post, 160),
    image: post.ogImageUrl || post.coverImageUrl || undefined,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: post.author
      ? { '@type': 'Person', name: post.author }
      : { '@type': 'Organization', name: 'קומפורט סליפ' },
    publisher: {
      '@type': 'Organization',
      name: 'קומפורט סליפ',
      logo: { '@type': 'ImageObject', url: `${baseUrl}/logo.png` },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}${withLocalePrefix(`/blog/${post.slug}`, locale)}`,
    },
    keywords: post.tags?.join(', ') || undefined,
  };

  return (
    <div className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <article>
        {/* Header */}
        <header className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-secondary to-background">
          <div className="absolute inset-0 -z-10 opacity-40">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          </div>
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <Link
              href={withLocalePrefix('/blog', locale)}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {c.backToBlog}
            </Link>

            {post.category && (
              <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-accent">
                {post.category}
              </p>
            )}
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {post.author && (
                <>
                  <span className="font-medium text-foreground">{c.by} {post.author}</span>
                  <span aria-hidden>·</span>
                </>
              )}
              {date && (
                <>
                  <span dir="ltr">{date}</span>
                  <span aria-hidden>·</span>
                </>
              )}
              <span>{mins} {c.minRead}</span>
            </div>
          </div>
        </header>

        {/* Cover image */}
        {post.coverImageUrl && (
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-6 aspect-[16/9] overflow-hidden rounded-3xl border border-border bg-secondary shadow-lg sm:-mt-8">
              <Image
                src={post.coverImageUrl}
                alt={post.coverImageAlt || post.title}
                fill
                priority
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          {post.excerpt && (
            <p className="mb-8 border-s-4 border-accent ps-5 text-lg font-medium leading-relaxed text-foreground/90">
              {post.excerpt}
            </p>
          )}

          <BlogContent content={post.content} />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2 border-t border-border pt-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Shop CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-12 text-center text-primary-foreground shadow-xl sm:px-12 sm:py-14">
          <div className="absolute inset-0 -z-10 opacity-20">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent blur-2xl" />
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl">{c.shopCta}</h2>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-primary-foreground/90">
            {c.shopCtaBody}
          </p>
          <Link
            href={withLocalePrefix('/products', locale)}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
          >
            {c.shopCtaBtn}
            <svg className="h-5 w-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold text-foreground">{c.related}</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rp) => (
                <RelatedCard key={rp.id} post={rp} locale={locale} copy={c} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function RelatedCard({
  post,
  locale,
  copy,
}: {
  post: BlogPost;
  locale: Locale;
  copy: (typeof COPY)[Locale];
}) {
  const href = withLocalePrefix(`/blog/${post.slug}`, locale);
  const date = formatBlogDate(post.publishedAt || post.createdAt, locale);
  return (
    <Link
      href={href}
      className="hover-lift group flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-secondary">
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.coverImageAlt || post.title}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary to-accent/15">
            <svg className="h-10 w-10 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {post.category && (
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            {post.category}
          </span>
        )}
        <h3 className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        {date && (
          <span className="mt-auto text-xs text-muted-foreground" dir="ltr">
            {date}
          </span>
        )}
      </div>
    </Link>
  );
}
