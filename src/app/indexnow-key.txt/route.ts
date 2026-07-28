import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/brainerce';

/**
 * IndexNow ownership verification for Brainerce's SEO Autopilot.
 *
 * The platform pings IndexNow whenever it publishes a blog post; search engines
 * then fetch this file and compare it to the key in the ping payload. A 404 here
 * fails verification silently — every ping is discarded and autopilot articles
 * fall back to ordinary (slow) crawl discovery.
 *
 * The key is public by protocol design, not a secret.
 * The `keyLocation` the platform sends points at this exact path, so the route
 * must stay at `/indexnow-key.txt`.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  let key: string | null = null;

  try {
    key = (await getServerClient().getStoreInfo()).seo?.indexNowKey ?? null;
  } catch {
    // Backend hiccup — fall through to the 404 below rather than a 500, so the
    // verifier records "not published yet" instead of a server error.
  }

  // `null` until the store's SEO Autopilot generates a key — 404 is the
  // documented response, and must not be cached in case it appears later.
  if (!key) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  return new NextResponse(key, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
