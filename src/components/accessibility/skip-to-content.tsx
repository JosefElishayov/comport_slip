'use client';

import { useTranslations } from '@/lib/translations';

export function SkipToContent() {
  const t = useTranslations('a11y');
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:end-4 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-6 focus:py-3 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-accent"
    >
      {t('skipToContent')}
    </a>
  );
}
