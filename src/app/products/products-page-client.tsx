'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/lib/navigation';
import type { Product } from 'brainerce';
import type { ProductQueryParams } from 'brainerce';
import { getClient } from '@/lib/brainerce';
import { useRegionId } from '@/providers/region-provider';
import { ProductGrid } from '@/components/products/product-grid';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { sortOptions, type SortOption } from './sort-options';

const PAGE_SIZE = 20;

export interface CategoryNode {
  id: string;
  name: string;
  image?: string | null;
  parentId?: string | null;
  children: CategoryNode[];
}

function isActiveInTree(node: CategoryNode, selectedId: string): boolean {
  if (node.id === selectedId) return true;
  return node.children.some((child) => isActiveInTree(child, selectedId));
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4.5L6 7.5L9 4.5" />
    </svg>
  );
}

function CustomSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || options[0]?.label || '';

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex flex-col items-center gap-1 min-w-[120px]">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800 hover:text-gray-600 transition-colors cursor-pointer px-2 py-0.5"
      >
        {selectedLabel}
        <ChevronDown className={cn('transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 z-50 min-w-[180px] max-h-[240px] overflow-y-auto rounded-xl bg-white border border-gray-100 shadow-xl py-1 animate-fade-in-dropdown">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                'w-full px-4 py-2.5 text-sm text-start transition-colors',
                opt.value === value
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryDropdownItems({
  items,
  depth,
  selectedId,
  onSelect,
}: {
  items: CategoryNode[];
  depth: number;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {items.map((child) => (
        <div key={child.id}>
          <button
            onClick={() => onSelect(child.id)}
            className={cn(
              'hover:bg-muted w-full px-4 py-2 text-start text-sm transition-colors',
              selectedId === child.id && 'bg-primary/10 text-primary font-medium'
            )}
            style={{ paddingInlineStart: `${(depth + 1) * 16}px` }}
          >
            {child.name}
          </button>
          {child.children.length > 0 && (
            <CategoryDropdownItems
              items={child.children}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          )}
        </div>
      ))}
    </>
  );
}

function CategoryChip({
  category,
  selectedId,
  onSelect,
  tc,
}: {
  category: CategoryNode;
  selectedId: string;
  onSelect: (id: string) => void;
  tc: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasChildren = category.children.length > 0;
  const isActive = isActiveInTree(category, selectedId);

  function findName(nodes: CategoryNode[], id: string): string | null {
    for (const n of nodes) {
      if (n.id === id) return n.name;
      const found = findName(n.children, id);
      if (found) return found;
    }
    return null;
  }

  const selectedChildName =
    isActive && selectedId !== category.id ? findName(category.children, selectedId) : null;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!hasChildren) {
    return (
      <button
        onClick={() => onSelect(category.id)}
        className={cn(
          'rounded-full border px-3 py-1.5 text-sm transition-colors',
          selectedId === category.id
            ? 'bg-primary text-primary-foreground border-primary'
            : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
        )}
      >
        {category.name}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground border-primary'
            : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
        )}
      >
        {category.name}
        {selectedChildName && (
          <span className="opacity-80">
            {'·'} {selectedChildName}
          </span>
        )}
        <ChevronDown className={cn('ms-0.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="bg-background border-border absolute start-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border shadow-lg">
          <button
            onClick={() => {
              onSelect(category.id);
              setOpen(false);
            }}
            className={cn(
              'hover:bg-muted w-full px-4 py-2 text-start text-sm font-medium transition-colors',
              selectedId === category.id && 'bg-primary/10 text-primary'
            )}
          >
            {tc('all')} {category.name}
          </button>
          <div className="bg-border mx-2 h-px" />
          <div onClick={() => setOpen(false)}>
            <CategoryDropdownItems
              items={category.children}
              depth={0}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface ProductsPageClientProps {
  initialProducts: Product[];
  initialTotal: number;
  initialTotalPages: number;
  initialCategories: CategoryNode[];
  initialBrands: Array<{ id: string; name: string }>;
  initialTags: Array<{ id: string; name: string }>;
}

export default function ProductsPageClient({
  initialProducts,
  initialTotal,
  initialTotalPages,
  initialCategories,
  initialBrands,
  initialTags,
}: ProductsPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('products');
  const tc = useTranslations('common');

  const searchQuery = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const brandId = searchParams.get('brand') || '';
  const tagId = searchParams.get('tag') || '';
  const sortParam = searchParams.get('sort') || '0';
  const regionId = useRegionId();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [total, setTotal] = useState(initialTotal);
  const [categories] = useState<CategoryNode[]>(initialCategories);
  const [brands] = useState<Array<{ id: string; name: string }>>(initialBrands);
  const [tags] = useState<Array<{ id: string; name: string }>>(initialTags);

  const sortIndex = parseInt(sortParam, 10) || 0;
  const currentSort = sortOptions[sortIndex] || sortOptions[0];

  const loadProducts = useCallback(
    async (pageNum: number, append: boolean) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const client = getClient();
        const params: ProductQueryParams = {
          page: pageNum,
          limit: PAGE_SIZE,
          sortBy: currentSort.sortBy,
          sortOrder: currentSort.sortOrder,
        };

        if (searchQuery) params.search = searchQuery;
        if (categoryId) params.categories = categoryId;
        if (brandId) params.brands = brandId;
        if (tagId) params.tags = tagId;
        if (regionId) params.regionId = regionId;

        const result = await client.getProducts(params);

        if (append) {
          setProducts((prev) => [...prev, ...result.data]);
        } else {
          setProducts(result.data);
        }
        setTotalPages(result.meta.totalPages);
        setTotal(result.meta.total);
        setPage(pageNum);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, categoryId, brandId, tagId, currentSort.sortBy, currentSort.sortOrder, regionId]
  );

  const skipInitialFetch = useRef(true);
  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    loadProducts(1, false);
  }, [loadProducts]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page < totalPages && !loadingMore) {
          loadProducts(page + 1, true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, totalPages, loadingMore, loadProducts]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  }

  function handleCategorySelect(id: string) {
    updateParam('category', id);
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner with Filters */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/products-hero.webp"
            alt=""
            className="h-full w-full object-cover object-center scale-110"
            style={{ filter: 'brightness(0.3)' }}
          />
        </div>
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-4 py-20 sm:py-28 w-full max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-white text-3xl font-extrabold sm:text-5xl tracking-tight animate-fade-in-up">
              {searchQuery ? `${t('searchPrefix')} "${searchQuery}"` : t('allProducts')}
            </h1>
            {!loading && (
              <p className="text-white/70 mt-3 text-base sm:text-lg animate-fade-in-up-delay">
                {total} {total === 1 ? tc('product') : tc('products')} {tc('found')}
              </p>
            )}
          </div>

          {/* Filters Bar */}
          <div className="animate-fade-in-up-delay-2 w-full max-w-3xl relative z-20">
            <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white/95 backdrop-blur-md px-5 py-4 shadow-2xl">
              {categories.length > 0 && (
                <CustomSelect
                  label={t('pageTitle')}
                  value={categoryId}
                  options={[
                    { value: '', label: tc('all') },
                    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                  ]}
                  onChange={(v) => updateParam('category', v)}
                />
              )}

              {categories.length > 0 && (brands.length > 0 || tags.length > 0) && (
                <div className="h-8 w-px bg-gray-200" />
              )}

              {brands.length > 0 && (
                <CustomSelect
                  label={t('allBrands')}
                  value={brandId}
                  options={[
                    { value: '', label: tc('all') },
                    ...brands.map((b) => ({ value: b.id, label: b.name })),
                  ]}
                  onChange={(v) => updateParam('brand', v)}
                />
              )}

              {brands.length > 0 && tags.length > 0 && (
                <div className="h-8 w-px bg-gray-200" />
              )}

              {tags.length > 0 && (
                <CustomSelect
                  label={t('allTags')}
                  value={tagId}
                  options={[
                    { value: '', label: tc('all') },
                    ...tags.map((tg) => ({ value: tg.id, label: tg.name })),
                  ]}
                  onChange={(v) => updateParam('tag', v)}
                />
              )}

              {(categories.length > 0 || brands.length > 0 || tags.length > 0) && (
                <div className="h-8 w-px bg-gray-200" />
              )}

              <CustomSelect
                label={tc('sortBy')}
                value={String(sortIndex)}
                options={sortOptions.map((opt, idx) => ({
                  value: String(idx),
                  label: t(opt.labelKey),
                }))}
                onChange={(v) => updateParam('sort', v)}
              />

              {searchQuery && (
                <>
                  <div className="h-8 w-px bg-gray-200" />
                  <button
                    onClick={() => updateParam('search', '')}
                    className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    {searchQuery}
                    <span className="text-gray-400">&times;</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

    <div className="bg-white">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <ProductGrid products={products} />

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />
          {loadingMore && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          )}
        </>
      )}
    </div>
    </div>
    </div>
  );
}
