import assert from 'node:assert/strict';

const origin = process.argv[2] || 'http://localhost:3107';
const get = (path, headers) => fetch(new URL(path, origin), { headers, redirect: 'manual', signal: AbortSignal.timeout(30000) });

const catalogRes = await get('/.well-known/ard.json');
assert.equal(catalogRes.status, 200);
const catalog = await catalogRes.json();
assert.equal(catalog.entries.length, 1);
const entry = catalog.entries[0];
assert.match(entry.identifier, /^urn:air:comfortsleep\.co\.il:/);
assert.equal(entry.type, 'application/mcp-server-card+json');
assert.ok(entry.displayName);
assert.ok(entry.url && !entry.data);
const cardRes = await get(new URL(entry.url).pathname);
assert.equal(cardRes.status, 200);
const card = await cardRes.json();
assert.equal(card.remotes[0].type, 'streamable-http');
assert.match(card.remotes[0].url, /^https:\/\/api\.brainerce\.com\/api\/mcp\/storefront\/vc_/);
assert.ok(card.description.length <= 100);
assert.equal(cardRes.headers.get('access-control-allow-origin'), '*');
const legacyCatalog = await (await get('/.well-known/ai-catalog.json')).json();
assert.equal(legacyCatalog.specVersion, '1.0');
assert.match((await get('/.well-known/api-catalog')).headers.get('content-type'), /application\/linkset\+json/);
assert.deepEqual(legacyCatalog.entries, catalog.entries);
for (const path of ['/index.md', '/auth.md', '/agents.md', '/pricing.md']) {
  const res = await get(path);
  assert.equal(res.status, 200, path);
  assert.match(res.headers.get('content-type'), /text\/markdown/);
  const text = await res.text();
  assert.match(text, /^---\ntitle:/);
  assert.match(text, /canonical:/);
  assert.ok(!text.includes('<!DOCTYPE'));
}
for (const path of ['/', '/en']) {
  const res = await get(path, { Accept: 'text/markdown' });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/markdown/);
  assert.match(res.headers.get('vary'), /Accept/i);
}
const missing = await get('/__agent-surface-missing-page', { Accept: 'text/markdown' });
assert.equal(missing.status, 404);
assert.match(missing.headers.get('content-type'), /text\/markdown/);
assert.match(await missing.text(), /sitemap/);
const missingFile = await get('/__agent-surface-missing-file.md', { Accept: 'text/markdown' });
assert.equal(missingFile.status, 404);
assert.match(missingFile.headers.get('content-type'), /text\/markdown/);
const missingHtml = await get('/__agent-surface-missing-page');
assert.equal(missingHtml.status, 404);
assert.match(missingHtml.headers.get('content-type'), /text\/html/);
const account = await get('/en/account', { Accept: 'text/markdown' });
assert.equal(account.status, 307);
assert.match(account.headers.get('location'), /\/en\/login$/);
const htmlRes = await get('/');
const html = await htmlRes.text();
assert.equal(htmlRes.status, 200);
assert.match(htmlRes.headers.get('link'), /rel="service-desc"/);
assert.match(html, /property="og:image"/);
assert.match(html, /rel="ard"/);
assert.ok(html.includes('https://www.facebook.com/profile.php?id=61593023545584'));
const headings = [...html.matchAll(/<h([1-6])\b/g)].map((match) => match[1]);
assert.equal(headings[0], '1', 'First content heading must be H1');
assert.equal(headings.filter((level) => level === '1').length, 1);
const llms = await (await get('/llms.txt')).text();
assert.match(llms, /When to use/);
assert.match(llms, /products\/llms.txt/);
assert.match(await (await get('/products/llms.txt')).text(), /search_catalog/);
console.log('Agent HTTP checks passed: discovery, cards, Markdown, pricing, 404, auth boundary, locale, metadata and heading order.');
