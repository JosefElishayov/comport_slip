'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { PaymentIntent, PaymentClientSdk } from 'brainerce';
import { formatPrice } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useTranslations } from '@/lib/translations';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useStoreInfo } from '@/providers/store-provider';
import { cn } from '@/lib/utils';
import { isAllowedPaymentUrl, isValidCheckoutId, safePaymentRedirect } from '@/lib/safe-redirect';

/**
 * Backward-compat defaults when backend doesn't return clientSdk.
 */
const LEGACY_GROW_SDK: PaymentClientSdk = {
  renderType: 'sdk-widget',
  scriptUrl: 'https://cdn.meshulam.co.il/sdk/gs.min.js',
  globalName: 'growPayment',
  initMethod: 'init',
  renderMethod: 'renderPaymentOptions',
  containerId: 'grow-payment-container',
  initConfig: { version: 1, environment: 'DEV' },
  additionalScripts: [
    { url: 'https://meshulam.co.il/_media/js/apple_pay_sdk/sdk.min.js', optional: true },
  ],
  bodyStyles:
    '[id*="Gr0W8-"],[id*="Gr0W8-"] *,[class*="Gr0W8-"],[class*="Gr0W8-"] *{direction:ltr !important;text-align:left}',
};

interface PaymentStepProps {
  checkoutId: string;
  className?: string;
}

function resolveClientSdk(
  intent: PaymentIntent | null,
  preloadedSdk?: PaymentClientSdk | null
): PaymentClientSdk {
  const fullSdk = [preloadedSdk, intent?.clientSdk].find((s) => s?.renderType);
  const runtimeSdk = intent?.clientSdk;
  if (fullSdk) {
    if (!runtimeSdk || runtimeSdk === fullSdk) return fullSdk;
    return {
      ...fullSdk,
      ...(runtimeSdk.renderArg ? { renderArg: runtimeSdk.renderArg } : {}),
      ...(runtimeSdk.initConfig
        ? { initConfig: { ...fullSdk.initConfig, ...runtimeSdk.initConfig } }
        : {}),
    };
  }
  const legacy = intent?.provider === 'grow' ? LEGACY_GROW_SDK : null;
  if (legacy && runtimeSdk) {
    return {
      ...legacy,
      ...(runtimeSdk.renderArg ? { renderArg: runtimeSdk.renderArg } : {}),
      ...(runtimeSdk.initConfig
        ? { initConfig: { ...legacy.initConfig, ...runtimeSdk.initConfig } }
        : {}),
    };
  }
  if (legacy) return legacy;
  return { renderType: 'redirect' };
}

function extractMessage(response: unknown): string {
  if (typeof response === 'string') return response;
  return (response as { message?: string })?.message || '';
}

