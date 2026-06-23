'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useRouter } from '@/lib/navigation';
import { usePathname } from 'next/navigation';
import { stripLocalePrefix } from '@/lib/locale';
import Image from 'next/image';
import type { SearchSuggestions, ProductSuggestion } from 'brainerce';
import { formatPrice } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useTranslations } from '@/lib/translations';
import { useStoreInfo, useAuth, useCart } from '@/providers/store-provider';
import { useLocale } from '@/providers/locale-provider';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { LanguageSwitcher } from '@/components/layout/language-switcher';

export function Header() {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const { storeInfo } = useStoreInfo();
  const { isLoggedIn, logout } = useAuth();
  const { itemCount, openCartDrawer } = useCart();
  const { locale } = useLocale();
  const router = useRouter();

  const pathname = usePathname();
  // Strip any `/en` prefix so route checks work the same in both languages.
  const barePathname = stripLocalePrefix(pathname).pathname;
  const isHeroPage = barePathname === '/';

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTransparent = isHeroPage && !scrolled;

  const currency = storeInfo?.currency || 'ILS';

  // Track scroll position for shrinking header effect
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 80);
      setScrollY(window.scrollY);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debounced search suggestions
  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setSuggestions(null);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const client = getClient();
        const result = await client.getSearchSuggestions(query, 5);
        setSuggestions(result);
        setShowSuggestions(true);
      } catch {
        setSuggestions(null);
      }
    }, 300);
  }, []);

  // Close suggestions / search panel on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when the search panel opens; close on Escape
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
      function handleKey(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          setSearchOpen(false);
          setShowSuggestions(false);
        }
      }
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [searchOpen]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  function handleSuggestionClick(suggestion: ProductSuggestion) {
    const href = suggestion.slug ? `/products/${suggestion.slug}` : `/products/${suggestion.id}`;
    router.push(href);
    setShowSuggestions(false);
    setSearchOpen(false);
    setSearchQuery('');
  }

  return (
    <>
    <header
      style={{ top: 'var(--banner-h, 0px)' }}
      className={`${isHeroPage ? 'fixed' : 'sticky'} z-50 w-full ${
        scrolled ? 'pt-3' : isTransparent ? '' : 'border-b border-border bg-background'
      }`}
    >
      <div
        className={`mx-auto transition-[max-width,border-radius,box-shadow,background-color,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled
            ? 'backdrop-blur-md max-w-5xl rounded-2xl border border-border/60 bg-background/85 px-4 shadow-xl sm:px-6'
            : 'max-w-7xl border-transparent px-4 sm:px-6 lg:px-8'
        }`}
      >
        <div
          className={`relative flex items-center gap-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            scrolled ? 'h-16' : 'h-20'
          }`}
        >
          {/* Left: Desktop Navigation + mobile menu button */}
          <div className="flex flex-1 items-center gap-6">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`rounded-full p-2 md:hidden transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-secondary/50'}`}
              aria-label={t('menu')}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/products"
                className={`text-sm font-medium transition-colors ${isTransparent ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-primary'}`}
              >
                {t('products')}
              </Link>
              <Link
                href="/about"
                className={`text-sm font-medium transition-colors ${isTransparent ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-primary'}`}
              >
                {t('about')}
              </Link>
              <Link
                href="/contact"
                className={`text-sm font-medium transition-colors ${isTransparent ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-primary'}`}
              >
                {t('contact')}
              </Link>
              {isLoggedIn && (
                <Link
                  href="/account"
                  className={`text-sm font-medium transition-colors ${isTransparent ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-primary'}`}
                >
                  {t('account')}
                </Link>
              )}
            </nav>
          </div>

          {/* Center: Logo */}
          <Link
            href="/"
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center"
            aria-label={storeInfo?.name || tc('store')}
          >
            <Image
              src={locale === 'en' ? '/logo-en.png' : '/logo.png'}
              alt={storeInfo?.name || process.env.NEXT_PUBLIC_STORE_NAME || tc('store')}
              width={738}
              height={447}
              priority
              className={`w-auto transition-all duration-700 ${scrolled ? 'h-14' : 'h-16'}`}
              style={{
                filter: isTransparent ? 'brightness(0) invert(1)' : 'none',
                transition: 'filter 0.6s ease',
              }}
            />
          </Link>

          {/* Right: actions */}
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
            {/* Language switcher (desktop / tablet) */}
            <div className="hidden sm:block">
              <LanguageSwitcher isTransparent={isTransparent} />
            </div>

            {/* Auth (icon) */}
            {isLoggedIn ? (
              <button
                onClick={logout}
                className={`hidden rounded-full p-2 transition-colors sm:inline-flex ${isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:text-primary hover:bg-secondary/50'}`}
                aria-label={t('logout')}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            ) : (
              <Link
                href="/login"
                className={`rounded-full p-2 transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:text-primary hover:bg-secondary/50'}`}
                aria-label={t('login')}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}

            {/* Search (icon → opens panel) */}
            <button
              type="button"
              onClick={() => {
                setSearchOpen((v) => !v);
                if (suggestions && searchQuery.length >= 2) setShowSuggestions(true);
              }}
              className={`rounded-full p-2 transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:text-primary hover:bg-secondary/50'}`}
              aria-label={t('search')}
              aria-expanded={searchOpen}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Cart */}
            <button
              type="button"
              onClick={openCartDrawer}
              data-cart-icon
              className={`relative rounded-full p-2 transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:text-primary hover:bg-secondary/50'}`}
              aria-label={`${itemCount} ${itemCount === 1 ? tc('item') : tc('items')}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="bg-accent text-accent-foreground absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full text-[10px] font-bold">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expanding Search Panel */}
        <div
          ref={searchRef}
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            searchOpen ? 'max-h-[480px] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
          }`}
        >
          <div className={`relative mx-auto w-full max-w-2xl pb-4 ${scrolled ? 'pt-1' : 'pt-2'}`}>
            <form onSubmit={handleSearchSubmit}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchSuggestions(e.target.value);
                }}
                onFocus={() => {
                  if (suggestions && searchQuery.length >= 2) setShowSuggestions(true);
                }}
                placeholder={t('searchPlaceholder')}
                className={`h-12 w-full rounded-full border px-5 pe-12 text-sm focus:outline-none focus:ring-2 transition-all ${isTransparent ? 'border-white/40 bg-white/10 text-white placeholder:text-white/60 focus:ring-white/20 focus:border-white/70' : 'border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary'}`}
              />
              <button
                type="submit"
                className={`absolute end-2 top-2 flex h-12 w-12 items-center justify-center transition-colors ${isTransparent ? 'text-white/70 hover:text-white' : 'text-muted-foreground hover:text-primary'} ${scrolled ? '-mt-1' : ''}`}
                aria-label={t('search')}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions && (
              <div className="bg-background border-border absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border shadow-lg">
                {suggestions.products.length > 0 && (
                  <div>
                    <div className="text-muted-foreground bg-secondary/50 px-4 py-2 text-xs font-medium">
                      {t('products')}
                    </div>
                    {suggestions.products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSuggestionClick(product)}
                        className="hover:bg-secondary/50 flex w-full items-center gap-3 px-4 py-2.5 text-start transition-colors"
                      >
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={36}
                            height={36}
                            className="flex-shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="bg-secondary h-9 w-9 flex-shrink-0 rounded-lg" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate text-sm">{product.name}</p>
                          {(() => {
                            const raw = product.salePrice || product.price;
                            const num = parseFloat(raw);
                            if (!num || num <= 0) return null;
                            return (
                              <p className="text-muted-foreground text-xs">
                                {formatPrice(raw, { currency }) as string}
                              </p>
                            );
                          })()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {suggestions.categories.length > 0 && (
                  <div>
                    <div className="text-muted-foreground bg-secondary/50 px-4 py-2 text-xs font-medium">
                      {t('categories')}
                    </div>
                    {suggestions.categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          router.push(`/products?category=${cat.id}`);
                          setShowSuggestions(false);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="hover:bg-secondary/50 flex w-full items-center justify-between px-4 py-2.5 text-start transition-colors"
                      >
                        <span className="text-foreground text-sm">{cat.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {cat.productCount} {tc('products')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {suggestions.products.length === 0 && suggestions.categories.length === 0 && (
                  <div className="text-muted-foreground px-4 py-4 text-center text-sm">
                    {tc('noResults')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`space-y-1 border-t py-3 md:hidden ${isTransparent ? 'border-white/20 bg-black/60 backdrop-blur-md rounded-b-2xl px-2' : 'border-border'}`}>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-secondary/50'}`}
            >
              {t('products')}
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-secondary/50'}`}
            >
              {t('about')}
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-secondary/50'}`}
            >
              {t('contact')}
            </Link>
            {isLoggedIn && (
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-secondary/50'}`}
              >
                {t('account')}
              </Link>
            )}
            {isLoggedIn ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className={`block w-full rounded-lg px-3 py-2.5 text-start text-sm font-medium transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-secondary/50'}`}
              >
                {t('logout')}
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-secondary/50'}`}
              >
                {t('login')}
              </Link>
            )}

            {/* Mobile search */}
            <form onSubmit={handleSearchSubmit} className="px-2 pt-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className={`h-10 w-full rounded-full border px-4 text-sm focus:outline-none focus:ring-2 transition-all ${isTransparent ? 'border-white/40 bg-white/10 text-white placeholder:text-white/60 focus:ring-white/20 focus:border-white/70' : 'border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary'}`}
              />
            </form>

            {/* Language switcher (mobile) */}
            <div className={`mt-2 border-t pt-2 ${isTransparent ? 'border-white/20' : 'border-border'}`}>
              <LanguageSwitcher isTransparent={isTransparent} variant="block" />
            </div>
          </div>
        )}
      </div>

    </header>

      {/* Side Cart Drawer — must be outside <header> because
          the header's backdrop-blur creates a new containing block
          that breaks fixed positioning */}
      <CartDrawer />
    </>
  );
}
