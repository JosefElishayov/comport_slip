'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Order, OrderStatus, OrderDownloadLink } from 'brainerce';
import { formatPrice } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<OrderStatus, { labelKey: string; className: string }> = {
  pending: {
    labelKey: 'statusPending',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400',
  },
  processing: {
    labelKey: 'statusProcessing',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  },
  shipped: {
    labelKey: 'statusShipped',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400',
  },
  delivered: {
    labelKey: 'statusDelivered',
    className: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400',
  },
  cancelled: {
    labelKey: 'statusCancelled',
    className: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400',
  },
  refunded: {
    labelKey: 'statusRefunded',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400',
  },
};

interface OrderHistoryProps {
  orders: Order[];
  className?: string;
}

export function OrderHistory({ orders, className }: OrderHistoryProps) {
  const t = useTranslations('account');
  if (orders.length === 0) {
    return (
      <div className={cn('py-12 text-center', className)}>
        <svg
          className="text-muted-foreground mx-auto mb-3 h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <h3 className="text-foreground text-lg font-semibold">{t('noOrders')}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{t('noOrdersDesc')}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const t = useTranslations('account');
  const tc = useTranslations('common');
  const [expanded, setExpanded] = useState(false);
  const statusConfig =
    STATUS_CONFIG[order.status?.toLowerCase() as OrderStatus] || STATUS_CONFIG.pending;
  const currency = order.currency || 'USD';
  const totalAmount = order.totalAmount || order.total || '0';

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      {/* Order header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-muted/50 flex w-full items-center justify-between p-4 text-start transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-foreground text-sm font-semibold">
              {order.orderNumber || `${t('orderPrefix')} ${order.id.slice(0, 8)}`}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                statusConfig.className
              )}
            >
              {t(
                statusConfig.labelKey as
                  | 'statusPending'
                  | 'statusProcessing'
                  | 'statusShipped'
                  | 'statusDelivered'
                  | 'statusCancelled'
                  | 'statusRefunded'
              )}
            </span>
          </div>
          <div className="text-muted-foreground mt-1 flex items-center gap-4 text-xs">
            <span>
              {order.createdAt && !isNaN(new Date(order.createdAt).getTime())
                ? new Date(order.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '—'}
            </span>
            <span>
              {order.items.length} {order.items.length === 1 ? tc('item') : tc('items')}
            </span>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          <span className="text-foreground text-sm font-semibold">
            {formatPrice(parseFloat(totalAmount), { currency }) as string}
          </span>
          <svg
            className={cn(
              'text-muted-foreground h-4 w-4 transition-transform',
              expanded && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded order items */}
      {expanded && (
        <div className="border-border bg-muted/30 space-y-3 border-t px-4 py-3">
          {order.items.map((item, index) => (
            <div key={`${item.productId}-${index}`} className="flex items-center gap-3">
              <div className="bg-muted relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name || t('productFallback')}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <p className="text-foreground truncate text-sm">
                  {item.name || t('productFallback')}
                </p>
                <p className="text-muted-foreground text-xs">
                  {tc('qty')} {item.quantity}
                </p>
              </div>

              <span className="text-foreground flex-shrink-0 text-sm">
                {formatPrice(parseFloat(item.price), { currency }) as string}
              </span>
            </div>
          ))}

          {/* Downloads section */}
          {order.hasDownloads && <OrderDownloads orderId={order.id} />}

          <OrderFinancialSummary order={order} currency={currency} />
        </div>
      )}
    </div>
  );
}

function OrderDownloads({ orderId }: { orderId: string }) {
  const t = useTranslations('account');
  const [downloads, setDownloads] = useState<OrderDownloadLink[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const client = getClient();
        const links = await client.getOrderDownloads(orderId);
        if (!cancelled) setDownloads(links);
      } catch {
        if (!cancelled) setDownloads([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="border-border border-t pt-2">
        <p className="text-muted-foreground animate-pulse text-xs">{t('downloads')}...</p>
      </div>
    );
  }

  if (!downloads || downloads.length === 0) return null;

  return (
    <div className="border-border space-y-2 border-t pt-2">
      <p className="text-foreground text-sm font-medium">{t('downloads')}</p>
      {downloads.map((link, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm">{link.fileName}</p>
            <p className="text-muted-foreground text-xs">
              {link.productName}
              {' · '}
              {link.downloadLimit != null
                ? `${link.downloadsUsed}/${link.downloadLimit} ${t('downloadsRemaining')}`
                : t('unlimitedDownloads')}
              {' · '}
              {link.expiresAt
                ? `${t('expiresAt')} ${new Date(link.expiresAt).toLocaleDateString()}`
                : t('noExpiry')}
            </p>
          </div>
          <a
            href={link.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground flex-shrink-0 rounded px-3 py-1 text-xs font-medium hover:opacity-90"
          >
            {t('downloadFile')}
          </a>
        </div>
      ))}
    </div>
  );
}

function OrderFinancialSummary({ order, currency }: { order: Order; currency: string }) {
  const tc = useTranslations('common');
  const totalAmount = order.totalAmount || order.total || '0';
  const subtotal = order.subtotal ? parseFloat(order.subtotal) : null;
  const ruleAmt = order.ruleDiscountAmount ? parseFloat(order.ruleDiscountAmount) : 0;
  const couponAmt = order.couponDiscount ? parseFloat(order.couponDiscount) : 0;
  const shipping = order.shippingAmount ? parseFloat(order.shippingAmount) : 0;
  const tax = order.taxAmount ? parseFloat(order.taxAmount) : 0;
  const rules = order.appliedDiscounts;

  const hasBreakdown = subtotal !== null && subtotal > 0;

  if (!hasBreakdown) {
    return (
      <div className="border-border flex items-center justify-between border-t pt-2">
        <span className="text-muted-foreground text-sm font-medium">{tc('total')}</span>
        <span className="text-foreground text-sm font-semibold">
          {formatPrice(parseFloat(totalAmount), { currency }) as string}
        </span>
      </div>
    );
  }

  return (
    <div className="border-border space-y-1 border-t pt-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{tc('subtotal')}</span>
        <span className="text-foreground">{formatPrice(subtotal, { currency }) as string}</span>
      </div>

      {rules && rules.length > 0
        ? rules.map((rule) => (
            <div key={rule.ruleId} className="flex items-center justify-between">
              <span className="text-muted-foreground">{rule.ruleName}</span>
              <span className="text-destructive">
                -{formatPrice(parseFloat(rule.discountAmount || '0'), { currency }) as string}
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

      {order.couponCode && couponAmt > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            {tc('couponDiscount')} ({order.couponCode})
          </span>
          <span className="text-destructive">
            -{formatPrice(couponAmt, { currency }) as string}
          </span>
        </div>
      )}

      {shipping > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{tc('shipping')}</span>
          <span className="text-foreground">{formatPrice(shipping, { currency }) as string}</span>
        </div>
      )}

      {tax > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{tc('tax')}</span>
          <span className="text-foreground">{formatPrice(tax, { currency }) as string}</span>
        </div>
      )}

      <div className="border-border flex items-center justify-between border-t pt-1">
        <span className="text-foreground font-medium">{tc('total')}</span>
        <span className="text-foreground font-semibold">
          {formatPrice(parseFloat(totalAmount), { currency }) as string}
        </span>
      </div>
    </div>
  );
}
