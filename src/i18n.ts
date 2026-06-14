import he from '../messages/he.json';
import en from '../messages/en.json';
import type { Locale } from '@/lib/locale';

export { defaultLocale, locales, getDirection } from '@/lib/locale';
export type { Locale } from '@/lib/locale';

/** Canonical message shape — derived from the Hebrew (source-of-truth) bundle. */
export type Messages = typeof he;

export const allMessages: Record<Locale, Messages> = {
  he,
  en: en as Messages,
};

export function getMessages(locale: Locale): Messages {
  return allMessages[locale] ?? allMessages.he;
}

/** Backwards-compatible default export (Hebrew) for any non-localized callers. */
export const messages = he;
