'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/lib/navigation';
import type { WaitForOrderResult, OrderDownloadLink } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useCart } from '@/providers/store-provider';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useTranslations } from '@/lib/translations';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get('checkout_id');

  const { refreshCart } = useCart();
  const t = useTranslations('orderConfirmation');
  const tc = useTranslations('common');
  const [result, setResult] = useState<WaitForOrderResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutId) {
      setError(t('missingCheckoutInfo'));
      setLoading(false);
      return;
    }

    async function waitForOrder() {
      try {
        const client = getClient();

        // Clear cart state after successful payment
        client.handlePaymentSuccess(checkoutId!);
        await refreshCart();

        // For redirect-based payment providers (e.g. CardCom), the customer
        // returns with provider params in the URL (lowprofilecode, etc.).
        // Send these to the backend for server-side verification via the
        // provider's API (e.g. GetLpResult) — never trust URL params alone.
        const lowProfileCode =
          searchParams.get('lowprofilecode') || searchParams.get('LowProfileCode');
        if (lowProfileCode) {
          try {
            await client.confirmSdkPayment(checkoutId!, {
              paymentIntentId: lowProfileCode,
            });
          } catch (err) {
            console.warn('Redirect payment confirmation failed:', err);
            // Don't block — webhook may still process the payment
          }
        }

        const orderResult = await client.waitForOrder(checkoutId!, {
          maxWaitMs: 30000,
        });
        setResult(orderResult);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to confirm order';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    waitForOrder();
  }, [checkoutId, refreshCart]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground mt-4">{t('confirming')}</p>
        <p className="text-muted-foreground mt-1 text-xs">{t('confirmingHint')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <svg
          className="text-destructive mx-auto mb-4 h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-2.694-.834-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h1 className="text-foreground text-2xl font-bold">{t('errorTitle')}</h1>
        <p className="text-muted-foreground mt-2">{error}</p>
        <p className="text-muted-foreground mt-1 text-sm">{t('errorChargedHint')}</p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground mt-6 inline-flex items-center rounded px-6 py-3 font-medium transition-opacity hover:opacity-90"
        >
          {t('returnHome')}
        </Link>
      </div>
    );
  }

  // Order was created successfully
  if (result?.success) {
    const orderNumber = result.status.orderNumber;

    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <svg
          className="text-primary mx-auto mb-4 h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <h1 className="text-foreground text-2xl font-bold">{t('thankYou')}</h1>

        {orderNumber && (
          <p className="text-foreground mt-3 text-lg">
            {t('orderNumber')} <span className="font-semibold">{orderNumber}</span>
          </p>
        )}

        <p className="text-muted-foreground mt-2">{t('confirmationEmail')}</p>

        {result.status.orderId && (
          <ConfirmationDownloads orderId={result.status.orderId} checkoutId={checkoutId!} />
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/products"
            className="bg-primary text-primary-foreground inline-flex items-center rounded px-6 py-3 font-medium transition-opacity hover:opacity-90"
          >
            {tc('continueShopping')}
          </Link>

          <Link
            href="/account"
            className="border-border text-foreground hover:bg-muted inline-flex items-center rounded border px-6 py-3 font-medium transition-colors"
          >
            {t('viewOrders')}
          </Link>
        </div>
      </div>
    );
  }

  // Order not yet confirmed (polling timed out) - still show success
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <svg
        className="text-primary mx-auto mb-4 h-16 w-16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <h1 className="text-foreground text-2xl font-bold">{t('paymentReceived')}</h1>

      <p className="text-muted-foreground mt-2">{t('orderProcessing')}</p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/products"
          className="bg-primary text-primary-foreground inline-flex items-center rounded px-6 py-3 font-medium transition-opacity hover:opacity-90"
        >
          {tc('continueShopping')}
        </Link>

        <Link
          href="/account"
          className="border-border text-foreground hover:bg-muted inline-flex items-center rounded border px-6 py-3 font-medium transition-colors"
        >
          {t('viewOrders')}
        </Link>
      </div>
    </div>
  );
}

function ConfirmationDownloads({ orderId, checkoutId }: { orderId: string; checkoutId: string }) {
  const t = useTranslations('orderConfirmation');
  const [downloads, setDownloads] = useState<OrderDownloadLink[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchDownloads() {
      const client = getClient();
      // Retry a few times — the worker may still be writing downloadMeta
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const links = await client.getOrderDownloads(orderId, { checkoutId });
          if (!cancelled && links.length > 0) {
            setDownloads(links);
            return;
          }
        } catch {
          // Not all orders have downloads
        }
        if (attempt < 2 && !cancelled) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }
    fetchDownloads();
    return () => {
      cancelled = true;
    };
  }, [orderId, checkoutId]);

  if (!downloads || downloads.length === 0) return null;

  return (
    <div className="border-border bg-muted/30 mx-auto mt-8 max-w-md rounded-lg border p-6 text-start">
      <h3 className="text-foreground mb-3 text-sm font-semibold">{t('yourDownloads')}</h3>
      <div className="space-y-2">
        {downloads.map((link, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm">{link.fileName}</p>
              <p className="text-muted-foreground truncate text-xs">{link.productName}</p>
            </div>
            <a
              href={link.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground flex-shrink-0 rounded px-3 py-1.5 text-xs font-medium hover:opacity-90"
            >
              {t('download')}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
