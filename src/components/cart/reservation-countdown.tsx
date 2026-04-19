'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ReservationInfo } from 'brainerce';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface ReservationCountdownProps {
  reservation: ReservationInfo;
  className?: string;
}

export function ReservationCountdown({ reservation, className }: ReservationCountdownProps) {
  const t = useTranslations('reservation');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const calculateRemaining = useCallback(() => {
    if (!reservation.expiresAt) return 0;
    const expiresAtMs = new Date(reservation.expiresAt).getTime();
    const nowMs = Date.now();
    return Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
  }, [reservation.expiresAt]);

  useEffect(() => {
    setRemainingSeconds(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateRemaining]);

  if (!reservation.hasReservation) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isExpired = remainingSeconds <= 0;
  const isUrgent = remainingSeconds > 0 && remainingSeconds < 120;

  const displayMessage = reservation.countdownMessage
    ? reservation.countdownMessage.replace(
        '{time}',
        `${minutes}:${seconds.toString().padStart(2, '0')}`
      )
    : null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-4 py-3 text-sm',
        isExpired
          ? 'bg-destructive/10 border-destructive/20 text-destructive border'
          : isUrgent
            ? 'border border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300'
            : 'bg-primary/5 border-primary/20 text-foreground border',
        className
      )}
    >
      <svg
        className={cn(
          'h-5 w-5 flex-shrink-0',
          isExpired
            ? 'text-destructive'
            : isUrgent
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-primary'
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <div className="flex-1">
        {isExpired ? (
          <p className="font-medium">{t('expired')}</p>
        ) : displayMessage ? (
          <p>{displayMessage}</p>
        ) : (
          <p>
            {isUrgent ? `${t('hurry')} ` : ''}
            {t('reservedFor')}{' '}
            <span className="font-semibold tabular-nums">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
