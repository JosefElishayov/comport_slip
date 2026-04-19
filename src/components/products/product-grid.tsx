'use client';

import type { Product } from 'brainerce';
import { useTranslations } from '@/lib/translations';
import { ProductCard } from '@/components/products/product-card';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  className?: string;
}

export function ProductGrid({ products, className }: ProductGridProps) {
  const t = useTranslations('products');
  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-lg">{t('noProducts')}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
