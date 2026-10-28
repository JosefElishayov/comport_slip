'use client';

import { useEffect, useState } from 'react';
import type { Product } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useWishlist } from '@/providers/wishlist-provider';
import { useAuth } from '@/providers/store-provider';
import { useOptionalLocale } from '@/providers/locale-provider';
import { useRegionId } from '@/providers/region-provider';
import { Link } from '@/lib/navigation';
import { ProductCard } from '@/components/products/product-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function WishlistPage() {
  const { keys, loading, error, refresh } = useWishlist();
  const { isLoggedIn } = useAuth();
  const locale = useOptionalLocale();
  const en = locale === 'en';
  const regionId = useRegionId();
  const [products, setProducts] = useState<Product[]>([]);
  const [resolving, setResolving] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (loading || error) return;
    let active = true;
    setResolving(true);
    setFailed(false);
    getClient().wishlist.resolve(keys, { locale, regionId: regionId ?? undefined })
      .then(result => { if (active) setProducts(result); })
      .catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setResolving(false); });
    return () => { active = false; };
  }, [keys, loading, error, locale, regionId, retry]);

  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-bold">{en ? 'Your wishlist' : 'רשימת המשאלות שלך'}</h1>
    {!isLoggedIn && <p className="mt-3 text-muted-foreground">{en ? 'Saved in this browser. Sign in to keep your items across devices.' : 'הפריטים נשמרים בדפדפן הזה. התחברו כדי לשמור אותם בחשבון ולגשת אליהם ממכשירים נוספים.'} <Link className="underline" href="/login">{en ? 'Sign in' : 'התחברות'}</Link></p>}
    {error || failed ? <div role="alert" className="py-12 text-center"><p>{en ? 'Could not load your wishlist. Please try again.' : 'לא ניתן לטעון את רשימת המשאלות. נסו שוב.'}</p><button type="button" className="mt-4 rounded-xl border px-6 py-3" onClick={() => { void refresh(); setRetry(n => n + 1); }}>{en ? 'Retry' : 'ניסיון נוסף'}</button></div>
      : loading || resolving ? <div role="status" aria-label={en ? 'Loading wishlist' : 'טוען רשימת משאלות'} className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      : products.length === 0 ? <div className="py-16 text-center"><p className="text-xl">{en ? 'No saved products available yet' : 'עדיין אין מוצרים שמורים זמינים'}</p><p className="mt-2 text-muted-foreground">{en ? 'Tap the heart on a product to save it here.' : 'לחצו על הלב ליד מוצר כדי לשמור אותו כאן.'}</p><Link href="/products" className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-primary-foreground">{en ? 'Explore products' : 'לכל המוצרים'}</Link></div>
      : <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map(product => <ProductCard key={product.id} product={product} />)}</div>}
  </div>;
}
