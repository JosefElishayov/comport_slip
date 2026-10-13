'use client';

import { useEffect, useRef, useState } from 'react';
import type { PaymentFlowError, PaymentFlowStatus, PaymentSession } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { Link } from '@/lib/navigation';
import { useTranslations } from '@/lib/translations';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useStoreInfo } from '@/providers/store-provider';
import { cn } from '@/lib/utils';
import { isValidCheckoutId } from '@/lib/safe-redirect';

/** `PaymentSession['presentation']` without the null. */
type Presentation = NonNullable<PaymentSession['presentation']>;

/** Fallback height for a provider's own payment page (it reports no height). */
const PROVIDER_PAGE_HEIGHT = 600;

/**
 * Some providers (e.g. Cardcom) finish the payment by webhook and never send
 * the iframe back to /payment-complete. Poll for the order as a safety net.
 */
const ORDER_POLL_START_MS = 8000;
const ORDER_POLL_INTERVAL_MS = 3000;

interface PaymentStepProps {
  checkoutId: string;
  className?: string;
}

/**
 * The payment step for any provider the store has, via the SDK's
 * `startPayment`: it picks the render type the platform returns (redirect,
 * provider iframe, Brainerce embed, JS widget, sandbox), enforces the payment
 * URL / script allowlists, and reports success only after the SERVER confirms
 * the order. This component only chooses the wrapper and the messages.
 */
