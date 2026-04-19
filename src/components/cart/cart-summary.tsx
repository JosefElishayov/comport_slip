'use client';

import { formatPrice } from 'brainerce';
import { useTranslations } from '@/lib/translations';
import { useStoreInfo, useCart } from '@/providers/store-provider';
import { cn } from '@/lib/utils';

interface CartSummaryProps {
  className?: string;
}

export function CartSummary({ className }: CartSummaryProps) {
  const t = useTranslations('cart');
  const tc = useTranslations('common');
  const { storeInfo } = useStoreInfo();
  const { totals, cart } = useCart();
  const currency = storeInfo?.currency || 'USD';

  const rules = cart?.appliedDiscounts;
  const ruleAmt = cart?.ruleDiscountAmount ? parseFloat(cart.ruleDiscountAmount) : 0;
  const couponAmt = totals.discount - ruleAmt;

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-foreground text-lg font-semibold">{t('orderSummary')}</h3>

      <div className="space-y-2 text-sm">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{tc('subtotal')}</span>
          <span className="text-foreground font-medium">
            {formatPrice(totals.subtotal, { currency }) as string}
          </span>
        </div>

        {/* Rule discounts - show each rule by name */}
        {rules && rules.length > 0
          ? rules.map((rule) => (
              <div key={rule.ruleId} className="flex items-center justify-between">
                <span className="text-muted-foreground">{rule.ruleName}</span>
                <span className="text-destructive font-medium">
                  -{formatPrice(parseFloat(rule.discountAmount), { currency }) as string}
                </span>
              </div>
            ))
          : ruleAmt > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{tc('generalDiscount')}</span>
                <span className="text-destructive font-medium">
                  -{formatPrice(ruleAmt, { currency }) as string}
                </span>
              </div>
            )}

        {/* Coupon discount */}
        {cart?.couponCode && couponAmt > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {tc('couponDiscount')} ({cart.couponCode})
            </span>
            <span className="text-destructive font-medium">
              -{formatPrice(couponAmt, { currency }) as string}
            </span>
          </div>
        )}

        {/* Fallback: generic discount when no breakdown available */}
        {totals.discount > 0 &&
          ruleAmt <= 0 &&
          !cart?.couponCode &&
          (!rules || rules.length === 0) && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{tc('discount')}</span>
              <span className="text-destructive font-medium">
                -{formatPrice(totals.discount, { currency }) as string}
              </span>
            </div>
          )}

        {/* Shipping */}
        {totals.shipping > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{tc('shipping')}</span>
            <span className="text-foreground font-medium">
              {formatPrice(totals.shipping, { currency }) as string}
            </span>
          </div>
        )}

        {/* Tax */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{tc('tax')}</span>
          <span className="text-muted-foreground text-xs">{t('taxAtCheckout')}</span>
        </div>

        {/* Divider */}
        <div className="border-border mt-2 border-t pt-2">
          <div className="flex items-center justify-between">
            <span className="text-foreground font-semibold">{tc('total')}</span>
            <span className="text-foreground text-base font-semibold">
              {formatPrice(totals.total, { currency }) as string}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
