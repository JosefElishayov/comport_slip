import { NextRequest, NextResponse } from 'next/server';
import { checkCsrf } from '@/lib/csrf';

const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_STATE_MAX_AGE = 10 * 60; // 10 minutes

function isSecure(): boolean {
  return process.env.NODE_ENV === 'production';
}

function generateState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Called by the client before initiating an OAuth redirect.
 * Generates a cryptographic nonce stored in an httpOnly cookie.
 * The nonce travels through the OAuth flow embedded in the redirect URL
 * and is verified in oauth-callback, preventing login-CSRF / session fixation.
 */
export async function POST(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const state = generateState();

  const response = NextResponse.json({ state });
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_STATE_MAX_AGE,
  });

  return response;
}
