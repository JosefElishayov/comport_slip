import { NextRequest, NextResponse } from 'next/server';

const TOKEN_COOKIE = 'brainerce_customer_token';
const LOGGED_IN_COOKIE = 'brainerce_logged_in';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function isSecure(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * OAuth callback handler.
 * The backend redirects here with ?token=jwt&oauth_success=true after OAuth code exchange.
 * We set the httpOnly cookie and redirect to the client-side callback page (without the token).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');
  const oauthSuccess = searchParams.get('oauth_success');
  const oauthError = searchParams.get('oauth_error');

  // Build redirect URL to client-side callback page
  const redirectUrl = new URL('/auth/callback', request.url);

  if (oauthError) {
    redirectUrl.searchParams.set('oauth_error', oauthError);
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }

  if (oauthSuccess === 'true' && token) {
    redirectUrl.searchParams.set('oauth_success', 'true');

    const response = NextResponse.redirect(redirectUrl);

    // Set httpOnly cookie with the token
    response.cookies.set(TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: isSecure(),
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    // Set indicator cookie (readable by client JS)
    response.cookies.set(LOGGED_IN_COOKIE, '1', {
      httpOnly: false,
      secure: isSecure(),
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    // Prevent token leaking via Referer header on the downstream navigation
    response.headers.set('Referrer-Policy', 'no-referrer');

    return response;
  }

  // Fallback: no token or success flag
  redirectUrl.searchParams.set('oauth_error', 'Authentication failed');
  const response = NextResponse.redirect(redirectUrl);
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
