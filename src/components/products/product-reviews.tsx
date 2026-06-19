'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/translations';

// Local mirror of SDK types — the brainerce package declares these interfaces
// but does not export them in v1.25.0.
interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  body: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
}
interface MyProductReview {
  eligible: boolean;
  reason: 'no_eligible_order' | 'reviews_disabled' | 'product_not_found' | null;
  myReview: ProductReview | null;
}
import { useAuth } from '@/providers/store-provider';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StarRating, RatingSummary } from './star-rating';

interface ProductReviewsProps {
  productId: string;
  initialAvgRating?: number;
  initialReviewCount?: number;
  className?: string;
}

const PAGE_SIZE = 10;

export function ProductReviews({
  productId,
  initialAvgRating,
  initialReviewCount,
  className,
}: ProductReviewsProps) {
  const t = useTranslations('productDetail');
  const { isLoggedIn, authLoading } = useAuth();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number>(initialReviewCount ?? 0);
  const [avg, setAvg] = useState<number>(initialAvgRating ?? 0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const [myReview, setMyReview] = useState<MyProductReview | null>(null);
  const [myReviewLoading, setMyReviewLoading] = useState(false);

  const loadPage = useCallback(
    async (p: number, append: boolean) => {
      setLoading(true);
      try {
        const { getClient } = await import('@/lib/brainerce');
        const client = getClient();
        const res = await client.listProductReviews(productId, { page: p, limit: PAGE_SIZE });
        const items = res.data ?? [];
        setReviews((prev) => (append ? [...prev, ...items] : items));
        const totalItems = res.meta?.total ?? items.length;
        setTotal(totalItems);
        setHasMore(p * PAGE_SIZE < totalItems);

        // Compute avg from first page if backend doesn't surface it elsewhere
        if (!append && items.length > 0) {
          const sum = items.reduce((acc, r) => acc + (r.rating || 0), 0);
          // Prefer initialAvgRating (from product) since it spans all pages; fallback to page avg
          setAvg((prev) => (prev > 0 ? prev : sum / items.length));
        }
      } catch (err) {
        console.error('Failed to load reviews', err);
      } finally {
        setLoading(false);
      }
    },
    [productId]
  );

  const loadMyReview = useCallback(async () => {
    if (!isLoggedIn) {
      setMyReview(null);
      return;
    }
    setMyReviewLoading(true);
    try {
      const { getClient } = await import('@/lib/brainerce');
      const client = getClient();
      const res = await client.getMyProductReview(productId);
      setMyReview(res);
    } catch (err) {
      console.error('Failed to load my review', err);
      setMyReview(null);
    } finally {
      setMyReviewLoading(false);
    }
  }, [productId, isLoggedIn]);

  useEffect(() => {
    setPage(1);
    void loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    if (!authLoading) void loadMyReview();
  }, [authLoading, loadMyReview]);

  function handleAfterMutation() {
    void loadPage(1, false);
    setPage(1);
    void loadMyReview();
  }

  const showZeroState = !loading && total === 0;

  return (
    <section
      className={cn('border-border border-t pt-10', className)}
      aria-labelledby="product-reviews-heading"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-12">
        {/* Summary + write form — right column in RTL, sticky on scroll */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div>
            <h2
              id="product-reviews-heading"
              className="text-foreground text-2xl font-bold"
            >
              {t('reviewsTitle')}
            </h2>
            {total > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <RatingSummary avgRating={avg} reviewCount={total} size="lg" showCount={false} />
                <span className="text-muted-foreground text-sm">
                  {t('basedOnReviews', { count: String(total) })}
                </span>
              </div>
            )}
          </div>

          <WriteReviewArea
            productId={productId}
            isLoggedIn={isLoggedIn}
            authLoading={authLoading}
            myReview={myReview}
            myReviewLoading={myReviewLoading}
            onMutated={handleAfterMutation}
          />
        </div>

        {/* Reviews list — left column */}
        <div className="min-w-0">
          {loading && reviews.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
              <span className="ms-3 text-sm text-muted-foreground">{t('loadingReviews')}</span>
            </div>
          ) : showZeroState ? (
            <div className="bg-secondary/30 border-border flex h-full min-h-[180px] flex-col items-center justify-center rounded-xl border p-8 text-center">
              <p className="text-foreground text-base font-medium">{t('noReviewsYet')}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t('beTheFirstToReview')}</p>
            </div>
          ) : (
            <ul className="space-y-5">
              {reviews.map((r) => (
                <ReviewItem key={r.id} review={r} verifiedLabel={t('verifiedPurchase')} />
              ))}
            </ul>
          )}

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  void loadPage(next, true);
                }}
                disabled={loading}
                className="border-border bg-background text-foreground hover:bg-secondary rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? <LoadingSpinner size="sm" /> : t('showMoreReviews')}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ReviewItem({
  review,
  verifiedLabel,
}: {
  review: ProductReview;
  verifiedLabel: string;
}) {
  const date = (() => {
    try {
      return new Date(review.createdAt).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  })();
  return (
    <li className="border-border border-b pb-5 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <StarRating value={review.rating} size="sm" />
        <span className="text-foreground text-sm font-semibold">{review.authorName}</span>
        {review.verifiedPurchase && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800 dark:bg-green-950/30 dark:text-green-400">
            <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {verifiedLabel}
          </span>
        )}
        {date && (
          <span className="text-muted-foreground ms-auto text-xs">{date}</span>
        )}
      </div>
      {review.body && (
        <p className="text-foreground mt-2 whitespace-pre-wrap text-sm leading-relaxed">
          {review.body}
        </p>
      )}
    </li>
  );
}

