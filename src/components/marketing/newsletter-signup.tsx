'use client';

import { useState } from 'react';
import { getClient } from '@/lib/brainerce';
import { useOptionalLocale } from '@/providers/locale-provider';
import { useTranslations } from '@/lib/translations';
import { isValidEmail } from '@/lib/validation';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

/** Referrer, page and UTM params — provenance the merchant sees per signup. */
function collectSourceMetadata(): Record<string, unknown> | undefined {
  if (typeof window === 'undefined') return undefined;
  const meta: Record<string, unknown> = { page: window.location.pathname };
  if (document.referrer) meta.referrer = document.referrer;
  const params = new URLSearchParams(window.location.search);
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) meta[key] = value;
  }
  return meta;
}

interface NewsletterSignupProps {
  /** Free-form origin label for the merchant's reporting. */
  source?: string;
  className?: string;
}

export function NewsletterSignup({ source = 'footer', className }: NewsletterSignupProps) {
  const t = useTranslations('newsletter');
  const locale = useOptionalLocale();

  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    // Bots fill every input; give them the same success screen, no request.
    if (honeypot.trim() !== '') {
      setSuccess(true);
      return;
    }

    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError(t('invalidEmail'));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await getClient().marketing.subscribe({
        email: trimmed,
        locale,
        source,
        sourceMetadata: collectSourceMetadata(),
        honeypot,
      });
      // Confirmed opt-in: nobody is subscribed until they click the link in the
      // email. The response is uniform (new / already confirmed / inside the
      // 24h resend cooldown / bounced) — one message, nothing to branch on.
      setSuccess(true);
      setEmail('');
    } catch (err) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      setError(statusCode === 429 ? t('rateLimited') : t('error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn(className)}>
      <h4 className="text-sm font-semibold">{t('heading')}</h4>

      {success ? (
        <p className="text-primary-foreground/80 mt-2 max-w-md text-sm">{t('success')}</p>
      ) : (
        <>
          <p className="text-primary-foreground/70 mt-1 max-w-md text-sm">{t('subtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-3 max-w-md" noValidate>
            {/* Honeypot — off-screen, never focusable */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <label>
                {t('honeypot')}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </label>
            </div>

            <label htmlFor="newsletter-email" className="sr-only">
              {t('emailLabel')}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="newsletter-email"
                type="email"
                dir="ltr"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t('emailPlaceholder')}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'newsletter-error' : undefined}
                className={cn(
                  'border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50 focus:border-primary-foreground/50 focus:ring-primary-foreground/20 min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none',
                  error && 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                )}
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary-foreground text-primary shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="sm" className="border-primary/30 border-t-primary" />
                    {t('sending')}
                  </span>
                ) : (
                  t('submit')
                )}
              </button>
            </div>

            {error ? (
              <p id="newsletter-error" className="mt-2 text-sm text-red-300">
                {error}
              </p>
            ) : (
              <p className="text-primary-foreground/50 mt-2 text-xs">{t('privacyNote')}</p>
            )}
          </form>
        </>
      )}
    </div>
  );
}
