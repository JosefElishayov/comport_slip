import { frontmatter, markdownResponse, STOREFRONT_MCP_URL } from '@/lib/agent-discovery';
import { SITE_URL } from '@/lib/seo';
export function GET() {
  return markdownResponse(frontmatter('Comfort Sleep authentication', 'Public shopping tools and customer login boundaries.', '/auth.md') + `# Authentication

## Public shopping tools

Endpoint: ${STOREFRONT_MCP_URL}

The public storefront MCP uses Streamable HTTP and does not require an API key, OAuth token or customer login. Send JSON-RPC POST requests with Content-Type: application/json and Accept: application/json, text/event-stream. Discover current tool schemas with tools/list. Check get_store_info.cart_enabled before create_cart.

## Customer login

Customers sign in through [the login page](${SITE_URL}/login). Authentication uses an HttpOnly cookie on the storefront. Browser WebMCP tools reuse the current session. Never ask a shopper to paste passwords, session cookies, retry tokens or payment details into an agent conversation. There is no advertised agent OAuth authorization server on this storefront.

## Checkout and permissions

Creating a cart is not payment authorization. Give the returned checkout_url directly to the shopper and keep its fragment intact. Do not redeem or preview it: the first browser to open it owns the cart. The shopper reviews and completes payment on the storefront.

## Recovery

If customer login expires, return to the login page. If an MCP request fails, report the failure instead of guessing account state or retrying a write with a new identity. Use the idempotency and retry contract documented by create_cart for safe retries.
`);
}
