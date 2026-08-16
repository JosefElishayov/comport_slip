/**
 * Google tag (gtag.js) — GA4 measurement + Google Ads conversion tracking.
 *
 * One tag serves both products: the loader is fetched once and each ID gets its
 * own `config`. The tag is loaded in <head> by <GoogleTag/> with Consent Mode v2
 * defaults set to `denied`, so nothing is written to storage until the visitor
 * accepts in the cookie banner. <GoogleTagConsent/> pushes the `consent: update`
 * afterwards.
 *
 * SPA route changes are counted by GA4's Enhanced Measurement ("page changes
 * based on browser history events"), which observes the History API calls the
 * App Router already makes — so no manual `page_view` is sent from here. Sending
 * one would double-count every route change unless that setting is turned off.
 */

/** GA4 property "קומפורט סליפ", web stream comfortsleep.co.il. */
export const GA4_MEASUREMENT_ID = 'G-KQNSQNDCGE';

export const GOOGLE_ADS_ID = 'AW-18286035451';

type ConsentState = 'granted' | 'denied';

/** The Consent Mode v2 signals Google Ads reads. */
export interface ConsentSignals {
  ad_storage: ConsentState;
  ad_user_data: ConsentState;
  ad_personalization: ConsentState;
  analytics_storage: ConsentState;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function consentSignals(granted: boolean): ConsentSignals {
  const state: ConsentState = granted ? 'granted' : 'denied';
  return {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  };
}

/**
 * Inline bootstrap for gtag.js.
 *
 * The loader is appended from here rather than emitted as a sibling
 * `<script async src>` tag on purpose: React 19 hoists async script tags, which
 * could place the loader ahead of this block. gtag.js must not run before the
 * denied consent defaults are on the dataLayer, so injecting it last makes the
 * order deterministic. `strict-dynamic` in the CSP trusts scripts appended by
 * this nonced script, so the injected tag needs no nonce of its own.
 *
 * `wait_for_update` holds tags briefly so a visitor who accepts straight away
 * is still measured.
 */
export const GTAG_BOOTSTRAP_SNIPPET = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', ${JSON.stringify({
  ...consentSignals(false),
  wait_for_update: 500,
})});
gtag('js', new Date());
gtag('config', ${JSON.stringify(GA4_MEASUREMENT_ID)});
gtag('config', ${JSON.stringify(GOOGLE_ADS_ID)});
(function(){
  var s = document.createElement('script');
  s.async = true;
  s.src = ${JSON.stringify(`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`)};
  document.head.appendChild(s);
})();
`.trim();

/** Fire-and-forget wrapper — no-ops if the tag was blocked or hasn't loaded. */
export function gtag(...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  window.gtag?.(...args);
}

/**
 * GA4 "stitch" ids. Brainerce forwards these with the cart/checkout so the
 * purchase conversion it sends server-side (Measurement Protocol) joins this
 * browser's GA4 session instead of creating a phantom user.
 */
export interface Ga4StitchIds {
  analyticsClientId?: string;
  analyticsSessionId?: string;
}

/**
 * Cached only once actually resolved. An empty result is deliberately NOT
 * cached: before the visitor accepts cookies gtag reports no ids, and caching
 * that would permanently blind every shopper who accepts later — which is
 * exactly the SDK's own `loadGoogleAnalytics()` failure mode (it resolves once
 * at call time and reuses that promise forever), and why this resolves here
 * instead.
 */
let cachedStitchIds: Ga4StitchIds | null = null;
let stitchInFlight = false;

/**
 * Ask gtag for the ids and cache them. Fire-and-forget — call once consent has
 * been granted, so the value is ready long before checkout and no cart call
 * ever waits on it.
 *
 * Ids come from `gtag('get', ...)`, Google's documented accessor, rather than
 * from parsing the `_ga` cookie — the cookie format is undocumented and its
 * contents shift with Consent Mode state. If analytics consent is denied gtag
 * reports nothing and the ids stay absent; they are never synthesized.
 */
export function primeGa4StitchIds(timeoutMs = 1500): void {
  if (typeof window === 'undefined' || cachedStitchIds || stitchInFlight) return;
  if (!window.gtag) return;
  stitchInFlight = true;

  const ids: Ga4StitchIds = {};
  let pending = 2;
  let settled = false;

  const finish = () => {
    if (settled) return;
    settled = true;
    stitchInFlight = false;
    if (ids.analyticsClientId || ids.analyticsSessionId) cachedStitchIds = ids;
  };
  // gtag never calling back (blocked/slow loader) must not leak a stuck flag.
  const timer = setTimeout(finish, timeoutMs);
  const done = () => {
    if (--pending === 0) {
      clearTimeout(timer);
      finish();
    }
  };

  try {
    gtag('get', GA4_MEASUREMENT_ID, 'client_id', (id: unknown) => {
      if (id) ids.analyticsClientId = String(id);
      done();
    });
    gtag('get', GA4_MEASUREMENT_ID, 'session_id', (id: unknown) => {
      if (id) ids.analyticsSessionId = String(id);
      done();
    });
  } catch {
    clearTimeout(timer);
    finish();
  }
}

/**
 * Synchronous read of whatever `primeGa4StitchIds()` resolved — `{}` if consent
 * was denied, the tag was blocked, or it simply hasn't resolved yet.
 *
 * Deliberately not async: checkout must never block on an analytics lookup, and
 * a shopper with no ids has nothing to wait for anyway.
 */
export function getGa4StitchIds(): Ga4StitchIds {
  return cachedStitchIds ?? {};
}
