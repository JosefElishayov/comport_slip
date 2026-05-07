import { NextRequest, NextResponse } from 'next/server';

const RESET_TOKEN_COOKIE = 'brainerce_reset_token';
const RESET_TOKEN_MAX_AGE = 10 * 60; // 10 minutes

// JWTs are three base64url segments separated by dots
const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const TOKEN_MAX_LENGTH = 2048;

function isSecure(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Password-reset callback handler.
 * The email link redirects here with ?token=... from the backend.
 * We validate the token format to prevent session fixation with crafted tokens,
 * store it in an httpOnly cookie, and redirect to /reset-password (clean URL).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');

  const invalid =
    !token ||
    token.length > TOKEN_MAX_LENGTH ||
    !JWT_RE.test(token);

  if (invalid) {
    return NextResponse.redirect(new URL('/forgot-password', request.url));
  }

  const redirectUrl = new URL('/reset-password', request.url);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set(RESET_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: RESET_TOKEN_MAX_AGE,
  });

  response.headers.set('Referrer-Policy', 'no-referrer');

  return response;
}
