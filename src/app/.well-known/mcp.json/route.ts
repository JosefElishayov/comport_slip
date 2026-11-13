import { publicJson, serverCard, STOREFRONT_MCP_URL } from '@/lib/agent-discovery';
export function GET() {
  return publicJson({ servers: [{ name: 'Comfort Sleep', url: STOREFRONT_MCP_URL, transport: 'streamable-http', card: serverCard }] });
}
