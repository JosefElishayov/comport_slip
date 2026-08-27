'use client';

import { useEffect, useState } from 'react';
import type { OrderItem } from 'brainerce';
import { getClient } from '@/lib/brainerce';

/**
 * Order line items are a frozen snapshot and the backend doesn't always
 * populate `image` on them. Backfill missing ones from the live product
 * record so order-confirmation / order-history don't show a blank
 * placeholder when the product itself has a perfectly good photo.
 */
export function useOrderItemImages(items: OrderItem[] | undefined): Record<string, string> {
  const [fallbackImages, setFallbackImages] = useState<Record<string, string>>({});

  const missingIds = Array.from(
    new Set((items ?? []).filter((item) => !item.image && item.productId).map((i) => i.productId))
  ).sort();
  const key = missingIds.join(',');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const productIds = key.split(',');

    async function fetchImages() {
      const client = getClient();
      const entries = await Promise.all(
        productIds.map(async (productId) => {
          try {
            const product = await client.getProduct(productId);
            const image =
              product?.images?.find((img) => img.isMain)?.url ?? product?.images?.[0]?.url;
            return image ? ([productId, image] as const) : null;
          } catch {
            return null;
          }
        })
      );
      if (!cancelled) {
        const next = Object.fromEntries(entries.filter((e): e is [string, string] => e !== null));
        if (Object.keys(next).length > 0) {
          setFallbackImages((prev) => ({ ...prev, ...next }));
        }
      }
    }

    fetchImages();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return fallbackImages;
}
