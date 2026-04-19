'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/providers/store-provider';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useTranslations } from '@/lib/translations';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);
  const t = useTranslations('auth');

  const oauthSuccess = searchParams.get('oauth_success');
  const oauthError = searchParams.get('oauth_error');
  // Token is no longer in URL — it was set as httpOnly cookie by /api/auth/oauth-callback

  useEffect(() => {
    // Prevent double-processing in React StrictMode
    if (processedRef.current) return;
    processedRef.current = true;

    if (oauthError) {
      setError(oauthError);
      return;
    }

    if (oauthSuccess === 'true') {
      // Cookie was already set by the API route; refresh auth state
      auth.login().then(() => {
        router.push('/');
      });
    } else {
      setError(t('authFailedDesc'));
    }
  }, [oauthSuccess, oauthError, auth, router, t]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-4 text-center">
          <svg
            className="text-destructive mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-2.694-.834-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h1 className="text-foreground text-2xl font-bold">{t('authFailed')}</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="bg-primary text-primary-foreground inline-flex items-center rounded px-6 py-3 font-medium transition-opacity hover:opacity-90"
          >
            {t('backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground mt-4">{t('completingSignIn')}</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
