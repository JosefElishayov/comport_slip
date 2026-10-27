import type { Metadata } from 'next';
import { withLocalePrefix, type Locale } from '@/lib/locale';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://comfortsleep.co.il').replace(/\/$/, '');

/** For routes whose slug is shared across languages, not translated products/posts. */
export function localizedAlternates(path: string, locale: Locale): Metadata['alternates'] {
  return {
    canonical: withLocalePrefix(path, locale),
    languages: {
      'he-IL': withLocalePrefix(path, 'he'),
      'en-US': withLocalePrefix(path, 'en'),
      'x-default': withLocalePrefix(path, 'he'),
    },
  };
}

export function plainText(input: string): string {
  return input
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function textSummary(input: string, max = 160): string {
  const text = plainText(input);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${space > max * 0.6 ? cut.slice(0, space) : cut}…`;
}
