
import { NextRequest, NextResponse } from 'next/server';
import { buildStorefrontCsp } from 'brainerce';
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

const API_ORIGIN = new URL(process.env.BRAINERCE_API_URL || 'https://api.brainerce.com').origin;

// Sources this storefront needs on top of the SDK's storefront policy:
// Cloudflare Web Analytics, and Google Ads gtag.js — its conversion-linker
// iframe on td.doubleclick.net, remarketing frames from googletagmanager.com.
const EXTRA_SOURCES: Record<string, string[]> = {
  'script-src': ['https://static.cloudflareinsights.com'],
  'frame-src': [
    'https://www.googletagmanager.com',
    'https://td.doubleclick.net',
    'https://*.doubleclick.net',
  ],
  'connect-src': [
    'https://brainerce.com',
    'https://*.brainerce.com',
    'https://cloudflareinsights.com',
    'https://*.cloudflareinsights.com',
    'https://*.g.doubleclick.net',
    'https://td.doubleclick.net',
    'https://pagead2.googlesyndication.com',
    'https://www.google.co.il',
  ],
};

// The SDK owns the payment-provider hosts (frame-src / connect-src come from
// the same allowlist `startPayment` enforces), so a newly enabled provider
// needs no CSP edit here.
function buildCsp(nonce: string): string {
  const base = buildStorefrontCsp({
    nonce,
    apiOrigin: API_ORIGIN,
    // Next dev's eval-source-map devtool needs 'unsafe-eval'; prod never evals.
    isDev: process.env.NODE_ENV === 'development',
  });
  return base
    .split(';')
    .map((directive) => directive.trim())
    .filter(Boolean)
    .map((directive) => {
      const [name, ...sources] = directive.split(/\s+/);
      const extra = EXTRA_SOURCES[name];
      if (!extra) return directive;
      return [name, ...new Set([...sources, ...extra])].join(' ');
    })
    .join('; ');
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

