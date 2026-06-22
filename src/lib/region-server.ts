import { cookies, headers } from 'next/headers';
import { getServerClient } from './brainerce';
import {
  BASE_COUNTRY,
  BASE_CURRENCY,
  GEO_COUNTRY_HEADER,
  REGION_COOKIE,
  REGION_COUNTRY_COOKIE,
  normalizeCountry,
} from './region';

/** Sentinel stored in REGION_COOKIE when the visitor resolves to the base currency. */
const BASE_REGION_SENTINEL = 'base';

/** In-memory country → regionId cache, so we don't hit getAutoRegion on every render. */
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const regionCache = new Map<string, { regionId: string | null; exp: number }>();

async function resolveRegionForCountry(country: string): Promise<string | null> {
  const cached = regionCache.get(country);
  if (cached && cached.exp > Date.now()) return cached.regionId;

  let regionId: string | null = null;
  try {
    const client = getServerClient();
    const res = (await client.getAutoRegion(country)) as {
      region?: { id?: string; currency?: string } | null;
      matched?: boolean;
    };
    const region = res?.region;
    // Only a non-base currency needs a display overlay; base currency → no region.
    if (res?.matched && region?.id && region.currency && region.currency !== BASE_CURRENCY) {
      regionId = region.id;
    }
  } catch {
    // Backend hiccup — fall back to base currency rather than erroring the page.
    regionId = null;
  }

  regionCache.set(country, { regionId, exp: Date.now() + CACHE_TTL_MS });
  return regionId;
}

/**
 * Region id for the current request, or `undefined` for the base currency.
 *
 * Resolution order:
 *  1. `brainerce_region` cookie — an explicit choice already resolved (regionId,
 *     or the `base` sentinel meaning "no overlay"). Avoids re-resolving.
 *  2. Country from the `brainerce_country` cookie (manual switch / local testing)
 *     or the `x-geo-country` header the middleware derives from `cf-ipcountry`.
 *  3. `getAutoRegion(country)` (cached) → region id when its currency differs
 *     from the store base currency.
 *
 * Use in Server Components to pass `regionId` to product fetches so prices come
 * back with `displayPrice`/`displayCurrency` in the visitor's currency.
 */
export async function getServerRegionId(): Promise<string | undefined> {
  const cookieStore = await cookies();

  const chosen = cookieStore.get(REGION_COOKIE)?.value;
  if (chosen) {
    return chosen === BASE_REGION_SENTINEL ? undefined : chosen;
  }

  const country =
    normalizeCountry(cookieStore.get(REGION_COUNTRY_COOKIE)?.value) ??
    normalizeCountry((await headers()).get(GEO_COUNTRY_HEADER));

  if (!country || country === BASE_COUNTRY) return undefined;

  const regionId = await resolveRegionForCountry(country);
  return regionId ?? undefined;
}
