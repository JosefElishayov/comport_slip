import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // The storefront is a consumer of the Brainerce API — it has to render
    // whatever image URLs the API returns. In practice those URLs can be on
    // cdn.brainerce.com OR on an upstream merchant host (WooCommerce, Shopify,
    // self-hosted) depending on whether the product's image-import job has
    // completed on the backend. Rather than hard-fail on unknown hosts, skip
    // the server-side optimizer entirely and let the browser fetch each image
    // directly from origin. No server-side fetching → no SSRF or DoS surface
    // on this Next server. Trade-off: no webp/resize/lazy optimization, so
    // LCP is marginally worse. Acceptable; the storefront is not the right
    // layer to enforce a hostname policy.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // SAMEORIGIN (not DENY) so iframe-based payment providers (e.g. Cardcom)
          // can redirect the iframe back to /payment-complete on the storefront
          // itself after a successful charge — the postMessage relay needs the
          // parent frame to be able to render our own same-origin page.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
