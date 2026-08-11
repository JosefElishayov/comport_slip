import { getNonce } from '@/lib/nonce';
import { GTAG_BOOTSTRAP_SNIPPET } from '@/lib/gtag';

/**
 * Google tag (gtag.js) for Google Ads — rendered in <head>.
 *
 * One nonced inline script seeds the dataLayer with Consent Mode v2 defaults
 * and then appends the gtag.js loader; `strict-dynamic` in the middleware CSP
 * covers that injected tag and everything gtag.js loads after it.
 *
 * The inline payload is a module-level constant assembled from literals in
 * `@/lib/gtag` — no request, user or CMS input reaches it, so there is no
 * injection surface. Inline script is the only way to seed the dataLayer
 * before the tag library runs.
 */
export async function GoogleTag() {
  const nonce = await getNonce();
  return (
    <>
      {/* The loader is injected, not parser-discovered — warm the connection early. */}
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <script
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: GTAG_BOOTSTRAP_SNIPPET }}
      />
    </>
  );
}
