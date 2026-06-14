import { cookies } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale, type Locale } from './locale';

/** Active locale for the current request, read from the NEXT_LOCALE cookie.
 *  Use in Server Components to localize Brainerce data fetches via
 *  getServerClient(locale) and to pick localized static content. */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}
