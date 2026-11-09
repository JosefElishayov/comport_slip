'use client';

import { useTranslations } from '@/lib/translations';

const POLYRON_URL = 'https://www.polyron.co.il/pages/stores';
const AMINACH_URL = 'https://www.aminachreseller.co.il/%d7%a1%d7%a0%d7%99%d7%a4%d7%99%d7%9d/';

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function BrandLink({ href, label, ariaLabel }: { href: string; label: string; ariaLabel: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="inline-flex items-center rounded-full border border-border bg-background px-4 py-1.5 text-sm font-bold tracking-wide text-primary transition-colors hover:border-primary"
    >
      {label}
    </a>
  );
}

/**
 * "Authorized dealer" trust signal for Polyron and Aminach.
 * - variant="strip": full-width band for the home page.
 * - variant="compact": small box under the PDP purchase buttons.
 */
export function AuthorizedDealer({ variant = 'strip' }: { variant?: 'strip' | 'compact' }) {
  const t = useTranslations('authorizedDealer');

  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-6 w-6 flex-shrink-0 text-accent" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-foreground">{t('compactTitle')}</p>
          <p className="mt-0.5 text-muted-foreground">
            {t('compactBody')}{' '}
            <a href={POLYRON_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
              {t('polyron')}
            </a>
            {' · '}
            <a href={AMINACH_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
              {t('aminach')}
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="border-b border-border bg-primary text-primary-foreground" aria-label={t('stripTitle')}>
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 text-center sm:px-6 md:flex-row md:justify-between md:text-start lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-lg font-bold sm:text-xl">{t('stripTitle')}</h2>
            <p className="text-sm text-primary-foreground/75">{t('stripSubtitle')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <BrandLink href={POLYRON_URL} label={t('polyron')} ariaLabel={t('verifyPolyron')} />
          <BrandLink href={AMINACH_URL} label={t('aminach')} ariaLabel={t('verifyAminach')} />
          <span className="text-xs text-primary-foreground/70">{t('verifyHint')}</span>
        </div>
      </div>
    </section>
  );
}
