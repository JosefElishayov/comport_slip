'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/lib/navigation';
import type {
  CartRecommendationsResponse,
  CartUpgradesResponse,
  CartBundlesResponse,
} from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useCart } from '@/providers/store-provider';
import { CartItem } from '@/components/cart/cart-item';
import { CartUpgradeBanner } from '@/components/cart/cart-upgrade-banner';
import { CartBundleOfferCard } from '@/components/cart/cart-bundle-offer';
import { CartSummary } from '@/components/cart/cart-summary';
import { CouponInput } from '@/components/cart/coupon-input';
import { CartNudges } from '@/components/cart/cart-nudges';
import { FreeShippingBar } from '@/components/cart/free-shipping-bar';
import { ReservationCountdown } from '@/components/cart/reservation-countdown';
import { CartRecommendationSection } from '@/components/products/recommendation-section';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useTranslations } from '@/lib/translations';

export default function CartPage() {
  const { cart, cartLoading, refreshCart, itemCount } = useCart();
  const t = useTranslations('cart');
  const tc = useTranslations('common');
  const [cartRecs, setCartRecs] = useState<CartRecommendationsResponse | null>(null);
  const [upgrades, setUpgrades] = useState<CartUpgradesResponse | null>(null);
  const [bundles, setBundles] = useState<CartBundlesResponse | null>(null);

  // Load recommendations, upgrades, and bundles in a single request
  useEffect(() => {
    if (!cart?.id || cart.items.length === 0) {
      setCartRecs(null);
      setUpgrades(null);
      setBundles(null);
      return;
    }
    const client = getClient();
    client
      .getCart(cart.id, { include: ['recommendations', 'upgrades', 'bundles'] })
      .then((enriched) => {
        setCartRecs(enriched.recommendations ?? null);
        setUpgrades(enriched.upgrades ?? null);
        setBundles(enriched.bundles ?? null);
      })
      .catch(() => {});
  }, [cart?.id, cart?.items.length]);

  if (cartLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <svg
          className="text-muted-foreground mx-auto mb-4 h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <h1 className="text-foreground text-2xl font-bold">{t('emptyTitle')}</h1>
        <p className="text-muted-foreground mt-2">{t('emptySubtitle')}</p>
        <Link
          href="/products"
          className="bg-primary text-primary-foreground mt-6 inline-flex items-center rounded px-6 py-3 font-medium transition-opacity hover:opacity-90"
        >
          {tc('continueShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-foreground mb-6 text-2xl font-bold">
        {t('title')} ({itemCount} {itemCount === 1 ? tc('item') : tc('items')})
      </h1>

      {/* Reservation countdown */}
      {cart.reservation?.hasReservation && (
        <ReservationCountdown reservation={cart.reservation} className="mb-6" />
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {/* Nudges */}
          {cart.nudges && cart.nudges.length > 0 && (
            <CartNudges nudges={cart.nudges} className="mb-4" />
          )}

          {/* Cart items */}
          <div>
            {cart.items.map((item) => (
              <div key={item.id}>
                <CartItem item={item} onUpdate={refreshCart} />
                {upgrades?.upgrades?.[item.productId] && (
                  <CartUpgradeBanner
                    suggestion={upgrades.upgrades[item.productId]}
                    cartItem={item}
                    onUpgrade={refreshCart}
                    className="mb-2 ms-24"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Bundle offers */}
          {bundles?.bundles && bundles.bundles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-foreground text-sm font-semibold">{t('bundleOffers')}</h3>
              {bundles.bundles.map((offer) => (
                <CartBundleOfferCard
                  key={offer.id}
                  offer={offer}
                  cartId={cart.id}
                  onAdd={refreshCart}
                />
              ))}
            </div>
          )}

          {/* Coupon input */}
          <div className="border-border mt-6 border-t pt-4">
            <CouponInput cart={cart} onUpdate={refreshCart} />
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-muted/50 border-border sticky top-24 rounded-lg border p-6">
            <FreeShippingBar className="mb-4" />
            <CartSummary />

            <Link
              href="/checkout"
              className="bg-primary text-primary-foreground mt-6 inline-flex w-full items-center justify-center rounded px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
            >
              {t('proceedToCheckout')}
            </Link>

            <Link
              href="/products"
              className="text-muted-foreground hover:text-foreground mt-3 inline-flex w-full items-center justify-center px-6 py-2 text-sm transition-colors"
            >
              {tc('continueShopping')}
            </Link>
          </div>
        </div>
      </div>

      {/* Cross-sell recommendations */}
      {cartRecs?.recommendations && cartRecs.recommendations.length > 0 && (
        <CartRecommendationSection
          title={t('youMightAlsoNeed')}
          items={cartRecs.recommendations}
          className="mt-10"
        />
      )}
    </div>
  );
}
