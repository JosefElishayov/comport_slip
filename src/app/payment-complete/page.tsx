'use client';

import { useEffect } from 'react';
import { relayPaymentReturn } from 'brainerce';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

/**
 * Return page for iframe-based payment providers (e.g. CardCom).
 *
 * After the customer pays on the provider's page (inside the checkout iframe),
 * the provider redirects the iframe here. `relayPaymentReturn` posts the query
 * params to the parent checkout (same origin only), where `startPayment`
 * verifies the payment server-side. Opened at the top level instead (a
 * provider that broke out of the frame), it forwards to /order-confirmation.
 */
export default function PaymentCompletePage() {
  useEffect(() => {
    relayPaymentReturn();
  }, []);

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