export function PaymentStep({ checkoutId, className }: PaymentStepProps) {
  const t = useTranslations('checkout');
  const { storeInfo } = useStoreInfo();

  // Defense in depth: the parent already validates checkoutId from URL params,
  // but we re-check here so the component is safe to render in any context.
  if (!isValidCheckoutId(checkoutId)) {
    return (
      <div className={cn('border-destructive/50 rounded-md border p-4', className)}>
        <p className="text-destructive text-sm">{t('paymentError')}</p>
      </div>
    );
  }

  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [preloadedSdk, setPreloadedSdk] = useState<PaymentClientSdk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const walletOpenRef = useRef(false);
  const initialized = useRef(false);

  // Stable refs for SDK event callbacks (avoids stale closures in onload)
  const cbRef = useRef({
    onSuccess: (_r: unknown) => {},
    onFailure: (_r: unknown) => {},
    onError: (_r: unknown) => {},
    onTimeout: () => {},
    onWalletChange: (_s: string) => {},
    retryRender: () => {},
  });

  const handleSuccess = useCallback(
    async (response: unknown) => {
      console.info('Payment SDK success:', JSON.stringify(response));
      try {
        const client = getClient();
        const resp = response as Record<string, unknown>;
        const data = (resp?.data && typeof resp.data === 'object' ? resp.data : resp) as
          | Record<string, unknown>
          | undefined;
        await client.confirmSdkPayment(checkoutId, data || undefined);
      } catch (err) {
        console.warn('Failed to confirm payment with backend:', err);
      }
      window.location.href = `/order-confirmation?checkout_id=${checkoutId}`;
    },
    [checkoutId]
  );

  cbRef.current = {
    onSuccess: handleSuccess,
    onFailure: (response: unknown) => {
      console.error('Payment SDK failure:', response);
      setError(extractMessage(response) || t('paymentError'));
    },
    onError: (response: unknown) => {
      const TRANSIENT = [
        'Wallet not initialized',
        "SDK was not loaded as needed and therefore can't run",
      ];
      const msg = extractMessage(response);
      if (TRANSIENT.some((e) => msg.includes(e))) {
        console.info('Payment SDK: transient error, retrying render in 1s:', msg);
        setTimeout(() => cbRef.current.retryRender(), 1000);
        return;
      }
      console.error('Payment SDK error:', response);
      setError(msg || t('paymentError'));
    },
    onTimeout: () => {
      console.warn('Payment SDK: wallet timed out');
      setError(t('paymentTimedOut'));
    },
    onWalletChange: (state: string) => {
      console.info('Payment SDK wallet state:', state);
      if (state === 'open') {
        walletOpenRef.current = true;
        setSdkReady(true);
      }
      if (state === 'close') setSdkReady(false);
    },
    retryRender: () => {},
  };

  // =========================================================================
  // MAIN EFFECT — Follows Grow SDK docs exactly:
  //
  // Step 1: Load gs.min.js (insertBefore, as docs show)
  // Step 2: s.onload → growPayment.init({ environment, version, events })
  //         This triggers the SDK to load mp.min.js → CSS, HTML, params, services
  // Step 3: createPaymentIntent (starts wallet timer — should be AFTER init)
  // Step 4: growPayment.renderPaymentOptions(authCode)
  //
  // "call createPaymentProcess right before you need to render the wallet"
  // =========================================================================
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const client = getClient();
    const iframeSuccessUrl = `${window.location.origin}/payment-complete?checkout_id=${checkoutId}`;
    const iframeFailedUrl = `${window.location.origin}/payment-complete?checkout_id=${checkoutId}&failed=true`;
    const redirectSuccessUrl = `${window.location.origin}/order-confirmation?checkout_id=${checkoutId}`;
    const cancelUrl = `${window.location.origin}/checkout?checkout_id=${checkoutId}&canceled=true`;

    let sdkInitDone = false;
    let currentSdk: PaymentClientSdk | null = null;
    const cleanups: (() => void)[] = [];

    // --- Load SDK script exactly as Grow docs show ---
    function loadScript(sdk: PaymentClientSdk) {
      if (!sdk.scriptUrl || !sdk.globalName) return;

      // Inject bodyStyles
      if (sdk.bodyStyles && !document.querySelector('style[data-payment-sdk]')) {
        const style = document.createElement('style');
        style.setAttribute('data-payment-sdk', 'true');
        style.textContent = sdk.bodyStyles;
        document.head.appendChild(style);
        cleanups.push(() => style.remove());
      }

      // Additional scripts (Apple Pay etc.) — fire and forget
      if (sdk.additionalScripts) {
        for (const extra of sdk.additionalScripts) {
          if (document.querySelector(`script[src="${extra.url}"]`)) continue;
          const s = document.createElement('script');
          s.type = 'text/javascript';
          s.async = true;
          s.src = extra.url;
          const ref = document.getElementsByTagName('script')[0];
          if (ref?.parentNode) ref.parentNode.insertBefore(s, ref);
          else document.head.appendChild(s);
        }
      }

      // Already loaded? Init immediately
      if ((window as any)[sdk.globalName]) {
        initSdk(sdk);
        return;
      }

      // Already loading (from a previous call)? Wait for it instead of duplicating
      if (document.querySelector(`script[src="${sdk.scriptUrl}"]`)) {
        const waitId = setInterval(() => {
          if ((window as any)[sdk.globalName!]) {
            clearInterval(waitId);
            initSdk(sdk);
          }
        }, 100);
        cleanups.push(() => clearInterval(waitId));
        return;
      }

      // Load main SDK — insertBefore first <script> as Grow docs show
      const s = document.createElement('script');
      s.type = 'text/javascript';
      s.async = true;
      s.src = sdk.scriptUrl;
      s.onload = () => initSdk(sdk); // init DIRECTLY in onload
      s.onerror = () => {
        console.error('Payment SDK: script load failed');
        setError(t('failedToLoadPaymentSdk'));
      };
      const ref = document.getElementsByTagName('script')[0];
      if (ref?.parentNode) ref.parentNode.insertBefore(s, ref);
      else document.head.appendChild(s);
    }

    // --- Init: called in s.onload (as Grow docs require) ---
    function initSdk(sdk: PaymentClientSdk) {
      if (sdkInitDone) return; // Guard against double init

      const global = (window as any)[sdk.globalName!];
      if (!global) {
        setError(t('failedToLoadPaymentSdk'));
        return;
      }

      const method = sdk.initMethod || 'init';
      const config = {
        ...(sdk.initConfig || {}),
        events: {
          onSuccess: (r: unknown) => cbRef.current.onSuccess(r),
          onFailure: (r: unknown) => cbRef.current.onFailure(r),
          onError: (r: unknown) => cbRef.current.onError(r),
          onTimeout: () => cbRef.current.onTimeout(),
          onWalletChange: (s: string) => cbRef.current.onWalletChange(s),
        },
      };

      console.info(`Payment SDK: calling ${method}()`);
      global[method](config);
      sdkInitDone = true;
    }

    // --- Render: call once, then safety-net retries if wallet doesn't open ---
    // Grow SDK sometimes silently swallows renderPaymentOptions when its
    // internal resources (mp.min.js etc.) aren't fully loaded yet.
    // Strategy: render once, then retry up to 3 times with increasing delays
    // (2s, 3s, 4s) if onWalletChange("open") hasn't fired.
    let pendingRender: { sdk: PaymentClientSdk; intent: PaymentIntent } | null = null;
    let renderAttempts = 0;
    const MAX_RENDER_ATTEMPTS = 4;

    function renderPayment(sdk: PaymentClientSdk, intent: PaymentIntent) {
      const global = (window as any)[sdk.globalName!];
      if (!global || walletOpenRef.current) return;

      const renderMethod = sdk.renderMethod || 'renderPaymentOptions';
      const renderArg = sdk.renderArg || intent.clientSecret;
      renderAttempts++;

      try {
        global[renderMethod](renderArg);
        console.info(`Payment SDK: renderPaymentOptions called (attempt ${renderAttempts})`);
      } catch (err) {
        console.info('Payment SDK: render threw, will retry in 1s');
      }

      // Safety net: if wallet doesn't open within a delay, retry
      if (renderAttempts < MAX_RENDER_ATTEMPTS) {
        const delay = 1000 + renderAttempts * 1000; // 2s, 3s, 4s
        const retryId = setTimeout(() => {
          if (!walletOpenRef.current) {
            console.info(`Payment SDK: wallet not open after ${delay}ms, retrying render...`);
            renderPayment(sdk, intent);
          }
        }, delay);
        cleanups.push(() => clearTimeout(retryId));
      }
    }

    function retryRender() {
      if (pendingRender && !walletOpenRef.current) {
        renderPayment(pendingRender.sdk, pendingRender.intent);
      }
    }

    // =============================================
    // Execution flow
    // =============================================

    // A) Get SDK config from providers (fast, no wallet timer)
    const providerPromise = client
      .getPaymentProviders()
      .then((res) => {
        const sdk = res.defaultProvider?.clientSdk;
        if (sdk) setPreloadedSdk(sdk);
        return sdk || null;
      })
      .catch(() => null);

    // B) Load + init SDK as early as possible (skip for sandbox)
    providerPromise.then((providerSdk) => {
      if (providerSdk?.renderType === 'sandbox') return;
      if (providerSdk?.renderType === 'sdk-widget' && providerSdk.scriptUrl) {
        currentSdk = providerSdk;
        loadScript(providerSdk);
      }
    });

    // C) Create payment intent (starts wallet timer)
    // Wait for provider info so we can choose the right success URL:
    // iframe providers redirect inside the iframe to /payment-complete (postMessage),
    // redirect providers go straight to /order-confirmation.
    const intentPromise = providerPromise
      .then((providerSdk) => {
        const isIframe = providerSdk?.renderType === 'iframe';
        const successUrl = isIframe ? iframeSuccessUrl : redirectSuccessUrl;
        const failedUrl = isIframe ? iframeFailedUrl : cancelUrl;
        return client.createPaymentIntent(checkoutId, {
          successUrl,
          cancelUrl: failedUrl,
        });
      })
      .then((intent) => {
        setPaymentIntent(intent);
        return intent;
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('paymentError'));
        return null;
      })
      .finally(() => setLoading(false));

    // D) When both ready: resolve final SDK config and render
    Promise.all([providerPromise, intentPromise]).then(([providerSdk, intent]) => {
      if (!intent) return;

      const sdk = resolveClientSdk(intent, providerSdk);
      currentSdk = sdk;

      // Sandbox mode — no SDK to load, UI handles it
      if (sdk.renderType === 'sandbox') return;

      if (sdk.renderType === 'redirect') {
        if (!isAllowedPaymentUrl(intent.clientSecret)) {
          setError(t('paymentRedirectBlocked'));
          return;
        }
        safePaymentRedirect(intent.clientSecret);
        return;
      }

      // Iframe mode: listen for postMessage from the /payment-complete callback
      // page that loads inside the iframe after the provider redirects on completion.
      if (sdk.renderType === 'iframe') {
        if (!isAllowedPaymentUrl(intent.clientSecret)) {
          setError(t('paymentRedirectBlocked'));
          return;
        }
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type !== 'brainerce:payment-complete') return;

          const params = event.data.data as Record<string, string> | undefined;
          if (params?.failed === 'true') {
            setError(t('paymentError'));
            return;
          }

          // Map provider-specific params to normalized format for
          // server-side verification (e.g. CardCom lowprofilecode → paymentIntentId)
          const lowProfileCode = params?.lowprofilecode || params?.LowProfileCode;
          const normalized: Record<string, unknown> = { ...params };
          if (lowProfileCode) {
            normalized.paymentIntentId = lowProfileCode;
          }

          // Trigger server-side verification + order creation
          handleSuccess(normalized);
        };
        window.addEventListener('message', handleMessage);
        cleanups.push(() => window.removeEventListener('message', handleMessage));
        return;
      }

      if (sdk.renderType !== 'sdk-widget' || !sdk.globalName) return;

      // Store for retryRender from onError callback
      pendingRender = { sdk, intent };
      cbRef.current.retryRender = retryRender;

      // If SDK wasn't loaded from providers, load + init now
      if (!sdkInitDone) {
        loadScript(sdk);
        // Wait for init to complete, then render once
        const id = setInterval(() => {
          if (sdkInitDone) {
            clearInterval(id);
            renderPayment(sdk, intent);
          }
        }, 100);
        cleanups.push(() => clearInterval(id));
        return;
      }

      // Re-init with final config if environment changed
      if (sdk.initConfig?.environment && currentSdk) {
        const global = (window as any)[sdk.globalName];
        if (global) {
          const method = sdk.initMethod || 'init';
          global[method]({
            ...(sdk.initConfig || {}),
            events: {
              onSuccess: (r: unknown) => cbRef.current.onSuccess(r),
              onFailure: (r: unknown) => cbRef.current.onFailure(r),
              onError: (r: unknown) => cbRef.current.onError(r),
              onTimeout: () => cbRef.current.onTimeout(),
              onWalletChange: (s: string) => cbRef.current.onWalletChange(s),
            },
          });
        }
      }

      // SDK ready — render once
      renderPayment(sdk, intent);
    });

    return () => cleanups.forEach((fn) => fn());
  }, [checkoutId]);

  // --- UI ---

  if (loading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground mt-4 text-sm">{t('preparingPayment')}</p>
      </div>
    );
  }

  if (error) {
    const isNotConfigured =
      error.toLowerCase().includes('not configured') ||
      error.toLowerCase().includes('no payment') ||
      error.toLowerCase().includes('provider');
    return (
      <div className={cn('py-12 text-center', className)}>
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
          {isNotConfigured ? t('paymentNotConfiguredDesc') : error}
        </p>
      </div>
    );
  }

  if (!paymentIntent) return null;

  const sdk = resolveClientSdk(paymentIntent, preloadedSdk);

  if (sdk.renderType === 'sandbox') {
    const handleCompleteSandbox = async () => {
      setLoading(true);
      try {
        const client = getClient();
        await client.completeGuestCheckout(checkoutId);
        window.location.href = `/order-confirmation?checkout_id=${checkoutId}`;
      } catch (err) {
        setError(err instanceof Error ? err.message : t('paymentError'));
        setLoading(false);
      }
    };

    return (
      <div className={cn('py-8 text-center', className)}>
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
            onClick={handleCompleteSandbox}
            className="inline-flex items-center rounded-md bg-amber-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600"
          >
            {t('completeTestOrder')}
          </button>
        </div>
      </div>
    );
  }

  if (sdk.renderType === 'sdk-widget') {
    const containerId =
      sdk.containerId || `${paymentIntent.provider || 'payment'}-payment-container`;
    return (
      <div className={cn('py-4', className)}>
        {!sdkReady && (
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground mt-4 text-sm">{t('loadingPaymentOptions')}</p>
          </div>
        )}
        <div id={containerId} />
      </div>
    );
  }

  if (sdk.renderType === 'iframe') {
    if (!isAllowedPaymentUrl(paymentIntent.clientSecret)) return null;
    const formattedAmount = formatPrice((Number(paymentIntent.amount) || 0) / 100, {
      currency: paymentIntent.currency,
    }) as string;
    return (
      <>
        {/* Modal overlay */}
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-6 backdrop-blur-sm">
          <div className="bg-background relative mx-4 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="border-border flex items-center justify-between gap-4 border-b px-5 py-4">
              <div className="flex min-w-0 flex-col">
                <span className="text-foreground truncate text-sm font-semibold">
                  {storeInfo?.name}
                </span>
                <span className="text-muted-foreground text-xs">{t('payment')}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-foreground text-lg font-bold tabular-nums">
                  {formattedAmount}
                </span>
                <span className="text-muted-foreground text-xs uppercase">
                  {paymentIntent.currency}
                </span>
              </div>
              <button
                onClick={() => {
                  window.location.href = `/checkout?checkout_id=${checkoutId}&canceled=true`;
                }}
                className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
                aria-label="Close"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>
            {/* Iframe body */}
            <iframe
              src={paymentIntent.clientSecret}
              className="w-full border-0"
              style={{ height: '80vh' }}
              title={t('payment')}
              allow="payment"
            />
            {/* Footer */}
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
          </div>
        </div>
        {/* Placeholder so the checkout layout doesn't collapse */}
        <div className={cn('flex flex-col items-center justify-center py-12', className)}>
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground mt-4 text-sm">{t('preparingPayment')}</p>
        </div>
      </>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground mt-4 text-sm">{t('redirectingToPayment')}</p>
      <p className="text-muted-foreground mt-2 text-xs">
        {t('redirectingHint')}
        <a href={paymentIntent.clientSecret} className="text-primary hover:underline">
          {t('clickHere')}
        </a>
        .
      </p>
    </div>
  );
}
