import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale, type Locale } from './locale';

/** Active locale for the current request. Derived from the URL prefix by the
 *  middleware and forwarded via the `x-locale` header, so it is authoritative
 *  for crawlers (no cookie required). Falls back to the NEXT_LOCALE cookie if
 *  the header is absent (e.g. a request the middleware did not process).
 *  Use in Server Components to localize Brainerce data fetches via
 *  getServerClient(locale) and to pick localized static content. */
export async function getServerLocale(): Promise<Locale> {
  const fromHeader = (await headers()).get('x-locale');
  if (fromHeader) return normalizeLocale(fromHeader);
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}
