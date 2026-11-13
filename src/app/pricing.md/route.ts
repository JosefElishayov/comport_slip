import { getServerClient } from '@/lib/brainerce';
import { getDisplayPriceInfo } from '@/lib/pricing';
import { frontmatter, markdownResponse } from '@/lib/agent-discovery';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getServerClient('he');
    const [info, products] = await Promise.all([client.getStoreInfo(), client.getProducts({ page: 1, limit: 20 })]);
    const lines = products.data.map((product) => {
      const price = getDisplayPriceInfo(product, info.currency);
      const name = product.name.replace(/[\r\n|]/g, ' ');
      return `- [${name}](${SITE_URL}/products/${encodeURIComponent(product.slug || product.id)}): ${price.price} ${price.currency}; type: ${product.type}. Check the selected variant for its exact price.`;
    });
    return markdownResponse(frontmatter('Comfort Sleep pricing', 'Live sample of catalog prices, currency and checkout rules.', '/pricing.md') + `# Product pricing

Currency: ${info.currency}. Retrieved: ${new Date().toISOString()}.

This is page 1 of ${products.meta.totalPages} (${products.meta.total} products total), up to 20 products, not the complete catalog. Product and variant prices can change. A variable product's listed price is not a quote for every size. Use get_product to select a variant and estimate_delivery_and_total for an estimate. Checkout confirms shipping, tax, discounts and the amount due.

${lines.join('\n')}

See [all products](${SITE_URL}/products), [shipping](${SITE_URL}/shipping), [returns](${SITE_URL}/returns) and [agent tools](${SITE_URL}/agents.md).
`);
  } catch {
    return new Response('# Pricing temporarily unavailable\n\nRetry shortly or visit /products for live prices.\n', {
      status: 503, headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Retry-After': '30', 'Cache-Control': 'no-store' },
    });
  }
}
