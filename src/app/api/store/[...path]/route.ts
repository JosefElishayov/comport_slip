// SECURITY: This BFF proxy intentionally has no application-level rate limiting.
// Rate limiting is the deployer's responsibility — configure it at the platform
// edge (Vercel Firewall, Cloudflare, nginx) or add a Redis-backed limiter
// (e.g. @upstash/ratelimit) here before going to production. Auth endpoints
// like customers/login and customers/register are the most important to cover.
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkCsrf } from '@/lib/csrf';

const BACKEND_URL = (process.env.BRAINERCE_API_URL || 'https://api.brainerce.com').replace(
  /\/$/,
  ''
);

const TOKEN_COOKIE = 'brainerce_customer_token';
const LOGGED_IN_COOKIE = 'brainerce_logged_in';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const BACKEND_TIMEOUT_MS = 15_000;

/** Auth endpoints whose responses contain tokens to intercept */
const AUTH_ENDPOINTS = ['customers/login', 'customers/register', 'customers/verify-email'];

function isAuthEndpoint(path: string): boolean {
  return AUTH_ENDPOINTS.some((ep) => path.endsWith(ep));
}

function isSafePathSegment(segment: string): boolean {
  if (!segment) return false;
  if (segment === '.' || segment === '..') return false;
  if (segment.includes('/') || segment.includes('\\')) return false;
  if (segment.includes('\0')) return false;
  return true;
}

function isSecure(): boolean {
  return process.env.NODE_ENV === 'production';
}

function setAuthCookies(response: NextResponse, token: string): void {
  response.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set(LOGGED_IN_COOKIE, '1', {
    httpOnly: false,
    secure: isSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete(TOKEN_COOKIE);
  response.cookies.delete(LOGGED_IN_COOKIE);
}

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] }
): Promise<NextResponse> {
  const method = request.method;

  // Reject path-traversal attempts before constructing the backend URL
  if (!params.path.every(isSafePathSegment)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  // CSRF protection for mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfError = checkCsrf(request);
    if (csrfError) return csrfError;
  }

  // Build backend URL from path segments
  const pathSegments = params.path.join('/');
  const backendUrl = new URL(`${BACKEND_URL}/${pathSegments}`);

  // Forward query parameters
  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  // Build headers for backend request
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Send the proxy's own origin (not the client-supplied Origin header).
  // The backend's BrowserOriginGuard only checks for presence of Origin/Referer,
  // so forwarding a client-controlled value adds spoofing surface for nothing.
  headers['Origin'] = request.nextUrl.origin;

  // Forward SDK version header if present
  const sdkVersion = request.headers.get('x-sdk-version');
  if (sdkVersion) {
    headers['X-SDK-Version'] = sdkVersion;
  }

  // Forward Accept-Language so the backend locale middleware can resolve translations
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    headers['Accept-Language'] = acceptLanguage;
  }

  // Add auth token from httpOnly cookie
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(TOKEN_COOKIE);
  if (tokenCookie?.value) {
    headers['Authorization'] = `Bearer ${tokenCookie.value}`;
  }

  // Forward request body for non-GET requests
  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await request.text();
    } catch {
      // No body
    }
  }

  // Proxy the request to backend
  let backendResponse: Response;
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), BACKEND_TIMEOUT_MS);
  try {
    backendResponse = await fetch(backendUrl.toString(), {
      method,
      headers,
      body,
      signal: abortController.signal,
    });
  } catch (error) {
    const isTimeout = (error as Error)?.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? 'Backend request timed out' : 'Backend service unavailable' },
      { status: isTimeout ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // Read response body
  const responseText = await backendResponse.text();

  // For auth endpoints: intercept token, set cookie, strip token from response
  if (backendResponse.ok && method === 'POST' && isAuthEndpoint(pathSegments)) {
    try {
      const data = JSON.parse(responseText);
      if (data.token) {
        const token = data.token;

        // Strip token from client response
        const { token: _stripped, ...safeData } = data;

        const response = NextResponse.json(safeData, {
          status: backendResponse.status,
        });
        setAuthCookies(response, token);
        return response;
      }
    } catch {
      // Not JSON or no token field — pass through
    }
  }

  // Handle 401 responses: clear auth cookies
  if (backendResponse.status === 401 && tokenCookie?.value) {
    const response = new NextResponse(responseText, {
      status: backendResponse.status,
      headers: {
        'Content-Type': backendResponse.headers.get('Content-Type') || 'application/json',
      },
    });
    clearAuthCookies(response);
    return response;
  }

  // Sanitize 5xx responses so backend internals don't leak to the client
  if (backendResponse.status >= 500) {
    console.error(`[proxy] backend ${backendResponse.status} on ${pathSegments}:`, responseText);
    return NextResponse.json(
      { error: 'Backend service error' },
      { status: backendResponse.status }
    );
  }

  // Pass through response as-is
  return new NextResponse(responseText, {
    status: backendResponse.status,
    headers: {
      'Content-Type': backendResponse.headers.get('Content-Type') || 'application/json',
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}
