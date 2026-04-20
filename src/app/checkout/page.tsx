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

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { storeInfo } = useStoreInfo();
  const { cart, refreshCart } = useCart();
  const { isLoggedIn } = useAuth();
  const currency = storeInfo?.currency || 'USD';
  const t = useTranslations('checkout');
  const tc = useTranslations('common');

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
  const [shippingOpen, setShippingOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Check for returning from canceled payment
  const canceled = searchParams.get('canceled') === 'true';
  const checkoutIdParam = searchParams.get('checkout_id');
  const existingCheckoutId = isValidCheckoutId(checkoutIdParam) ? checkoutIdParam : null;

  // Derived progress states
  const addressDone = isAllDigital
    ? !!checkout?.email
    : deliveryType === 'pickup'
      ? !!checkout?.pickupLocation
      : !!checkout?.shippingAddress;
  const shippingDone = isAllDigital || deliveryType === 'pickup' || !!selectedRateId;

  // Auto-open shipping drawer when address is done
  useEffect(() => {
    if (addressDone) setShippingOpen(true);
  }, [addressDone]);

  // Auto-open payment drawer when shipping is done
  useEffect(() => {
    if (shippingDone) setPaymentOpen(true);
  }, [shippingDone]);

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

          // Load custom fields
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

          // Determine state based on checkout
          const allDigital = existing.lineItems.every(
            (i) => (i.product as unknown as { isDownloadable?: boolean }).isDownloadable
          );
          setIsAllDigital(allDigital);

          if (existing.deliveryType === 'pickup' && existing.pickupLocation) {
            setDeliveryType('pickup');
          }

          // If shipping address already set, fetch rates
          if (!allDigital && existing.shippingAddress && existing.deliveryType !== 'pickup') {
            const rates = await client.getShippingRates(existing.id);
            setShippingRates(rates);
            if (existing.shippingRateId) {
              setSelectedRateId(existing.shippingRateId);
            }
          }

          return;
        }

        // Create new checkout — cart is always server-side now
        const newCheckout = await client.createCheckout({ cartId: cart.id });
        setCheckout(newCheckout);

        // Load custom fields early
        client
          .getCheckoutCustomFields(newCheckout.id)
          .then(setCustomFields)
          .catch(() => setCustomFields([]));

        // If all items are downloadable, skip shipping
        const allDigital = newCheckout.lineItems.every(
          (i) => (i.product as unknown as { isDownloadable?: boolean }).isDownloadable
        );
        setIsAllDigital(allDigital);

        // If pickup locations exist, default to shipping (user can toggle)
        if (locations.length > 0) {
          setDeliveryType('shipping');
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

  // Submit custom fields helper
  async function submitCustomFields(checkoutId: string) {
    if (customFields.length === 0) return;
    // Only submit if there are values
    const hasValues = Object.values(customFieldValues).some(
      (v) => v !== undefined && v !== null && v !== ''
    );
    if (!hasValues) return;
    try {
      setCustomFieldsLoading(true);
      const updated = await getClient().setCheckoutCustomFields(checkoutId, customFieldValues);
      setCheckout(updated);
    } catch {
      // Non-critical — don't block the flow
    } finally {
      setCustomFieldsLoading(false);
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
        // Also submit custom fields
        await submitCustomFields(updated.id);
      } else {
        const response = await client.setShippingAddress(checkout.id, address);
        setCheckout(response.checkout);
        setShippingRates(response.rates);
        // Also submit custom fields
        await submitCustomFields(response.checkout.id);
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
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedToSelectShipping');
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delivery method toggle
  async function handleDeliveryTypeSelect(method: 'shipping' | 'pickup') {
    if (!checkout) return;

    try {
      setLoading(true);
      setError(null);
      setDeliveryType(method);
      const client = getClient();
      await client.setDeliveryType(checkout.id, method);
      // Reset progress when switching
      setShippingRates([]);
      setSelectedRateId(null);
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
      // Also submit custom fields
      await submitCustomFields(updated.id);
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

  // Custom fields inline renderer (rendered inside CheckoutForm as children)
  const customFieldsInline =
    customFields.length > 0 ? (
      <div className="border-border border-t pt-4">
        <CustomFieldsStep
          fields={customFields}
          values={customFieldValues}
          onChange={(key, value) =>
            setCustomFieldValues((prev) => ({ ...prev, [key]: value }))
          }
          onApply={() => {}}
          onUploadFile={(file) => getClient().uploadCustomizationFile(file)}
          loading={customFieldsLoading}
          hideSubmit
        />
      </div>
    ) : null;

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

      {/* Error banner */}
      {error && checkout && (
        <div className="bg-destructive/10 border-destructive/20 text-destructive mb-6 rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main content — all sections visible */}
        <div className="space-y-6 lg:col-span-2">

          {/* === DELIVERY METHOD TOGGLE === */}
          {!isAllDigital && pickupLocations.length > 0 && (
            <div className="border-border rounded-lg border p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">{t('deliveryMethod')}</h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleDeliveryTypeSelect('shipping')}
                  disabled={loading}
                  className={cn(
                    'flex flex-1 items-center gap-3 rounded border px-4 py-3 text-start transition-colors',
                    deliveryType === 'shipping'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <svg className="text-muted-foreground h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  <span className="text-foreground text-sm font-medium">{t('shipToAddress')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeliveryTypeSelect('pickup')}
                  disabled={loading}
                  className={cn(
                    'flex flex-1 items-center gap-3 rounded border px-4 py-3 text-start transition-colors',
                    deliveryType === 'pickup'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <svg className="text-muted-foreground h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
                  </svg>
                  <span className="text-foreground text-sm font-medium">{t('pickUpInStore')}</span>
                </button>
              </div>
            </div>
          )}

          {/* === ADDRESS / CONTACT / PICKUP + CUSTOM FIELDS === */}
          <div className="border-border rounded-lg border p-6">
            <h2 className="text-foreground mb-4 text-lg font-semibold">
              {isAllDigital
                ? t('contactInfo')
                : deliveryType === 'pickup'
                  ? t('pickupLocation')
                  : t('shippingAddress')}
            </h2>

            {deliveryType === 'pickup' && !isAllDigital ? (
              /* Pickup form with custom fields */
              <>
                <PickupStep
                  locations={pickupLocations}
                  onSelect={handlePickupSelect}
                  loading={loading}
                  initialEmail={checkout?.email || ''}
                />
                {customFieldsInline}
              </>
            ) : (
              /* Address / Contact form with custom fields inline */
              <CheckoutForm
                onSubmit={handleAddressSubmit}
                loading={loading}
                destinations={isAllDigital ? null : destinations}
                showSaveDetails={isLoggedIn && !hasSavedAddress && !isAllDigital}
                emailOnly={isAllDigital}
                submitLabel={isAllDigital ? t('continueToPayment') : undefined}
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
              >
                {customFieldsInline}
              </CheckoutForm>
            )}
          </div>

          {/* === SHIPPING METHOD (collapsible) === */}
          {!isAllDigital && deliveryType === 'shipping' && (
            <div
              className={cn(
                'border-border rounded-lg border transition-opacity',
                !addressDone && 'pointer-events-none opacity-40'
              )}
            >
              <button
                type="button"
                onClick={() => addressDone && setShippingOpen((v) => !v)}
                className="flex w-full items-center justify-between p-6"
              >
                <h2 className="text-foreground text-lg font-semibold">{t('shippingMethod')}</h2>
                <svg
                  className={cn(
                    'text-muted-foreground h-5 w-5 transition-transform duration-200',
                    shippingOpen && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-300 ease-in-out',
                  shippingOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-6">
                    {shippingRates.length > 0 ? (
                      <ShippingStep
                        rates={shippingRates}
                        selectedRateId={selectedRateId}
                        onSelect={handleShippingSelect}
                        loading={loading}
                      />
                    ) : (
                      <p className="text-muted-foreground py-4 text-center text-sm">
                        {addressDone ? t('noShippingOptions') : t('fillAddressForShipping')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === PAYMENT (collapsible) === */}
          <div
            className={cn(
              'border-border rounded-lg border transition-opacity',
              !shippingDone && 'pointer-events-none opacity-40'
            )}
          >
            <button
              type="button"
              onClick={() => shippingDone && setPaymentOpen((v) => !v)}
              className="flex w-full items-center justify-between p-6"
            >
              <h2 className="text-foreground text-lg font-semibold">{t('payment')}</h2>
              <svg
                className={cn(
                  'text-muted-foreground h-5 w-5 transition-transform duration-200',
                  paymentOpen && 'rotate-180'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-in-out',
                paymentOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                <div className="px-6 pb-6">
                  {shippingDone && checkout ? (
                    <PaymentStep checkoutId={checkout.id} />
                  ) : (
                    <p className="text-muted-foreground py-4 text-center text-sm">
                      {t('completeAboveSteps')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
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

            {/* Coupon input */}
            {cart && (
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
