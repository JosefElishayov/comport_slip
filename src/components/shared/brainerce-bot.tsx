'use client';

import { useEffect } from 'react';
import { getClient } from '@/lib/brainerce';
import { useCart } from '@/providers/store-provider';
import { addToCart } from '@/lib/cart-store';
import { trackAddToCart } from '@/lib/gtag-ecommerce';

const CONNECTION_ID =
  process.env.NEXT_PUBLIC_BRAINERCE_CONNECTION_ID || 'vc_BslbK0EDGoUXP2c5VH0Dk';

/**
 * Brainerce AI shopping-assistant chat widget.
 *
 * Mounts client-side via the SDK (not the external bot.js script, so the strict
 * CSP needs no changes). All appearance/behavior is configured server-side in
 * the merchant dashboard — the widget renders nothing until the bot is Live.
 *
 * The bot's product cards add to OUR cart store through `onAddToCart`, so the
 * header count and cart drawer stay in sync; on failure it falls back to the PDP.
 */
export function BrainerceBot() {
  const { openCartDrawer } = useCart();

  useEffect(() => {
    let bot: { destroy: () => void } | null = null;
    let cancelled = false;

    import('brainerce/bot')
      .then(async ({ BrainerceBot: Bot }) => {
        const instance = await Bot.mount({
          connectionId: CONNECTION_ID,
          baseUrl: process.env.NEXT_PUBLIC_BRAINERCE_API_URL,
          // Signed-in shoppers can look up their orders in the chat. The client
          // asks through our /api/store proxy (which holds the httpOnly session
          // cookie) and hands the widget a 5-minute bot-only token, never the
          // real session token.
          getBotSession: () => getClient().getBotSession(),
          onAddToCart: async ({ productId, variantId, quantity }) => {
            try {
              await addToCart({
                productId,
                variantId: variantId ?? undefined,
                quantity,
              });
              // The bot's callback carries ids only — no name or price. A thin
              // add_to_cart still beats losing the bot's conversions entirely.
              trackAddToCart(undefined, { id: productId, quantity });
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
  }, [openCartDrawer]);

  return null;
}
