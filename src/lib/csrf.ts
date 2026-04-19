import { NextRequest, NextResponse } from 'next/server';

export const CSRF_HEADER = 'x-requested-with';
export const CSRF_VALUE = 'brainerce';

export function checkCsrf(request: NextRequest): NextResponse | null {
  if (request.headers.get(CSRF_HEADER) !== CSRF_VALUE) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }
  return null;
}
