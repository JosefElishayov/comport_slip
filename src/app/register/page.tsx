'use client';

import { useState } from 'react';
import { useRouter, Link } from '@/lib/navigation';
import { useAuth } from '@/providers/store-provider';
import { proxyRegister } from '@/lib/auth';
import { RegisterForm } from '@/components/auth/register-form';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { useTranslations } from '@/lib/translations';

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const t = useTranslations('auth');
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    acceptsMarketing: boolean;
  }) {
    try {
      setError(null);
      const result = await proxyRegister(data);

      if (result.requiresVerification) {
        // Cookie already set by proxy; verify-email uses it for auth
        router.push('/verify-email');
        return;
      }

      // Cookie was set by the proxy; refresh auth state
      await auth.login();
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-foreground text-2xl font-bold">{t('createAccountTitle')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('joinSubtitle')}</p>
        </div>

        <RegisterForm onSubmit={handleRegister} error={error} />

        <OAuthButtons />

        <p className="text-muted-foreground text-center text-sm">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            {t('signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
