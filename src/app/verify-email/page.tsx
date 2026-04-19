'use client';

import { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, Link } from '@/lib/navigation';
import { useAuth } from '@/providers/store-provider';
import { proxyVerifyEmail, proxyResendVerification } from '@/lib/auth';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useTranslations } from '@/lib/translations';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

function VerifyEmailContent() {
  const router = useRouter();
  const auth = useAuth();

  const t = useTranslations('auth');

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = useCallback(
    async (code: string) => {
      if (code.length !== CODE_LENGTH || loading) return;

      try {
        setLoading(true);
        setError(null);
        // Auth token is in httpOnly cookie — proxy adds Authorization header
        const result = await proxyVerifyEmail(code);

        if (result.verified) {
          // Refresh auth state (cookie already set)
          await auth.login();
          setSuccess('Email verified successfully! Redirecting...');
          setTimeout(() => router.push('/'), 1500);
        } else {
          setError(result.message || 'Verification failed. Please try again.');
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Verification failed. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [loading, auth, router]
  );

  function handleDigitChange(index: number, value: string) {
    // Allow only single digits
    const digit = value.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-focus next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    const fullCode = newDigits.join('');
    if (fullCode.length === CODE_LENGTH) {
      handleSubmit(fullCode);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Move focus to previous input on backspace when current is empty
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);

    if (pastedText.length === 0) return;

    const newDigits = [...digits];
    for (let i = 0; i < pastedText.length; i++) {
      newDigits[i] = pastedText[i];
    }
    setDigits(newDigits);

    // Focus the next empty input, or the last filled one
    const nextEmptyIndex = newDigits.findIndex((d) => !d);
    const focusIndex = nextEmptyIndex === -1 ? CODE_LENGTH - 1 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if all digits pasted
    if (pastedText.length === CODE_LENGTH) {
      handleSubmit(pastedText);
    }
  }

  async function handleResend() {
    if (resending || cooldown > 0) return;

    try {
      setResending(true);
      setError(null);
      await proxyResendVerification();
      setSuccess('Verification code sent! Check your email.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      // Clear digits for fresh entry
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code.';
      setError(message);
    } finally {
      setResending(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join('');
    handleSubmit(code);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <svg
            className="text-primary mx-auto mb-3 h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h1 className="text-foreground text-2xl font-bold">{t('verifyTitle')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('verifySubtitle')}</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
            {success}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Digit inputs */}
          <div dir="ltr" className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className="border-border bg-background text-foreground focus:ring-primary/20 focus:border-primary h-12 w-11 rounded border text-center text-xl font-semibold focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-12"
                aria-label={`${t('digitAriaLabel')} ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || digits.join('').length !== CODE_LENGTH}
            className="bg-primary text-primary-foreground flex h-10 w-full items-center justify-center gap-2 rounded text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoadingSpinner
                  size="sm"
                  className="border-primary-foreground/30 border-t-primary-foreground"
                />
                {t('verifying')}
              </>
            ) : (
              t('verifyButton')
            )}
          </button>
        </form>

        {/* Resend code */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            {t('didntReceive')}{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-primary font-medium hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            >
              {resending
                ? t('sending')
                : cooldown > 0
                  ? `${t('resendIn')} ${cooldown}${t('secondsSuffix')}`
                  : t('resendCode')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
