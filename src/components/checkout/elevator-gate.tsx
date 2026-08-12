'use client';

import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

export type ElevatorAnswer = 'fits' | 'no-fit';

interface ElevatorGateProps {
  value: ElevatorAnswer | null;
  onChange: (value: ElevatorAnswer) => void;
  className?: string;
}

/**
 * Asks whether the item fits in the customer's elevator. A "no-fit" answer reveals
 * the floor field (manual carry, may add a surcharge above floor 3).
 */
export function ElevatorGate({ value, onChange, className }: ElevatorGateProps) {
  const t = useTranslations('checkout');

  const options: Array<{ key: ElevatorAnswer; label: string }> = [
    { key: 'fits', label: t('elevatorFits') },
    { key: 'no-fit', label: t('elevatorNoFit') },
  ];

  return (
    <fieldset className={cn('space-y-2', className)}>
      <legend className="text-foreground mb-1 text-sm font-medium">
        {t('elevatorQuestion')}
        <span className="text-destructive ms-1">*</span>
      </legend>
      <p className="text-muted-foreground text-xs">{t('elevatorHelp')}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.key}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm transition-colors',
              value === option.key
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border text-foreground hover:border-primary/40'
            )}
          >
            <input
              type="radio"
              name="elevator-fits"
              value={option.key}
              checked={value === option.key}
              onChange={() => onChange(option.key)}
              className="accent-primary"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
