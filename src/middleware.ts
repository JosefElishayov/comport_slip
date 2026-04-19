
import { NextRequest, NextResponse } from 'next/server';

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
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://cdn.meshulam.co.il",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "frame-src 'self' https://meshulam.co.il https://*.meshulam.co.il https://grow.link https://*.grow.link https://grow.security https://*.grow.security https://creditguard.co.il https://*.creditguard.co.il https://js.stripe.com https://hooks.stripe.com https://pay.google.com https://secure.cardcom.solutions https://checkout.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
    "connect-src 'self' https://*.meshulam.co.il https://grow.link https://*.grow.link https://*.grow.security https://pay.google.com https://*.stripe.com https://*.creditguard.co.il",
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

  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const token = request.cookies.get(TOKEN_COOKIE);
    if (!token?.value) {
      const loginUrl = new URL('/login', request.url);
      return applyCspHeaders(NextResponse.redirect(loginUrl), nonce);
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return applyCspHeaders(response, nonce);
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};

