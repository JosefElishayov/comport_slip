import { NextRequest, NextResponse } from 'next/server';
import { checkCsrf } from '@/lib/csrf';

const TOKEN_COOKIE = 'brainerce_customer_token';
const LOGGED_IN_COOKIE = 'brainerce_logged_in';

export async function POST(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const response = NextResponse.json({ success: true });
  response.cookies.delete(TOKEN_COOKIE);
  response.cookies.delete(LOGGED_IN_COOKIE);
  return response;
}
