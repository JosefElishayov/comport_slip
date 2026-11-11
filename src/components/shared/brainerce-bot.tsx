'use client';

import { useEffect, useRef } from 'react';
import { getClient } from '@/lib/brainerce';
import { useCart } from '@/providers/store-provider';
import { addToCart, getCartStore } from '@/lib/cart-store';
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
  // The widget mounts once; keep the latest drawer opener reachable from it.
  const openCartDrawerRef = useRef(openCartDrawer);
  openCartDrawerRef.current = openCartDrawer;

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
          // Lets the bot read/change the shopper's cart on the server (3.19+).
          // The guest cart token is a secret: it only goes to the bot endpoint.
          getCartProof: () => {
            const held = getClient().getHeldCartProof();
            const cartId = getCartStore().getSnapshot().cart?.id ?? held?.cartId;
            if (!cartId) return null;
            return held?.cartId === cartId ? held : { cartId };
          },
          // The server confirmed a cart change made by the bot: re-read our
          // cart so the header count and drawer match, and show the drawer.
          onCartUpdated: () => {
            void getCartStore()
              .refresh({ force: true })
              .then(() => openCartDrawerRef.current());
          },
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
  }, []);

  return null;
}
