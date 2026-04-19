'use client';

import { useState } from 'react';
import { Link } from '@/lib/navigation';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  error?: string | null;
  className?: string;
}

export function LoginForm({ onSubmit, error, className }: LoginFormProps) {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      await onSubmit(email, password);
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

      <div>
        <label htmlFor="login-email" className="text-foreground mb-1.5 block text-sm font-medium">
          {t('email')}
        </label>
        <input
          id="login-email"
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
          htmlFor="login-password"
          className="text-foreground mb-1.5 block text-sm font-medium"
        >
          {t('password')}
        </label>
        <input
          id="login-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          autoComplete="current-password"
          className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-10 w-full rounded border px-3 text-sm focus:outline-none focus:ring-2"
        />
      </div>

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-primary text-sm hover:underline">
          {t('forgotPassword')}
        </Link>
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
            {t('signingIn')}
          </>
        ) : (
          t('signIn')
        )}
      </button>
    </form>
  );
}
