import { NextRequest, NextResponse } from 'next/server';

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

/**
 * OAuth callback handler.
 * The backend redirects here with ?token=jwt&oauth_success=true&state=nonce after OAuth code exchange.
 * We verify the state nonce against the httpOnly cookie set by /api/auth/oauth-init to prevent
 * login-CSRF / session fixation, then set the auth cookie and redirect to the client-side callback.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');
  const state = searchParams.get('state');
  const oauthSuccess = searchParams.get('oauth_success');
  const oauthError = searchParams.get('oauth_error');

  const redirectUrl = new URL('/auth/callback', request.url);

  if (oauthError) {
    redirectUrl.searchParams.set('oauth_error', oauthError);
    const response = NextResponse.redirect(redirectUrl);
    clearStateCookie(response);
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }

  // Verify state nonce: must match the cookie set during oauth-init
  const stateCookie = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const stateValid = !!(state && stateCookie && state === stateCookie);

  if (oauthSuccess === 'true' && token && stateValid) {
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

  // State mismatch, missing token, or no success flag
  redirectUrl.searchParams.set('oauth_error', 'Authentication failed');
  const response = NextResponse.redirect(redirectUrl);
  clearStateCookie(response);
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
