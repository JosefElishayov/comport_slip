'use client';

import { useState } from 'react';
import { Link } from '@/lib/navigation';
import { getClient } from '@/lib/brainerce';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useTranslations } from '@/lib/translations';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      const client = getClient();
      const resetUrl = `${window.location.origin}/api/auth/reset-callback`;
      await client.forgotPassword(email, { resetUrl });
      setSent(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-foreground text-2xl font-bold">{t('forgotPasswordTitle')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('forgotPasswordSubtitle')}</p>
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {sent ? (
          <div className="space-y-4">
            <div role="status" aria-live="polite" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
              {t('resetLinkSent')}
            </div>
            <Link
              href="/login"
              className="text-primary block text-center text-sm font-medium hover:underline"
            >
              {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-label={t('forgotPasswordTitle')}>
            <div>
              <label
                htmlFor="forgot-email"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                {t('email')} <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                aria-required="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                autoComplete="email"
                className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-10 w-full rounded border px-3 text-sm focus:outline-none focus:ring-2"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground flex h-10 w-full items-center justify-center gap-2 rounded text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner
                    size="sm"
                    className="border-primary-foreground/30 border-t-primary-foreground"
                  />
                  {t('sendingResetLink')}
                </>
              ) : (
                t('sendResetLink')
              )}
            </button>

            <Link
              href="/login"
              className="text-muted-foreground block text-center text-sm hover:underline"
            >
              {t('backToLogin')}
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
