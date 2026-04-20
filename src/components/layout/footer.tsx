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
    <footer className="border-border bg-primary text-primary-foreground border-t">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold">
              {storeInfo?.name || t('store')}
            </h3>
            <p className="mt-2 text-sm text-primary-foreground/70 max-w-xs">
              השינה שמגיעה לך — מזרונים איכותיים שעוטפים אותך בנוחות מושלמת
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3">ניווט מהיר</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/products"
                className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
              >
                {tn('products')}
              </Link>
              {isLoggedIn && (
                <Link
                  href="/account"
                  className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
                >
                  {tn('account')}
                </Link>
              )}
              <Link
                href="/cart"
                className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
              >
                עגלת קניות
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-3">צרו קשר</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
              <span>שירות לקוחות זמין עבורכם</span>
              <span>בימים א׳-ה׳ 09:00-18:00</span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/10 pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-primary-foreground/50 text-sm">
            {year} {storeInfo?.name || t('store')}. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
}
