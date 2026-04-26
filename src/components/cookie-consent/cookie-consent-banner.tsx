'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'cookie-consent';
const CONSENT_EVENT = 'cookie-consent-change';

type ConsentValue = 'accepted' | 'declined';

export function getCookieConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'accepted' || v === 'declined' ? v : null;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getCookieConsent() === null) setVisible(true);
  }, []);

  const setConsent = (value: ConsentValue) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="הודעת שימוש בעוגיות"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg"
    >
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground leading-relaxed">
          אנו משתמשים בעוגיות הכרחיות לתפעול האתר (כגון שמירת התחברות) ובעוגיות
          לשיפור חוויית השימוש. למידע נוסף עיין/י ב
          <Link href="/privacy" className="underline font-medium mx-1">
            מדיניות הפרטיות
          </Link>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setConsent('declined')}
            className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
          >
            רק הכרחיות
          </button>
          <button
            type="button"
            onClick={() => setConsent('accepted')}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
}
