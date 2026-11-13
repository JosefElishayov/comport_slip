import { frontmatter, markdownResponse, WHEN_TO_USE } from '@/lib/agent-discovery';
import { SITE_URL } from '@/lib/seo';
export function GET() {
  return markdownResponse(frontmatter('Comfort Sleep — קומפורט סליפ', 'Mattresses, beds and sleep products in Israel.', '/') + `# קומפורט סליפ — Comfort Sleep

חנות מזרנים ומוצרי שינה מבית רהיטי וייס, עם למעלה מ־40 שנות ניסיון. מזרנים, מיטות, בסיסים ומגני מזרן מהמותגים המופיעים בקטלוג החנות. האתר זמין בעברית ובאנגלית.

${WHEN_TO_USE}
## Browse and buy

- [Live product catalog](${SITE_URL}/products)
- [Current pricing guide](${SITE_URL}/pricing.md)
- [Agent connection guide](${SITE_URL}/agents.md)
- [Authentication guide](${SITE_URL}/auth.md)
- [Delivery policy](${SITE_URL}/shipping)
- [Returns and cancellations](${SITE_URL}/returns)
- [Contact](${SITE_URL}/contact)
- [Sitemap](${SITE_URL}/sitemap.xml)
- [English storefront](${SITE_URL}/en)

Final prices, delivery charges, discounts and stock are checked at checkout. Published policy pages govern purchases; no mattress trial period is implied.
`);
}
