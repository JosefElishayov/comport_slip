import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validatePassword } from '@/lib/validation';
import { checkCsrf } from '@/lib/csrf';

const BACKEND_URL = (process.env.BRAINERCE_API_URL || 'https://api.brainerce.com').replace(
  /\/$/,
  ''
);

const CONNECTION_ID = process.env.NEXT_PUBLIC_BRAINERCE_CONNECTION_ID || '';

const RESET_TOKEN_COOKIE = 'brainerce_reset_token';

/**
 * BFF endpoint for password reset.
 * Reads the reset token from the httpOnly cookie (set by /api/auth/reset-callback)
 * and proxies the request to the backend. The token never touches client JS.
 */
export async function POST(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  // Read reset token from httpOnly cookie
  const cookieStore = await cookies();
  const resetTokenCookie = cookieStore.get(RESET_TOKEN_COOKIE);

  if (!resetTokenCookie?.value) {
    return NextResponse.json(
      { error: 'No reset token found. Please request a new password reset link.' },
      { status: 400 }
    );
  }

  // Parse request body
  const body = await request.json();
  const { newPassword } = body;

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  // Proxy to backend
  const backendUrl = `${BACKEND_URL}/api/vc/${CONNECTION_ID}/customers/reset-password`;

  const backendResponse = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: request.nextUrl.origin,
    },
    body: JSON.stringify({
      token: resetTokenCookie.value,
      newPassword,
    }),
  });

  let data: unknown;
  try {
    data = await backendResponse.json();
  } catch {
    const response = NextResponse.json({ error: 'Invalid response from backend' }, { status: 502 });
    response.cookies.delete(RESET_TOKEN_COOKIE);
    return response;
  }

  const response = NextResponse.json(data, {
    status: backendResponse.status,
  });

  // Always clear the reset token cookie after use (success or failure)
  response.cookies.delete(RESET_TOKEN_COOKIE);

  return response;
}
