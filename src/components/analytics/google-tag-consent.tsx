'use client';

import { useEffect } from 'react';
import { CONSENT_EVENT, getCookieConsent } from '@/components/cookie-consent/cookie-consent-banner';
import { consentSignals, gtag, primeGa4StitchIds } from '@/lib/gtag';

/**
 * Bridges the cookie banner to Google Consent Mode v2.
 *
 * <GoogleTag/> boots gtag.js with every signal `denied`, so Google Ads writes
 * no cookies and sends only cookieless pings until this pushes an update.
 * Runs on mount too — a returning visitor who already accepted has their choice
 * stored in localStorage, which the server-rendered defaults can't know about.
 */
export function GoogleTagConsent() {
  useEffect(() => {
    const sync = (value: string | null) => {
      const granted = value === 'accepted';
      gtag('consent', 'update', consentSignals(granted));
      // Only now can gtag mint a client_id. Resolve it here — well ahead of
      // checkout — so the cart calls that carry it never wait on the lookup.
      if (granted) primeGa4StitchIds();
    };

    if (getCookieConsent() === 'accepted') sync('accepted');

    const onChange = (event: Event) => {
      sync((event as CustomEvent<string>).detail ?? getCookieConsent());
    };

    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  return null;
}
