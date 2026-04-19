'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

/**
 * Lightweight callback page for iframe-based payment providers (e.g. CardCom).
 *
 * After the customer pays on the provider's hosted page (rendered inside an
 * iframe on the checkout page), the provider redirects *inside the iframe* to
 * this page. We extract the relevant query params and send them to the parent
 * window via postMessage so the checkout page can verify the payment
 * server-side and proceed to order confirmation.
 */
function PaymentCompleteContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only send postMessage when running inside an iframe
    if (window.parent === window) {
      // Not in iframe — fallback: redirect to order-confirmation directly
      const checkoutId = searchParams.get('checkout_id');
      if (checkoutId) {
        window.location.href = `/order-confirmation?${searchParams.toString()}`;
      }
      return;
    }

    // Collect all query params from the provider redirect
    const data: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      data[key] = value;
    });

    window.parent.postMessage({ type: 'brainerce:payment-complete', data }, window.location.origin);
  }, [searchParams]);

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <PaymentCompleteContent />
    </Suspense>
  );
}
