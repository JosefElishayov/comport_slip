'use client';

import { useState } from 'react';
import { useRouter, Link } from '@/lib/navigation';
import { proxyResetPassword } from '@/lib/auth';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useTranslations } from '@/lib/translations';
import { getPasswordError } from '@/lib/validation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const t = useTranslations('auth');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const pwCode = getPasswordError(newPassword);
    if (pwCode) {
      setError(t(pwCode));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordsMustMatch'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await proxyResetPassword(newPassword);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
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
          <h1 className="text-foreground text-2xl font-bold">{t('resetPasswordTitle')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('resetPasswordSubtitle')}</p>
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="bg-destructive/10 border-destructive/20 text-destructive space-y-2 rounded-lg border px-4 py-3 text-sm">
            <p>{error}</p>
            <Link
              href="/forgot-password"
              className="text-primary block font-medium hover:underline"
            >
              {t('sendResetLink')}
            </Link>
          </div>
        )}

        {success ? (
          <div role="status" aria-live="polite" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
            {t('passwordResetSuccess')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-label={t('resetPasswordTitle')}>
            <div>
              <label
                htmlFor="new-password"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                {t('newPassword')} <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input
                id="new-password"
                type="password"
                required
                aria-required="true"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                autoComplete="new-password"
                className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-10 w-full rounded border px-3 text-sm focus:outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                {t('confirmPassword')} <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                aria-required="true"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                autoComplete="new-password"
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
                  {t('resettingPassword')}
                </>
              ) : (
                t('resetPassword')
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
