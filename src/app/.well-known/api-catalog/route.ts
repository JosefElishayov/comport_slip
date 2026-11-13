import { SITE_URL } from '@/lib/seo';
import { publicJson, STOREFRONT_MCP_URL } from '@/lib/agent-discovery';
export function GET() {
  const response = publicJson({ linkset: [{ anchor: SITE_URL,
    'service-desc': [{ href: `${SITE_URL}/.well-known/mcp/server-card.json`, type: 'application/mcp-server-card+json' }],
    'service-doc': [{ href: `${SITE_URL}/agents.md`, type: 'text/markdown' }],
    'service': [{ href: STOREFRONT_MCP_URL }],
  }] });
  response.headers.set('Content-Type', 'application/linkset+json');
  return response;
}
