'use client';

import { useWishlist } from '@/providers/wishlist-provider';
import { useOptionalLocale } from '@/providers/locale-provider';
import { Link } from '@/lib/navigation';

export function WishlistLink() {
  const { keys, loading, error } = useWishlist();
  const en = useOptionalLocale() === 'en';
  const label = en ? 'Wishlist' : 'רשימת המשאלות';
  return <Link href="/wishlist" className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full p-2 hover:bg-secondary/50" aria-label={!loading && !error ? `${label} (${keys.length})` : label}>
    <Heart />{!loading && !error && keys.length > 0 && <span className="text-xs">{keys.length}</span>}
  </Link>;
}

function Heart({ saved = false }: { saved?: boolean }) {
  return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>;
}

export function WishlistButton({ productId }: { productId: string }) {
  const { keys, loading, busy, error, toggle, refresh } = useWishlist();
  const en = useOptionalLocale() === 'en';
  const saved = keys.some(key => key.productId === productId);
  const label = error ? (en ? 'Wishlist failed. Retry' : 'שגיאה ברשימת המשאלות. נסו שוב') : saved ? (en ? 'Remove from wishlist' : 'הסרה מרשימת המשאלות') : (en ? 'Save to wishlist' : 'הוספה לרשימת המשאלות');
  return <button type="button" title={label} aria-label={label} aria-pressed={saved} disabled={loading || busy} onClick={e => { e.preventDefault(); e.stopPropagation(); void (error ? refresh() : toggle(productId)); }} className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-border disabled:opacity-50 ${saved ? 'text-red-600' : 'text-foreground'} hover:bg-secondary/50`}><Heart saved={saved} />{error && <span aria-hidden="true">!</span>}</button>;
}
