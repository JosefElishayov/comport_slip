import { NextRequest, NextResponse } from 'next/server';

const RESET_TOKEN_COOKIE = 'brainerce_reset_token';
const RESET_TOKEN_MAX_AGE = 10 * 60; // 10 minutes

function isSecure(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Password-reset callback handler.
 * The email link redirects here with ?token=... from the backend.
 * We store the token in an httpOnly cookie and redirect to /reset-password (clean URL).
 * This mirrors the OAuth callback pattern — the token never reaches client JS.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');

  if (!token) {
    const redirectUrl = new URL('/forgot-password', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUrl = new URL('/reset-password', request.url);
  const response = NextResponse.redirect(redirectUrl);

  // Set httpOnly cookie with the reset token (short-lived)
  response.cookies.set(RESET_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: RESET_TOKEN_MAX_AGE,
  });

  // Prevent token leaking via Referer header
  response.headers.set('Referrer-Policy', 'no-referrer');

  return response;
}
