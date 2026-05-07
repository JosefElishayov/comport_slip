import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center"
      dir="rtl"
    >
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
        כנראה שיש לך{' '}
        <span style={{ color: 'var(--sale, #dc2626)' }}>404 סיבות</span>{' '}
        למצוא את המזרן המועדף עליך
      </h1>

      {/* Sub-text */}
      <p
        className="text-[15px] leading-relaxed max-w-sm mb-10"
        style={{ color: 'var(--text-2, #6b6a66)' }}
      >
        הדף שחיפשת הלך לישון ולא קם.
        <br />
        אל תדאג — אנחנו כאן כדי שתישן טוב.
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
        לחנות המזרנים
        <span aria-hidden="true" className="text-base" style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>→</span>
      </Link>

      {/* Trust signals */}
      <div
        className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-10 text-[13px]"
        style={{ color: 'var(--text-2, #6b6a66)' }}
      >
        <span>✓ משלוח חינם מ-₪299</span>
        <span>✓ החזרה בתוך 30 יום</span>
        <span>✓ תשלום מאובטח</span>
      </div>
    </div>
  );
}
