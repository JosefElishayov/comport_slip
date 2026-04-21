'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useRouter } from '@/lib/navigation';
import Image from 'next/image';
import type { SearchSuggestions, ProductSuggestion } from 'brainerce';
import { formatPrice } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useTranslations } from '@/lib/translations';
import { useStoreInfo, useAuth, useCart } from '@/providers/store-provider';
import { CartDrawer } from '@/components/cart/cart-drawer';

export function Header() {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const { storeInfo } = useStoreInfo();
  const { isLoggedIn, logout } = useAuth();
  const { itemCount, openCartDrawer } = useCart();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currency = storeInfo?.currency || 'USD';

  // Track scroll position for header transparency
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener('scroll', handleScroll);
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

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setSearchQuery('');
    }
  }

  function handleSuggestionClick(suggestion: ProductSuggestion) {
    const href = suggestion.slug ? `/products/${suggestion.slug}` : `/products/${suggestion.id}`;
    router.push(href);
    setShowSuggestions(false);
    setSearchQuery('');
  }

  return (
    <>
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/95 shadow-sm backdrop-blur-md border-b border-border'
          : 'bg-background border-b border-border'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo / Store Name */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <span className="text-primary text-xl font-bold tracking-tight">
              {storeInfo?.name || process.env.NEXT_PUBLIC_STORE_NAME || tc('store')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/products"
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              {t('products')}
            </Link>
            {isLoggedIn && (
              <Link
                href="/account"
                className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
              >
                {t('account')}
              </Link>
            )}
          </nav>

          {/* Search */}
          <div ref={searchRef} className="relative hidden max-w-md flex-1 sm:block">
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchSuggestions(e.target.value);
                }}
                onFocus={() => {
                  if (suggestions && searchQuery.length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder={t('searchPlaceholder')}
                className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-10 w-full rounded-full border px-4 pe-10 text-sm focus:outline-none focus:ring-2 transition-all"
              />
              <button
                type="submit"
                className="text-muted-foreground hover:text-primary absolute end-0 top-0 flex h-10 w-10 items-center justify-center transition-colors"
                aria-label={t('search')}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions && (
              <div className="bg-background border-border absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border shadow-lg">
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
                          <p className="text-muted-foreground text-xs">
                            {
                              formatPrice(product.salePrice || product.price, {
                                currency,
                              }) as string
                            }
                          </p>
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

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Auth */}
            {isLoggedIn ? (
              <button
                onClick={logout}
                className="text-muted-foreground hover:text-primary hidden text-sm font-medium transition-colors sm:inline-flex"
                aria-label={t('logout')}
              >
                {t('logout')}
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-primary hidden text-sm font-medium transition-colors sm:inline-flex"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/login"
                  className="text-foreground hover:text-primary rounded-full p-2 transition-colors hover:bg-secondary/50 sm:hidden"
                  aria-label={t('login')}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </Link>
              </>
            )}

            {/* Cart */}
            <button
              type="button"
              onClick={openCartDrawer}
              data-cart-icon
              className="text-foreground hover:text-primary relative rounded-full p-2 transition-colors hover:bg-secondary/50"
              aria-label={`${itemCount} ${itemCount === 1 ? tc('item') : tc('items')}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="bg-accent text-accent-foreground absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full text-[10px] font-bold">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-foreground rounded-full p-2 hover:bg-secondary/50 md:hidden transition-colors"
              aria-label={t('menu')}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-border space-y-1 border-t py-3 md:hidden">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="text-foreground hover:bg-secondary/50 block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            >
              {t('products')}
            </Link>
            {isLoggedIn && (
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="text-foreground hover:bg-secondary/50 block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
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
                className="text-foreground hover:bg-secondary/50 block w-full rounded-lg px-3 py-2.5 text-start text-sm font-medium transition-colors"
              >
                {t('logout')}
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-foreground hover:bg-secondary/50 block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
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
                className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-primary/20 focus:border-primary h-10 w-full rounded-full border px-4 text-sm focus:outline-none focus:ring-2 transition-all"
              />
            </form>
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
