'use client';

import { useState } from 'react';
import { useRouter, Link } from '@/lib/navigation';
import { useAuth } from '@/providers/store-provider';
import { proxyLogin } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { useTranslations } from '@/lib/translations';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const t = useTranslations('auth');
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(email: string, password: string) {
    try {
      setError(null);
      const result = await proxyLogin(email, password);

      if (result.requiresVerification) {
        // Verification token is NOT the auth JWT — safe to pass in URL
        router.push('/verify-email');
        return;
      }

      // Cookie was set by the proxy; refresh auth state
      await auth.login();
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-foreground text-2xl font-bold">{t('welcomeBack')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('signInSubtitle')}</p>
        </div>

        <LoginForm onSubmit={handleLogin} error={error} />

        <OAuthButtons />

        <p className="text-muted-foreground text-center text-sm">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">
            {t('createOne')}
          </Link>
        </p>
      </div>
    </div>
  );
}
