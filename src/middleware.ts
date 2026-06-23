
import { NextRequest, NextResponse } from 'next/server';
import { stripLocalePrefix, withLocalePrefix } from '@/lib/locale';

const TOKEN_COOKIE = 'brainerce_customer_token';

/** Routes that require customer authentication */
const PROTECTED_PATHS = ['/account'];

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  // Next dev uses webpack's eval-source-map devtool, which requires 'unsafe-eval'
  // to execute module code. Prod builds never eval, so this only loosens dev.
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https://static.cloudflareinsights.com`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://static.cloudflareinsights.com`;
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://cdn.meshulam.co.il",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // Active payment provider: Meshulam/Grow only. Add other providers here if enabled in Brainerce.
    "frame-src 'self' https://brainerce.com https://*.brainerce.com https://meshulam.co.il https://*.meshulam.co.il https://grow.link https://*.grow.link https://grow.security https://*.grow.security https://pay.google.com",
    "connect-src 'self' https://brainerce.com https://*.brainerce.com https://*.meshulam.co.il https://grow.link https://*.grow.link https://*.grow.security https://pay.google.com https://cloudflareinsights.com https://*.cloudflareinsights.com",
    "worker-src 'self' blob:",
    // 'self' (not 'none') so iframe-based payment providers (e.g. Cardcom)
    // can redirect the iframe back to /payment-complete on the storefront
    // itself after a successful charge.
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

function applyCspHeaders(response: NextResponse, nonce: string): NextResponse {
  response.headers.set('Content-Security-Policy', buildCsp(nonce));
  response.headers.set('x-nonce', nonce);
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Locale is derived from the URL prefix (`/en/...`), not a cookie — so it is
  // authoritative for crawlers (which carry no cookie). The default locale (he)
  // lives at the root unprefixed. Prefixed requests are rewritten back onto the
  // shared route tree, with the active locale forwarded via `x-locale`.
  const { locale, pathname: barePath } = stripLocalePrefix(pathname);
  const hasPrefix = barePath !== pathname;

  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-locale', locale);

  // Forward the visitor's country (edge geo header) so Server Components can
  // resolve the right region/currency for per-region pricing. Vercel sets
  // `x-vercel-ip-country`; Cloudflare sets `cf-ipcountry` — support both.
  const country =
    request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry');
  if (country) {
    requestHeaders.set('x-geo-country', country);
  }

  const isProtected = PROTECTED_PATHS.some((p) => barePath.startsWith(p));

  if (isProtected) {
    const token = request.cookies.get(TOKEN_COOKIE);
    if (!token?.value) {
      // Keep the visitor in their language when bouncing to login.
      const loginUrl = new URL(withLocalePrefix('/login', locale), request.url);
      return applyCspHeaders(NextResponse.redirect(loginUrl), nonce);
    }
  }

  // For `/en/...` rewrite onto the unprefixed route tree so the same routes
  // serve both languages; the browser URL keeps its prefix.
  let response: NextResponse;
  if (hasPrefix) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = barePath;
    response = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }
  return applyCspHeaders(response, nonce);
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};