interface WriteReviewAreaProps {
  productId: string;
  isLoggedIn: boolean;
  authLoading: boolean;
  myReview: MyProductReview | null;
  myReviewLoading: boolean;
  onMutated: () => void;
}

function WriteReviewArea({
  productId,
  isLoggedIn,
  authLoading,
  myReview,
  myReviewLoading,
  onMutated,
}: WriteReviewAreaProps) {
  const t = useTranslations('productDetail');
  const [rating, setRating] = useState<number>(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Seed form when entering edit mode
  useEffect(() => {
    if (editing && myReview?.myReview) {
      setRating(myReview.myReview.rating);
      setBody(myReview.myReview.body ?? '');
    }
  }, [editing, myReview]);

  if (authLoading || myReviewLoading) {
    return (
      <div className="bg-secondary/30 border-border mb-6 rounded-xl border p-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-secondary/30 border-border mb-6 rounded-xl border p-4 text-sm">
        <Link
          href="/login"
          className="text-primary font-semibold hover:underline"
        >
          {t('signInToReview')}
        </Link>
      </div>
    );
  }

  if (!myReview) return null;

  // Not eligible
  if (!myReview.eligible && !myReview.myReview) {
    const reasonText =
      myReview.reason === 'reviews_disabled'
        ? t('reviewsDisabled')
        : t('purchaseToReview');
    return (
      <div className="bg-secondary/30 border-border mb-6 rounded-xl border p-4 text-sm text-muted-foreground">
        {reasonText}
      </div>
    );
  }

  // Has existing review and not editing — show summary + actions
  if (myReview.myReview && !editing) {
    const r = myReview.myReview;
    return (
      <div className="bg-secondary/30 border-border mb-6 rounded-xl border p-4">
        <p className="text-foreground mb-2 text-sm font-semibold">{t('yourReview')}</p>
        <div className="mb-2 flex items-center gap-2">
          <StarRating value={r.rating} size="sm" />
        </div>
        {r.body && (
          <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">{r.body}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setError(null);
              setSuccess(null);
            }}
            className="border-border bg-background hover:bg-secondary rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            {t('editReview')}
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!confirm(t('deleteReviewConfirm'))) return;
              setSubmitting(true);
              setError(null);
              try {
                const { getClient } = await import('@/lib/brainerce');
                const client = getClient();
                await client.deleteMyProductReview(productId);
                setSuccess(t('reviewDeleted'));
                setRating(0);
                setBody('');
                onMutated();
              } catch (err) {
                console.error(err);
                setError(t('reviewError'));
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
          >
            {t('deleteReview')}
          </button>
          {success && <span className="text-xs text-green-700">{success}</span>}
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      </div>
    );
  }

  // Submit / Edit form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError(t('ratingRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const { getClient } = await import('@/lib/brainerce');
      const client = getClient();
      const isUpdate = !!myReview?.myReview;
      const input = { rating, body: body.trim() || undefined };
      if (isUpdate) {
        await client.updateMyProductReview(productId, input);
        setSuccess(t('reviewUpdated'));
      } else {
        await client.submitProductReview(productId, input);
        setSuccess(t('reviewSubmitted'));
      }
      setEditing(false);
      onMutated();
    } catch (err) {
      console.error(err);
      setError(t('reviewError'));
    } finally {
      setSubmitting(false);
    }
  }

  const isUpdate = !!myReview.myReview;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-secondary/30 border-border mb-6 rounded-xl border p-4"
    >
      <p className="text-foreground mb-3 text-sm font-semibold">
        {isUpdate ? t('editReview') : t('writeReview')}
      </p>

      <div className="mb-3">
        <label className="text-foreground mb-1.5 block text-xs font-medium">
          {t('yourRating')}
        </label>
        <StarRating value={rating} size="lg" interactive onChange={setRating} />
      </div>

      <div className="mb-3">
        <label
          htmlFor="review-body"
          className="text-foreground mb-1.5 block text-xs font-medium"
        >
          {t('yourReview')}
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={t('reviewBodyPlaceholder')}
          className="border-border bg-background text-foreground placeholder:text-muted-foreground w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-accent text-accent-foreground hover:brightness-110 disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm"
        >
          {submitting
            ? t('submitting')
            : isUpdate
              ? t('updateReview')
              : t('submitReview')}
        </button>
        {isUpdate && (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
            className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 text-sm"
          >
            ✕
          </button>
        )}
        {error && <span className="text-xs text-destructive">{error}</span>}
        {success && <span className="text-xs text-green-700">{success}</span>}
      </div>
    </form>
  );
}
