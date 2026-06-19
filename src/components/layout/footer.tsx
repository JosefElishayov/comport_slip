'use client';

import { Link } from '@/lib/navigation';
import { useTranslations } from '@/lib/translations';
import { useStoreInfo, useAuth } from '@/providers/store-provider';

export function Footer() {
  const t = useTranslations('common');
  const tn = useTranslations('nav');
  const tf = useTranslations('footer');
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
              {tf('tagline')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3">{tf('quickNav')}</h4>
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
                {tf('cart')}
              </Link>
              <Link
                href="/about"
                className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
              >
                {tf('about')}
              </Link>
              <Link
                href="/contact"
                className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
              >
                {tf('contact')}
              </Link>
              <Link
                href="/accessibility"
                className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
              >
                {tf('accessibility')}
              </Link>
              <Link
                href="/privacy"
                className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
              >
                {tf('privacy')}
              </Link>
              <Link
                href="/terms"
                className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
              >
                {tf('terms')}
              </Link>
              <Link
                href="/shipping"
                className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
              >
                {tf('shipping')}
              </Link>
              <Link
                href="/returns"
                className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
              >
                {tf('returns')}
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-3">{tf('contactTitle')}</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
              <span>{tf('customerServiceAvailable')}</span>
              <span>{tf('hours1')}</span>
              <span>{tf('hours2')}</span>
              <span>{tf('hours3')}</span>
              <a
                href="tel:+97235794542"
                className="text-primary-foreground/90 hover:text-primary-foreground"
                dir="ltr"
              >
                03-5794542
              </a>
              <span>{tf('address')}</span>
              <Link
                href="/contact"
                className="mt-2 inline-flex items-center gap-1 text-primary-foreground hover:underline"
              >
                {tf('sendInquiry')}
              </Link>
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
