
/* Locale-aware navigation. Wraps next/link + next/navigation so every internal
 * link/route carries the active locale's URL prefix (`/en/...`; the default
 * locale stays at the root). This is the single place that injects the prefix —
 * components import `Link`/`useRouter` from here and need no per-link changes. */
'use client';

import NextLink from 'next/link';
import { useRouter as useNextRouter } from 'next/navigation';
import { forwardRef, useMemo } from 'react';
import type { ComponentProps } from 'react';
import type { Route } from 'next';
import { useOptionalLocale } from '@/providers/locale-provider';
import { withLocalePrefix, type Locale } from '@/lib/locale';

/** Internal app path (not an external URL, mailto:, tel:, hash, etc.). */
function isInternalPath(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

function localizeHref<T>(href: T, locale: Locale): T {
  if (typeof href === 'string') {
    return (isInternalPath(href) ? withLocalePrefix(href, locale) : href) as T;
  }
  if (href && typeof href === 'object' && 'pathname' in href) {
    const { pathname } = href as { pathname?: string };
    if (typeof pathname === 'string' && isInternalPath(pathname)) {
      return { ...href, pathname: withLocalePrefix(pathname, locale) } as T;
    }
  }
  return href;
}

type LinkProps = ComponentProps<typeof NextLink>;

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, ...rest },
  ref
) {
  const locale = useOptionalLocale();
  const localized = useMemo(() => localizeHref(href, locale), [href, locale]);
  return <NextLink ref={ref} href={localized} {...rest} />;
});

type NavOptions = Parameters<ReturnType<typeof useNextRouter>['push']>[1];

/** next/navigation useRouter with internal pushes/replaces/prefetches prefixed
 *  by the active locale. back/forward/refresh pass through unchanged. */
export function useRouter() {
  const router = useNextRouter();
  const locale = useOptionalLocale();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: NavOptions) =>
        router.push(localizeHref(href, locale) as Route, options),
      replace: (href: string, options?: NavOptions) =>
        router.replace(localizeHref(href, locale) as Route, options),
      prefetch: (href: string, options?: Parameters<typeof router.prefetch>[1]) =>
        router.prefetch(localizeHref(href, locale) as Route, options),
    }),
    [router, locale]
  );
}
