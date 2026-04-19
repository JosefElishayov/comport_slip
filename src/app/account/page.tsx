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
          className="bg-primary text-primary-foreground mt-6 inline-flex items-center rounded px-6 py-3 font-medium transition-opacity hover:opacity-90"
        >
          {tc('tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-bold">{t('myAccount')}</h1>
        <button
          type="button"
          onClick={logout}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          {t('signOut')}
        </button>
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
      <div>
        <h2 className="text-foreground mb-4 text-lg font-semibold">{t('orderHistory')}</h2>
        <OrderHistory orders={orders} />
      </div>
    </div>
  );
}
