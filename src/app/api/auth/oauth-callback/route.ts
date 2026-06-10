import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/brainerce';

const TOKEN_COOKIE = 'brainerce_customer_token';
const LOGGED_IN_COOKIE = 'brainerce_logged_in';
const OAUTH_STATE_COOKIE = 'oauth_state';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function isSecure(): boolean {
  return process.env.NODE_ENV === 'production';
}

function clearStateCookie(response: NextResponse): void {
  response.cookies.delete(OAUTH_STATE_COOKIE);
}

function failRedirect(request: NextRequest, message: string): NextResponse {
  const redirectUrl = new URL('/auth/callback', request.url);
  redirectUrl.searchParams.set('oauth_error', message);
  const response = NextResponse.redirect(redirectUrl);
  clearStateCookie(response);
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

/**
 * OAuth callback handler.
 * The backend redirects here with ?auth_code=code&oauth_success=true&state=nonce after the
 * OAuth provider exchange. We verify the state nonce against the httpOnly cookie set by
 * /api/auth/oauth-init to prevent login-CSRF / session fixation, then swap the single-use
 * auth_code for the customer JWT server-side and set it as an httpOnly cookie.
 *
 * The single-use code keeps the JWT out of the browser URL/history (unlike the legacy
 * ?token= flow, which is being removed in the next brainerce major release).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const authCode = searchParams.get('auth_code');
  const state = searchParams.get('state');
  const oauthSuccess = searchParams.get('oauth_success');
  const oauthError = searchParams.get('oauth_error');

  if (oauthError) {
    return failRedirect(request, oauthError);
  }

  // Verify state nonce: must match the cookie set during oauth-init
  const stateCookie = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const stateValid = !!(state && stateCookie && state === stateCookie);

  if (oauthSuccess !== 'true' || !authCode || !stateValid) {
    return failRedirect(request, 'Authentication failed');
  }

  // Exchange the single-use auth_code for the customer JWT (server-to-server,
  // so the token never touches the browser URL).
  let token: string | undefined;
  try {
    const result = await getServerClient().exchangeOAuthCode(authCode);
    token = result.token;
  } catch (err) {
    console.error('OAuth code exchange failed:', err);
    return failRedirect(request, 'Authentication failed');
  }

  if (!token) {
    return failRedirect(request, 'Authentication failed');
  }

  const redirectUrl = new URL('/auth/callback', request.url);
  redirectUrl.searchParams.set('oauth_success', 'true');

  const response = NextResponse.redirect(redirectUrl);
  clearStateCookie(response);

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

  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
