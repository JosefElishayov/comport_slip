/**
 * Google tag (gtag.js) — Google Ads conversion tracking.
 *
 * The tag is loaded in <head> by <GoogleTag/> with Consent Mode v2 defaults set
 * to `denied`, so nothing is written to storage until the visitor accepts in the
 * cookie banner. <GoogleTagConsent/> pushes the `consent: update` afterwards.
 */

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
gtag('config', ${JSON.stringify(GOOGLE_ADS_ID)});
(function(){
  var s = document.createElement('script');
  s.async = true;
  s.src = ${JSON.stringify(`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`)};
  document.head.appendChild(s);
})();
`.trim();

/** Fire-and-forget wrapper — no-ops if the tag was blocked or hasn't loaded. */
export function gtag(...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  window.gtag?.(...args);
}
