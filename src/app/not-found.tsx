import Link from 'next/link';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale, type Locale } from '@/lib/locale';

const CONTENT = {
  he: {
    headlinePre: 'כנראה שיש לך',
    headlineEm: '404 סיבות',
    headlinePost: 'למצוא את המזרן המועדף עליך',
    sub1: 'הדף שחיפשת הלך לישון ולא קם.',
    sub2: 'אל תדאג — אנחנו כאן כדי שתישן טוב.',
    cta: 'לחנות המזרנים',
    trust: ['✓ משלוח חינם מ-₪299', '✓ החזרה בתוך 30 יום', '✓ תשלום מאובטח'],
  },
  en: {
    headlinePre: 'Looks like you have',
    headlineEm: '404 reasons',
    headlinePost: 'to find your favorite mattress',
    sub1: 'The page you were looking for went to sleep and didn’t wake up.',
    sub2: 'Don’t worry — we’re here to help you sleep well.',
    cta: 'To the mattress store',
    trust: ['✓ Free shipping over ₪299', '✓ 30-day returns', '✓ Secure checkout'],
  },
} as const;

export default async function NotFound() {
  const locale: Locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const c = CONTENT[locale];
  const isRtl = locale === 'he';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {/* 404 number */}
      <div className="relative select-none mb-2">
        <span
          className="text-[clamp(7rem,22vw,14rem)] font-black leading-none tracking-tighter"
          style={{ color: 'var(--bg-3, #eae8e3)' }}
        >
          404
        </span>
        <span
          className="absolute inset-0 flex items-center justify-center text-[clamp(7rem,22vw,14rem)] font-black leading-none tracking-tighter opacity-[0.06]"
          aria-hidden="true"
          style={{ color: 'var(--text, #1a1916)' }}
        >
          404
        </span>
      </div>

      {/* Mattress icon */}
      <div className="text-[clamp(2.5rem,6vw,4rem)] mb-6" aria-hidden="true">
        🛏️
      </div>

      {/* Headline */}
      <h1
        className="text-[clamp(1.5rem,4vw,2.5rem)] font-bold mb-4 leading-snug max-w-xl"
        style={{ color: 'var(--text, #1a1916)', fontFamily: 'inherit' }}
      >
        {c.headlinePre}{' '}
        <span style={{ color: 'var(--sale, #dc2626)' }}>{c.headlineEm}</span>{' '}
        {c.headlinePost}
      </h1>

      {/* Sub-text */}
      <p
        className="text-[15px] leading-relaxed max-w-sm mb-10"
        style={{ color: 'var(--text-2, #6b6a66)' }}
      >
        {c.sub1}
        <br />
        {c.sub2}
      </p>

      {/* CTA */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 rounded-lg px-8 py-4 text-[15px] font-semibold transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
        style={{
          background: 'var(--accent, #1a1916)',
          color: 'var(--accent-fg, #fafaf8)',
        }}
      >
        {c.cta}
        <span
          aria-hidden="true"
          className="text-base"
          style={{ transform: isRtl ? 'scaleX(-1)' : 'none', display: 'inline-block' }}
        >
          →
        </span>
      </Link>

      {/* Trust signals */}
      <div
        className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-10 text-[13px]"
        style={{ color: 'var(--text-2, #6b6a66)' }}
      >
        {c.trust.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}
