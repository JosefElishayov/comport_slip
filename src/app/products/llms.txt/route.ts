import { WHEN_TO_USE } from '@/lib/agent-discovery';
import { SITE_URL } from '@/lib/seo';
export function GET() {
  return new Response(`# Comfort Sleep product catalog\n\n${WHEN_TO_USE}\n- [Products](${SITE_URL}/products)\n- [Pricing](${SITE_URL}/pricing.md)\n- [Product and variant tools](${SITE_URL}/agents.md)\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}
