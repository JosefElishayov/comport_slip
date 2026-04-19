import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

const BACKEND_URL = (process.env.BRAINERCE_API_URL || 'https://api.brainerce.com').replace(
  /\/$/,
  ''
);

const CONNECTION_ID = process.env.NEXT_PUBLIC_BRAINERCE_CONNECTION_ID || '';

const TOKEN_COOKIE = 'brainerce_customer_token';
const LOGGED_IN_COOKIE = 'brainerce_logged_in';

/**
 * Auth status check endpoint.
 * Reads the httpOnly cookie, validates against backend, returns auth state.
 */
export async function GET() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(TOKEN_COOKIE);

  if (!tokenCookie?.value) {
    return NextResponse.json({ isLoggedIn: false });
  }

  // Derive Origin from the incoming request so the backend's BrowserOriginGuard accepts it
  const requestHeaders = await headers();
  const host = requestHeaders.get('host') || 'localhost:3000';
  const proto = requestHeaders.get('x-forwarded-proto') || 'http';
  const origin = requestHeaders.get('origin') || `${proto}://${host}`;

  try {
    // Validate token by calling backend profile endpoint
    const response = await fetch(`${BACKEND_URL}/api/vc/${CONNECTION_ID}/customers/me`, {
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`,
        'Content-Type': 'application/json',
        Origin: origin,
      },
    });

    if (!response.ok) {
      // Token is invalid or expired — clear cookies
      const res = NextResponse.json({ isLoggedIn: false });
      res.cookies.delete(TOKEN_COOKIE);
      res.cookies.delete(LOGGED_IN_COOKIE);
      return res;
    }

    const customer = await response.json();
    return NextResponse.json({ isLoggedIn: true, customer });
  } catch {
    // Backend unreachable — don't clear cookies, might be temporary
    return NextResponse.json({ isLoggedIn: false, error: 'Service unavailable' }, { status: 503 });
  }
}
