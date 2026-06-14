'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from '@/lib/translations';

type ContrastMode = 'none' | 'high' | 'inverted' | 'monochrome' | 'light';

type A11ySettings = {
  fontScale: number;
  contrast: ContrastMode;
  highlightLinks: boolean;
  highlightHeadings: boolean;
  readableFont: boolean;
  stopAnimations: boolean;
  bigCursor: boolean;
  letterSpacing: boolean;
  lineHeight: boolean;
  readingGuide: boolean;
  hideImages: boolean;
};

const DEFAULTS: A11ySettings = {
  fontScale: 1,
  contrast: 'none',
  highlightLinks: false,
  highlightHeadings: false,
  readableFont: false,
  stopAnimations: false,
  bigCursor: false,
  letterSpacing: false,
  lineHeight: false,
  readingGuide: false,
  hideImages: false,
};

const STORAGE_KEY = 'a11y-settings';
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.6;
const STEP = 0.1;

function applySettings(s: A11ySettings) {
  const root = document.documentElement;
  root.style.setProperty('--a11y-font-scale', String(s.fontScale));

  const classes: Record<string, boolean> = {
    'a11y-contrast-high': s.contrast === 'high',
    'a11y-contrast-inverted': s.contrast === 'inverted',
    'a11y-contrast-monochrome': s.contrast === 'monochrome',
    'a11y-contrast-light': s.contrast === 'light',
    'a11y-highlight-links': s.highlightLinks,
    'a11y-highlight-headings': s.highlightHeadings,
    'a11y-readable-font': s.readableFont,
    'a11y-stop-animations': s.stopAnimations,
    'a11y-big-cursor': s.bigCursor,
    'a11y-letter-spacing': s.letterSpacing,
    'a11y-line-height': s.lineHeight,
    'a11y-hide-images': s.hideImages,
  };

  for (const [cls, on] of Object.entries(classes)) {
    root.classList.toggle(cls, on);
  }
}

export function AccessibilityMenu() {
  const t = useTranslations('a11y');
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(DEFAULTS);
  const [mounted, setMounted] = useState(false);
  const [guideY, setGuideY] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as A11ySettings;
        setSettings(parsed);
        applySettings(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applySettings(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings, mounted]);

  useEffect(() => {
    if (!settings.readingGuide) return;
    const handler = (e: MouseEvent) => setGuideY(e.clientY);
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [settings.readingGuide]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const update = useCallback(<K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  const toggle = useCallback((key: keyof A11ySettings) => {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
    const root = document.documentElement;
    root.removeAttribute('style');
    [
      'a11y-contrast-high',
      'a11y-contrast-inverted',
      'a11y-contrast-monochrome',
      'a11y-contrast-light',
      'a11y-highlight-links',
      'a11y-highlight-headings',
      'a11y-readable-font',
      'a11y-stop-animations',
      'a11y-big-cursor',
      'a11y-letter-spacing',
      'a11y-line-height',
      'a11y-hide-images',
    ].forEach((c) => root.classList.remove(c));
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const changeFont = (delta: number) => {
    update('fontScale', Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number((settings.fontScale + delta).toFixed(2)))));
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('openMenu')}
        aria-expanded={open}
        aria-controls="a11y-panel"
        className="fixed bottom-4 left-4 z-[9998] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg outline-none ring-accent transition-transform hover:scale-110 focus-visible:ring-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 5v2h-5v13h-2v-6h-2v6H8V9H3V7h16Z" />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[9998] bg-black/30"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        id="a11y-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        className={`fixed bottom-0 left-0 top-0 z-[9999] flex w-[22rem] max-w-[90vw] flex-col bg-background text-foreground shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
          <h2 className="text-lg font-bold">{t('title')}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('close')}
            className="rounded p-1 outline-none hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Font size */}
          <section aria-labelledby="a11y-font-title" className="mb-5">
            <h3 id="a11y-font-title" className="mb-2 text-sm font-semibold">
              {t('fontSize')} ({Math.round(settings.fontScale * 100)}%)
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => changeFont(-STEP)}
                disabled={settings.fontScale <= MIN_SCALE}
                aria-label={t('decreaseFont')}
                className="flex-1 rounded border border-border bg-secondary px-3 py-2 text-lg font-bold hover:bg-muted disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => update('fontScale', 1)}
                aria-label={t('resetFont')}
                className="flex-1 rounded border border-border bg-secondary px-3 py-2 hover:bg-muted focus-visible:ring-2 focus-visible:ring-accent"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => changeFont(STEP)}
                disabled={settings.fontScale >= MAX_SCALE}
                aria-label={t('increaseFont')}
                className="flex-1 rounded border border-border bg-secondary px-3 py-2 text-lg font-bold hover:bg-muted disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent"
              >
                A+
              </button>
            </div>
          </section>

          {/* Contrast */}
          <section aria-labelledby="a11y-contrast-title" className="mb-5">
            <h3 id="a11y-contrast-title" className="mb-2 text-sm font-semibold">
              {t('contrastTitle')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'none', label: t('contrastNormal') },
                { key: 'high', label: t('contrastHigh') },
                { key: 'inverted', label: t('contrastInverted') },
                { key: 'monochrome', label: t('contrastMonochrome') },
                { key: 'light', label: t('contrastLight') },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => update('contrast', opt.key as ContrastMode)}
                  aria-pressed={settings.contrast === opt.key}
                  className={`rounded border px-3 py-2 text-sm transition focus-visible:ring-2 focus-visible:ring-accent ${
                    settings.contrast === opt.key
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-secondary hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Toggles */}
          <section aria-labelledby="a11y-tools-title" className="mb-5">
            <h3 id="a11y-tools-title" className="mb-2 text-sm font-semibold">
              {t('toolsTitle')}
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { key: 'highlightLinks' as const, label: t('highlightLinks') },
                { key: 'highlightHeadings' as const, label: t('highlightHeadings') },
                { key: 'readableFont' as const, label: t('readableFont') },
                { key: 'letterSpacing' as const, label: t('letterSpacing') },
                { key: 'lineHeight' as const, label: t('lineHeight') },
                { key: 'stopAnimations' as const, label: t('stopAnimations') },
                { key: 'bigCursor' as const, label: t('bigCursor') },
                { key: 'readingGuide' as const, label: t('readingGuide') },
                { key: 'hideImages' as const, label: t('hideImages') },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggle(opt.key)}
                  aria-pressed={Boolean(settings[opt.key])}
                  className={`flex items-center justify-between rounded border px-3 py-2 text-start text-sm transition focus-visible:ring-2 focus-visible:ring-accent ${
                    settings[opt.key]
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-secondary hover:bg-muted'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span aria-hidden="true" className="text-xs">
                    {settings[opt.key] ? t('on') : t('off')}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Reset + statement */}
          <section className="mb-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded border border-destructive bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20 focus-visible:ring-2 focus-visible:ring-accent"
            >
              {t('resetAll')}
            </button>
            <a
              href="/accessibility"
              className="rounded border border-border bg-secondary px-3 py-2 text-center text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-accent"
            >
              {t('statement')}
            </a>
          </section>

          <p className="text-xs text-muted-foreground">
            {t('compliance')}
          </p>
        </div>
      </div>

      {/* Reading guide bar */}
      {settings.readingGuide && (
        <div
          aria-hidden="true"
          style={{ top: guideY - 15 }}
          className="pointer-events-none fixed left-0 right-0 z-[9997] h-[30px] bg-yellow-300/30 border-y-2 border-yellow-500"
        />
      )}
    </>
  );
}
