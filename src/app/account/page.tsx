'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/navigation';
import type { CustomerProfile, Order } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useAuth } from '@/providers/store-provider';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ProfileSection } from '@/components/account/profile-section';
import { AddressBook } from '@/components/account/address-book';
import { OrderHistory } from '@/components/account/order-history';
import { useTranslations } from '@/lib/translations';

export default function AccountPage() {
  const router = useRouter();
  const { isLoggedIn, authLoading, logout } = useAuth();
  const t = useTranslations('account');
  const tc = useTranslations('common');
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    async function loadAccountData() {
      try {
        const client = getClient();
        const [profileResult, ordersResult] = await Promise.allSettled([
          client.getMyProfile(),
          client.getMyOrders({ limit: 20 }),
        ]);

        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value);
        } else {
          setError('Failed to load profile.');
        }

        if (ordersResult.status === 'fulfilled') {
          setOrders(ordersResult.value.data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load account data.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
  }, [isLoggedIn, authLoading, router]);

  if (authLoading || !isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-foreground text-2xl font-bold">{tc('error')}</h1>
        <p className="text-muted-foreground mt-2">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-accent text-accent-foreground mt-6 inline-flex items-center rounded-xl px-6 py-3 font-semibold transition-all hover:brightness-110 shadow-sm"
        >
          {tc('tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="section-warm min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-3xl font-bold">{t('myAccount')}</h1>
            <p className="text-muted-foreground mt-1 text-sm">ברוכים השבים! כאן תוכלו לנהל את החשבון שלכם</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground border border-border rounded-xl px-4 py-2 text-sm font-medium transition-all hover:bg-secondary/50"
          >
            {t('signOut')}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="dashboard-card p-5 text-center">
            <div className="text-3xl font-bold text-primary">{orders.length}</div>
            <div className="text-muted-foreground mt-1 text-sm">{t('orderHistory')}</div>
          </div>
          <div className="dashboard-card p-5 text-center">
            <div className="text-3xl font-bold text-primary">
              {profile?.addresses?.length || 0}
            </div>
            <div className="text-muted-foreground mt-1 text-sm">{t('addressBook')}</div>
          </div>
          <div className="dashboard-card p-5 text-center col-span-2 sm:col-span-1">
            <div className="flex items-center justify-center">
              {profile?.emailVerified ? (
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            <div className="text-muted-foreground mt-1 text-sm">
              {profile?.emailVerified ? t('verified') : t('unverified')}
            </div>
          </div>
        </div>

        {/* Profile Section */}
        {profile && (
          <ProfileSection profile={profile} onProfileUpdate={setProfile} className="mb-6" />
        )}

        {/* Address Book */}
        {profile && (
          <AddressBook
            addresses={profile.addresses ?? []}
            onUpdate={(updated) => setProfile((p) => (p ? { ...p, addresses: updated } : p))}
            className="mb-8"
          />
        )}

        {/* Order History */}
        <div className="dashboard-card p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">{t('orderHistory')}</h2>
          <OrderHistory orders={orders} />
        </div>
      </div>
    </div>
  );
}
