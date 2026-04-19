'use client';

import { useState } from 'react';
import type { PickupLocation } from 'brainerce';
import { formatPrice } from 'brainerce';
import { useTranslations } from '@/lib/translations';
import { useStoreInfo } from '@/providers/store-provider';
import { cn } from '@/lib/utils';

interface PickupStepProps {
  locations: PickupLocation[];
  onSelect: (
    locationId: string,
    customerInfo: { email: string; firstName?: string; lastName?: string; phone?: string }
  ) => void;
  loading?: boolean;
  initialEmail?: string;
  className?: string;
}

export function PickupStep({
  locations,
  onSelect,
  loading = false,
  initialEmail = '',
  className,
}: PickupStepProps) {
  const t = useTranslations('checkout');
  const tf = useTranslations('checkoutForm');
  const tc = useTranslations('common');
  const { storeInfo } = useStoreInfo();
  const currency = storeInfo?.currency || 'USD';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [email, setEmail] = useState(initialEmail);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedId) {
      setError(t('pickupLocationRequired'));
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(tf('emailInvalid'));
      return;
    }

    setError(null);
    onSelect(selectedId, {
      email: email.trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  };

  const inputClass =
    'bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-10 w-full rounded border px-3 text-sm focus:outline-none focus:ring-2';

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Pickup locations */}
      <div className="space-y-3">
        <p className="text-foreground text-sm font-medium">{t('selectPickupLocation')}</p>
        {locations.map((loc) => {
          const price = parseFloat(loc.price);
          const isFree = price === 0;
          const isSelected = selectedId === loc.id;

          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => {
                setSelectedId(loc.id);
                setError(null);
              }}
              className={cn(
                'flex w-full items-start gap-4 rounded border px-4 py-3 text-start transition-colors',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground'
              )}
            >
              {/* Radio indicator */}
              <div
                className={cn(
                  'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2',
                  isSelected ? 'border-primary' : 'border-muted-foreground/40'
                )}
              >
                {isSelected && <div className="bg-primary h-2 w-2 rounded-full" />}
              </div>

              {/* Location info */}
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-medium">{loc.name}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {loc.address.line1}
                  {loc.address.city && `, ${loc.address.city}`}
                </p>
                {loc.hours && <p className="text-muted-foreground mt-0.5 text-xs">{loc.hours}</p>}
                {loc.instructions && (
                  <p className="text-muted-foreground mt-1 text-xs italic">{loc.instructions}</p>
                )}
              </div>

              {/* Price */}
              <span
                className={cn(
                  'flex-shrink-0 text-sm font-medium',
                  isFree ? 'text-primary' : 'text-foreground'
                )}
              >
                {isFree ? tc('free') : (formatPrice(price, { currency }) as string)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Customer info */}
      <div className="space-y-4">
        <p className="text-foreground text-sm font-medium">{t('yourDetails')}</p>

        <div>
          <label htmlFor="pickup-email" className="text-foreground mb-1 block text-sm">
            {tf('email')} <span className="text-destructive">*</span>
          </label>
          <input
            id="pickup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(inputClass, 'border-border')}
            placeholder="your@email.com"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pickup-firstName" className="text-foreground mb-1 block text-sm">
              {tf('firstName')}
            </label>
            <input
              id="pickup-firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={cn(inputClass, 'border-border')}
            />
          </div>
          <div>
            <label htmlFor="pickup-lastName" className="text-foreground mb-1 block text-sm">
              {tf('lastName')}
            </label>
            <input
              id="pickup-lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={cn(inputClass, 'border-border')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="pickup-phone" className="text-foreground mb-1 block text-sm">
            {tf('phone')}
          </label>
          <input
            id="pickup-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={cn(inputClass, 'border-border')}
            placeholder={tf('phonePlaceholder')}
          />
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !selectedId}
        className="bg-primary text-primary-foreground w-full rounded px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? tc('saving') : t('continueToPayment')}
      </button>
    </form>
  );
}
