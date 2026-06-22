/**
 * Shared region / multi-currency constants & helpers — pure module, safe in
 * both Server and Client Components (no next/headers, no React imports here).
 *
 * Brainerce per-region currency: when a product is fetched with `?regionId=`
 * for a region whose currency differs from the store's base currency, the API
 * adds `displayPrice` / `displaySalePrice` / `displayCurrency` (display-only —
 * checkout still charges in the base currency). See [[multi-currency-regions]].
 */

/** Store base currency — products with no region overlay are priced in this. */
export const BASE_CURRENCY = 'ILS';
/** Country whose region IS the base currency, so no conversion is needed. */
export const BASE_COUNTRY = 'IL';

/**
 * Resolved region id for the current visitor. Holds a Brainerce region id
 * (e.g. `cmqnggxe0009d01pk5ec1vhe1`) or the empty string for "base currency,
 * no overlay" — the empty value is stored explicitly so we don't re-resolve on
 * every request.
 */
export const REGION_COOKIE = 'brainerce_region';

/**
 * Optional explicit country override (ISO-3166 alpha-2, e.g. `FR`). Takes
 * precedence over geo detection — used by a manual currency switcher and for
 * local testing where no `cf-ipcountry` edge header exists.
 */
export const REGION_COUNTRY_COOKIE = 'brainerce_country';

/** Request header the middleware sets from the Cloudflare `cf-ipcountry` edge header. */
export const GEO_COUNTRY_HEADER = 'x-geo-country';

/** Normalize a raw country value (cookie/header) to an upper-case alpha-2 code or null. */
export function normalizeCountry(value: string | null | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  // Cloudflare uses "XX"/"T1" for unknown/Tor; treat those as no-country.
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX' || code === 'T1') return null;
  return code;
}
