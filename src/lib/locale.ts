/**
 * Shared locale constants & helpers — pure module, safe in both Server and
 * Client Components (no next/headers, no React imports here).
 */

export const locales = ['he', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'he';

/** Cookie that stores the visitor's chosen UI language. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

const DIRECTIONS: Record<Locale, 'rtl' | 'ltr'> = {
  he: 'rtl',
  en: 'ltr',
};

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return DIRECTIONS[locale];
}

/** Coerce any string (cookie value, header, etc.) into a supported Locale. */
export function normalizeLocale(value: string | null | undefined): Locale {
  if (value && (locales as readonly string[]).includes(value)) {
    return value as Locale;
  }
  return defaultLocale;
}

/**
 * Add the locale URL prefix to an internal path. The default locale (he) stays
 * at the root with no prefix; other locales get a leading `/<locale>`.
 * Idempotent — a path that is already prefixed is returned unchanged.
 */
export function withLocalePrefix(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path;
  const prefix = `/${locale}`;
  if (path === prefix || path.startsWith(`${prefix}/`)) return path;
  if (path === '/') return prefix;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${prefix}${clean}`;
}

/**
 * Split a pathname into its locale (derived from a leading `/<locale>` prefix)
 * and the remaining unprefixed path. No prefix → default locale, path unchanged.
 */
export function stripLocalePrefix(pathname: string): { locale: Locale; pathname: string } {
  for (const loc of locales) {
    if (loc === defaultLocale) continue;
    const prefix = `/${loc}`;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const rest = pathname.slice(prefix.length);
      return { locale: loc, pathname: rest === '' ? '/' : rest };
    }
  }
  return { locale: defaultLocale, pathname };
}
