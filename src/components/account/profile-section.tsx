'use client';

import { useState } from 'react';
import type { CustomerProfile } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface ProfileSectionProps {
  profile: CustomerProfile;
  onProfileUpdate?: (updated: CustomerProfile) => void;
  className?: string;
}

export function ProfileSection({ profile, onProfileUpdate, className }: ProfileSectionProps) {
  const t = useTranslations('account');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    phone: profile.phone || '',
  });

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const initials =
    [profile.firstName?.[0], profile.lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    profile.email[0].toUpperCase();

  function startEditing() {
    setForm({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
    });
    setMessage(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setMessage(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const client = getClient();
      const updated = await client.updateMyProfile({
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        phone: form.phone || undefined,
      });
      onProfileUpdate?.(updated);
      setEditing(false);
      setMessage({ type: 'success', text: t('profileUpdated') });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: t('profileUpdateFailed') });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn('border-border rounded-lg border p-6', className)}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="bg-primary/10 text-primary flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-lg font-semibold">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    {t('firstName')}
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="border-border bg-background text-foreground focus:border-primary w-full rounded-md border px-3 py-1.5 text-sm outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    {t('lastName')}
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="border-border bg-background text-foreground focus:border-primary w-full rounded-md border px-3 py-1.5 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-md border px-3 py-1.5 text-sm outline-none"
                />
              </div>
              <p className="text-muted-foreground truncate text-sm">{profile.email}</p>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground rounded-md px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? '...' : t('save')}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="text-muted-foreground hover:text-foreground rounded-md px-4 py-1.5 text-sm transition-colors disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {fullName && (
                  <h2 className="text-foreground truncate text-lg font-semibold">{fullName}</h2>
                )}
                <button
                  type="button"
                  onClick={startEditing}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0 rounded p-1 transition-colors"
                  title={t('editProfile')}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-muted-foreground truncate text-sm">{profile.email}</p>

              <div className="mt-2 flex items-center gap-2">
                {profile.emailVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {t('verified')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01"
                      />
                    </svg>
                    {t('unverified')}
                  </span>
                )}
              </div>

              {profile.phone && (
                <p className="text-muted-foreground mt-2 text-sm">{profile.phone}</p>
              )}

              {profile.createdAt && !isNaN(new Date(profile.createdAt).getTime()) && (
                <p className="text-muted-foreground mt-3 text-xs">
                  {t('memberSince')}{' '}
                  {new Date(profile.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </>
          )}

          {/* Success/Error message */}
          {message && (
            <p
              className={cn(
                'mt-2 text-sm',
                message.type === 'success'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
