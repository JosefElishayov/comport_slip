'use client';

import type { CartNudge } from 'brainerce';
import { cn } from '@/lib/utils';

interface CartNudgesProps {
  nudges: CartNudge[];
  className?: string;
}

export function CartNudges({ nudges, className }: CartNudgesProps) {
  if (nudges.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {nudges.map((nudge) => (
        <div
          key={nudge.ruleId}
          className="bg-primary/5 border-primary/20 flex items-start gap-3 rounded-lg border px-4 py-3"
        >
          <svg
            className="text-primary mt-0.5 h-5 w-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-foreground flex-1 text-sm">{nudge.text}</p>
        </div>
      ))}
    </div>
  );
}
