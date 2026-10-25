// Google cart transfer (UCP) profile — Google reads it from
// https://{domain}/.well-known/ucp. Brainerce builds the profile; we serve it
// verbatim. See: https://brainerce.com/docs/ucp

import { getServerClient } from '@/lib/brainerce';

export const revalidate = 300;

export async function GET() {
  let info: unknown;
  try {
    info = await getServerClient().getStoreInfo();
  } catch {
    // "Could not ask" must not look like "UCP is off".
    return new Response(null, { status: 503, headers: { 'Retry-After': '30' } });
  }

  // Read through a local shape so it compiles on SDKs older than 3.13 (no StoreInfo.ucp).
  const profile = (info as { ucp?: { profile?: unknown } } | null)?.ucp?.profile;
  if (!profile || typeof profile !== 'object') return new Response(null, { status: 404 });

  return new Response(JSON.stringify(profile), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
