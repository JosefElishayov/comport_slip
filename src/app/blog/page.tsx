import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { withLocalePrefix, type Locale } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';
import {
  getBlogPosts,
  collectCategories,
  formatBlogDate,
  readingMinutes,
  postExcerpt,
  type BlogPost,
} from '@/lib/blog';

const COPY = {
  he: {
    eyebrow: 'המגזין של קומפורט סליפ',
    title: 'יומן השינה',
    lead: 'מדריכים, טיפים והשראה לשינה טובה יותר — מהמומחים שמלווים אתכם כבר למעלה מ-40 שנה.',
    metaTitle: 'יומן השינה — מדריכים וטיפים לשינה טובה',
    metaDescription:
      'מאמרים, מדריכי קנייה וטיפים מקצועיים לבחירת מזרן, מיטה ומוצרי שינה — מהמומחים של קומפורט סליפ מבית רהיטי וייס.',
    allCategories: 'הכול',
    featured: 'הכתבה הנבחרת',
    readMore: 'לקריאת הכתבה',
    minRead: 'דק׳ קריאה',
    emptyTitle: 'הכתבות בדרך אליכם',
    emptyBody:
      'אנחנו עובדים על תוכן חדש — מדריכי שינה, השוואות מזרנים וטיפים מהמומחים שלנו. בינתיים, מוזמנים לעיין במוצרים שלנו.',
    emptyCta: 'למעבר לחנות',
    by: 'מאת',
  },
  en: {
    eyebrow: 'The Comfort Sleep Magazine',
    title: 'The Sleep Journal',
    lead: 'Guides, tips and inspiration for better sleep — from the experts who have been with you for over 40 years.',
    metaTitle: 'The Sleep Journal — Guides & Tips for Better Sleep',
    metaDescription:
      'Articles, buying guides and professional tips for choosing a mattress, bed and sleep products — from the experts at Comfort Sleep by Weiss Furniture.',
    allCategories: 'All',
    featured: 'Featured story',
    readMore: 'Read the story',
    minRead: 'min read',
    emptyTitle: 'Stories are on the way',
    emptyBody:
      'We are working on fresh content — sleep guides, mattress comparisons and tips from our experts. In the meantime, feel free to browse our products.',
    emptyCta: 'Browse the store',
    by: 'By',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const c = COPY[locale];
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: '/blog' },
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      url: '/blog',
      type: 'website',
      locale: locale === 'he' ? 'he_IL' : 'en_US',
    },
  };
}

interface BlogPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { category } = await searchParams;
  const locale: Locale = await getServerLocale();
  const c = COPY[locale];

  const { posts } = await getBlogPosts(locale, category ? { category } : {});
  const categories = collectCategories(posts);

  // Featured = newest post; the rest flow into the grid. When a category filter
  // is active we keep all results in the grid (no oversized hero).
  const hasFilter = Boolean(category);
  const featured = !hasFilter ? posts[0] : undefined;
  const rest = featured ? posts.slice(1) : posts;

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-secondary to-background">
        <div className="absolute inset-0 -z-10 opacity-40">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:py-28 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            {c.eyebrow}
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {c.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {c.lead}
          </p>
        </div>
      </section>

      {posts.length === 0 ? (
        <EmptyState locale={locale} copy={c} />
      ) : (
        <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          {/* Category filters */}
          {categories.length > 0 && (
            <nav className="-mt-6 mb-12 flex flex-wrap items-center justify-center gap-2.5">
              <CategoryChip
                href={withLocalePrefix('/blog', locale)}
                label={c.allCategories}
                active={!category}
              />
              {categories.map((cat) => (
                <CategoryChip
                  key={cat}
                  href={withLocalePrefix(`/blog?category=${encodeURIComponent(cat)}`, locale)}
                  label={cat}
                  active={category === cat}
                />
              ))}
            </nav>
          )}

          {/* Featured post */}
          {featured && (
            <FeaturedCard post={featured} locale={locale} copy={c} />
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <PostCard key={post.id} post={post} locale={locale} copy={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type Copy = (typeof COPY)[Locale];

function CategoryChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary'
      }`}
    >
      {label}
    </Link>
  );
}

function PostMeta({
  post,
  locale,
  copy,
  light = false,
}: {
  post: BlogPost;
  locale: Locale;
  copy: Copy;
  light?: boolean;
}) {
  const date = formatBlogDate(post.publishedAt || post.createdAt, locale);
  const mins = readingMinutes(post.content);
  const tone = light ? 'text-primary-foreground/70' : 'text-muted-foreground';
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${tone}`}>
      {post.author && (
        <>
          <span className="font-medium">{copy.by} {post.author}</span>
          <span aria-hidden>·</span>
        </>
      )}
      {date && (
        <>
          <span dir="ltr">{date}</span>
          <span aria-hidden>·</span>
        </>
      )}
      <span>
        {mins} {copy.minRead}
      </span>
    </div>
  );
}

function FeaturedCard({
  post,
  locale,
  copy,
}: {
  post: BlogPost;
  locale: Locale;
  copy: Copy;
}) {
  const href = withLocalePrefix(`/blog/${post.slug}`, locale);
  return (
    <Link
      href={href}
      className="hover-lift group block overflow-hidden rounded-3xl border border-border bg-background shadow-sm"
    >
      <div className="grid md:grid-cols-2">
        <div className="relative aspect-[16/11] overflow-hidden bg-secondary md:aspect-auto">
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt={post.coverImageAlt || post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <CoverFallback />
          )}
          <span className="absolute start-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow">
            {copy.featured}
          </span>
        </div>
        <div className="flex flex-col justify-center gap-4 p-7 sm:p-10">
          {post.category && (
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              {post.category}
            </span>
          )}
          <h2 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {post.title}
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            {postExcerpt(post, 220)}
          </p>
          <PostMeta post={post} locale={locale} copy={copy} />
          <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            {copy.readMore}
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostCard({
  post,
  locale,
  copy,
}: {
  post: BlogPost;
  locale: Locale;
  copy: Copy;
}) {
  const href = withLocalePrefix(`/blog/${post.slug}`, locale);
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
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <CoverFallback />
        )}
        {post.category && (
          <span className="absolute start-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur">
            {post.category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {postExcerpt(post)}
        </p>
        <PostMeta post={post} locale={locale} copy={copy} />
      </div>
    </Link>
  );
}

function CoverFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary to-accent/15">
      <svg className="h-12 w-12 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    </div>
  );
}

function EmptyState({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-4 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-accent">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>
      <h2 className="mt-6 text-2xl font-bold text-foreground">{copy.emptyTitle}</h2>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">
        {copy.emptyBody}
      </p>
      <Link
        href={withLocalePrefix('/products', locale)}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
      >
        {copy.emptyCta}
        <svg className="h-5 w-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </div>
  );
}
