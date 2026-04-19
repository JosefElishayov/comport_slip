'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import type { ProductRecommendation } from 'brainerce';
import { PriceDisplay } from '@/components/shared/price-display';
import { cn } from '@/lib/utils';

interface RecommendationCardProps {
  item: ProductRecommendation;
  className?: string;
}

function RecommendationCard({ item, className }: RecommendationCardProps) {
  const firstImage = item.images?.[0];
  const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url || null;
  const slug = item.slug || item.id;
  const basePrice = parseFloat(item.basePrice);
  const salePrice = item.salePrice ? parseFloat(item.salePrice) : undefined;
  const isOnSale = salePrice != null && salePrice < basePrice;

  return (
    <Link
      href={`/products/${slug}`}
      className={cn(
        'border-border bg-background group block overflow-hidden rounded-lg border transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="bg-muted relative aspect-square overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-3">
        <h3 className="text-foreground group-hover:text-primary line-clamp-2 text-sm font-medium transition-colors">
          {item.name}
        </h3>
        <PriceDisplay price={basePrice} salePrice={isOnSale ? salePrice : undefined} size="sm" />
      </div>
    </Link>
  );
}

interface RecommendationSectionProps {
  title: string;
  items: ProductRecommendation[];
  className?: string;
}

export function RecommendationSection({ title, items, className }: RecommendationSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn('', className)}>
      <h2 className="text-foreground mb-4 text-xl font-semibold">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <RecommendationCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

interface CartRecommendationSectionProps {
  title: string;
  items: ProductRecommendation[];
  className?: string;
}

export function CartRecommendationSection({
  title,
  items,
  className,
}: CartRecommendationSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn('', className)}>
      <h2 className="text-foreground mb-4 text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <RecommendationCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
