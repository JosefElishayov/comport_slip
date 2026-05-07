import { NextRequest, NextResponse } from 'next/server';

export const CSRF_HEADER = 'x-requested-with';
export const CSRF_VALUE = 'brainerce';

function fail(): NextResponse {
  return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
}

export function checkCsrf(request: NextRequest): NextResponse | null {
  // Layer 1: custom header — browsers can't send this from a cross-origin HTML form
  if (request.headers.get(CSRF_HEADER) !== CSRF_VALUE) return fail();

  // Layer 2: Origin header — when present it must match the server's own host.
  // Browsers always set Origin on cross-origin fetch; attackers can't spoof it.
  // Same-origin fetch may omit Origin (allowed), so we only reject mismatches.
  const origin = request.headers.get('origin');
  if (origin) {
    const host = request.headers.get('host');
    try {
      if (new URL(origin).host !== host) return fail();
    } catch {
      return fail();
    }
  }

  return null;
}
