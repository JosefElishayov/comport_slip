'use client';

import { useCallback } from 'react';
import { LOCALE_COOKIE, locales, type Locale } from '@/lib/locale';
import { useLocale } from '@/providers/locale-provider';

const LABELS: Record<Locale, string> = {
  he: 'עברית',
  en: 'English',
};

const SHORT: Record<Locale, string> = {
  he: 'עב',
  en: 'EN',
};

export function LanguageSwitcher({
  isTransparent = false,
  variant = 'inline',
}: {
  isTransparent?: boolean;
  variant?: 'inline' | 'block';
}) {
  const { locale: active } = useLocale();

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === active) return;
      // 1 year, site-wide. Read by the layout (server) on the next request.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      // Full reload so Server Components (static pages, <html dir>) and the
      // store data re-render in the chosen language.
      window.location.reload();
    },
    [active]
  );

  const base = 'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors';
  const activeCls = isTransparent ? 'bg-white/20 text-white' : 'bg-secondary text-foreground';
  const idleCls = isTransparent
    ? 'text-white/70 hover:text-white'
    : 'text-muted-foreground hover:text-primary';

  if (variant === 'block') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5" role="group" aria-label="Language">
        {locales.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc)}
            aria-pressed={loc === active}
            className={`${base} ${loc === active ? activeCls : idleCls}`}
            lang={loc}
          >
            {LABELS[loc]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-0.5 rounded-full p-0.5 ${isTransparent ? 'border border-white/30' : 'border border-border'}`}
      role="group"
      aria-label="Language"
    >
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          aria-pressed={loc === active}
          aria-label={LABELS[loc]}
          className={`${base} ${loc === active ? activeCls : idleCls}`}
          lang={loc}
        >
          {SHORT[loc]}
        </button>
      ))}
    </div>
  );
}
