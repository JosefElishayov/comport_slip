'use client';

import { Link } from '@/lib/navigation';
import { useTranslations } from '@/lib/translations';
import { useStoreInfo, useAuth } from '@/providers/store-provider';

export function Footer() {
  const t = useTranslations('common');
  const tn = useTranslations('nav');
  const { storeInfo } = useStoreInfo();
  const { isLoggedIn } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-background border-t">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            {year} {storeInfo?.name || t('store')}. {t('allRightsReserved')}
          </p>
          <nav className="flex items-center gap-4">
            <Link
              href="/products"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {tn('products')}
            </Link>
            {isLoggedIn && (
              <Link
                href="/account"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {tn('account')}
              </Link>
            )}
          </nav>
        </div>
      </div>
    </footer>
  );
}
