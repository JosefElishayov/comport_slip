import { NextResponse } from 'next/server';
import { getBlogPosts } from '@/lib/blog';
import { categoryPath, flattenLinkableCategories, getCategoryTree } from '@/lib/categories';
import { defaultLocale } from '@/lib/locale';

/**
 * llms.txt — a plain-text site summary for AI answer engines (see llmstxt.org).
 *
 * Generated per request rather than shipped as a static file so the two parts
 * that actually change — the category landing pages and the SEO Autopilot's
 * articles — stay current without a redeploy. The positioning copy below is the
 * merchant's own and is intentionally hand-written.
 */
export const dynamic = 'force-dynamic';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://comfortsleep.co.il').replace(
  /\/$/,
  ''
);

const PREAMBLE = `# קומפורט סליפ (Comfort Sleep)

> חנות מזרנים ומוצרי שינה ישראלית מבית רהיטי וייס. למעלה מ-40 שנות ניסיון בעולם המזרנים, מיטות ובסיסים. מציעה את המותגים המובילים בישראל ובעולם — עמינח, פולירון, סימונס ועוד — עם משלוח חינם, החזרה תוך 30 יום ותשלום מאובטח.

## עיקרי האתר

- [דף הבית](${baseUrl}/): סקירה כללית של החנות, מבצעים ומוצרים חדשים
- [כל המוצרים](${baseUrl}/products): קטלוג המוצרים המלא — מזרנים, מיטות, בסיסים ומוצרי שינה
- [יומן השינה (בלוג)](${baseUrl}/blog): מדריכי קנייה, השוואות מזרנים וטיפים מקצועיים
- [אודות](${baseUrl}/about): סיפור המותג, ההיסטוריה של רהיטי וייס וערכי החנות
- [צור קשר](${baseUrl}/contact): פרטי יצירת קשר וטופס פנייה

## מידע ללקוח

- [משלוחים](${baseUrl}/shipping)
- [החזרות והחלפות](${baseUrl}/returns)
- [תנאי שימוש](${baseUrl}/terms)
- [מדיניות פרטיות](${baseUrl}/privacy)
- [נגישות](${baseUrl}/accessibility)`;

const EPILOGUE = `## מותגים נבחרים

- עמינח (Aminach)
- פולירון (Polyron)
- סימונס (Simmons)

## שירות

- משלוח חינם בהזמנות מעל סכום מסוים
- מדיניות החזרה: 30 יום
- תשלום מאובטח (SSL)
- שירות לקוחות בעברית`;

/** Collapse a description into a single clean line for the link annotation. */
function oneLine(value: string | null | undefined, max = 180): string {
  if (!value) return '';
  const text = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
}

export async function GET() {
  const sections: string[] = [PREAMBLE];

  const [tree, blog] = await Promise.all([
    getCategoryTree(defaultLocale),
    getBlogPosts(defaultLocale, { limit: 20 }),
  ]);

  const categories = flattenLinkableCategories(tree);
  if (categories.length > 0) {
    const lines = categories.map((cat) => `- [${cat.name}](${baseUrl}${categoryPath(cat.slug)})`);
    sections.push(['## קטגוריות מוצרים', '', ...lines].join('\n'));
  }

  if (blog.posts.length > 0) {
    const lines = blog.posts.map((post) => {
      const summary = oneLine(post.seoDescription || post.excerpt || post.content);
      const url = `${baseUrl}/blog/${post.slug}`;
      return summary ? `- [${post.title}](${url}): ${summary}` : `- [${post.title}](${url})`;
    });
    sections.push(['## מאמרים ומדריכים', '', ...lines].join('\n'));
  }

  sections.push(EPILOGUE);

  return new NextResponse(`${sections.join('\n\n')}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
