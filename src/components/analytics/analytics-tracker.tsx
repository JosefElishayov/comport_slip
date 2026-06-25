'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getClient } from '@/lib/brainerce';

/**
 * Brainerce native traffic analytics (cookieless, no PII).
 *
 * Replicates what the hosted `t.js` pixel does, but through the SDK so the strict
 * CSP needs no third-party script source — same approach as <BrainerceBot/>.
 * Beacons route through the same /api/store BFF proxy as every other SDK call
 * (httpOnly-cookie auth + `X-Requested-With` CSRF header are added there), and
 * `trackEvent()` is fire-and-forget: the SDK swallows errors so a failed beacon
 * never affects the page.
 *
 * Per route we send:
 *  - one `pageview` (de-duped on consecutive identical paths), and
 *  - one `engagement` carrying *active* (tab-visible) dwell time, flushed on
 *    navigation and when the tab is hidden/closed.
 *
 * `path` is pathname-only (no query string) by design — the backend reduces
 * referrer to a hostname and resolves IP→country then discards it, so this stays
 * cookieless with no PII and needs no consent banner under GDPR/ePrivacy.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  // Last path we sent a pageview for — guards against duplicate beacons from
  // React Strict Mode's double-invoke in development.
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const client = getClient();

    // --- pageview ---
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      const params = new URLSearchParams(window.location.search);
      client.trackEvent({
        eventType: 'pageview',
        path: pathname,
        referrer: document.referrer || undefined,
        utmSource: params.get('utm_source') ?? undefined,
        utmMedium: params.get('utm_medium') ?? undefined,
        utmCampaign: params.get('utm_campaign') ?? undefined,
        screenWidth: window.innerWidth,
        lang: navigator.language,
      });
    }

    // --- engagement: accumulate active (visible) dwell time for this path ---
    let activeMs = 0;
    let resumedAt = document.visibilityState === 'visible' ? Date.now() : 0;

    const pause = () => {
      if (resumedAt > 0) {
        activeMs += Date.now() - resumedAt;
        resumedAt = 0;
      }
    };
    const resume = () => {
      if (resumedAt === 0) resumedAt = Date.now();
    };
    const flush = () => {
      pause();
      if (activeMs >= 1000) {
        client.trackEvent({
          eventType: 'engagement',
          path: pathname,
          engagedMs: Math.min(activeMs, 1_800_000),
        });
        activeMs = 0; // don't double-count if flushed again before unmount
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') resume();
      else flush(); // hidden (incl. mobile tab-away / close) — report now
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      flush(); // route change — report dwell time for the path we're leaving
    };
  }, [pathname]);

  return null;
}
