'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import type { CartBundlesResponse } from 'brainerce';
import { formatPrice, getCartItemImage } from 'brainerce';
import { useTranslations } from '@/lib/translations';
import { useCart, useStoreInfo } from '@/providers/store-provider';
import { getClient } from '@/lib/brainerce';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { CouponInput } from '@/components/cart/coupon-input';
import { CartBundleOfferCard } from '@/components/cart/cart-bundle-offer';
import { cn } from '@/lib/utils';

export function CartDrawer() {
  const t = useTranslations('cartDrawer');
  const tc = useTranslations('common');
  const tCart = useTranslations('cart');
  const { cart, isCartDrawerOpen, closeCartDrawer, refreshCart, itemCount, totals } = useCart();
  const { storeInfo } = useStoreInfo();
  const currency = storeInfo?.currency || 'USD';

  // Fetch bundle offers when drawer opens with items
  const [bundles, setBundles] = useState<CartBundlesResponse | null>(null);
  useEffect(() => {
    if (!isCartDrawerOpen || !cart?.id || cart.items.length === 0) {
      setBundles(null);
      return;
    }
    const client = getClient();
    client
      .getCartBundles(cart.id)
      .then((res) => setBundles(res))
      .catch(() => {});
  }, [isCartDrawerOpen, cart?.id, cart?.items.length]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartDrawerOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeCartDrawer();
    }
    if (isCartDrawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isCartDrawerOpen, closeCartDrawer]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          isCartDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeCartDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`cart-drawer fixed top-0 z-[70] flex h-full w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-300 ease-out ${isCartDrawerOpen ? 'cart-drawer-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={tCart('title')}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-foreground">
            {tCart('title')}
            {itemCount > 0 && (
              <span className="text-muted-foreground text-sm font-normal ms-2">
                ({itemCount} {itemCount === 1 ? tc('item') : tc('items')})
              </span>
            )}
          </h2>
          <button
            onClick={closeCartDrawer}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
            aria-label={t('close')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg className="h-16 w-16 text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-foreground font-medium">{tCart('emptyTitle')}</p>
              <p className="text-muted-foreground text-sm mt-1">{tCart('emptySubtitle')}</p>
              <Link
                href="/products"
                onClick={closeCartDrawer}
                className="mt-4 text-sm font-medium text-accent hover:underline"
              >
                {tc('continueShopping')}
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-0">
                {cart.items.map((item) => (
                  <DrawerCartItem
                    key={`${item.productId}-${item.variantId || ''}`}
                    item={item}
                    currency={currency}
                    onUpdate={refreshCart}
                  />
                ))}
              </div>

              {/* Bundle offers */}
              {bundles?.bundles && bundles.bundles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-foreground text-sm font-semibold">{tCart('bundleOffers')}</h3>
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
            </>
          )}
        </div>

        {/* Footer with coupon, totals and buttons */}
        {cart && cart.items.length > 0 && (
          <div className="border-t border-border px-5 py-4 space-y-3">
            {/* Coupon */}
            <CouponInput cart={cart} onUpdate={refreshCart} />

            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{tc('subtotal')}</span>
              <span className="text-foreground text-sm">
                {formatPrice(totals.subtotal, { currency }) as string}
              </span>
            </div>

            {/* Discount */}
            {totals.discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{tc('discount')}</span>
                <span className="text-green-600 text-sm font-medium">
                  -{formatPrice(totals.discount, { currency }) as string}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm font-bold text-foreground">{tc('total')}</span>
              <span className="text-base font-bold text-foreground">
                {formatPrice(totals.total, { currency }) as string}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              <Link
                href="/checkout"
                onClick={closeCartDrawer}
                className="block w-full rounded-xl bg-accent text-accent-foreground py-3.5 text-center text-sm font-semibold shadow-sm hover:brightness-110 transition-all"
              >
                {tCart('proceedToCheckout')}
              </Link>
              <Link
                href="/cart"
                onClick={closeCartDrawer}
                className="block w-full rounded-xl border border-border bg-background text-foreground py-3 text-center text-sm font-semibold hover:bg-secondary/50 transition-all"
              >
                {t('goToCart')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Mini cart item for the drawer with quantity controls
function DrawerCartItem({
  item,
  currency,
  onUpdate,
}: {
  item: import('brainerce').CartItem;
  currency: string;
  onUpdate: () => void;
}) {
  const tc = useTranslations('common');
  const td = useTranslations('productDetail');
  const imageUrl = getCartItemImage(item);
  const unitPrice = parseFloat(item.unitPrice);
  const lineTotal = unitPrice * item.quantity;
  const [removing, setRemoving] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function handleQuantityChange(newQuantity: number) {
    if (newQuantity < 1 || updating) return;
    try {
      setUpdating(true);
      const client = getClient();
      await client.smartUpdateCartItem(item.productId, newQuantity, item.variantId || undefined);
      onUpdate();
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setUpdating(false);
    }
  }

  async function handleRemove() {
    if (removing) return;
    try {
      setRemoving(true);
      const client = getClient();
      await client.smartRemoveFromCart(item.productId, item.variantId || undefined);
      onUpdate();
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className={cn('flex gap-3 border-b border-border py-3 last:border-0', (removing || updating) && 'opacity-50')}>
      {/* Image */}
      <div className="bg-secondary/50 relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
        {imageUrl ? (
          <Image src={imageUrl} alt={item.product.name} fill sizes="64px" className="object-cover" />
        ) : (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <h4 className="text-foreground truncate text-sm font-medium">{item.product.name}</h4>
        {item.variant?.name && (
          <p className="text-muted-foreground text-xs mt-0.5">{item.variant.name}</p>
        )}

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-1.5">
          <div className="border-border flex items-center rounded border">
            <button
              type="button"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              className="text-foreground hover:bg-muted px-2 py-0.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={td('decreaseQuantity')}
            >
              -
            </button>
            <span className="text-foreground min-w-[2rem] px-1 py-0.5 text-center text-xs font-medium">
              {updating ? (
                <LoadingSpinner size="sm" className="border-muted-foreground/30 border-t-foreground mx-auto" />
              ) : (
                item.quantity
              )}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={updating}
              className="text-foreground hover:bg-muted px-2 py-0.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={td('increaseQuantity')}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="text-destructive hover:text-destructive/80 text-xs transition-colors disabled:opacity-40"
          >
            {removing ? tc('removing') : tc('remove')}
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="flex-shrink-0 self-center text-end">
        <span className="text-foreground text-sm font-semibold">
          {formatPrice(lineTotal, { currency }) as string}
        </span>
      </div>
    </div>
  );
}
