'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { getPasswordError } from '@/lib/validation';

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acceptsMarketing: boolean;
}

interface RegisterFormProps {
  onSubmit: (data: RegisterData) => Promise<void>;
  error?: string | null;
  className?: string;
}

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: '', color: '', width: 'w-0' };
  if (password.length < 8) return { label: 'tooShort', color: 'bg-destructive', width: 'w-1/4' };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'weak', color: 'bg-orange-500', width: 'w-1/3' };
  if (score <= 2) return { label: 'fair', color: 'bg-yellow-500', width: 'w-1/2' };
  if (score <= 3) return { label: 'good', color: 'bg-primary', width: 'w-3/4' };
  return { label: 'strong', color: 'bg-green-500', width: 'w-full' };
}

export function RegisterForm({ onSubmit, error, className }: RegisterFormProps) {
  const t = useTranslations('auth');
  const tf = useTranslations('checkoutForm');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [acceptsMarketing, setAcceptsMarketing] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const pwCode = getPasswordError(password);
    if (pwCode) {
      setPasswordError(t(pwCode));
      return;
    }
    setPasswordError(null);

    if (!privacyAccepted) {
      setPrivacyError(true);
      return;
    }

    try {
      setLoading(true);
      await onSubmit({ firstName, lastName, email, password, acceptsMarketing });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {error && (
        <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="register-first-name"
            className="text-foreground mb-1.5 block text-sm font-medium"
          >
            {tf('firstName')}
          </label>
          <input
            id="register-first-name"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t('firstNamePlaceholder')}
            autoComplete="given-name"
            className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-10 w-full rounded border px-3 text-sm focus:outline-none focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="register-last-name"
            className="text-foreground mb-1.5 block text-sm font-medium"
          >
            {tf('lastName')}
          </label>
          <input
            id="register-last-name"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t('lastNamePlaceholder')}
            autoComplete="family-name"
            className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-10 w-full rounded border px-3 text-sm focus:outline-none focus:ring-2"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="register-email"
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          {t('email')}
        </label>
        <input
          id="register-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-10 w-full rounded border px-3 text-sm focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label
          htmlFor="register-password"
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          {t('password')}
        </label>
        <input
          id="register-password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError(null);
          }}
          placeholder={t('atLeastChars')}
          autoComplete="new-password"
          className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-10 w-full rounded border px-3 text-sm focus:outline-none focus:ring-2"
        />
        {password.length > 0 && (
          <div className="mt-2">
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  strength.color,
                  strength.width
                )}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {strength.label
                ? t(strength.label as 'tooShort' | 'weak' | 'fair' | 'good' | 'strong')
                : ''}
            </p>
          </div>
        )}
        {passwordError && <p className="text-destructive mt-1 text-xs">{passwordError}</p>}
      </div>

      {/* Privacy Policy (required) */}
      <div>
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => {
              setPrivacyAccepted(e.target.checked);
              setPrivacyError(false);
            }}
            className="accent-primary mt-0.5"
          />
          <span className="text-muted-foreground text-sm">
            {t('privacyAcceptPrefix')}{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {t('privacyPolicyLink')}
            </a>{' '}
            <span className="text-destructive">*</span>
          </span>
        </label>
        {privacyError && <p className="text-destructive mt-1 text-xs">{t('privacyRequired')}</p>}
      </div>

      {/* Marketing consent (optional) */}
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={acceptsMarketing}
          onChange={(e) => setAcceptsMarketing(e.target.checked)}
          className="accent-primary mt-0.5"
        />
        <span className="text-muted-foreground text-sm">{t('acceptsMarketing')}</span>
      </label>

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
            {t('creatingAccount')}
          </>
        ) : (
          t('createAccount')
        )}
      </button>
    </form>
  );
}
