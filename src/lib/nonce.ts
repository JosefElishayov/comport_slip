import { headers } from 'next/headers';

/**
 * Reads the per-request CSP nonce set by middleware.
 * Use this in server components that render inline `<script>` tags so
 * they comply with the strict CSP (no `unsafe-inline`).
 */
export async function getNonce(): Promise<string | undefined> {
  return (await headers()).get('x-nonce') ?? undefined;
}
