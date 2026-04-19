'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import type {
  Checkout,
  ShippingRate,
  SetShippingAddressDto,
  ShippingDestinations,
  PickupLocation,
  CheckoutBumpsResponse,
  CheckoutCustomFieldDefinition,
} from 'brainerce';
import { formatPrice } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useStoreInfo, useCart, useAuth } from '@/providers/store-provider';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { ShippingStep } from '@/components/checkout/shipping-step';
import { PaymentStep } from '@/components/checkout/payment-step';
import { DeliveryMethodStep } from '@/components/checkout/delivery-method-step';
import { PickupStep } from '@/components/checkout/pickup-step';
import { CustomFieldsStep } from '@/components/checkout/custom-fields-step';
import { TaxDisplay } from '@/components/checkout/tax-display';
import { OrderBumpCard } from '@/components/checkout/order-bump-card';
import { CouponInput } from '@/components/cart/coupon-input';
import { ReservationCountdown } from '@/components/cart/reservation-countdown';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { isValidCheckoutId } from '@/lib/safe-redirect';

type CheckoutStep = 'method' | 'address' | 'shipping' | 'pickup' | 'custom-fields' | 'payment';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { storeInfo } = useStoreInfo();
  const { cart, refreshCart } = useCart();
  const { isLoggedIn } = useAuth();
  const currency = storeInfo?.currency || 'USD';
  const t = useTranslations('checkout');
  const tc = useTranslations('common');

  const [step, setStep] = useState<CheckoutStep>('address');
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<ShippingDestinations | null>(null);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [deliveryType, setDeliveryType] = useState<'shipping' | 'pickup'>('shipping');
  const [isAllDigital, setIsAllDigital] = useState(false);
  const [prefillAddress, setPrefillAddress] = useState<SetShippingAddressDto | null>(null);
  const [prefillCustomer, setPrefillCustomer] = useState<{
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  } | null>(null);
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [orderBumps, setOrderBumps] = useState<CheckoutBumpsResponse | null>(null);
  const [addedBumpIds, setAddedBumpIds] = useState<Set<string>>(new Set());
  const [bumpLoading, setBumpLoading] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CheckoutCustomFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({});
  const [customFieldsLoading, setCustomFieldsLoading] = useState(false);

  // Check for returning from canceled payment
  const canceled = searchParams.get('canceled') === 'true';
  const checkoutIdParam = searchParams.get('checkout_id');
  const existingCheckoutId = isValidCheckoutId(checkoutIdParam) ? checkoutIdParam : null;

  // Pre-fill address and customer data from profile when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    getClient()
      .getCheckoutPrefillData()
      .then((data) => {
        if (data.customer) setPrefillCustomer(data.customer);
        if (data.shippingAddress) {
          setPrefillAddress(data.shippingAddress);
          setHasSavedAddress(true);
        }
      })
      .catch(() => {});
  }, [isLoggedIn]);

  // Initialize or resume checkout (only once)
  const checkoutInitRef = useRef(false);
  const cartIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only init once, or if cart ID actually changed (e.g. cart was replaced)
    if (!cart?.id) return;
    if (checkoutInitRef.current && cartIdRef.current === cart.id) return;
    checkoutInitRef.current = true;
    cartIdRef.current = cart.id;

    const initCheckout = async () => {
      try {
        setInitializing(true);
        setError(null);
        const client = getClient();

        // Fetch shipping destinations and pickup locations in parallel
        client
          .getShippingDestinations()
          .then(setDestinations)
          .catch(() => {});

        const locations = await client.getPickupLocations().catch(() => [] as PickupLocation[]);
        setPickupLocations(locations);

        // If returning with existing checkout ID, resume it
        if (existingCheckoutId) {
          const existing = await client.getCheckout(existingCheckoutId);
          setCheckout(existing);

          // Preload custom field definitions and any existing values so the
          // step indicator and "change options" affordance work on resume.
          client
            .getCheckoutCustomFields(existing.id)
            .then((fields) => {
              setCustomFields(fields);
              const existingValues = (
                existing as unknown as {
                  customFieldValues?: Record<string, unknown> | null;
                }
              ).customFieldValues;
              if (existingValues) setCustomFieldValues(existingValues);
            })
            .catch(() => {
              setCustomFields([]);
            });

          // Determine step based on checkout state
          const allDigital = existing.lineItems.every(
            (i) => (i.product as unknown as { isDownloadable?: boolean }).isDownloadable
          );
          setIsAllDigital(allDigital);
          if (allDigital) {
            // Digital products: show contact info step if email not set, else payment
            setStep(existing.email ? 'payment' : 'address');
          } else if (existing.deliveryType === 'pickup' && existing.pickupLocation) {
            setDeliveryType('pickup');
            setStep('payment');
          } else if (existing.shippingAddress && existing.shippingRateId) {
            setStep('payment');
          } else if (existing.shippingAddress) {
            // Fetch shipping rates
            const rates = await client.getShippingRates(existing.id);
            setShippingRates(rates);
            setStep('shipping');
          } else if (locations.length > 0) {
            setStep('method');
          }
          return;
        }

        // Create new checkout — cart is always server-side now
        const newCheckout = await client.createCheckout({ cartId: cart.id });
        setCheckout(newCheckout);

        // If all items are downloadable, skip shipping — show contact info step
        const allDigital = newCheckout.lineItems.every(
          (i) => (i.product as unknown as { isDownloadable?: boolean }).isDownloadable
        );
        setIsAllDigital(allDigital);
        if (allDigital) {
          setStep('address');
          return;
        }

        // If pickup locations exist, start with delivery method selection
        if (locations.length > 0) {
          setStep('method');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t('failedToInitCheckout');
        setError(message);
      } finally {
        setInitializing(false);
      }
    };

    initCheckout();
  }, [cart?.id, existingCheckoutId]);

  // Load order bumps when checkout is available
  useEffect(() => {
    if (!checkout?.id || storeInfo?.upsell?.checkoutOrderBumpEnabled === false) {
      setOrderBumps(null);
      return;
    }
    const client = getClient();
    client
      .getCheckoutBumps(checkout.id)
      .then((data) => {
        setOrderBumps(data);
        // Detect already-added bumps from cart
        if (cart?.items) {
          const existingBumpIds = new Set<string>();
          for (const item of cart.items) {
            const meta = item.metadata as Record<string, unknown> | undefined;
            if (meta?.isOrderBump && meta?.orderBumpId) {
              existingBumpIds.add(meta.orderBumpId as string);
            }
          }
          setAddedBumpIds(existingBumpIds);
        }
      })
      .catch(() => {});
  }, [checkout?.id, storeInfo?.upsell?.checkoutOrderBumpEnabled]);

  // Handle bump toggle
  async function handleBumpToggle(bumpId: string, add: boolean, variantId?: string) {
    if (!cart?.id || bumpLoading) return;
    try {
      setBumpLoading(bumpId);
      const client = getClient();
      if (add) {
        await client.addOrderBump(cart.id, bumpId, variantId);
        setAddedBumpIds((prev) => new Set([...prev, bumpId]));
      } else {
        await client.removeOrderBump(cart.id, bumpId);
        setAddedBumpIds((prev) => {
          const next = new Set(prev);
          next.delete(bumpId);
          return next;
        });
      }
      await refreshCart();
    } catch (err) {
      console.error('Failed to toggle order bump:', err);
    } finally {
      setBumpLoading(null);
    }
  }

  // Handle shipping address submission
  async function handleAddressSubmit(
    address: SetShippingAddressDto,
    consent: { acceptsMarketing: boolean; saveDetails: boolean }
  ) {
    if (!checkout) return;

    try {
      setLoading(true);
      setError(null);
      const client = getClient();

      if (isAllDigital) {
        // Digital products: set customer info only, skip shipping
        const updated = await client.setCheckoutCustomer(checkout.id, {
          email: address.email,
          firstName: address.firstName,
          lastName: address.lastName,
          phone: address.phone,
          acceptsMarketing: consent.acceptsMarketing,
        });
        setCheckout(updated);
        setStep('payment');
      } else {
        const response = await client.setShippingAddress(checkout.id, address);
        setCheckout(response.checkout);
        setShippingRates(response.rates);
        setStep('shipping');
      }

      // Update marketing preference for logged-in users
      if (isLoggedIn) {
        try {
          await client.updateMyProfile({ acceptsMarketing: consent.acceptsMarketing });
        } catch {
          // non-critical
        }
      }

      // Save address to profile if checkbox was checked and no existing saved address
      if (isLoggedIn && consent.saveDetails && !hasSavedAddress && !isAllDigital) {
        try {
          await client.addMyAddress({
            firstName: address.firstName,
            lastName: address.lastName,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            region: address.region,
            postalCode: address.postalCode,
            country: address.country,
            phone: address.phone,
            isDefault: true,
          });
        } catch {
          // non-critical
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedToSaveAddress');
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // After shipping/pickup is set, decide whether to show the custom-fields step
  // or jump straight to payment. Returns the next step.
  async function loadCustomFieldsOrSkip(checkoutId: string): Promise<CheckoutStep> {
    try {
      const fields = await getClient().getCheckoutCustomFields(checkoutId);
      setCustomFields(fields);
      return fields.length > 0 ? 'custom-fields' : 'payment';
    } catch {
      // If the endpoint isn't available or fails, fall through to payment
      // rather than blocking the customer.
      setCustomFields([]);
      return 'payment';
    }
  }

  // Handle shipping method selection
  async function handleShippingSelect(rateId: string) {
    if (!checkout) return;

    try {
      setLoading(true);
      setError(null);
      setSelectedRateId(rateId);
      const client = getClient();

      const updated = await client.selectShippingMethod(checkout.id, rateId);
      setCheckout(updated);
      setStep(await loadCustomFieldsOrSkip(updated.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedToSelectShipping');
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Submit custom fields
  async function handleCustomFieldsApply() {
    if (!checkout) return;
    try {
      setCustomFieldsLoading(true);
      setError(null);
      const updated = await getClient().setCheckoutCustomFields(checkout.id, customFieldValues);
      setCheckout(updated);
      setStep('payment');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('customFieldsFailed');
      setError(message);
    } finally {
      setCustomFieldsLoading(false);
    }
  }

  // Handle delivery method selection
  async function handleDeliveryTypeSelect(method: 'shipping' | 'pickup') {
    if (!checkout) return;

    try {
      setLoading(true);
      setError(null);
      setDeliveryType(method);
      const client = getClient();

      await client.setDeliveryType(checkout.id, method);

      if (method === 'shipping') {
        setStep('address');
      } else {
        setStep('pickup');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedToSetDeliveryMethod');
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Handle pickup location selection
  async function handlePickupSelect(
    locationId: string,
    customerInfo: { email: string; firstName?: string; lastName?: string; phone?: string }
  ) {
    if (!checkout) return;

    try {
      setLoading(true);
      setError(null);
      const client = getClient();

      const updated = await client.selectPickupLocation(checkout.id, {
        pickupRateId: locationId,
        email: customerInfo.email,
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        phone: customerInfo.phone,
      });
      setCheckout(updated);
      setStep(await loadCustomFieldsOrSkip(updated.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedToSelectPickup');
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Refresh cart and checkout after coupon apply/remove
  const handleCouponUpdate = useCallback(async () => {
    await refreshCart();
    if (checkout) {
      try {
        const client = getClient();
        const updated = await client.getCheckout(checkout.id);
        setCheckout(updated);
      } catch (err) {
        console.error('Failed to refresh checkout after coupon update:', err);
      }
    }
  }, [checkout, refreshCart]);

  if (initializing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-foreground text-2xl font-bold">{t('emptyCart')}</h1>
        <p className="text-muted-foreground mt-2">{t('emptyCartSubtitle')}</p>
        <Link
          href="/products"
          className="bg-primary text-primary-foreground mt-6 inline-flex items-center rounded px-6 py-3 font-medium transition-opacity hover:opacity-90"
        >
          {tc('shopNow')}
        </Link>
      </div>
    );
  }

  if (error && !checkout) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-foreground text-2xl font-bold">{t('errorTitle')}</h1>
        <p className="text-destructive mt-2">{error}</p>
        <Link
          href="/cart"
          className="bg-primary text-primary-foreground mt-6 inline-flex items-center rounded px-6 py-3 font-medium transition-opacity hover:opacity-90"
        >
          {t('returnToCart')}
        </Link>
      </div>
    );
  }

  const customFieldsStep =
    customFields.length > 0
      ? [{ key: 'custom-fields' as CheckoutStep, label: t('stepCustomFields') }]
      : [];

  const steps: { key: CheckoutStep; label: string }[] = isAllDigital
    ? [
        { key: 'address', label: t('stepContactInfo') },
        ...customFieldsStep,
        { key: 'payment', label: t('stepPayment') },
      ]
    : pickupLocations.length > 0
      ? deliveryType === 'pickup'
        ? [
            { key: 'method', label: t('stepMethod') },
            { key: 'pickup', label: t('stepPickup') },
            ...customFieldsStep,
            { key: 'payment', label: t('stepPayment') },
          ]
        : [
            { key: 'method', label: t('stepMethod') },
            { key: 'address', label: t('stepAddress') },
            { key: 'shipping', label: t('stepShipping') },
            ...customFieldsStep,
            { key: 'payment', label: t('stepPayment') },
          ]
      : [
          { key: 'address', label: t('stepAddress') },
          { key: 'shipping', label: t('stepShipping') },
          ...customFieldsStep,
          { key: 'payment', label: t('stepPayment') },
        ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-foreground mb-6 text-2xl font-bold">{t('title')}</h1>

      {/* Canceled payment banner */}
      {canceled && (
        <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300">
          {t('paymentCanceledBanner')}
        </div>
      )}

      {/* Reservation countdown */}
      {checkout?.reservation?.hasReservation && (
        <ReservationCountdown reservation={checkout.reservation} className="mb-6" />
      )}

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((s, index) => (
          <div key={s.key} className="flex items-center">
            {index > 0 && (
              <div
                className={cn(
                  'mx-2 h-px w-8 sm:w-12',
                  index <= currentStepIndex ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                  index < currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {index < currentStepIndex ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'hidden text-sm sm:block',
                  index <= currentStepIndex
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && checkout && (
        <div className="bg-destructive/10 border-destructive/20 text-destructive mb-6 rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Delivery Method */}
          {step === 'method' && (
            <div>
              <h2 className="text-foreground mb-4 text-lg font-semibold">{t('deliveryMethod')}</h2>
              <DeliveryMethodStep onSelect={handleDeliveryTypeSelect} />
            </div>
          )}

          {/* Address */}
          {step === 'address' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-foreground text-lg font-semibold">
                  {isAllDigital ? t('contactInfo') : t('shippingAddress')}
                </h2>
                {!isAllDigital && pickupLocations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep('method')}
                    className="text-primary text-sm hover:underline"
                  >
                    {t('changeMethod')}
                  </button>
                )}
              </div>
              <CheckoutForm
                onSubmit={handleAddressSubmit}
                loading={loading}
                destinations={isAllDigital ? null : destinations}
                showSaveDetails={isLoggedIn && !hasSavedAddress && !isAllDigital}
                emailOnly={isAllDigital}
                initialValues={
                  checkout?.shippingAddress
                    ? {
                        email: checkout.email || '',
                        firstName: checkout.shippingAddress.firstName,
                        lastName: checkout.shippingAddress.lastName,
                        line1: checkout.shippingAddress.line1,
                        line2: checkout.shippingAddress.line2 || '',
                        city: checkout.shippingAddress.city,
                        region: checkout.shippingAddress.region || '',
                        postalCode: checkout.shippingAddress.postalCode,
                        country: checkout.shippingAddress.country,
                        phone: checkout.shippingAddress.phone || '',
                      }
                    : prefillAddress
                      ? {
                          email: prefillAddress.email,
                          firstName: prefillAddress.firstName,
                          lastName: prefillAddress.lastName,
                          line1: prefillAddress.line1,
                          line2: prefillAddress.line2 || '',
                          city: prefillAddress.city,
                          region: prefillAddress.region || '',
                          postalCode: prefillAddress.postalCode,
                          country: prefillAddress.country,
                          phone: prefillAddress.phone || '',
                        }
                      : prefillCustomer
                        ? {
                            email: prefillCustomer.email,
                            firstName: prefillCustomer.firstName || '',
                            lastName: prefillCustomer.lastName || '',
                            phone: prefillCustomer.phone || '',
                          }
                        : undefined
                }
              />
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 'shipping' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-foreground text-lg font-semibold">{t('shippingMethod')}</h2>
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="text-primary text-sm hover:underline"
                >
                  {t('editAddress')}
                </button>
              </div>

              <ShippingStep
                rates={shippingRates}
                selectedRateId={selectedRateId}
                onSelect={handleShippingSelect}
                loading={loading}
              />
            </div>
          )}

          {/* Pickup */}
          {step === 'pickup' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-foreground text-lg font-semibold">{t('pickupLocation')}</h2>
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="text-primary text-sm hover:underline"
                >
                  {t('changeMethod')}
                </button>
              </div>
              <PickupStep
                locations={pickupLocations}
                onSelect={handlePickupSelect}
                loading={loading}
                initialEmail={checkout?.email || ''}
              />
            </div>
          )}

          {/* Custom Fields (optional, between shipping/pickup and payment) */}
          {step === 'custom-fields' && checkout && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-foreground text-lg font-semibold">{t('customFieldsTitle')}</h2>
                <button
                  type="button"
                  onClick={() => setStep(deliveryType === 'pickup' ? 'pickup' : 'shipping')}
                  className="text-primary text-sm hover:underline"
                >
                  {deliveryType === 'pickup' ? t('changePickup') : t('changeShipping')}
                </button>
              </div>
              <CustomFieldsStep
                fields={customFields}
                values={customFieldValues}
                onChange={(key, value) =>
                  setCustomFieldValues((prev) => ({ ...prev, [key]: value }))
                }
                onApply={handleCustomFieldsApply}
                onUploadFile={(file) => getClient().uploadCustomizationFile(file)}
                loading={customFieldsLoading}
              />
            </div>
          )}

          {/* Payment */}
          {step === 'payment' && checkout && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-foreground text-lg font-semibold">{t('payment')}</h2>
                {customFields.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep('custom-fields')}
                    className="text-primary text-sm hover:underline"
                  >
                    {t('changeOptions')}
                  </button>
                ) : (
                  !isAllDigital && (
                    <button
                      type="button"
                      onClick={() => setStep(deliveryType === 'pickup' ? 'pickup' : 'shipping')}
                      className="text-primary text-sm hover:underline"
                    >
                      {deliveryType === 'pickup' ? t('changePickup') : t('changeShipping')}
                    </button>
                  )
                )}
              </div>

              <PaymentStep checkoutId={checkout.id} />
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-muted/50 border-border sticky top-24 rounded-lg border p-6">
            <h3 className="text-foreground mb-4 text-lg font-semibold">{t('orderSummary')}</h3>

            {/* Line items */}
            {checkout?.lineItems && checkout.lineItems.length > 0 ? (
              <div className="mb-4 space-y-3">
                {checkout.lineItems.map((item) => {
                  const imageUrl = item.product.images?.[0]?.url || null;
                  const name = item.variant?.name || item.product.name;
                  const lineTotal = parseFloat(item.unitPrice) * item.quantity;

                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="bg-muted relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate text-sm">{name}</p>
                        <p className="text-muted-foreground text-xs">
                          {tc('qty')} {item.quantity}
                        </p>
                      </div>

                      <span className="text-foreground flex-shrink-0 text-sm font-medium">
                        {formatPrice(lineTotal, { currency }) as string}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Fallback to cart items if checkout line items aren't loaded yet
              cart && (
                <div className="mb-4 space-y-2">
                  <p className="text-muted-foreground text-sm">
                    {cart.items.length} {cart.items.length === 1 ? tc('item') : tc('items')}
                  </p>
                </div>
              )
            )}

            {/* Order bumps */}
            {orderBumps?.bumps && orderBumps.bumps.length > 0 && (
              <div className="border-border space-y-2 border-t pt-4">
                <p className="text-foreground text-xs font-semibold uppercase tracking-wide">
                  {t('addToYourOrder')}
                </p>
                {orderBumps.bumps.map((bump) => (
                  <OrderBumpCard
                    key={bump.id}
                    bump={bump}
                    isAdded={addedBumpIds.has(bump.id)}
                    onToggle={handleBumpToggle}
                    loading={bumpLoading === bump.id}
                  />
                ))}
              </div>
            )}

            {/* Coupon input — show from shipping/pickup step onwards (or immediately if digital) */}
            {cart &&
              (isAllDigital || step === 'shipping' || step === 'pickup' || step === 'payment') && (
                <div className="border-border border-t pt-4">
                  <CouponInput cart={cart} onUpdate={handleCouponUpdate} />
                </div>
              )}

            {/* Totals */}
            {checkout && (
              <div className="border-border space-y-2 border-t pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{tc('subtotal')}</span>
                  <span className="text-foreground">
                    {formatPrice(parseFloat(checkout.subtotal), { currency }) as string}
                  </span>
                </div>

                {(() => {
                  const totalDiscount = parseFloat(checkout.discountAmount);
                  const ruleAmt = parseFloat(checkout.ruleDiscountAmount || '0');
                  const couponAmt = totalDiscount - ruleAmt;
                  const rules = cart?.appliedDiscounts;
                  if (totalDiscount <= 0) return null;
                  return (
                    <>
                      {rules && rules.length > 0
                        ? rules.map((rule) => (
                            <div key={rule.ruleId} className="flex items-center justify-between">
                              <span className="text-muted-foreground">{rule.ruleName}</span>
                              <span className="text-destructive">
                                -
                                {
                                  formatPrice(parseFloat(rule.discountAmount), {
                                    currency,
                                  }) as string
                                }
                              </span>
                            </div>
                          ))
                        : ruleAmt > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">{tc('generalDiscount')}</span>
                              <span className="text-destructive">
                                -{formatPrice(ruleAmt, { currency }) as string}
                              </span>
                            </div>
                          )}
                      {checkout.couponCode && couponAmt > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {tc('couponDiscount')} ({checkout.couponCode})
                          </span>
                          <span className="text-destructive">
                            -{formatPrice(couponAmt, { currency }) as string}
                          </span>
                        </div>
                      )}
                      {!checkout.couponCode && ruleAmt <= 0 && (!rules || rules.length === 0) && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{tc('discount')}</span>
                          <span className="text-destructive">
                            -{formatPrice(totalDiscount, { currency }) as string}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}

                {(parseFloat(checkout.shippingAmount) > 0 ||
                  checkout.deliveryType === 'pickup') && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {checkout.deliveryType === 'pickup' ? tc('pickup') : tc('shipping')}
                    </span>
                    <span className="text-foreground">
                      {parseFloat(checkout.shippingAmount) === 0
                        ? tc('free')
                        : (formatPrice(parseFloat(checkout.shippingAmount), {
                            currency,
                          }) as string)}
                    </span>
                  </div>
                )}

                <TaxDisplay
                  addressSet={!!checkout.shippingAddress}
                  taxAmount={checkout.taxAmount}
                  taxBreakdown={checkout.taxBreakdown}
                />

                {/* Custom field surcharges (one line per applied surcharge) */}
                {checkout.appliedSurcharges && checkout.appliedSurcharges.length > 0 && (
                  <>
                    {checkout.appliedSurcharges.map((s) => (
                      <div key={s.key} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{s.name}</span>
                        <span className="text-foreground">
                          {formatPrice(Number(s.amount), { currency }) as string}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                <div className="border-border mt-2 border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-semibold">{tc('total')}</span>
                    <span className="text-foreground text-base font-semibold">
                      {formatPrice(parseFloat(checkout.total), { currency }) as string}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