export function PaymentStep({ checkoutId, className }: PaymentStepProps) {
  const t = useTranslations('checkout');
  const { storeInfo } = useStoreInfo();

  const containerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<PaymentSession | null>(null);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [status, setStatus] = useState<PaymentFlowStatus>('preparing');
  const [failure, setFailure] = useState<string | null>(null);
  const [flowError, setFlowError] = useState<PaymentFlowError | null>(null);
  const [placingTestOrder, setPlacingTestOrder] = useState(false);

  useEffect(() => {
    if (!isValidCheckoutId(checkoutId) || !containerRef.current) return;

    const confirmationUrl = () =>
      `/order-confirmation?checkout_id=${encodeURIComponent(checkoutId)}`;

    let done = false;
    const session = getClient().startPayment(checkoutId, {
      container: containerRef.current,
      onStatus: setStatus,
      onPresentation: setPresentation,
      onSuccess: () => {
        done = true;
        window.location.href = confirmationUrl();
      },
      onFailure: (message) => {
        console.warn('Payment not completed:', message);
        setFailure(message || t('paymentError'));
      },
      onError: (err) => {
        // The provider says it is paid but the order is still on its way
        // (webhook pending) — the confirmation page keeps waiting for it.
        if (err.code === 'unconfirmed') {
          done = true;
          window.location.href = confirmationUrl();
          return;
        }
        console.error('Payment error:', err.code, err.message);
        setFlowError(err);
      },
    });
    sessionRef.current = session;

    // Webhook-only completion safety net (see ORDER_POLL_START_MS).
    let pollCancelled = false;
    const pollStartId = setTimeout(async () => {
      while (!pollCancelled && !done) {
        if (sessionRef.current?.presentation === 'provider-page') {
          try {
            const res = await getClient().waitForOrder(checkoutId, { maxWaitMs: 2500 });
            if (res.success && !pollCancelled && !done) {
              done = true;
              window.location.href = confirmationUrl();
              return;
            }
          } catch {
            // keep polling
          }
        }
        await new Promise((r) => setTimeout(r, ORDER_POLL_INTERVAL_MS));
      }
    }, ORDER_POLL_START_MS);

    return () => {
      pollCancelled = true;
      clearTimeout(pollStartId);
      session.destroy();
      sessionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutId]);

  function handleRetry() {
    setFailure(null);
    sessionRef.current?.reopen();
  }

  async function handleCompleteTestOrder() {
    setPlacingTestOrder(true);
    await sessionRef.current?.completeTestOrder();
    setPlacingTestOrder(false);
  }

  // --- UI ---

  // Defense in depth: the parent already validates checkoutId from URL params,
  // but we re-check here so the component is safe to render in any context.
  if (!isValidCheckoutId(checkoutId)) {
    return (
      <div className={cn('border-destructive/50 rounded-md border p-4', className)}>
        <p className="text-destructive text-sm">{t('paymentError')}</p>
      </div>
    );
  }

  const isFrame = presentation === 'provider-page' || presentation === 'embedded';
  const processing = status === 'processing' || placingTestOrder;
  // A full-panel state replaces the payment UI. The container below stays
  // mounted (only hidden), so the SDK's iframe / widget survives a retry.
  const showFrame = isFrame && !flowError && !processing;

  let panel: React.ReactNode = null;
  if (flowError) {
    const isNotConfigured = flowError.code === 'unavailable';
    panel = (
      <div className="py-12 text-center">
        <svg
          className="text-muted-foreground mx-auto mb-4 h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        <h3 className="text-foreground mb-2 text-lg font-semibold">
          {isNotConfigured ? t('paymentNotConfigured') : t('paymentError')}
        </h3>
        <p className="text-muted-foreground mx-auto max-w-md text-sm">
          {isNotConfigured
            ? t('paymentNotConfiguredDesc')
            : flowError.code === 'session_locked'
              ? t('paymentSessionLocked')
              : flowError.code === 'blocked_url' || flowError.code === 'blocked_script'
                ? t('paymentRedirectBlocked')
                : flowError.code === 'load_failed'
                  ? t('failedToLoadPaymentSdk')
                  : flowError.message}
        </p>
        {flowError.code === 'load_failed' && flowError.url && (
          <a
            href={flowError.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary mt-3 inline-block text-sm font-medium hover:underline"
          >
            {t('openPaymentInNewTab')}
          </a>
        )}
        {flowError.code === 'session_locked' && (
          <Link
            href="/cart"
            className="text-primary mt-3 inline-block text-sm font-medium hover:underline"
          >
            {t('backToCart')}
          </Link>
        )}
      </div>
    );
  } else if (processing) {
    panel = (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground mt-4 text-sm">{t('confirmingPayment')}</p>
      </div>
    );
  } else if (presentation === 'sandbox') {
    panel = (
      <div className="py-8 text-center">
        <div className="mx-auto max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-foreground mb-1 text-lg font-semibold">{t('sandboxTitle')}</h3>
          <p className="text-muted-foreground mb-4 text-sm">{t('sandboxDescription')}</p>
          <button
            onClick={handleCompleteTestOrder}
            className="inline-flex items-center rounded-md bg-amber-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600"
          >
            {t('completeTestOrder')}
          </button>
        </div>
      </div>
    );
  } else if (presentation === 'redirect') {
    const paymentUrl = sessionRef.current?.paymentUrl;
    panel = (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground mt-4 text-sm">{t('redirectingToPayment')}</p>
        {paymentUrl && (
          <p className="text-muted-foreground mt-2 text-xs">
            {t('redirectingHint')}
            <a href={paymentUrl} className="text-primary hover:underline">
              {t('clickHere')}
            </a>
            .
          </p>
        )}
      </div>
    );
  } else if (!isFrame) {
    // Preparing, or a JS widget (it opens its own overlay).
    panel = (
      <>
        {status !== 'open' && status !== 'closed' && !failure && (
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground mt-4 text-sm">
              {presentation === 'widget' ? t('loadingPaymentOptions') : t('preparingPayment')}
            </p>
          </div>
        )}
        {status === 'closed' && !failure && (
          <div className="py-4 text-center">
            <button
              type="button"
              onClick={handleRetry}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
            >
              {t('reopenPayment')}
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={cn('py-4', className)}>
      {!flowError && !processing && failure && (
        <div
          role="alert"
          className="bg-destructive/10 border-destructive/20 mb-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
        >
          <p className="text-destructive text-sm">{failure}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="text-foreground flex-shrink-0 text-sm font-medium hover:underline"
          >
            {t('tryAgain')}
          </button>
        </div>
      )}
      {panel}
      {/* Stable host for the SDK's iframe / widget — never unmounted mid-flow */}
      <div
        className={cn(showFrame && 'border-border overflow-hidden rounded-2xl border shadow-sm')}
        hidden={isFrame && !showFrame}
      >
        {showFrame && (
          <div className="border-border flex items-center justify-between gap-4 border-b px-5 py-4">
            <div className="flex min-w-0 flex-col">
              <span className="text-foreground truncate text-sm font-semibold">
                {storeInfo?.name}
              </span>
              <span className="text-muted-foreground text-xs">{t('payment')}</span>
            </div>
          </div>
        )}
        {showFrame && status !== 'open' && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        )}
        <div
          ref={containerRef}
          className={cn(isFrame && 'transition-[height] duration-200 ease-out')}
          style={presentation === 'provider-page' ? { height: PROVIDER_PAGE_HEIGHT } : undefined}
        />
        {showFrame && (
          <div className="border-border bg-secondary/30 text-muted-foreground flex items-center justify-center gap-2 border-t px-5 py-3 text-xs">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>
              {t('securePayment')} · <span className="font-medium">Brainerce</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
