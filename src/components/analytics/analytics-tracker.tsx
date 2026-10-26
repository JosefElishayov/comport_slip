'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getClient } from '@/lib/brainerce';

/**
 * Brainerce native traffic analytics (cookieless, no PII).
 *
 * Replicates what the hosted `t.js` pixel does, but through the SDK so the strict
 * CSP needs no third-party script source — same approach as <BrainerceBot/>.
 * The SDK sends beacons straight to the Brainerce API (not the /api/store BFF
 * proxy) so the visitor's real IP reaches it for country lookup; `trackEvent()`
 * is fire-and-forget and swallows errors so a failed beacon never affects the page.
 * Do not also load `t.js` — that would double-count every pageview.
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

type LandingAttribution = {
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

/**
 * Traffic source of this page load, read once from the entry URL.
 *
 * `trackEvent()` adds no referrer/UTM on its own, and the backend buckets every
 * pageview by its own source. Reading `location.search` per route would drop the
 * UTM tags on the first client-side navigation — e.g. a ChatGPT visit (typically
 * `utm_source=chatgpt.com` and no referrer) turned "direct" from page two on.
 * So the entry values are captured before anything can rewrite the URL and
 * repeated on every SPA pageview of this visit, just as `document.referrer`
 * stays fixed across them. Kept in memory only: a new page load (a fresh entry)
 * starts from scratch and never inherits an earlier visit's source.
 */
let landing: LandingAttribution | null = null;

function getLandingAttribution(): LandingAttribution {
  if (!landing) {
    const params = new URLSearchParams(window.location.search);
    landing = {
      referrer: document.referrer || undefined,
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
    };
  }
  return landing;
}

// Capture at module load (hydration), ahead of any effect that might clean the URL.
if (typeof window !== 'undefined') getLandingAttribution();

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
      client.trackEvent({
        eventType: 'pageview',
        path: pathname,
        ...getLandingAttribution(),
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
