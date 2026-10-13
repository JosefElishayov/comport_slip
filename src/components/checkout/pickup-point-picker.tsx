'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Checkout, PickupPoint } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useTranslations } from '@/lib/translations';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';

interface PickupPointPickerProps {
  checkoutId: string;
  /** The point already stored on the checkout, if any. */
  selected: PickupPoint | null | undefined;
  onSelected: (checkout: Checkout) => void;
  className?: string;
}

/**
 * Carrier pickup points (partner shops and lockers) for a shipping rate with
 * `requiresPickupPoint`. Payment is refused until one is chosen.
 *
 * A failed lookup means the carrier could not be reached — offer a retry,
 * never "no points near you" (that is an empty list).
 */
export function PickupPointPicker({
  checkoutId,
  selected,
  onSelected,
  className,
}: PickupPointPickerProps) {
  const t = useTranslations('checkout');
  const [points, setPoints] = useState<PickupPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [city, setCity] = useState('');
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);

  const load = useCallback(
    async (searchCity?: string) => {
      setLoading(true);
      setFailed(false);
      try {
        const result = await getClient().getPickupPoints(
          checkoutId,
          searchCity ? { city: searchCity } : undefined
        );
        setPoints(result);
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [checkoutId]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function handleSelect(point: PickupPoint) {
    if (selectingId) return;
    setSelectingId(point.id);
    setSelectError(null);
    try {
      const updated = await getClient().selectPickupPoint(checkoutId, point);
      onSelected(updated);
    } catch {
      // 404: the carrier no longer lists it — refresh the list.
      setSelectError(t('pickupPointUnavailable'));
      load(city.trim() || undefined);
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-foreground text-sm font-medium">{t('choosePickupPoint')}</p>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load(city.trim() || undefined);
        }}
      >
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t('pickupPointSearchPlaceholder')}
          className="border-border bg-background text-foreground min-w-0 flex-1 rounded border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="border-border text-foreground hover:bg-muted rounded border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
        >
          {t('search')}
        </button>
      </form>

      {selectError && (
        <p role="alert" className="text-destructive text-sm">
          {selectError}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner size="md" />
        </div>
      ) : failed ? (
        <div className="py-4 text-center">
          <p className="text-muted-foreground text-sm">{t('pickupPointsLoadFailed')}</p>
          <button
            type="button"
            onClick={() => load(city.trim() || undefined)}
            className="text-primary mt-2 text-sm font-medium hover:underline"
          >
            {t('tryAgain')}
          </button>
        </div>
      ) : points && points.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">{t('noPickupPointsNearby')}</p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {points?.map((point) => {
            const isSelected = selected?.id === point.id;
            return (
              <button
                key={point.id}
                type="button"
                onClick={() => handleSelect(point)}
                disabled={!!selectingId}
                className={cn(
                  'flex w-full items-start gap-3 rounded border px-4 py-3 text-start transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground',
                  selectingId && 'cursor-not-allowed opacity-60'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2',
                    isSelected ? 'border-primary' : 'border-muted-foreground/40'
                  )}
                >
                  {isSelected && <div className="bg-primary h-2 w-2 rounded-full" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-medium">
                    {point.name}
                    {point.kind === 'locker' && (
                      <span className="text-muted-foreground ms-2 text-xs font-normal">
                        {t('pickupPointLocker')}
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {point.address.street1}, {point.address.city}
                  </p>
                  {point.hours && (
                    <p className="text-muted-foreground mt-0.5 text-xs">{point.hours}</p>
                  )}
                  {point.note && (
                    <p className="text-muted-foreground mt-0.5 text-xs">{point.note}</p>
                  )}
                </div>
                {point.distanceKm != null && (
                  <span className="text-muted-foreground flex-shrink-0 text-xs" dir="ltr">
                    {point.distanceKm.toFixed(1)} km
                  </span>
                )}
                {selectingId === point.id && <LoadingSpinner size="sm" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
