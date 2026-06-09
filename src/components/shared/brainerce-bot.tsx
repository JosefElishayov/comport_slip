'use client';

import { useEffect } from 'react';
import { getClient } from '@/lib/brainerce';
import { useCart } from '@/providers/store-provider';

const CONNECTION_ID =
  process.env.NEXT_PUBLIC_BRAINERCE_CONNECTION_ID || 'vc_BslbK0EDGoUXP2c5VH0Dk';

/**
 * Brainerce AI shopping-assistant chat widget.
 *
 * Mounts client-side via the SDK (not the external bot.js script, so the strict
 * CSP needs no changes). All appearance/behavior is configured server-side in
 * the merchant dashboard — the widget renders nothing until the bot is Live.
 *
 * The bot's product cards add to OUR cart through `onAddToCart`, so the header
 * count and cart drawer stay in sync; on failure it falls back to the PDP.
 */
export function BrainerceBot() {
  const { refreshCart, openCartDrawer } = useCart();

  useEffect(() => {
    let bot: { destroy: () => void } | null = null;
    let cancelled = false;

    import('brainerce/bot')
      .then(async ({ BrainerceBot: Bot }) => {
        const instance = await Bot.mount({
          connectionId: CONNECTION_ID,
          baseUrl: process.env.NEXT_PUBLIC_BRAINERCE_API_URL,
          onAddToCart: async ({ productId, variantId, quantity }) => {
            try {
              await getClient().smartAddToCart({
                productId,
                variantId: variantId ?? undefined,
                quantity,
              });
              await refreshCart();
              openCartDrawer();
              return true;
            } catch (err) {
              console.error('Brainerce bot add-to-cart failed:', err);
              return false;
            }
          },
        });
        // Resolves to null when the bot is disabled server-side.
        if (cancelled) instance?.destroy();
        else bot = instance;
      })
      .catch((err) => console.error('Failed to load Brainerce bot:', err));

    return () => {
      cancelled = true;
      bot?.destroy();
    };
  }, [refreshCart, openCartDrawer]);

  return null;
}
