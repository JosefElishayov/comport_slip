export function GET() {
  return new Response('# Page not found\n\nThis address does not exist. Find available pages in [the sitemap](/sitemap.xml), [the catalog](/products), or [the AI guide](/llms.txt).\n', {
    status: 404,
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', Vary: 'Accept', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
