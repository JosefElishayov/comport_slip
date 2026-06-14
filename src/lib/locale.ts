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
